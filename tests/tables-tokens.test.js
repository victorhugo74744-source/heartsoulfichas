'use strict';

const test = require('node:test');
const { assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { getEnv, seed, seedMaster, seedPlayer } = require('./helpers');

test('tables e tokens', async (t) => {
  const env = await getEnv();
  t.after(() => env.cleanup());
  t.beforeEach(() => env.clearFirestore());

  await t.test('um player não pode criar mesa', async () => {
    await seedPlayer(env, 'alice');
    const alice = env.authenticatedContext('alice');
    await assertFails(
      alice.firestore().collection('tables').doc('t1').set({ name: 'Mesa 1', createdBy: 'alice' })
    );
  });

  await t.test('um master cria mesa com createdBy = ele mesmo', async () => {
    await seedMaster(env, 'gm1');
    const gm1 = env.authenticatedContext('gm1');
    await assertSucceeds(
      gm1.firestore().collection('tables').doc('t1').set({ name: 'Mesa 1', createdBy: 'gm1' })
    );
  });

  await t.test('só o master dono da mesa edita/exclui a mesa', async () => {
    await seedMaster(env, 'gm1');
    await seedMaster(env, 'gm2');
    await seed(env, (db) => db.collection('tables').doc('t1').set({ name: 'Mesa 1', createdBy: 'gm1' }));

    const gm2 = env.authenticatedContext('gm2');
    await assertFails(gm2.firestore().collection('tables').doc('t1').update({ name: 'Hackeada' }));

    const gm1 = env.authenticatedContext('gm1');
    await assertSucceeds(gm1.firestore().collection('tables').doc('t1').update({ name: 'Renomeada' }));
  });

  await t.test('qualquer jogador logado pode ler a mesa', async () => {
    await seedMaster(env, 'gm1');
    await seedPlayer(env, 'alice');
    await seed(env, (db) => db.collection('tables').doc('t1').set({ name: 'Mesa 1', createdBy: 'gm1' }));

    const alice = env.authenticatedContext('alice');
    await assertSucceeds(alice.firestore().collection('tables').doc('t1').get());
  });

  await t.test('um jogador só cria/apaga o próprio token (id = seu uid)', async () => {
    await seedMaster(env, 'gm1');
    await seedPlayer(env, 'alice');
    await seed(env, (db) => db.collection('tables').doc('t1').set({ name: 'Mesa 1', createdBy: 'gm1' }));

    const alice = env.authenticatedContext('alice');
    await assertSucceeds(
      alice.firestore().collection('tables').doc('t1').collection('tokens').doc('alice')
        .set({ x: 0, y: 0, hp: {} })
    );
    await assertFails(
      alice.firestore().collection('tables').doc('t1').collection('tokens').doc('npc-goblin')
        .set({ x: 0, y: 0, hp: {} })
    );
  });

  await t.test('o master dono da mesa cria token avulso de NPC', async () => {
    await seedMaster(env, 'gm1');
    await seed(env, (db) => db.collection('tables').doc('t1').set({ name: 'Mesa 1', createdBy: 'gm1' }));

    const gm1 = env.authenticatedContext('gm1');
    await assertSucceeds(
      gm1.firestore().collection('tables').doc('t1').collection('tokens').doc('npc-goblin')
        .set({ x: 0, y: 0, hp: {} })
    );
  });

  await t.test('qualquer logado presente pode atualizar só o hp de um token alheio', async () => {
    await seedMaster(env, 'gm1');
    await seedPlayer(env, 'alice');
    await seedPlayer(env, 'bob');
    await seed(env, (db) => {
      const table = db.collection('tables').doc('t1');
      return Promise.all([
        table.set({ name: 'Mesa 1', createdBy: 'gm1' }),
        table.collection('tokens').doc('alice').set({ x: 0, y: 0, hp: { head: 5 }, ownerId: 'alice' })
      ]);
    });

    const bob = env.authenticatedContext('bob');
    await assertSucceeds(
      bob.firestore().collection('tables').doc('t1').collection('tokens').doc('alice')
        .update({ hp: { head: 2 }, updatedAt: new Date() })
    );
    await assertFails(
      bob.firestore().collection('tables').doc('t1').collection('tokens').doc('alice')
        .update({ x: 999 })
    );
  });

  await t.test('um master visitante (dono de outra mesa) não gerencia token alheio nesta mesa', async () => {
    await seedMaster(env, 'gm1');
    await seedMaster(env, 'gm2'); // dono de outra mesa, não desta
    await seedPlayer(env, 'alice');
    await seed(env, (db) => {
      const table = db.collection('tables').doc('t1');
      return Promise.all([
        table.set({ name: 'Mesa 1', createdBy: 'gm1' }),
        table.collection('tokens').doc('alice').set({ x: 0, y: 0, hp: {}, ownerId: 'alice' })
      ]);
    });

    const gm2 = env.authenticatedContext('gm2');
    await assertFails(
      gm2.firestore().collection('tables').doc('t1').collection('tokens').doc('alice')
        .update({ x: 999 })
    );
  });
});
