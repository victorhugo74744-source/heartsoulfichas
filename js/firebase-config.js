// ============================================================
// CONFIGURAÇÃO DO FIREBASE — preencha com as chaves do SEU projeto
// ============================================================
// Como conseguir isso:
// 1. Vá em https://console.firebase.google.com/ e crie um projeto (grátis).
// 2. No painel do projeto, clique no ícone "</>" (Web) para registrar um app.
// 3. Copie o objeto "firebaseConfig" que aparece e cole abaixo, substituindo
//    os valores de exemplo.
// 4. No menu lateral, ative:
//      - "Authentication" → método "E-mail/senha"
//      - "Firestore Database" → crie o banco (modo produção)
// 5. Em Firestore > Regras, cole as regras do arquivo firestore.rules
//    (na raiz deste projeto) e publique.
//
// Veja o README.md para o passo a passo completo.
// ============================================================

window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyDdP-zZwD-Z3vRnfP0WnLlb2kwGDLmijCE",
  authDomain: "fichas-heartsoul.firebaseapp.com",
  projectId: "fichas-heartsoul",
  storageBucket: "fichas-heartsoul.firebasestorage.app",
  messagingSenderId: "945190925165",
  appId: "1:945190925165:web:e2ff5e6235d3c66fe12064",
  measurementId: "G-3YXDQDKW6S"
};

// Não existe mais senha secreta de Mestre — contas de Mestre agora só são
// criadas manualmente, editando o campo "role" para "master" direto no
// Firestore (Console do Firebase > Firestore Database > coleção "users").
// Veja o README.md, seção "Como promover alguém a Mestre".
