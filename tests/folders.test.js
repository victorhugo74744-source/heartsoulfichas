'use strict';

const test = require('node:test');
const { assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { getEnv, seed, seedMaster, seedPlayer } = require('./helpers');

test('folders', async (t) => {
  const env = await getEnv();
  t.after(() => env.cleanup());
  t.beforeEach(() => env.clearFirestore());

  await t.test('qualquer usuário logado pode ler a lista de pastas', async () => {
    await seedPlayer(env, 'alice');
    const alice = env.authenticatedContext('alice');
    await assertSucceeds(alice.firestore().collection('folders').get());
  });

  await t.test('um player não pode criar pasta de campanha', async () => {
    await seedPlayer(env, 'alice');
    const alice = env.authenticatedContext('alice');
    await assertFails(
      alice.firestore().collection('folders').add({ name: 'Campanha X', createdBy: 'alice' })
    );
  });

  await t.test('um master pode criar pasta com createdBy = ele mesmo', async () => {
    await seedMaster(env, 'gm1');
    const gm1 = env.authenticatedContext('gm1');
    await assertSucceeds(
      gm1.firestore().collection('folders').doc('f1').set({ name: 'Campanha X', createdBy: 'gm1' })
    );
  });

  await t.test('um master não pode criar pasta em nome de outro master', async () => {
    await seedMaster(env, 'gm1');
    const gm1 = env.authenticatedContext('gm1');
    await assertFails(
      gm1.firestore().collection('folders').doc('f1').set({ name: 'Campanha X', createdBy: 'gm2' })
    );
  });

  await t.test('outro master não pode renomear/excluir pasta alheia', async () => {
    await seedMaster(env, 'gm1');
    await seedMaster(env, 'gm2');
    await seed(env, (db) => db.collection('folders').doc('f1').set({ name: 'Campanha X', createdBy: 'gm1' }));

    const gm2 = env.authenticatedContext('gm2');
    await assertFails(gm2.firestore().collection('folders').doc('f1').update({ name: 'Hackeada' }));
    await assertFails(gm2.firestore().collection('folders').doc('f1').delete());
  });

  await t.test('o master dono da pasta pode renomeá-la e excluí-la', async () => {
    await seedMaster(env, 'gm1');
    await seed(env, (db) => db.collection('folders').doc('f1').set({ name: 'Campanha X', createdBy: 'gm1' }));

    const gm1 = env.authenticatedContext('gm1');
    await assertSucceeds(gm1.firestore().collection('folders').doc('f1').update({ name: 'Renomeada' }));
    await assertSucceeds(gm1.firestore().collection('folders').doc('f1').delete());
  });
});
