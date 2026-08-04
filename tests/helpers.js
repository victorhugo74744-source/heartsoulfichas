'use strict';

// Helper compartilhado pelos testes de firestore.rules.
//
// Usa @firebase/rules-unit-testing contra o emulador local do Firestore
// (nunca contra o projeto real). Cada teste chama getEnv() uma vez por
// arquivo (ver beforeEach/afterEach nos próprios arquivos de teste) e usa
// env.authenticatedContext(uid) / env.unauthenticatedContext() para simular
// um usuário específico, exatamente como request.auth apareceria nas regras.
//
// Como rodar: `npm run test:rules` (sobe o emulador, roda os testes com
// node --test, derruba o emulador). Precisa do Firebase CLI instalado
// (já vem como devDependency) e não precisa de projeto Firebase real nem
// de internet — tudo roda local na porta 8080 (ver firebase.json).

const fs = require('fs');
const path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');

const PROJECT_ID = 'heartsoul-rules-test';

async function getEnv() {
  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(path.resolve(__dirname, '../firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080
    }
  });
}

// Atalho para popular dados "como admin" (ignorando as regras), útil para
// preparar o cenário do teste (ex.: criar de antemão o /users/{uid} com
// role=master antes de testar o que esse master pode fazer em /tables).
async function seed(env, fn) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await fn(ctx.firestore());
  });
}

async function seedMaster(env, uid) {
  await seed(env, (db) => db.collection('users').doc(uid).set({
    name: uid, email: `${uid}@x.com`, role: 'master'
  }));
}

async function seedPlayer(env, uid) {
  await seed(env, (db) => db.collection('users').doc(uid).set({
    name: uid, email: `${uid}@x.com`, role: 'player'
  }));
}

module.exports = { getEnv, seed, seedMaster, seedPlayer, PROJECT_ID };
