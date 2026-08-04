# Heartsoul — Sistema de Fichas

Site para os jogadores criarem, salvarem e consultarem suas fichas de personagem
do sistema Heartsoul, com um painel separado para o mestre ver todas as fichas.

## O que tem aqui

- **Cadastro/login de jogadores** (e-mail e senha)
- **Login separado de mestre** (promovido manualmente por quem administra o projeto, ver Passo 6)
- **Criação de ficha guiada**: atributos (16 pts), perícias (6 pts, livres),
  raça (20 raças, traço fixo + 2 opcionais), antecedente (opcional, 35 opções),
  traços adicionais (6 pts, com traço maligno obrigatório), história/aparência/inventário
- **Minhas Fichas**: cada jogador só vê e edita as próprias fichas
- **Painel do Mestre**: cria pastas de campanha e vê as fichas que estão
  dentro delas, agrupadas por jogador (ver seção "Mais de um Mestre no
  mesmo site" abaixo)
- Tudo salvo na nuvem via **Firebase** (gratuito), então funciona em qualquer
  dispositivo, sem perder nada ao fechar o navegador

## Passo 1 — Criar o projeto no Firebase (gratuito)

1. Acesse **https://console.firebase.google.com/** e clique em "Adicionar projeto".
2. Dê um nome (ex.: `heartsoul-fichas`) e siga o assistente (pode desativar o
   Google Analytics, não é necessário).
3. Dentro do projeto, clique no ícone **`</>`** ("Web") para registrar um app.
   Dê um apelido (ex.: `heartsoul-web`) e clique em "Registrar app".
4. O Firebase vai mostrar um bloco de código com `firebaseConfig = {...}`.
   **Copie esse objeto inteiro.**

## Passo 2 — Ativar Autenticação

1. No menu lateral, vá em **Build > Authentication**.
2. Clique em "Começar" (Get started).
3. Na aba "Sign-in method", ative o provedor **E-mail/senha**.

## Passo 3 — Ativar o banco de dados (Firestore)

1. No menu lateral, vá em **Build > Firestore Database**.
2. Clique em "Criar banco de dados".
3. Escolha o modo **produção** e a localização mais próxima de você (ex.: `southamerica-east1`).
4. Depois de criado, vá na aba **Regras** e substitua todo o conteúdo pelo
   arquivo `firestore.rules` deste projeto. Clique em "Publicar".

## Passo 4 — Colar as chaves no site

1. Abra o arquivo `js/firebase-config.js` deste projeto.
2. Substitua os valores de exemplo pelo `firebaseConfig` que você copiou no Passo 1.

## Passo 5 — Publicar no GitHub Pages

1. Crie um repositório novo no GitHub (pode ser público ou privado — se for
   privado, o GitHub Pages exige plano pago; público funciona no plano
   gratuito).
2. Suba todos os arquivos desta pasta para o repositório (mantendo a
   estrutura de pastas `css/`, `js/`, e os arquivos `.html` na raiz).
3. No repositório, vá em **Settings > Pages**.
4. Em "Source", escolha a branch `main` (ou `master`) e a pasta `/ (root)`.
   Salve.
5. Em alguns minutos, o GitHub vai te dar um link tipo
   `https://seu-usuario.github.io/nome-do-repo/`. Esse é o link que você
   compartilha com seus players.

## Passo 6 — Criar sua conta de mestre

Não existe mais tela de "criar conta de Mestre" com senha secreta — isso
foi removido de propósito: como o site inteiro roda no navegador, qualquer
senha ali estaria visível pra quem soubesse abrir o código-fonte, e
antigamente as regras do Firestore não impediam ninguém de simplesmente
criar o próprio perfil já como Mestre. Agora toda conta nova nasce como
jogador, e virar Mestre é uma ação manual, feita por você (dono do
projeto) direto no painel do Firebase:

1. Abra o site publicado e crie uma conta normal em "Sou Jogador" → "Criar
   conta", com seu e-mail e senha.
2. No [console do Firebase](https://console.firebase.google.com/), abra
   seu projeto → **Firestore Database** → coleção `users`.
3. Encontre o documento com o seu e-mail e mude o campo `role` de
   `"player"` para `"master"`.
4. Pronto — na próxima vez que entrar no site (ou recarregar a página),
   use "Sou Mestre" → "Entrar" com o mesmo e-mail e senha.

O mesmo passo 2-3 vale pra promover qualquer outra pessoa a Mestre depois
(por exemplo, se mais de uma pessoa do grupo vai narrar campanhas
diferentes — ver "Mais de um Mestre no mesmo site" abaixo).

## Como os jogadores entram

Cada jogador acessa o mesmo link, clica em "Sou Jogador" → "Criar conta",
preenche nome, e-mail e senha. A partir daí, cada um só vê e edita as
próprias fichas — você, como mestre, vê todas.

## Mais de um Mestre no mesmo site (dono de pasta e dono de mesa)

Se o seu site tem mais de uma conta de Mestre (mais de uma campanha rodando
no mesmo lugar), cada Mestre só enxerga e só mexe no que é dele:

- **Pastas/campanhas**: cada Mestre cria as próprias pastas. Só o Mestre
  que criou uma pasta pode renomeá-la ou excluí-la; a pasta de outro Mestre
  nem aparece pra ele gerenciar (aparece só na lista que o jogador vê ao
  escolher em qual campanha a ficha dele entra, já que essa lista precisa
  mostrar as pastas de todo mundo).
- **Fichas**: o Painel do Mestre só mostra as fichas que estão dentro de
  uma pasta sua, mais as fichas que você mesmo criou como jogador. A ficha
  de um jogador que está na campanha de outro Mestre (ou que ainda não
  escolheu nenhuma pasta) não aparece pra você, e você não consegue abrir,
  editar ou excluir essa ficha mesmo tendo o link direto — isso é aplicado
  no próprio Firestore (`firestore.rules`), não só escondido na tela.
- **Mesas**: se você (Mestre) entrar numa mesa criada por outro Mestre —
  seja só espiando, seja porque também joga naquela campanha como jogador —
  você é tratado como jogador comum ali: não vê os controles exclusivos de
  Mestre (gerar/apagar mapa, névoa, desenhos, iniciativa, adicionar NPC,
  excluir a mesa, acompanhar todos os sussurros, ver quem está na mesa
  etc.), só mexe no próprio token, e as rolagens ocultas de outra pessoa
  continuam ocultas pra você. Isso também é reforçado no Firestore, então
  vale mesmo tentando pelo console do navegador.
- **Importante:** se você já tinha publicado uma versão anterior deste
  projeto (antes desse isolamento existir), é preciso **republicar o
  `firestore.rules`** (Passo 3) de novo — sem isso as regras antigas
  continuam valendo e um Mestre ainda consegue mexer no que é de outro.
  Fichas que já estavam numa pasta continuam funcionando normalmente depois
  de republicar; só é preciso reabrir e salvar cada ficha uma vez (ou usar
  o seletor de pasta no Painel do Mestre) se ela tiver sido colocada numa
  pasta antes desta atualização, pra preencher o novo campo interno que
  identifica o Mestre dono da pasta.

## Mesa de Tabletop (tabuleiro)

- Qualquer jogador logado pode clicar em **"🗺️ Mesa"** no menu, escolher uma
  mesa e clicar em **"Entrar na mesa com esta ficha"**: isso cria um token no
  tabuleiro com o mesmo nome e a mesma imagem de aparência cadastrados na
  ficha. O jogador arrasta o próprio token livremente. A partir de agora, se
  o jogador editar a aparência ou o nome da ficha depois, o token na(s)
  mesa(s) em que ele estiver é **atualizado automaticamente** ao salvar a
  ficha — não precisa mais voltar na Mesa para clicar em "Atualizar
  aparência" (o botão continua lá, útil só pra trocar de ficha ou entrar na
  mesa pela primeira vez).
- O Mestre cria mesas na própria tela da Mesa, pode gerar **mapas
  proceduralmente** em **8 tipos de bioma** (masmorra, caverna, ruínas,
  floresta, pântano, geleira, necrópole, cidade em ruínas) e **6 tamanhos**
  (minúsculo, pequeno, médio, grande, épico e colossal), pode adicionar
  tokens avulsos (monstros/NPCs, com upload de imagem) e pode mover/remover
  qualquer token.
- **Dados da mesa**: qualquer rolagem feita no painel "🎲 Dados" da Mesa
  agora aparece, em tempo real, para todos os jogadores presentes (antes só
  aparecia para quem rolou). Tem uma caixinha **"Ocultar esta rolagem dos
  outros jogadores"** — quando marcada, só quem rolou e o Mestre veem o
  resultado; os outros jogadores nem recebem a rolagem (a regra é aplicada
  no próprio Firestore, não só escondida na tela). O Mestre também tem essa
  opção, para rolagens secretas de NPCs.
- Tudo é sincronizado em tempo real via Firestore (coleções `tables`,
  `tables/{id}/tokens` e `tables/{id}/rolls`) — se dois jogadores estiverem
  na mesma mesa, cada um vê o outro se mover e rolar dados ao vivo.
- **Importante:** se você já tinha publicado uma versão anterior deste
  projeto, é preciso **republicar o `firestore.rules`** (Passo 3) de novo —
  a rolagem de dados compartilhada usa uma coleção nova (`rolls`) que só
  funciona com as regras atualizadas deste pacote. Sem isso, a Mesa continua
  funcionando normalmente, mas os dados dão erro de permissão.

## Seletor de cenas (estilo Owlbear Rodeo)

- No painel **🎬 Cenas** (só o Mestre vê), dá pra ter **várias cenas
  (mapas) preparadas de antemão** dentro da mesma mesa — ex.: "Taverna",
  "Masmorra — Nível 1", "Emboscada na estrada" — e trocar qual está sendo
  exibida com um clique em **"○ Usar"**. A troca aparece **na hora** para
  todos os jogadores presentes, exatamente como o seletor de cenas do
  Owlbear Rodeo.
- Cada cena guarda **seu próprio mapa** (gerado ou enviado), **seus
  próprios desenhos** (✏️) e **sua própria névoa de guerra** (🌫) — mudar de
  cena não apaga nem mistura o que foi preparado em outra.
- **"+ Nova cena"** cria uma cena em branco (dá pra nomear antes) e já a
  deixa ativa, pra você gerar ou enviar o mapa dela no painel de mapa logo
  abaixo. As setas **↑ ↓** reordenam a lista, e o **🗑** exclui uma cena
  (não é possível excluir a última restante).
- **NPCs por cena:** um monstro/NPC avulso criado enquanto uma cena está
  ativa só aparece nessa cena — assim, os goblins da masmorra não aparecem
  do nada na cena da taverna. Na lista "Fichas na mesa", um NPC que está em
  outra cena aparece esmaecido com "(outra cena)" e um botão **"📥 trazer"**
  pra Mestre trazê-lo pra cena atual, se quiser. As **fichas dos
  jogadores continuam as mesmas em qualquer cena** — o grupo "atravessa"
  de uma cena para a outra junto, sem precisar recriar tokens.
- **Iniciativa por cena:** "+ Adicionar tokens presentes" agora só traz pra
  lista quem está de fato na cena atual (NPCs de outra cena ficam de fora),
  pra não misturar o combate de uma cena com monstros que não estão nela.
- Mesas criadas antes deste recurso são **migradas automaticamente**: na
  primeira vez que o Mestre abrir uma mesa antiga, o mapa que já existia
  vira a "Cena 1" e os desenhos/névoa de antes são preservados nela.
- **Importante:** isto usa uma coleção nova no Firestore (`scenes`, dentro
  de cada mesa) e um novo campo (`sceneId`) em `drawings` e `fog` — se você
  já tinha publicado uma versão anterior, **republique o `firestore.rules`**
  (Passo 3) de novo, senão o painel de cenas dá erro de permissão.

## Dano e cura automáticos nas rolagens da mesa

- No painel **🎲 Dados** da Mesa, abaixo do campo de comando, dá pra escolher
  um **alvo** (qualquer token presente na cena atual — ficha de jogador ou
  NPC do Mestre). Ao escolher um alvo, aparecem mais dois campos: a **parte
  do corpo** (Cabeça, Tronco, Braço Esquerdo, Braço Direito, Perna Esquerda,
  Perna Direita) e a **ação** (⚔️ Causar dano ou ❤️ Curar).
- Com alvo, parte e ação marcados, ao clicar em "Rolar" o **total da própria
  rolagem** já é debitado (dano) ou somado (cura) automaticamente no HP
  daquela parte do token-alvo — sem nenhum passo manual a mais. O resultado
  (ex.: "Cabeça: 14 → 6 HP") aparece tanto no histórico de rolagens quanto
  atualizado na hora para todos os presentes na mesa.
- Deixando o alvo em "— sem alvo —" a rolagem funciona exatamente como
  antes (livre, sem mexer em HP de ninguém).
- Cada token na mesa guarda seu próprio HP por parte (separado da ficha, pra
  funcionar também com NPCs avulsos que não têm ficha nenhuma). Quando um
  jogador entra na mesa com uma ficha, o HP do token começa igual ao da
  ficha (Cabeça, Tronco, Braços e Pernas); um NPC avulso criado pelo Mestre
  começa com 10/10 em cada parte, ajustável manualmente.
- Na lista **"Fichas na mesa"**, o botão **"❤ HP"** ao lado de cada token
  (visível pra você no seu próprio token, e pro Mestre em qualquer um)
  expande um mini-editor com o HP atual/máximo de cada uma das 6 partes,
  para corrigir um valor a qualquer momento (não só via rolagem).
- **Importante:** isto usa um novo campo (`hp`) dentro de cada token — se
  você já tinha publicado uma versão anterior deste projeto, é preciso
  **republicar o `firestore.rules`** (Passo 3) de novo, senão aplicar
  dano/cura no token de outra pessoa (por exemplo, um jogador atacando um
  NPC do Mestre) dá erro de permissão. Mover, girar e as outras ações do
  próprio token continuam funcionando normalmente mesmo sem republicar.

## Chat da mesa

- Com uma mesa aberta, aparece um **botão flutuante 💬** no canto inferior
  direito da tela (funciona em desktop e mobile). Clicar abre um popup de
  conversa com 2 abas:
  - **📣 Geral** — todos os presentes na mesa veem e enviam.
  - **🤫 Sussurro** — pensado para 2 personagens conversarem "dentro do RP"
    sem os outros jogadores saberem, mas o **Mestre desta mesa sempre
    consegue ler**. Na aba de Sussurro, o Mestre tem um seletor com
    **"👁️ Ver todos os sussurros"** (modo padrão, acompanha todas as
    conversas da mesa sem precisar escolher uma dupla) e também pode
    **escolher um jogador da lista para sussurrar diretamente com ele**
    (ex.: dar uma dica privada, falar "como um NPC à parte", etc.) — vira
    uma conversa normal entre os dois, que os dois leem, e o Mestre continua
    enxergando as outras também. Dentro do modo "ver todos", também dá pra
    clicar no **nome de qualquer pessoa** numa mensagem observada para
    entrar direto na conversa com ela, sem precisar usar o seletor. Se o
    site tiver mais de um Mestre (mais de uma campanha), só o Mestre
    **dono desta mesa** vê os sussurros dela — o de outra campanha não tem
    acesso.
- O botão de **–** minimiza o popup sem perder a conversa (fecha só
  visualmente; reabrir mostra tudo de novo); o **✕** fecha de vez. Um
  contador vermelho aparece no botão flutuante quando chegam mensagens
  novas com o chat fechado/minimizado, e cada aba (Geral/Sussurro) agora
  também mostra uma **bolinha própria** quando ela especificamente tem
  mensagem nova, mesmo com o popup aberto na outra aba.
- Mensagens de sussurro têm um visual levemente diferente (borda
  tracejada, itálico) para não se confundir com o chat geral à primeira
  vista, e mensagens do Mestre — em qualquer canal — ganham uma etiqueta
  **"Mestre"** ao lado do nome.
- No mobile o popup ocupa quase a tela toda, com abas, campo de texto e
  botão de enviar maiores para o toque.
- **Importante sobre permissões:** o cliente só *sugere* o canal e o
  destinatário do sussurro — quem garante que ele não vaza para quem não
  deveria ver é a regra do Firestore (`firestore.rules`), aplicada mensagem
  por mensagem, no mesmo estilo já usado nas rolagens de dados ocultas.
  Este projeto não tem um servidor Node/Socket.IO próprio — quem faz esse
  papel de "validação no servidor" aqui é o próprio Firestore.
- **Limitação conhecida:** a lista de destinatários de Sussurro é montada a
  partir de quem já "entrou na mesa com uma ficha" (tem um token no
  tabuleiro) — um jogador que só entrou na mesa mas ainda não escolheu uma
  ficha não aparece como destinatário até fazer isso.
- **Importante:** isto usa uma coleção nova no Firestore (`chatMessages`,
  dentro de cada mesa) — se você já tinha publicado uma versão anterior,
  **republique o `firestore.rules`** (Passo 3) de novo, senão o chat dá erro
  de permissão. Se você já tinha publicado a versão *com* o canal Privado
  antigo, republicar de novo também é o que corrige um bug de escopo do
  Sussurro (antes, qualquer conta de Mestre no site — não só o Mestre da
  mesa — conseguia ler o sussurro de qualquer mesa).

## Ferramentas de mapa

Uma barra de ferramentas aparece acima do tabuleiro (✋ Mover é a padrão —
arrastar move o mapa, roda do mouse/pinça dá zoom, exatamente como antes):

- **📏 Régua** — clique e arraste sobre o mapa para medir a distância entre
  dois pontos, em número de casas da grade. Os dois pontos agora **encaixam
  no centro da célula mais próxima** (a mesma regra de "🧲 Encaixar na
  grade" usada para soltar tokens), com as duas células destacadas na tela
  para ficar claro de onde a que ponto a medida está sendo feita — segure
  **Alt/Option** para medir livre, sem encaixar (útil pra medir algo que não
  está alinhado à grade). É só uma medida na tela de quem está usando (não
  fica salva nem aparece pra outros jogadores).
- **📍 Marcar** — qualquer jogador pode clicar num ponto do mapa pra chamar
  atenção de todos; aparece um círculo pulsante ali por ~1,5s pra todo mundo
  presente na mesa, e some sozinho.
- **✏️ Desenhar** (só Mestre) — desenha traços livres por cima do mapa
  (5 cores disponíveis), úteis pra marcar rotas, áreas de efeito, etc. Fica
  salvo e visível a todos até o Mestre clicar em "🧹 Limpar desenhos".
- **🌫 Névoa** (só Mestre) — arraste para cobrir uma área do mapa com névoa
  de guerra; jogadores veem essa área totalmente escondida, o Mestre a vê
  semitransparente (pra saber o que está escondendo sem perder a visão geral
  do mapa). Clique numa área já coberta pra revelá-la, ou use "☀️ Revelar
  tudo" pra remover toda a névoa de uma vez.
- **Girar/redimensionar/camada do token** — na lista "Fichas na mesa", cada token tem
  botões ⟲ ⟳ (girar 15°), − + (de 0,5× a 3× o tamanho de uma célula), e agora também
  ⬆︎ **Trazer para frente** / ⬇︎ **Enviar para trás**, pra resolver quando um token
  grande acaba cobrindo outro menor no mapa.
- **Mapa próprio** — no painel do Mestre, além de gerar mapas
  proceduralmente, dá pra enviar uma imagem sua (comprada, desenhada, print
  de outro programa etc.). Escolha o arquivo, informe em quantas colunas a
  grade deve dividir a imagem e clique em "Enviar mapa" — a grade é
  desenhada por cima automaticamente, do mesmo jeito que nos mapas
  procedurais, pra encaixar os tokens certinho.

**Importante:** estas ferramentas usam três coleções novas no Firestore
(`drawings`, `fog`, `pings`, dentro de cada mesa) — se você já tinha
publicado uma versão anterior, **republique o `firestore.rules`** (Passo 3)
de novo, senão elas dão erro de permissão.

## Estrutura de arquivos

```
index.html            → tela de login/cadastro (jogador e mestre)
minhas-fichas.html     → lista de fichas do jogador logado
ficha-editor.html      → criação/edição de ficha (o "assistente" com as etapas)
ficha-view.html         → visualização de uma ficha específica
master.html             → painel do mestre (todas as fichas, por jogador)
mesa.html                → mesa de tabletop: mesas, tokens (fichas) e mapas do mestre
livro-de-regras.html    → compêndio de regras do sistema, com busca e navegação por capítulos
css/style.css            → visual do site
js/data.js                → dados do sistema (raças, traços, antecedentes) — gerado do livro de regras
js/firebase-config.js     → SUAS chaves do Firebase (editar antes de publicar)
js/firebase-init.js       → inicialização do Firebase e funções auxiliares
js/editor.js               → lógica da criação de ficha
js/view.js                  → lógica da visualização de ficha
js/master.js                → lógica do painel do mestre
js/mesa-board.js               → mesa de tabletop: estado, cores, lobby, cenas, presença, zoom/pan
js/mesa-tools.js               → mesa: régua, desenhar, névoa, marcar, áreas de efeito
js/mesa-tokens.js              → mesa: tokens, HP, iniciativa, mapa do mestre
js/mesa-dice.js                → mesa: rolagens de dados
js/mesa-chat.js                → mesa: chat (geral/sussurro)
js/mesa-init.js                → mesa: inicialização (carregar sempre por último)
                                 (os 6 acima eram um só js/mesa.js; divididos por tamanho —
                                 ver ordem de carregamento em mesa.html)
js/mapgen.js                  → gerador procedural de mapas de batalha (masmorra/caverna)
firestore.rules              → regras de segurança do banco de dados
```

## Dúvidas comuns

**"Erro: Firebase: Error (auth/configuration-not-found)"** — normalmente
significa que o método E-mail/senha não foi ativado (Passo 2) ou que as
chaves em `firebase-config.js` estão erradas.

**Um jogador não consegue ver a ficha dele** — confira se as regras do
Firestore (Passo 3) foram publicadas corretamente.

**Quero mudar o limite de pontos (16 de atributo, 6 de perícia, 6 de traço)**
— esses números estão no topo do arquivo `js/editor.js`, nas constantes
`ATTR_POOL_MAX`, `SKILL_POOL_MAX` e `TRAIT_POOL_MAX`.
