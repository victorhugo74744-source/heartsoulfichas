'use strict';

const test = require('node:test');
const { assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { getEnv, seed, seedMaster, seedPlayer } = require('./helpers');

test('rolls', async (t) => {
  const env = await getEnv();
  t.after(() => env.cleanup());
  t.beforeEach(() => env.clearFirestore());

  async function seedTable(gmUid) {
    await seedMaster(env, gmUid);
    await seed(env, (db) => db.collection('tables').doc('t1').set({ name: 'Mesa', createdBy: gmUid }));
  }

  await t.test('qualquer jogador logado cria uma rolagem própria (by = ele mesmo)', async () => {
    await seedTable('gm1');
    await seedPlayer(env, 'alice');
    const alice = env.authenticatedContext('alice');
    await assertSucceeds(
      alice.firestore().collection('tables').doc('t1').collection('rolls').add({
        by: 'alice', total: 12, hidden: false
      })
    );
  });

  await t.test('não pode criar rolagem em nome de outra pessoa', async () => {
    await seedTable('gm1');
    await seedPlayer(env, 'alice');
    const alice = env.authenticatedContext('alice');
    await assertFails(
      alice.firestore().collection('tables').doc('t1').collection('rolls').add({
        by: 'bob', total: 12, hidden: false
      })
    );
  });

  await t.test('rolagem não-oculta é lida por qualquer um na mesa', async () => {
    await seedTable('gm1');
    await seedPlayer(env, 'alice');
    await seedPlayer(env, 'bob');
    await seed(env, (db) => db.collection('tables').doc('t1').collection('rolls').doc('r1').set({
      by: 'alice', total: 12, hidden: false
    }));

    const bob = env.authenticatedContext('bob');
    await assertSucceeds(bob.firestore().collection('tables').doc('t1').collection('rolls').doc('r1').get());
  });

  await t.test('rolagem oculta só é lida por quem rolou e pelo master dono da mesa', async () => {
    await seedTable('gm1');
    await seedPlayer(env, 'alice');
    await seedPlayer(env, 'bob');
    await seed(env, (db) => db.collection('tables').doc('t1').collection('rolls').doc('r1').set({
      by: 'alice', total: 12, hidden: true
    }));

    const bob = env.authenticatedContext('bob');
    await assertFails(bob.firestore().collection('tables').doc('t1').collection('rolls').doc('r1').get());

    const alice = env.authenticatedContext('alice');
    await assertSucceeds(alice.firestore().collection('tables').doc('t1').collection('rolls').doc('r1').get());

    const gm1 = env.authenticatedContext('gm1');
    await assertSucceeds(gm1.firestore().collection('tables').doc('t1').collection('rolls').doc('r1').get());
  });

  await t.test('rolagem é um registro imutável: update sempre falha', async () => {
    await seedTable('gm1');
    await seedPlayer(env, 'alice');
    await seed(env, (db) => db.collection('tables').doc('t1').collection('rolls').doc('r1').set({
      by: 'alice', total: 12, hidden: false
    }));

    const alice = env.authenticatedContext('alice');
    await assertFails(
      alice.firestore().collection('tables').doc('t1').collection('rolls').doc('r1').update({ total: 99 })
    );
  });

  await t.test('quem rolou e o master da mesa podem apagar; outro jogador, não', async () => {
    await seedTable('gm1');
    await seedPlayer(env, 'alice');
    await seedPlayer(env, 'bob');
    await seed(env, (db) => db.collection('tables').doc('t1').collection('rolls').doc('r1').set({
      by: 'alice', total: 12, hidden: false
    }));

    const bob = env.authenticatedContext('bob');
    await assertFails(bob.firestore().collection('tables').doc('t1').collection('rolls').doc('r1').delete());

    const gm1 = env.authenticatedContext('gm1');
    await assertSucceeds(gm1.firestore().collection('tables').doc('t1').collection('rolls').doc('r1').delete());
  });
});
