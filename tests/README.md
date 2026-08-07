# Testes automatizados

Duas suítes independentes, cada uma no seu canto:

- **`tests/client/`** — o parser de texto de traço do editor de ficha
  (bônus de atributo, elemento, perícia). Sem emulador, sem internet:
  `npm test`. Ver `tests/client/README.md`.
- **Este diretório (`tests/*.test.js`)** — as regras do Firestore,
  descritas abaixo. Precisa do emulador: `npm run test:rules`.

---

# Testes das regras do Firestore

Testa `firestore.rules` direto contra o emulador local do Firestore —
sem precisar de projeto Firebase real, sem internet, sem gastar nada.
Cobre `/users`, `/folders`, `/sheets`, `/tables` + `tokens`, `rolls` e
`chatMessages`.

## Por quê

As regras são a parte mais crítica (e mais fácil de quebrar sem perceber)
do projeto: um erro ali pode vazar dado de um jogador pra outro, ou
quebrar uma tela inteira com `permission-denied` (como já aconteceu com
o chat da mesa). Testar direto contra o emulador pega esse tipo de erro
antes de publicar, sem precisar abrir o site manualmente com duas contas
diferentes em duas abas pra conferir.

## Como rodar

Precisa de [Node.js](https://nodejs.org) e do
[Firebase CLI](https://firebase.google.com/docs/cli) (já listado como
dependência de desenvolvimento).

```bash
npm install
npm run test:rules
```

Isso sobe o emulador do Firestore na porta 8080 (config em
`firebase.json`), roda todos os arquivos em `tests/` com o runner nativo
do Node (`node --test`), e derruba o emulador no final — tudo automático,
um único comando.

Se preferir deixar o emulador aberto pra debugar (ver os dados no meio
de um teste, por exemplo), rode em dois terminais:

```bash
# terminal 1
npx firebase emulators:start --only firestore

# terminal 2
node --test tests/
```

## Estrutura

- `tests/helpers.js` — sobe o ambiente de teste com as regras reais do
  projeto, e tem atalhos (`seedMaster`, `seedPlayer`, `seed`) pra
  preparar o cenário de cada teste "como admin", ignorando as regras
  (do jeito que só o Firebase Admin conseguiria).
- Um arquivo de teste por coleção principal: `users`, `folders`,
  `sheets`, `tables-tokens`, `rolls`, `chatMessages`.

## Ao mudar `firestore.rules`

Sempre que uma regra mudar, rode os testes de novo antes de publicar
(`firebase deploy --only firestore:rules`). Se uma regra nova não tiver
teste cobrindo o caso que você quer garantir, adicione um `t.test(...)`
no arquivo correspondente — o padrão de cada teste é sempre "prepara o
cenário com `seed`, chama a operação como o usuário certo,
`assertSucceeds` ou `assertFails`".
