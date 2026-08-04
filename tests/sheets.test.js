'use strict';

const test = require('node:test');
const { assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { getEnv, seed, seedMaster, seedPlayer } = require('./helpers');

test('sheets', async (t) => {
  const env = await getEnv();
  t.after(() => env.cleanup());
  t.beforeEach(() => env.clearFirestore());

  await t.test('um jogador pode criar a própria ficha (ownerId = ele mesmo)', async () => {
    await seedPlayer(env, 'alice');
    const alice = env.authenticatedContext('alice');
    await assertSucceeds(
      alice.firestore().collection('sheets').doc('s1').set({
        ownerId: 'alice', name: 'Personagem', masterId: null
      })
    );
  });

  await t.test('não é permitido criar ficha em nome de outro jogador', async () => {
    await seedPlayer(env, 'alice');
    const alice = env.authenticatedContext('alice');
    await assertFails(
      alice.firestore().collection('sheets').doc('s1').set({
        ownerId: 'bob', name: 'Personagem', masterId: null
      })
    );
  });

  await t.test('ficha sem pasta (masterId nulo) só o dono lê', async () => {
    await seedPlayer(env, 'alice');
    await seedMaster(env, 'gm1');
    await seed(env, (db) => db.collection('sheets').doc('s1').set({
      ownerId: 'alice', masterId: null, name: 'P'
    }));

    const gm1 = env.authenticatedContext('gm1');
    await assertFails(gm1.firestore().collection('sheets').doc('s1').get());

    const alice = env.authenticatedContext('alice');
    await assertSucceeds(alice.firestore().collection('sheets').doc('s1').get());
  });

  await t.test('o master dono da pasta (masterId) lê a ficha; outro master não', async () => {
    await seedPlayer(env, 'alice');
    await seedMaster(env, 'gm1');
    await seedMaster(env, 'gm2');
    await seed(env, (db) => db.collection('sheets').doc('s1').set({
      ownerId: 'alice', masterId: 'gm1', name: 'P'
    }));

    const gm1 = env.authenticatedContext('gm1');
    await assertSucceeds(gm1.firestore().collection('sheets').doc('s1').get());

    const gm2 = env.authenticatedContext('gm2');
    await assertFails(gm2.firestore().collection('sheets').doc('s1').get());
  });

  await t.test('o dono pode atualizar a ficha, mas não masterNotes', async () => {
    await seedPlayer(env, 'alice');
    await seedMaster(env, 'gm1');
    await seed(env, (db) => db.collection('sheets').doc('s1').set({
      ownerId: 'alice', masterId: 'gm1', name: 'P', masterNotes: 'segredo do mestre'
    }));

    const alice = env.authenticatedContext('alice');
    await assertSucceeds(alice.firestore().collection('sheets').doc('s1').update({ name: 'P2' }));
    await assertFails(
      alice.firestore().collection('sheets').doc('s1').update({ masterNotes: 'trapaça' })
    );
  });

  await t.test('o master dono da pasta pode atualizar masterNotes; outro master, não', async () => {
    await seedPlayer(env, 'alice');
    await seedMaster(env, 'gm1');
    await seedMaster(env, 'gm2');
    await seed(env, (db) => db.collection('sheets').doc('s1').set({
      ownerId: 'alice', masterId: 'gm1', name: 'P', masterNotes: ''
    }));

    const gm1 = env.authenticatedContext('gm1');
    await assertSucceeds(
      gm1.firestore().collection('sheets').doc('s1').update({ masterNotes: 'anotação' })
    );

    const gm2 = env.authenticatedContext('gm2');
    await assertFails(
      gm2.firestore().collection('sheets').doc('s1').update({ masterNotes: 'hackeada' })
    );
  });

  await t.test('qualquer logado presente na mesa pode atualizar só o HP (resources.hp)', async () => {
    await seedPlayer(env, 'alice');
    await seedPlayer(env, 'bob');
    await seed(env, (db) => db.collection('sheets').doc('s1').set({
      ownerId: 'alice', masterId: null, name: 'P',
      resources: { hp: { head: 5 } }, updatedAt: null
    }));

    const bob = env.authenticatedContext('bob');
    await assertSucceeds(
      bob.firestore().collection('sheets').doc('s1').update({
        'resources.hp': { head: 2 }, updatedAt: new Date()
      })
    );
  });

  await t.test('atualizar HP não pode vir junto com outro campo qualquer', async () => {
    await seedPlayer(env, 'alice');
    await seedPlayer(env, 'bob');
    await seed(env, (db) => db.collection('sheets').doc('s1').set({
      ownerId: 'alice', masterId: null, name: 'P',
      resources: { hp: { head: 5 } }, updatedAt: null
    }));

    const bob = env.authenticatedContext('bob');
    await assertFails(
      bob.firestore().collection('sheets').doc('s1').update({
        'resources.hp': { head: 2 }, name: 'Nome trocado por quem não devia'
      })
    );
  });

  await t.test('o dono e o master da pasta podem excluir; outro jogador, não', async () => {
    await seedPlayer(env, 'alice');
    await seedPlayer(env, 'bob');
    await seedMaster(env, 'gm1');
    await seed(env, (db) => db.collection('sheets').doc('s1').set({
      ownerId: 'alice', masterId: 'gm1', name: 'P'
    }));

    const bob = env.authenticatedContext('bob');
    await assertFails(bob.firestore().collection('sheets').doc('s1').delete());

    const gm1 = env.authenticatedContext('gm1');
    await assertSucceeds(gm1.firestore().collection('sheets').doc('s1').delete());
  });
});
