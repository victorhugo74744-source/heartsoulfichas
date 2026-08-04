'use strict';

const test = require('node:test');
const { assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { getEnv, seed, seedMaster, seedPlayer } = require('./helpers');

test('chatMessages', async (t) => {
  const env = await getEnv();
  t.after(() => env.cleanup());
  t.beforeEach(() => env.clearFirestore());

  async function seedTable(gmUid) {
    await seedMaster(env, gmUid);
    await seed(env, (db) => db.collection('tables').doc('t1').set({ name: 'Mesa', createdBy: gmUid }));
  }
  const chat = (ctx) => ctx.firestore().collection('tables').doc('t1').collection('chatMessages');

  await t.test('qualquer um na mesa cria e lê mensagem no canal geral', async () => {
    await seedTable('gm1');
    await seedPlayer(env, 'alice');
    await seedPlayer(env, 'bob');
    const alice = env.authenticatedContext('alice');
    await assertSucceeds(
      chat(alice).add({ type: 'general', fromUserId: 'alice', content: 'Oi mesa!' })
    );

    await seed(env, (db) => db.collection('tables').doc('t1').collection('chatMessages').doc('m1')
      .set({ type: 'general', fromUserId: 'alice', content: 'Oi mesa!' }));
    const bob = env.authenticatedContext('bob');
    await assertSucceeds(chat(bob).doc('m1').get());
  });

  await t.test('mensagem geral vazia ou maior que 1000 caracteres é rejeitada', async () => {
    await seedTable('gm1');
    await seedPlayer(env, 'alice');
    const alice = env.authenticatedContext('alice');
    await assertFails(chat(alice).add({ type: 'general', fromUserId: 'alice', content: '' }));
    await assertFails(
      chat(alice).add({ type: 'general', fromUserId: 'alice', content: 'x'.repeat(1001) })
    );
  });

  await t.test('sussurro exige toUserId válido e diferente do remetente', async () => {
    await seedTable('gm1');
    await seedPlayer(env, 'alice');
    await seedPlayer(env, 'bob');
    const alice = env.authenticatedContext('alice');

    await assertFails(
      chat(alice).add({ type: 'whisper', fromUserId: 'alice', toUserId: 'alice', content: 'oi' })
    );
    await assertSucceeds(
      chat(alice).add({ type: 'whisper', fromUserId: 'alice', toUserId: 'bob', content: 'psiu' })
    );
  });

  await t.test('sussurro só é lido pelos dois envolvidos e pelo master DESTA mesa', async () => {
    await seedTable('gm1');
    await seedMaster(env, 'gm2'); // master de outra mesa, não participa desta
    await seedPlayer(env, 'alice');
    await seedPlayer(env, 'bob');
    await seedPlayer(env, 'carol'); // presente na mesa, mas fora do sussurro
    await seed(env, (db) => db.collection('tables').doc('t1').collection('chatMessages').doc('w1').set({
      type: 'whisper', fromUserId: 'alice', toUserId: 'bob', content: 'segredo'
    }));

    const carol = env.authenticatedContext('carol');
    await assertFails(chat(carol).doc('w1').get());

    const gm2 = env.authenticatedContext('gm2');
    await assertFails(chat(gm2).doc('w1').get());

    const bob = env.authenticatedContext('bob');
    await assertSucceeds(chat(bob).doc('w1').get());

    const alice = env.authenticatedContext('alice');
    await assertSucceeds(chat(alice).doc('w1').get());

    const gm1 = env.authenticatedContext('gm1');
    await assertSucceeds(chat(gm1).doc('w1').get());
  });

  // Este é o cenário que quebrava antes do fix de queries divididas em
  // mesa-chat.js: uma query SEM filtro que misture documentos que o
  // usuário pode e não pode ler é rejeitada inteira pelo Firestore
  // ("permission-denied"), mesmo que o usuário tivesse permissão de ler
  // alguns dos documentos individualmente. Testamos aqui que uma query
  // list() sem filtro adequado realmente falha — e que as duas queries
  // filtradas que o app usa (fromUserId / toUserId) funcionam.
  await t.test('list() sem filtro na coleção mista falha; queries filtradas (como no app) funcionam', async () => {
    await seedTable('gm1');
    await seedPlayer(env, 'alice');
    await seedPlayer(env, 'bob');
    await seed(env, (db) => {
      const col = db.collection('tables').doc('t1').collection('chatMessages');
      return Promise.all([
        col.doc('g1').set({ type: 'general', fromUserId: 'alice', content: 'oi geral' }),
        col.doc('w1').set({ type: 'whisper', fromUserId: 'alice', toUserId: 'bob', content: 'segredo' })
      ]);
    });

    const bob = env.authenticatedContext('bob');
    await assertFails(chat(bob).get()); // list() geral, sem where — não é o padrão usado pelo app

    // Padrão real usado por js/mesa-chat.js: queries separadas e filtradas.
    await assertSucceeds(chat(bob).where('type', '==', 'general').get());
    await assertSucceeds(
      chat(bob).where('type', '==', 'whisper').where('toUserId', '==', 'bob').get()
    );
  });

  await t.test('mensagens são imutáveis: update sempre falha', async () => {
    await seedTable('gm1');
    await seedPlayer(env, 'alice');
    await seed(env, (db) => db.collection('tables').doc('t1').collection('chatMessages').doc('m1')
      .set({ type: 'general', fromUserId: 'alice', content: 'oi' }));

    const alice = env.authenticatedContext('alice');
    await assertFails(chat(alice).doc('m1').update({ content: 'editado' }));
  });

  await t.test('só o master DESTA mesa apaga mensagem (moderação); outro jogador não', async () => {
    await seedTable('gm1');
    await seedPlayer(env, 'alice');
    await seedPlayer(env, 'bob');
    await seed(env, (db) => db.collection('tables').doc('t1').collection('chatMessages').doc('m1')
      .set({ type: 'general', fromUserId: 'alice', content: 'spam' }));

    const bob = env.authenticatedContext('bob');
    await assertFails(chat(bob).doc('m1').delete());

    const gm1 = env.authenticatedContext('gm1');
    await assertSucceeds(chat(gm1).doc('m1').delete());
  });
});
