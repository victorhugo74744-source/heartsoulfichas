'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { getEnv, seed } = require('./helpers');

test('users', async (t) => {
  const env = await getEnv();
  t.after(() => env.cleanup());
  t.beforeEach(() => env.clearFirestore());

  await t.test('um usuário pode criar o próprio perfil como player', async () => {
    const alice = env.authenticatedContext('alice');
    await assertSucceeds(
      alice.firestore().collection('users').doc('alice').set({
        name: 'Alice', email: 'alice@example.com', role: 'player'
      })
    );
  });

  await t.test('ninguém consegue criar o próprio perfil já como master', async () => {
    const alice = env.authenticatedContext('alice');
    await assertFails(
      alice.firestore().collection('users').doc('alice').set({
        name: 'Alice', email: 'alice@example.com', role: 'master'
      })
    );
  });

  await t.test('não é permitido criar perfil de outra pessoa', async () => {
    const alice = env.authenticatedContext('alice');
    await assertFails(
      alice.firestore().collection('users').doc('bob').set({
        name: 'Bob', email: 'bob@example.com', role: 'player'
      })
    );
  });

  await t.test('um player não consegue se autopromover a master via update', async () => {
    const alice = env.authenticatedContext('alice');
    await alice.firestore().collection('users').doc('alice').set({
      name: 'Alice', email: 'a@x.com', role: 'player'
    });
    await assertFails(
      alice.firestore().collection('users').doc('alice').update({ role: 'master' })
    );
  });

  await t.test('um usuário pode atualizar o próprio perfil sem mexer no role', async () => {
    const alice = env.authenticatedContext('alice');
    await alice.firestore().collection('users').doc('alice').set({
      name: 'Alice', email: 'a@x.com', role: 'player'
    });
    await assertSucceeds(
      alice.firestore().collection('users').doc('alice').update({ name: 'Alice B.' })
    );
  });

  await t.test('um player não pode ler o perfil de outro jogador', async () => {
    const alice = env.authenticatedContext('alice');
    const bob = env.authenticatedContext('bob');
    await alice.firestore().collection('users').doc('alice').set({
      name: 'Alice', email: 'a@x.com', role: 'player'
    });
    await assertFails(bob.firestore().collection('users').doc('alice').get());
  });

  await t.test('um master pode ler o perfil de qualquer jogador', async () => {
    const alice = env.authenticatedContext('alice');
    const gm = env.authenticatedContext('gm');
    await alice.firestore().collection('users').doc('alice').set({
      name: 'Alice', email: 'a@x.com', role: 'player'
    });
    await seed(env, (db) => db.collection('users').doc('gm').set({
      name: 'GM', email: 'gm@x.com', role: 'master'
    }));
    await assertSucceeds(gm.firestore().collection('users').doc('alice').get());
  });

  await t.test('usuário deslogado não lê nem escreve perfil nenhum', async () => {
    const anon = env.unauthenticatedContext();
    await assertFails(anon.firestore().collection('users').doc('alice').get());
  });
});
