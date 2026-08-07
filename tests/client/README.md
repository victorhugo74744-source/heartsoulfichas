# Testes do parser de texto de traço (client-side)

Testa as funções de `js/editor-core.js` e `js/editor-build.js` que leem o
texto livre de um traço (`desc`) e extraem dele bônus de atributo
("+2 Vontade"), elemento (fogo/gelo/raio/.../água) e perícia concedida
("Perícia: Furtividade."). Roda sem navegador, sem emulador do Firebase e
sem internet — só `node --test`.

## Por quê

Esses parsers são "melhor esforço": regex lendo texto escrito à mão, sem
nenhuma estrutura por trás. Um traço novo com fraseado levemente diferente
do padrão esperado ("+2 em Força" em vez de "+2 Força", um atributo
digitado em minúsculo, uma palavra acentuada logo no início de um elemento)
passa batido **sem nenhum erro aparecer** — a ficha simplesmente não aplica
o bônus, e só se percebe manualmente comparando com o livro de regras.

Além dos testes unitários de cada função, há dois testes que rodam contra
o catálogo real (`js/data/traits.js`, todos os traços cadastrados) em vez
de só exemplos inventados — são esses que pegam esse tipo de regressão
silenciosa quando uma leva nova de traços é adicionada.

## Como rodar

```bash
npm install   # só na primeira vez
npm test
# ou, direto:
node --test tests/client/*.test.js
```

Não precisa de Firebase CLI nem de emulador (isso só é necessário pra
`npm run test:rules`, que testa outra coisa — `firestore.rules`).

## Estrutura

- `load-editor.js` — sobe `editor-core.js` + `editor-build.js` num sandbox
  de VM mínimo (sem jsdom) só o suficiente pra essas duas funções rodarem
  fora do navegador. Ver comentário no topo do arquivo pra detalhes de por
  quê (e por que `assert.deepEqual` direto contra o retorno dessas funções
  falha com "not reference-equal" — é preciso `plain(...)` primeiro).
- `load-traits-data.js` — lê `js/data/traits.js` e devolve o catálogo real
  como objeto JS (sem executar o arquivo — só extrai o JSON).
- `trait-parser.test.js` — os testes de fato.

## Ao adicionar uma leva nova de traços

Rode `npm test` antes de publicar. Se o teste "catálogo real: todo
'+N Palavra'..." quebrar, ele aponta o traço exato e o padrão que não foi
reconhecido — geralmente é um de dois casos:

1. É um atributo de verdade, só que escrito diferente do que o parser
   espera (ex.: minúsculo, ou um sinônimo) → ajuste o texto do traço pra
   bater com o padrão (`+N Força/Foco/Vontade/Intelecto/Destreza/
   Constituição`, exatamente com maiúscula e acento assim).
2. Não é um atributo (é um termo de jogo tipo "Defesa", "Iniciativa",
   "PV"...) → adicione a palavra em `KNOWN_NON_ATTR_WORDS` no topo de
   `trait-parser.test.js`, só depois de confirmar que não deveria mesmo
   virar bônus.
