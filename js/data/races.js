// Dados das 24 raças jogáveis do sistema Heartsoul (extraído de js/data.js).
// Não editar manualmente sem checar js/data.js, que combina este arquivo com
// traits.js e backgrounds.js em window.HEARTSOUL_DATA.
window.HEARTSOUL_RACES = [
 {
  "id": "raca-humano",
  "name": "Humano",
  "flavor": [
   "Os humanos são a raça mais numerosa e diversificada do mundo. Encontrados em praticamente todos os cantos, eles se destacam não por uma força física superior ou por dons mágicos inatos, mas por sua incrível capacidade de adaptação, comunicação e engenhosidade. Sua sociedade é complexa, repleta de nuances, e sua história é marcada tanto por feitos grandiosos quanto por terríveis atrocidades. Escolher um humano é abraçar a versatilidade em sua forma mais pura."
  ],
  "fixedTrait": "Instinto de Sociedade: Todos os humanos possuem uma predisposição natural para viver em comunidade e se comunicar com outras raças. Você tem mais facilidade para negociações, comércio e diplomacia. +2 em testes de Persuasão e Intuição ao interagir com qualquer raças.",
  "optionalTraits": [
   "Poder Humano: Um traço sombrio que surge em humanos obcecados pela pureza racial. Você nutre um ódio profundo por não-humanos e canaliza essa aversão em combate. +2 em testes de ataque e dano contra inimigos não- humanos. -2 nos mesmos testes ao enfrentar oponentes humanos. -2 em testes sociais com raças não humanas que percebam sua hostilidade.",
   "Mente Adaptativa: Fruto de eras de adaptação em ambientes hostis e entre as mais variadas criaturas, a mente humana se tornou resiliente e flexível. +1 Intelecto. +2 Vontade.",
   "Versatilidade Engenhosa: Os humanos têm uma capacidade inata de improvisar e criar soluções com os recursos disponíveis. Você consegue fabricar ferramentas e armas simples mesmo em condições precárias. +2 em testes de perícias manuais (criação de itens, reparos, arrombamentos). Improvisa ferramentas e armas simples sem sofrer penalidades.",
   "Fé Incrustada: Alguns humanos levam a fé a um nível extremo, vivendo e respirando por suas crenças. Sua convicção é tão profunda que se torna uma fonte extra de poder. Se a classe inicial for Crença (Fé): +3 pontos de Fé adicionais ao reservatório. Escolha um atributo para receber +2 permanente. Se a classe inicial não for Crença, este traço não pode ser escolhido.",
   "Espírito Empreendedor: Você nasceu para o comércio, sabendo ler pessoas e oportunidades onde outros veem apenas mercadorias. +1 Vontade. +2 em testes de comércio, barganha e avaliação de mercadorias.",
   "Sangue Misturado: Há algo de não-humano em sua linhagem distante, e isso se manifesta sutilmente. Escolha uma raça além de Humano. Você ganha +1 em um atributo relacionado a essa raça (ex.: Elfo → +1 Foco, Orc → +1 Força, Anão → +1 Constituição) e uma característica física sutil (olhos ligeiramente puxados, presas pequenas, resistência maior)."
  ]
 },
 {
  "id": "raca-elfo",
  "name": "Elfo",
  "flavor": [
   "Os elfos são seres longevos, de beleza etérea e orelhas pontiagudas. Habitam florestas ancestrais, cidades de cristal ou reinos isolados, onde cultivam sua cultura refinada e suas tradições milenares. São exímios arqueiros, estudiosos da magia e guardiões de conhecimentos antigos, mas carregam consigo um orgulho racial que beira a arrogância. Consideram os orcs como criaturas bárbaras e destrutivas. Quanto aos humanos, toleram-nos em pequenas doses, admirando sua ambição, mas desprezando sua falta de refinamento."
  ],
  "fixedTrait": "Natureza Élfica: A percepção élfica é lendária, e seu corpo não exige o descanso que os mortais precisam. Seus olhos e ouvidos captam detalhes que outras raças jamais notariam, e a penumbra não é obstáculo para você. +2 Foco. Visão no escuro até 18 metros. Em vez de dormir, você entra em transe — uma meditação profunda e semiconsciente — por 4 horas. Durante o transe, você permanece ciente do que acontece ao seu redor e não pode ser pego de surpresa, exceto se estiver incapacitado por outros meios. Ao final das 4 horas, você recebe os mesmos benefícios de um descanso longo completo de 8 horas.",
  "optionalTraits": [
   "Herança Arcana: O sangue élfico carrega resquícios de magia ancestral que flui através das gerações. Sua conexão com o místico é natural. +2 Intelecto. Se sua classe usar Mana: +2 pontos de Mana adicionais.",
   "Passos da Floresta: Acostumado a percorrer bosques e selvas, você se move silenciosamente pela natureza como uma brisa entre as folhas. +2 em testes de Furtividade em ambientes naturais. Não deixa rastros visíveis.",
   "Precisão Natural: A coordenação motora dos elfos é refinada por séculos de prática. Seus ataques à distância encontram brechas onde outros veem apenas obstáculos. +2 Destreza, +2 Foco. Ignora penalidades de cobertura parcial em ataques à distância.",
   "Língua de Prata Élfica: Treinado na diplomacia e na arte do subterfúgio verbal, você sabe como usar palavras para conseguir o que deseja — seja com elogios ou ameaças veladas. +2 em testes de Persuasão e Enganação.",
   "Memória Ancestral: Você herdou as lembranças de seus antepassados élficos, e eles sussurram sabedoria em sua mente. +2 Intelecto. Uma vez por cena, ao realizar um teste de Intelecto, Foco ou Vontade, você pode rolar o dado novamente e ficar com o melhor resultado.",
   "Reflexos do Bosque: A agilidade élfica se traduz em reação rápida diante do perigo. Uma vez por combate, você pode repetir um teste de Esquiva recém-falhado, ficando com o novo resultado.",
   "Flecha Certeira: Sua pontaria élfica encontra brechas que outros não veem. Uma vez por combate, um ataque à distância seu ignora metade da Defesa do alvo."
  ]
 },
 {
  "id": "raca-elfo-negro",
  "name": "Elfo Negro",
  "flavor": [
   "Nas profundezas onde a luz do sol nunca chega, os elfos negros construíram sua civilização, cidades de pedra escura e cristais luminescentes, teias de política e traição, templos dedicados a deuses esquecidos e magias que torcem a própria escuridão. Sua pele varia do cinza-azulado ao preto absoluto, seus cabelos são brancos ou prateados como a luz da lua, e seus olhos, vermelhos, violetas ou pálidos como os de um cadáver, enxergam perfeitamente na mais completa escuridão.",
   "Temidos e estigmatizados pelas raças da superfície, os elfos negros carregam a reputação de serem cruéis, traiçoeiros e impiedosos. Em parte, essa fama é merecida: sua sociedade valoriza a astúcia, a ambição e a sobrevivência a qualquer custo. Mas também é verdade que muitos elfos negros fogem desse destino, buscando na superfície uma nova vida longe das intrigas de suas casas nobres. Um elfo negro aventureiro é frequentemente um exilado, um fugitivo ou alguém que ousou questionar a ordem cruel de seu próprio povo."
  ],
  "fixedTrait": "Herança das Profundezas: Nascido na escuridão eterna das cavernas, você carrega os dons e as marcas do subterrâneo — e também suas fragilidades. Atributos: +2 Foco, +2 Intelecto. Visão no Escuro: visão no escuro total até 24 metros (em preto e branco). Sentidos Subterrâneos: +2 em testes de Percepção e Sobrevivência em ambientes subterrâneos (cavernas, túneis, masmorras). Orientação Natural: você nunca se perde em ambientes subterrâneos. Sabe instintivamente a profundidade em que está e a direção da superfície.",
  "optionalTraits": [
   "Arma da Nobreza: Treinado desde jovem com rapieiras, bestas de mão e adagas, armas tradicionais de seu povo. +1 em testes de ataque com rapieiras, bestas de mão e adagas. Uma vez por combate, um ataque crítico com essas armas causa +1d6 de dano adicional.",
   "Magia das Sombras: O sangue dos antigos magos das trevas ainda corre em suas veias. Você conhece um truque de magia sombria: pode apagar uma pequena fonte de luz (vela, tocha) a até 15 metros como Ação de Suporte, ou criar um globo de escuridão que obscurece 3,5 metros por 10 minutos. +2 Intelecto.",
   "Toque Venenoso: Sua linhagem carrega o conhecimento ancestral das artes venenosas, passado de geração em geração nas profundezas. +2 em testes para aplicar veneno em armas ou identificar substâncias tóxicas. Uma vez por combate, ao acertar um ataque com uma arma, você pode aplicar um veneno imediatamente: o alvo sofre 1d4 de dano adicional e -1 em testes físicos por 1 turno.",
   "Reflexos do Submundo: A vida nas profundezas exige reações instantâneas para sobreviver a emboscadas e criaturas rastejantes. +2 Destreza. Você não pode ser surpreendido enquanto estiver em ambientes subterrâneos ou escuros.",
   "Resistência Arcana: Seu povo desenvolveu uma tolerância natural às magias que uns usam contra os outros. +2 em testes de defesa contra feitiços e efeitos mágicos. Uma vez por descanso longo, pode anular um efeito mágico de nível 1 ou 2 que o tenha afetado (como uma maldição leve ou encantamento).",
   "Máscara da Nobreza Sombria: Você foi criado na corte dos elfos negros, aprendendo a esconder suas intenções por trás de um sorriso encantador. +2 em testes de Enganação e Persuasão. Uma vez por cena, ao mentir com naturalidade, você pode forçar um alvo a um teste de Vontade (CD 16). Se falhar, ele acredita em sua mentira.",
   "Olhos de Obsidiana: Seus olhos são como pedras negras polidas, capazes de enxergar até mesmo através de ilusões sombrias. +1 Foco. Você tem vantagem em testes para perceber ilusões, disfarces mágicos e invisibilidade (criaturas invisíveis aparecem como sombras fracas para você)."
  ]
 },
 {
  "id": "raca-meio-elfo",
  "name": "Meio-Elfo",
  "flavor": [
   "Filhos de duas culturas, os meio-elfos carregam em seu sangue a longevidade élfica e a ambição humana. Os elfos os veem como impuros. Os humanos os veem como estranhos. Ainda assim, desenvolveram uma resiliência emocional notável e uma capacidade ímpar de transitar entre esferas sociais distintas. Costumam se tornar diplomatas, comerciantes ou aventureiros, aqueles que vivem nas fronteiras, onde as regras são mais flexíveis."
  ],
  "fixedTrait": "Herança Élfica: Sangue élfico corre diluído em suas veias — não o bastante para dispensar o sono por completo, como um elfo puro, mas o suficiente para tornar seu descanso mais eficiente. Além disso, você carrega a herança social de ambas as raças progenitoras, o que o torna um mediador natural entre elas. +1 Foco. Seu descanso longo dura apenas 6 horas (em vez das 8 usuais) para conceder os mesmos benefícios de recuperação completa. +2 em testes de Persuasão e Diplomacia ao interagir com elfos ou humanos. Vantagem narrativa ao atuar como mediador em conflitos interculturais.",
  "optionalTraits": [
   "Visão Híbrida: Você herdou parcialmente os sentidos élficos. Não enxerga tão bem no escuro quanto um elfo puro, mas ainda supera a maioria das raças. +2 Foco. Visão em penumbra até 9 metros.",
   "Dualidade Cultural: Crescer entre duas culturas que raramente se entendem forçou sua mente a se tornar mais flexível e perspicaz. +2 Intelecto. +2 em testes de Intuição para identificar mentiras ou segundas intenções.",
   "Adaptabilidade Física: Nem tão frágil quanto um elfo, nem tão robusto quanto um humano, você encontrou seu próprio equilíbrio. +2 Destreza ou +2 Constituição (escolha no momento da criação).",
   "Mira Refinada: Parte da precisão élfica corre em suas veias. +1 Destreza. Ignora metade da penalidade de cobertura parcial ao realizar ataques à distância.",
   "Herança Flutuante: Seu sangue misto permite uma leve afinidade com uma das energias, dependendo de sua criação e inclinação pessoal. Se a classe for Energia (Mana): +2 pontos de Mana adicionais. Se a classe for Crença (Fé): +2 pontos de Fé adicionais. Se a classe for Poder (Aura): +2 pontos de Aura adicionais.",
   "Diplomata Nato: Você cresceu entre dois mundos e aprendeu a falar a língua de ambos. +2 em testes de Diplomacia e mediação de conflitos. Você pode acalmar discussões acaloradas com um teste de Vontade (CD 15), reduzindo a hostilidade em um nível.",
   "Ecos da Memória: Fragmentos da memória ancestral élfica sussurram em sua mente nos momentos certos. Uma vez por descanso curto, ao realizar um teste de Intelecto, Foco ou Vontade, você pode rolar o dado novamente e ficar com o melhor resultado."
  ]
 },
 {
  "id": "raca-orc",
  "name": "Orc",
  "flavor": [
   "Os orcs são a personificação da força bruta e da resiliência. Nascidos em clãs guerreiros, forjados em terras inóspitas e temperados por conflitos constantes, eles valorizam a honra do combate acima de tudo. Sua aparência imponente — pele esverdeada ou acinzentada, presas inferiores proeminentes, musculatura densa — intimida as raças mais frágeis. Nutrem um ódio profundo pelos elfos, que consideram covardes. Quanto aos humanos, enxergam-nos como criaturas fracas, embora respeitem aqueles que provam seu valor em batalha."
  ],
  "fixedTrait": "Resiliência Orc: O corpo de um orc é preparado para a guerra desde o nascimento. Mesmo quando ferido gravemente, você continua lutando quando outros já teriam caído. +2 Constituição. Uma vez por combate, ao zerar o HP de uma parte do corpo, teste de Constituição (CD 12) para mantê-la funcional por mais 1 rodada.",
  "optionalTraits": [
   "Visão do Mundo Espiritual: Seus olhos foram abertos pelo ritual de passagem, permitindo que você enxergue os espíritos que caminham entre os vivos. +1 Foco. Você pode ver criaturas invisíveis ou incorpóreas (espíritos, fantasmas, entidades) a até 9 metros, como se fossem sombras translúcidas.",
   "Intimidação Bestial: Sua presença é suficiente para fazer os fracos hesitarem. Não são apenas as presas, é o olhar, a postura, a aura de violência contida. +2 Força. +2 em testes de Intimidação. Se passar no teste de Intimidação, o alvo sofre -2 no próximo teste contra você.",
   "Golpe Brutal: Treinado para causar o máximo de estrago, você sabe exatamente onde bater para que doa mais. Uma vez por combate, ao acertar um ataque corpo a corpo: +2d4 de dano extra. Este dano não dobra em críticos.",
   "Pele de Pedra do Clã: Os xamãs do seu clã o ensinaram a invocar a resistência das montanhas para proteger seu corpo. +1 Constituição. Uma vez por descanso curto, você pode endurecer sua pele por 3 rodadas: reduz 2 pontos de dano físico (contundente, cortante, perfurante) recebido.",
   "Voz dos Ancestrais: Os espíritos dos antigos guerreiros orcs sussurram em seus ouvidos, guiando seus passos e inflamando sua coragem. +1 Vontade. Uma vez por cena, você pode invocar a sabedoria dos ancestrais: escolha um aliado ou a si mesmo. O alvo recebe +2 em seu próximo teste de ataque ou resistência.",
   "Ímpeto Selvagem: Ao derrubar um inimigo, você avança como uma avalanche. Ao reduzir um inimigo a 0 PV em qualquer parte do corpo, você pode se mover até 2 metros como ação livre."
  ]
 },
 {
  "id": "raca-meio-orc",
  "name": "Meio-Orc",
  "flavor": [
   "Os meio-orcs carregam a força de seus ancestrais orcs temperada pela adaptabilidade humana. São fisicamente imponentes — presas menores que as de um orc puro, mas ainda visíveis, pele em tons de verde-acinzentado, porte musculoso. Os orcs puros os veem como fracos. Os humanos frequentemente os temem ou desprezam. Apesar disso, os meio-orcs que superam o preconceito costumam se tornar guerreiros temíveis, mercenários respeitados ou líderes improváveis."
  ],
  "fixedTrait": "Determinação Implacável: A vida de rejeição forjou um espírito difícil de quebrar. Quando o mundo tenta oprimi-lo, você resiste com unhas e dentes. Uma vez por cena, ao sofrer um efeito de status negativo (medo, confusão, paralisia), teste de Vontade (CD 12) para reduzir a duração do efeito em 3 turnos. Além disso, quando o HP de uma parte vital (cabeça ou tronco) chegar a 0, faça um teste de Constituição (CD 16): se passar, permanece com 1 HP nessa parte e continua consciente. Uma vez por combate.",
  "optionalTraits": [
   "Fúria Contida: A herança orc se manifesta em momentos de raiva controlada. Você não perde o controle, você o usa. Uma vez por combate, ao entrar em fúria (ação livre): +2 em testes de ataque corpo a corpo por 2 rodadas. Após isso, sofre -1 em defesa por 1 rodada.",
   "Força Desproporcional: Mesmo para seu tamanho, você é anormalmente forte. Seus músculos parecem subestimar a gravidade. +2 Força. Capacidade de carga como se tivesse +2 adicionais de Força.",
   "Golpe Ancestral: O instinto de combate orc guia sua mão, mesmo que de forma menos brutal. Uma vez por combate, ao acertar um ataque corpo a corpo: +1d4 de dano extra. Este dano não dobra em críticos.",
   "Pele Curtida: Sua pele herdou parte da resistência orc, endurecida pela vida à margem. +1 Constituição. Uma vez por descanso curto, você pode endurecer sua pele por 2 rodadas: reduz 1 ponto de dano físico recebido.",
   "Sangue Guerreiro: O instinto de sobrevivência herdado dos orcs mantém você de pé quando outros já teriam caído. Uma vez por dia, ao zerar o HP de uma parte não-vital (braços ou pernas): ignora os efeitos de inutilização por 2 rodadas.",
   "Aparência Ameaçadora: A combinação de traços orcs e humanos resulta em uma figura que impõe respeito, ou medo. Você não precisa gritar para ser notado. +2 em testes de Intimidação. Se passar no teste, o alvo sofre -2 em seu próximo teste contra você.",
   "Eco dos Ancestrais: Vozes distantes de uma linhagem que você mal conhece ainda sussurram em momentos de necessidade. +1 Vontade. Uma vez por cena, você pode invocar essa herança: escolha um aliado ou a si mesmo. O alvo recebe +1 em seu próximo teste de ataque ou resistência."
  ]
 },
 {
  "id": "raca-an-o",
  "name": "Anão",
  "flavor": [
   "Os anões são um povo orgulhoso, forjado nas profundezas das montanhas e nas bigornas de suas lendárias forjas. Baixos e atarracados, com barbas exuberantes, eles são mestres da metalurgia, da engenharia e da guerra de resistência. Sua sociedade é clânica, baseada na honra familiar e no respeito aos ancestrais. Desconfiam profundamente dos humanos, que consideram volúveis e inconstantes. Apesar disso, respeitam o artesanato e a coragem individual."
  ],
  "fixedTrait": "Constituição das Montanhas: Forjados na dureza das rochas, os anões são excepcionalmente resistentes. Venenos e doenças que derrubariam outras raças são apenas inconvenientes para você. +2 Constituição. +2 adicional em testes para resistir a venenos ou doenças.",
  "optionalTraits": [
   "Mestre das Forjas: O anão carrega em seu sangue o conhecimento ancestral da metalurgia. Suas mãos reconhecem a qualidade de um metal antes mesmo que seus olhos o vejam. +2 em testes de criação e reparo de itens metálicos. Identifica a qualidade e composição de qualquer arma ou armadura apenas observando-a por alguns segundos.",
   "Guardião Implacável: Treinado para defender os salões subterrâneos, você é uma muralha viva. Quando firma os pés no chão, é difícil movê-lo. +2 adicional em testes de Bloqueio. Se já tiver bônus de escudo, o bônus do escudo aumenta em +1.",
   "Visão nas Profundezas: Acostumado às cavernas escuras, você enxerga perfeitamente onde outros tropeçam cegos. Visão no escuro total até 12 metros (em preto e branco). Em penumbra, visão colorida e nítida.",
   "Vigor de Batalha: A resistência anã é lendária. Você aguenta pancadas que fariam outros desabarem, e ainda pede mais uma rodada de hidromel. Uma vez por combate, ao receber dano: ignora 2d4 de dano do ataque (usa-se após o dano ser rolado).",
   "Resistência a Magia: Os anões sempre foram teimosos contra encantamentos. +1 Vontade. +2 em testes de resistência contra magia e efeitos arcanos.",
   "Orgulho dos Ancestrais: Quando você cai, os espíritos da montanha o erguem. Uma vez por dia, ao falhar em um teste, você pode invocar seus ancestrais e repetir o teste com +2."
  ]
 },
 {
  "id": "raca-meio-an-o",
  "name": "Meio-Anão",
  "flavor": [
   "Os meio-anões são fruto da união, rara e frequentemente malvista, entre anões e humanos. Herdam a robustez anã, mas com uma estatura um pouco mais elevada. Muitos clãs anões os tratam com frieza. Entre os humanos, são vistos como exóticos ou teimosos demais. Tornam-se artesãos dedicados, guerreiros obstinados ou mercadores que transitam entre o mundo das montanhas e o mundo da superfície."
  ],
  "fixedTrait": "Linhagem Dividida: Você carrega a herança de dois povos que raramente se entendem, e isso o torna mais forte. +2 em testes de Persuasão ao interagir com anões ou humanos. Uma vez por cena, pode repetir um teste de resistência recém-falhado, ficando com o novo resultado.",
  "optionalTraits": [
   "Sangue das Minas: A herança anã se manifesta na resistência física. Seus ossos são mais densos, seus pulmões acostumados ao ar pesado das profundezas. +2 Constituição. +2 em testes de sobrevivência em ambientes subterrâneos.",
   "Mãos Habilidosas: Herdou parte da aptidão artesanal anã, combinada com a versatilidade humana. Suas mãos criam o que sua mente imagina. +2 em testes de criação e reparo de itens (qualquer material).",
   "Pequeno Tanque: Mais resistente que um humano, mais ágil que um anão. Você é o equilíbrio perfeito entre força e mobilidade. +2 em testes de bloqueio. Pode usar armaduras pesadas sem sofrer penalidade de deslocamento.",
   "Olhos Acostumados: Seus olhos se adaptam rapidamente à escuridão, herança das gerações que viveram sob as montanhas. Visão em penumbra até 9 metros. Em ambientes totalmente escuros, discerne formas vagas a até 3 metros.",
   "Pele de Pedra: Sua herança anã endureceu sua pele como rocha. +1 Defesa. Reduz 1 ponto de dano físico (contundente, cortante, perfurante) recebido.",
   "Coração da Montanha: Você é tão difícil de mover quanto a própria terra. +1 Constituição. +2 em testes para resistir a empurrões, agarrões e desequilíbrios."
  ]
 },
 {
  "id": "raca-draconato-met-lico",
  "name": "Draconato-Metálico",
  "flavor": [
   "Os draconatos metálicos são herdeiros do sangue dos dragões nobres — ouro, prata, bronze, cobre e latão. Sua aparência reflete essa linhagem: escamas brilhantes, olhos com pupilas verticais, porte majestoso. A maioria segue filosofias de honra, justiça e proteção. Apesar de sua aparência imponente, muitos buscam integração com outras raças, servindo como paladinos, conselheiros ou guardiões. Outras raças os respeitam — ou os temem — instintivamente, pois mesmo sem saber, reconhecem o eco do dragão.",
   "Subtipos metálicos: Ouro, Prata, Bronze, Cobre, Latão."
  ],
  "fixedTrait": "Sopro Dracônico (Metálico): Você pode exalar uma descarga elemental de sua boca, como os dragões de sua linhagem. Ação Principal. Dano: 1d6 + Constituição. Tipo de dano: Ouro (Fogo), Prata (Gélido), Bronze (Elétrico), Cobre (Ácido), Latão (Fogo em cone amplo). Alcance: cone de 3 metros ou linha de 6 metros (varia pela linhagem). Uma vez por combate. Em nível 10: 2d6.",
  "optionalTraits": [
   "Escamas Resistentes: Sua pele draconata é naturalmente blindada, um presente de sua ancestralidade. Lâminas e projéteis encontram dificuldade em penetrá-la. +2 de Constituição. Resistência ao tipo de dano de sua linhagem: reduz 3 pontos de dano desse tipo.",
   "Presença Imponente: Seu porte inspira respeito e autoridade. Quando você fala, outras raças escutam, seja por admiração ou por temor. +2 em testes de Intimidação e Persuasão. +3 ao usar essas perícias contra não-draconatos.",
   "Afinidade Elemental: A conexão com a energia dracônica é mais forte em você. O elemento de sua linhagem responde ao seu chamado com entusiasmo. +2 ao dano de habilidades que causem o mesmo tipo de dano de seu sopro. +2 pontos adicionais da energia de sua classe (Aura, Mana ou Fé).",
   "Garras Naturais: Você possui garras retráteis que podem ser usadas como armas naturais. Mesmo desarmado, você nunca está verdadeiramente indefeso. Ataque com garras: 1d6 + Força de dano cortante. Armas leves (podem usar Destreza). Nunca fica desarmado.",
   "Sopro Aprimorado: Seu sopro dracônico é mais forte e frequente. O dano do seu Sopro Dracônico aumenta em +1d4. Você pode usar o Sopro Dracônico uma vez adicional por combate.",
   "Asas de Dragão Metálico: Suas costas abrigam um par de asas metálicas plenamente desenvolvidas, capazes de erguer seu corpo em voo. Você ganha deslocamento de voo de 9 metros. Pode voar por até 10 minutos contínuos. Após esse período, precisa descansar por 1 hora (descanso curto) para voar novamente. Enquanto voa, você não pode usar armas de duas mãos ou arcos longos (as asas atrapalham os movimentos amplos). Suas asas são resistentes: você pode usá-las como escudo, concedendo +1 Defesa enquanto estiver no chão e consciente.",
   "Instinto de Liderança: Sua presença dracônica inspira coragem nos aliados. Aliados a até 6 metros de você recebem +1 em testes de resistência contra medo e encantamento.",
   "Fúria do Dragão Metálico: Quando encurralado, o instinto do dragão desperta e a fúria assume o controle. Uma vez por combate, ao sofrer dano que zeraria o HP de uma parte do corpo, você pode entrar em fúria: +2 em testes de ataque corpo a corpo por 2 turnos. Enquanto em fúria, sofre -1 em Defesa."
  ]
 },
 {
  "id": "raca-draconato-crom-tico",
  "name": "Draconato-Cromático",
  "flavor": [
   "Os draconatos cromáticos descendem dos dragões de escamas coloridas — vermelho, azul, verde, preto e branco. Sua herança é tão poderosa quanto a dos metálicos, mas carrega um estigma: os dragões cromáticos são frequentemente associados à tirania, à destruição e ao caos. Apesar do preconceito, um draconato cromático não está condenado a seguir o caminho do mal — mas a sociedade ao seu redor frequentemente espera o pior.",
   "Subtipos cromáticos: Vermelho, Azul, Verde, Preto, Branco."
  ],
  "fixedTrait": "Sopro Dracônico (Cromático): Você pode exalar uma descarga elemental de sua boca, como os dragões de sua linhagem. Ação Principal. Dano: 1d6 + Constituição. Tipo de dano: Vermelho (Fogo), Azul (Elétrico), Verde (Ácido/Veneno), Preto (Ácido corrosivo), Branco (Gélido). Alcance: cone de 3 metros ou linha de 6 metros (varia pela linhagem). Uma vez por combate. Em nível 10: 2d6.",
  "optionalTraits": [
   "Fúria Dracônica: O sangue cromático ferve em combate. Abater um inimigo não o sacia, apenas o prepara para o próximo. Uma vez por combate, ao reduzir um inimigo a 0 PV (qualquer parte do corpo): ataque extra como ação livre contra outro alvo adjacente.",
   "Herança Predatória: Seus sentidos são aguçados para a caça. Você fareja sangue no ar e segue rastros com uma precisão assustadora. +2 em testes de Foco (Percepção). Vantagem em testes de Sobrevivência ou Investigação para rastrear inimigos feridos (cheiro de sangue).",
   "Escamas Intimidadoras: Sua aparência cromática é naturalmente ameaçadora. As pessoas se encolhem quando você se aproxima, e isso pode ser uma vantagem. +2 em testes de Intimidação. Se passar no teste, o alvo sofre -2 em seu próximo ataque contra você (o medo afeta a pontaria).",
   "Sangue Corrosivo: O sangue que corre em suas veias é ácido, uma herança maldita de seus ancestrais cromáticos. Sempre que você sofrer dano Cortante ou Perfurante, o atacante que causou o ferimento sofre 1d4 de dano de Ácido (respingo do seu sangue). Você é imune a dano de Ácido causado por seu próprio sangue.",
   "Sopro Aprimorado: Seu sopro dracônico é mais forte e frequente. O dano do seu Sopro Dracônico aumenta em +1d4. Você pode usar o Sopro Dracônico uma vez adicional por combate.",
   "Asas do Caçador Cromático: De suas costas brotam asas membranosas, escuras como a noite, que lhe permitem voar como um predador. Você ganha deslocamento de voo de 9 metros. Pode voar por até 10 minutos contínuos. Após esse período, precisa descansar por 1 hora (descanso curto) para voar novamente. Enquanto voa, você não pode usar armas de duas mãos ou arcos longos (as asas atrapalham os movimentos amplos). Suas asas permitem planar silenciosamente: +2 em testes de Furtividade durante o voo.",
   "Rugido do Tirano: Seu rugido carrega a autoridade brutal dos dragões cromáticos, esmagando a coragem alheia. Uma vez por combate, como Ação Principal, você pode emitir um rugido aterrorizante: todos os inimigos a até 6 metros fazem um teste de Vontade (CD 15). Se falharem, sofrem -2 em testes de ataque e -1 em Defesa por 1 rodada (medo). Aliados a até 6 metros recebem +1 em testes de ataque por 1 rodada (inspirados pela sua ferocidade)."
  ]
 },
 {
  "id": "raca-vampiro",
  "name": "Vampiro",
  "flavor": [
   "Os Vampiros são criaturas da noite, amaldiçoados com a sede insaciável de sangue e abençoados com poder e longevidade sobrenaturais. Originários de uma maldição ancestral ou de rituais profanos, eles habitam as sombras da sociedade, divididos entre sua humanidade perdida e os instintos predatórios que os governam. Sua aparência é sedutora e pálida, com olhos que brilham na escuridão e presas que se revelam ao sorrir. Apesar do estigma, nem todos os vampiros são monstros, alguns lutam contra sua natureza, buscando redenção ou um propósito maior."
  ],
  "fixedTrait": "Vampirismo: Você carrega a maldição e a dádiva do vampirismo. Seu corpo não produz energia vital própria — você a toma de outros seres. Você recebe a habilidade Aura de Sangue, que permite gastar Estamina para criar constructos de energia carmesim (armas, escudos, tentáculos, etc.) que se manifestam fisicamente por curtos períodos. Ao consumir sangue fresco de uma criatura viva (uma Ação de Suporte): cura 1d5 + Constituição de PV, distribuídos como desejar entre as partes do corpo. Se passar mais de 3 dias sem consumir sangue: -2 em todos os modificadores de atributo e -2 em testes de perícia. A cada dia adicional sem sangue, perde 10% dos PV máximos (acumulativo). Após 7 dias sem sangue, entra em frenesi e ataca a criatura viva mais próxima indiscriminadamente.",
  "optionalTraits": [
   "Forma da Noite: Você aprendeu a se transformar em uma criatura da escuridão. Ação Principal: transforma-se em enxame de morcegos ou névoa densa por até 1 minuto. Enxame: voa até 12 metros por turno, imune a ataques corpo a corpo, mas sofre +50% de dano de área. Névoa: imune a dano físico, mas não pode atacar ou interagir com objetos. Uma vez por descanso médio.",
   "Gula de Sangue: Você pode consumir sangue com rapidez assustadora, drenando inimigos em pleno combate. Sempre que causar dano com sua mordida (ou ataque desarmado que cause sangramento), você pode gastar uma Reação para recuperar 1d6 PV. Se o alvo estiver com sangramento ativo, a cura aumenta para 2d4 PV.",
   "Hipnose Predatória: Seu olhar prende a vontade dos fracos. Ação de Suporte: faça contato visual com um alvo humanoide. O alvo faz teste de Vontade (CD 16). Se falhar, fica fascinado e obedece a uma ordem simples (como \"largue a arma\", \"sente-se\", \"não grite\"). Ordens suicidas quebram o efeito. Dura 1 minuto ou até o alvo sofrer dano. -4 Stamina por uso.",
   "Passos das Sombras: Você se funde com a escuridão como se fosse parte dela. Em áreas de penumbra ou escuridão total: invisível para criaturas que dependam de visão normal. Criaturas com visão no escuro ainda podem vê-lo. +2 em testes de Furtividade em ambientes noturnos ou subterrâneos.",
   "Força Vampirica: Seu corpo morto-vivo é mais forte do que aparenta. +2 Força. Ao usar armas corpo a corpo, uma vez por turno: +1d3 de dano extra (energia necrótica/carmesim).",
   "Regeneração Vampírica: Seu corpo se cura sozinho na escuridão. Enquanto estiver em escuridão ou penumbra, você recupera 1 PV no início de cada turno.",
   "Linhagem Pura: Você descende diretamente de um dos primeiros vampiros, e sua maldição é mais forte — assim como seu poder. +1 em todos os atributos, exceto Constituição. Sua fraqueza ao sol é mais severa: sob luz solar direta, você sofre 1d4 de dano por turno (em vez de apenas penalidades). Em compensação, sua cura por consumo de sangue é aumentada em +2 PV."
  ]
 },
 {
  "id": "raca-dampiro",
  "name": "Dampiro",
  "flavor": [
   "Os meio-vampiros, ou dhampires, são filhos da união entre um vampiro e um mortal — geralmente humano. Carregam parte da maldição do vampirismo, mas sua humanidade permanece intacta o suficiente para caminhar sob o sol e sentir o calor da vida. Sua aparência é exótica: pele pálida, olhos com um brilho rubro sob a luz certa, caninos ligeiramente alongados. Rejeitados tanto pelos vampiros puros (que os veem como fracos) quanto pelos mortais (que os temem como monstros), os meio-vampiros vivem à margem, buscando um lugar onde possam pertencer — ou forjando seu próprio caminho."
  ],
  "fixedTrait": "Vampirismo (Meio-Sangue): Você herdou parte da maldição vampírica, mas de forma atenuada. Você recebe a habilidade Aura de Sangue, que permite gastar Estamina para criar pequenos constructos de energia carmesim (adagas, garras, correntes leves, etc.) que duram poucos segundos. Ao consumir sangue fresco de uma criatura viva (uma Ação de Suporte): cura 1d5 + Constituição de PV, distribuídos como desejar entre as partes do corpo. Tolerância ao Sol: você pode caminhar sob a luz do dia. Sofre apenas -1 em testes de Foco sob luz solar intensa (sensibilidade ocular), mas não sofre dano. Você não precisa se alimentar de sangue para sobreviver, mas sente o desejo — sem penalidades mecânicas, apenas incômodo narrativo (fome, irritabilidade).",
  "optionalTraits": [
   "Reflexos Vampiricos: Sua herança sobrenatural lhe concede agilidade sobre-humana. +2 Destreza. Uma vez por combate: repete um teste de esquiva recém-falhado, ficando com o novo resultado.",
   "Empatia Predatória: Você sente o cheiro do medo e da hesitação. +2 em testes de Intuição para detectar mentiras, medo ou intenções hostis. Se um alvo próximo a você estiver com sangramento ativo, você sabe sua localização exata, mesmo que esteja invisível ou em escuridão total (sente o cheiro do sangue).",
   "Sangue Híbrido: Sua herança mista o torna mais resistente que um vampiro puro e mais forte que um humano comum. +2 Constituição, +2 Força. Sempre que consumir sangue, você recupera +2 PV adicional.",
   "Herança Noturna: Você herdou parcialmente a afinidade com a escuridão. Visão em penumbra até 9 metros. +2 em testes de Furtividade durante a noite ou em ambientes escuros. Uma vez por descanso médio: véu de sombras ao redor que concede +2 na Defesa por 1 rodada (ação livre).",
   "Afinidade com as Sombras: As sombras são seu refúgio natural, e você se move nelas com uma fluidez sobrenatural. +2 em testes de Furtividade em ambientes de penumbra ou escuridão. Uma vez por cena, você pode desaparecer em uma sombra e reaparecer em outra a até 6 metros de distância (ação de movimento).",
   "Dança da Lâmina Rubra: Você luta com uma elegância mortal, como se o sangue do vampiro guiasse seus movimentos. +2 em testes de Esquiva. Uma vez por combate, ao esquivar completamente de um ataque, você pode fazer um ataque de oportunidade contra o agressor.",
   "Vigor do Sangue: O sangue que você consome não apenas cura — ele fortalece. Ao consumir sangue fresco, você ganha +2 em todos os testes físicos por 2 rodadas."
  ]
 },
 {
  "id": "raca-golias",
  "name": "Golias",
  "flavor": [
   "Os golias são descendentes dos antigos gigantes das montanhas, um povo forjado pelo vento cortante dos picos e pelo peso das rochas que chamam de lar. Com estatura que facilmente ultrapassa os dois metros e meio, corpos cobertos por tons de cinza, mármore ou argila, e marcas naturais que percorrem sua pele como veios de pedra, eles são tão imponentes quanto o ambiente de onde vêm. Sua cultura gira em torno da superação: cada golias busca constantemente desafiar seus próprios limites, seja escalando uma montanha jamais conquistada, seja derrotando um inimigo que ninguém mais ousaria enfrentar. Não temem a morte — temem apenas a estagnação. Em um grupo, o golias é a muralha inabalável ou o martelo que despedaça obstáculos, sempre em busca da próxima prova de força."
  ],
  "fixedTrait": "Sangue dos Gigantes: Seu corpo carrega a herança inegável dos gigantes ancestrais. Você é maior, mais denso e mais resistente do que as outras raças. +2 Constituição. Seu deslocamento base é de 8 metros (em vez de 5 metros). Sua altura e peso são o dobro da média humana.",
  "optionalTraits": [
   "Força das Montanhas: Seus músculos são fibras de aço forjadas nas altitudes. Você levanta pesos que fariam outros desabarem. +2 Força. Capacidade de carga e dobrada.",
   "Resistência ao Frio: Nascido nos picos onde o ar gela os ossos, você simplesmente ignora temperaturas que matariam outros. Imune aos efeitos de frio ambiental (não sofre dano ou penalidades por baixas temperaturas). +2 em testes de Constituição contra dano Gélido e Congelamento.",
   "Atleta Implacável: Seu corpo não é apenas forte, é uma máquina de movimento. Escalar uma encosta é como andar para você. +1 Força, +1 Destreza. Vantagem em testes de Atletismo para escalar, saltar ou nadar.",
   "Presença Esmagadora: Não são apenas seus músculos que intimidam, é a certeza de que você pode esmagar qualquer um. +2 Vontade. Vantagem em testes de Intimidação. Se passar no teste, o alvo sofre -2 em seu próximo ataque contra você.",
   "Pele de Granito: Sua pele é tão resistente quanto a rocha das montanhas. +2 Defesa. Reduz 1 ponto de dano físico (contundente, cortante, perfurante) recebido.",
   "Espírito Competitivo: Você não recusa um desafio — e odeia perder. +2 em testes quando está competindo, desafiando ou lutando por um objetivo claramente definido. -1 em testes sociais quando alguém o desafia e você se recusa a aceitar."
  ]
 },
 {
  "id": "raca-nephilim-demon-aco",
  "name": "Nephilim-Demoníaco",
  "flavor": [
   "Os nephilins demoníacos são fruto da união , consentida ou não, entre um demônio e um mortal. Carregam no sangue o fogo do submundo e a herança de uma linhagem corrompida. Sua aparência denuncia sua origem: chifres que brotam da testa em formatos variados, olhos com íris que brilham como brasas, e uma aura de calor que incomoda os mais sensíveis. A maioria luta contra o estigma de serem vistos como monstros, enquanto outros abraçam a natureza infernal e se tornam exatamente aquilo que os outros temem. Seja qual for o caminho, um nephilim demoníaco jamais será ignorado, sua presença é um lembrete de que o fogo do inferno arde em alguns corações."
  ],
  "fixedTrait": "Sangue Infernal: O fogo do submundo corre em suas veias. Você é resistente ao calor extremo e pode canalizar esse poder destrutivo. +2 Vontade. Resistência a dano de Calor: reduz em 2 pontos qualquer dano de fogo ou calor recebido. Gastando 3 estamina, como Ação Principal, pode conjurar Labareda Infernal: cone de 3 metros que causa 1d6 + Vontade de dano de Calor (CD 15 de Destreza para reduzir à metade).",
  "optionalTraits": [
   "Presença Aterradora: Sua aparência demoníaca causa pavor nos corações mais fracos. +2 em testes de Intimidação. Se passar no teste, o alvo sofre -2 no próximo ataque contra você.",
   "Asas Infernais: Asas membranosas brotam de suas costas, permitindo voos curtos. Pode planar ao cair de grandes alturas (não sofre dano de queda). Uma vez por descanso médio, pode voar por até 10 minutos com deslocamento de 9 metros.",
   "Regeneração Profana: Seu sangue negro se recusa a deixar o corpo morrer. Sempre que causar dano com sua Labareda Infernal, recupera 1d4 PV. Em cenas noturnas ou subterrâneas, +2 adicional em testes de Constituição.",
   "Maldição Infernal: Você pode amaldiçoar um inimigo com uma palavra de poder profano. Ação de Suporte: escolha um alvo a até 6 metros. Ele sofre -2 em todos os testes/ações por 2 rodadas. Uma vez por combate.",
   "Chamas do Inferno: Seu sangue infernal queima em seus golpes. +1d4 de dano de Calor (fogo) em ataques corpo a corpo. Seus ataques desarmados causam 1d4 de dano de fogo.",
   "Pacto Sombrio: Você pode invocar uma fração do poder demoníaco por um preço. Uma vez por combate, como Ação de Suporte, gaste 3 pontos de Estamina para ganhar +2 Força e +1 Vontade por 2 turnos."
  ]
 },
 {
  "id": "raca-nephilim-angelical",
  "name": "Nephilim Angelical",
  "flavor": [
   "Os nephilins angelicais são filhos de um celestial com um mortal, herdeiros de uma graça divina que se manifesta em sua própria existência. Sua aparência é marcada por traços etéreos: olhos de cores claras que parecem refletir a luz, cabelos que brilham sob o sol, e uma voz que acalma os aflitos. Muitos sentem o peso de expectativas divinas, esperando que vivam à altura de sua linhagem sagrada. Outros renegam essa herança, buscando forjar seu próprio caminho longe do olhar dos céus. Independentemente de sua escolha, um nephilim angelical carrega consigo uma centelha de luz que pode curar ou cegar, e o mundo sempre espera que ele escolha a primeira opção."
  ],
  "fixedTrait": "Sangue Celestial: A luz dos céus flui em suas veias. Você é um farol de esperança e possui dons curativos. +2 Vontade. Resistência a dano Gélido e efeitos de Congelamento: reduz em 2 pontos qualquer dano de frio recebido. Gastando 3 estamina, como Ação de Suporte, pode usar Toque Curativo: cura 1d6 + Vontade de PV em um aliado (ou em si mesmo).",
  "optionalTraits": [
   "Asas Celestiais: Asas emplumadas, brancas ou douradas, brotam de suas costas. Pode planar ao cair de grandes alturas (não sofre dano de queda). Uma vez por descanso médio, pode voar por até 10 minuto com deslocamento de 9 metros.",
   "Presença Seráfica: Sua aparência angelical inspira confiança e admiração. +2 em testes de Persuasão. Aliados a até 6 metros de você recebem +2 em testes de resistência contra medo e efeitos mentais.",
   "Luz Purificadora: Você pode canalizar sua energia celestial em uma explosão de luz ofuscante. Ação Principal: todos os inimigos a até 5 metros devem passar em um teste de Constituição (CD 16) ou ficar cegos por 5 turno. Uma vez por combate.",
   "Bênção Protetora: Seu sangue celestial lhe concede uma barreira divina em momentos de necessidade. Uma vez por dia, ao sofrer dano que o mataria, você pode ativar esta bênção: fica com 1 PV na parte atingida e recebe +2 de Defesa por 2 rodadas.",
   "Martelo Celestial: Sua linhagem celestial lhe concede a capacidade de imbuir seus golpes com a fúria divina dos céus. Ao acertar um ataque corpo a corpo, você adiciona +1d4 de dano radiante ao ataque.",
   "Égide Celestial: Uma aura protetora envolve você e aqueles próximos. +1 Defesa. Aliados a até 3 metros de você recebem +1 em testes de resistência contra efeitos de medo e escuridão."
  ]
 },
 {
  "id": "raca-crascker",
  "name": "Crascker",
  "flavor": [
   "Os Crasckers são uma raça amaldiçoada, ou abençoada, dependendo de quem pergunta. Dizem as lendas que seus ancestrais foram amaldiçoados por um deus-bestial ou fizeram um pacto com espíritos primitivos da natureza selvagem. O resultado é um povo que carrega dentro de si a essência de uma fera específica, transmitida através das gerações como uma maldição de sangue. Cada Crascker nasce vinculado a um animal seja ele: leão, lobo, urso, águia, serpente, entre outros, definido no momento do nascimento e imutável pelo resto da vida.",
   "Sua aparência humana já carrega traços sutis do animal interior: olhos felinos, dentes ligeiramente afiados, pelagem em partes do corpo ou unhas mais espessas. Mas é na transformação que sua verdadeira natureza se revela. Os Crasckers são capazes de assumir duas formas além da humana: uma forma híbrida, que mescla o melhor dos dois mundos, e uma forma bestial completa, onde o animal interior toma o controle total do corpo. Essa dualidade os torna caçadores formidáveis, guerreiros instintivos e, por vezes, párias temidos por aqueles que não compreendem sua condição."
  ],
  "fixedTrait": "Sangue Bestial: A maldição ancestral corre em suas veias, concedendo a você o poder de se transformar na fera que habita sua alma. No momento da criação do personagem, escolha um animal (leão, lobo, urso, águia, serpente, pantera, etc.). Você pode assumir duas formas alternativas, cada uma com um custo em Estamina. Forma Híbrida: Custo: 3 pontos de Estamina. Como uma Ação de Suporte, você assume uma forma bípede que mescla seu corpo humano com características bestiais (garras, presas, pelagem, asas vestigiais, etc., de acordo com o animal escolhido). Nesta forma, você escolhe um atributo físico (Força, Destreza ou Constituição) para receber +2. Além disso, suas mãos se transformam em garras ou presas naturais que causam 1d6 + Força de dano (tipo cortante ou perfurante, dependendo do animal). A forma híbrida dura até você decidir revertê-la (ação livre) ou até sofrer um dano crítico. Você pode usá-la uma vez por descanso curto. Forma Bestial Completa: Custo: 6 pontos de Estamina. Como uma Ação Principal, você se transforma completamente no animal escolhido. Você define os atributos da sua forma animal durante a criação da ficha, redistribuindo seus pontos de Força, Destreza e Constituição (os pontos devem ser os mesmos que você já possui, apenas reorganizados). Exemplo: um Crascker com Força 4, Destreza 2, Constituição 3 pode, ao se transformar em um lobo, mudar para Força 3, Destreza 4, Constituição 2. Além disso, você ganha as seguintes características: Ataques naturais: garras ou mordida (1d8 + Força) de dano cortante ou perfurante. Sentidos aguçados: +2 em testes de Foco (Percepção) para ouvir ou farejar. Deslocamento: seu deslocamento base aumenta em +3 metros (se o animal for terrestre) ou você ganha deslocamento de voo 9m (se for uma ave). Você não pode falar, usar armas ou conjurar magias enquanto estiver nessa forma, e seu equipamento se funde ao corpo ou cai no chão (à sua escolha). A transformação dura até o fim da cena ou até você revertê-la como ação livre. Você pode usar esta forma uma vez por descanso longo.",
  "optionalTraits": [
   "Faro Predatório: Seu olfato é tão aguçado quanto o da fera que carrega. +2 em testes de Foco (Percepção) para rastrear pelo cheiro. Pode identificar criaturas familiares ou sangramento ativo pelo odor a até 12 metros.",
   "Sentidos Bestiais: Seus instintos animais estão sempre em alerta, mesmo na forma humana. +1 Foco, +1 Destreza. Você não pode ser surpreendido enquanto estiver consciente (sente o perigo instintivamente).",
   "Regeneração Primitiva: Seu corpo se cura mais rápido do que o normal, especialmente quando está em contato com a natureza. Sempre que estiver em um ambiente natural (floresta, montanha, caverna), recupera +1 PV extra em qualquer cura recebida. Uma vez por descanso curto, pode gastar uma Ação de Suporte para recuperar 1d4 PV.",
   "Fúria Selvagem: Quando encurralado, o animal interior assume o controle. Uma vez por combate, ao sofrer dano que reduziria o HP de uma parte do corpo a 0, você pode entrar em fúria: recebe +2 em testes de ataque corpo a corpo por 2 rodadas, mas sofre -1 em defesa pelo mesmo período.",
   "Instinto de Caça: Você é um predador nato, incansável. +2 em testes de rastreamento e perseguição. Uma vez por cena, ao falhar em um teste de rastreamento, pode repeti-lo imediatamente.",
   "Forma Híbrida Aprimorada: Sua forma híbrida é ainda mais poderosa. Ao ativar a Forma Híbrida, você recebe +1 adicional em um atributo físico de sua escolha (além do bônus normal). Suas garras na forma híbrida causam 1d8 + Força em vez de 1d6 + Força."
  ]
 },
 {
  "id": "raca-fada",
  "name": "Fada",
  "flavor": [
   "Pequenas, aladas e envoltas em um véu perpétuo de mistério, as fadas são criaturas que parecem ter saído de um sonho, ou de um pesadelo, dependendo do seu humor. Medindo entre 50 centímetros e 80 centímetros de altura, são a menor das raças conscientes, mas não se engane com seu tamanho: seu corpo frágil abriga uma centelha mágica que arde com intensidade desproporcional. Sua aparência varia tanto quanto as flores de um jardim encantado, algumas têm asas translúcidas de libélula, outras brilham como vaga-lumes, e há aquelas cujas feições são tão estranhas quanto belas. Vivem em florestas ocultas, planos paralelos ou até mesmo nos cantos esquecidos das cidades humanas, sempre onde a magia é mais densa. Para uma fada, o mundo é um lugar imenso e perigoso, mas também cheio de oportunidades para quem sabe usar a astúcia e o encanto."
  ],
  "fixedTrait": "Essência Feérica: Seu corpo minúsculo é frágil, mas vibra com uma energia mágica incomum. Você é uma criatura do impossível, e as regras comuns não se aplicam a você da mesma forma. Tamanho: Entre 50 e 80 cm. Você pode se mover por espaços pequenos sem penalidade, mas seu alcance corpo a corpo é limitado: você só pode atacar alvos adjacentes, e não pode usar armas de tamanho normal (a menos que sejam adaptadas, com custo adicional). Armas leves e pequenas funcionam normalmente. HP Reduzido: Seu corpo é frágil. Os valores base do HP de cada parte do corpo são reduzidos pela metade (arredondado para baixo). Some o modificador de Constituição normalmente. Cabeça: 6 + Constituição. Tronco: 9 + Constituição. Braços: 5 + Constituição cada. Pernas: 6 + Constituição cada. Reservatório Ampliado: Seu reservatório de energia de classe (Aura, Mana ou Fé) é 50% maior do que o normal. Por exemplo, se sua classe concede 10 pontos base, você recebe 15. Este bônus é calculado após todos os outros ajustes. Agilidade Minúscula: Seu tamanho reduzido torna você difícil de acertar. +2 em testes de Esquiva e Furtividade. Fragilidade: Sua força física é limitada. -2 em testes de Força para carga, agarrões e manobras de empurrar. Sua capacidade de carga é metade do normal.",
  "optionalTraits": [
   "Asas Cintilantes: Você possui asas translúcidas que capturam a luz e desafiam a gravidade. Você pode voar com deslocamento de 10 metros por turno. Voar exige concentração; se sofrer dano enquanto voa, faça um teste de Destreza (CD 12) ou caia. Fora de combate, pode pairar e planar livremente.",
   "Pó de Fada: Você produz uma poeira mágica que brilha como estrelas e pode encantar ou perturbar os sentidos alheios. Uma vez por combate, como Ação de Suporte, você pode lançar um punhado de pó mágico em um alvo a até 4 metros. O alvo faz um teste de Vontade (CD 16). Se falhar, fica encantado ou sonolento (nível 1) por 1d4 turnos. Você escolhe o efeito ao usar a habilidade.",
   "Afinidade Natural: Você está em sintonia com as plantas, os animais e os espíritos menores da natureza. +2 em testes de Intuição e Sobrevivência em ambientes naturais. Pequenos animais hostis e não hostis não o atacarão e podem até ajudá-lo com informações simples (a critério do mestre).",
   "Travessura Encantada: Fadas são mestras da ilusão e do truque sutil. +2 em testes de Enganação e Prestidigitação. Uma vez por descanso curto, você pode lançar uma ilusão menor (som, imagem ou cheiro) que dura até 8 minuto, como distração ou disfarce.",
   "Olhos de Fada: Seus olhos enxergam além do véu do mundo material. +2 Foco. Visão no escuro até 12 metros. Você pode perceber auras mágicas fracas: itens encantados, portais ocultos ou resquícios de feitiços recentes brilham levemente para você (não revela detalhes, apenas a presença de magia).",
   "Mente Caótica: Sua mente é tão imprevisível que efeitos de controle mental têm dificuldade em afetá-la. +2 em testes de Vontade contra encantamento, possessão e dominação. Sempre que um inimigo tentar ler sua mente, ele recebe imagens confusas e sem sentido (a critério do mestre).",
   "Fuga Cintilante: Seu corpo se dissolve em brilho ao menor sinal de perigo. Uma vez por combate, ao ser alvo de um ataque, você pode gastar uma Reação para se tornar invisível até o início do seu próximo turno."
  ]
 },
 {
  "id": "raca-mechatron",
  "name": "Mechatron",
  "flavor": [
   "Os Mechatrons não nasceram, eles foram forjados. Seja pela genialidade de um inventor louco, pelo último suspiro de uma civilização perdida ou por um ritual que uniu metal e alma, cada Mechatron é uma consciência habitando um corpo artificial. Sua aparência varia conforme o propósito para o qual foram criados: alguns são humanoides perfeitos, cobertos por placas de metal polido e engrenagens à mostra; outros são brutos e desajeitados, com membros hidráulicos e um único olho incandescente; há ainda aqueles tão refinados que se passam por estátuas vivas, com articulações de porcelana e runas cintilantes sob a superfície. Não respiram, não dormem, não comem, mas pensam, sentem e questionam. Um Mechatron não pergunta \"o que sou?\", e sim \"quem eu escolho ser?\"."
  ],
  "fixedTrait": "Corpo Forjado: Você não é de carne e osso. Seu corpo foi construído, não gestado, e funciona sob regras diferentes das criaturas vivas. Anatomia Artificial: Você não precisa comer, beber, dormir ou respirar. É imune a venenos, doenças e efeitos de sufocamento. Não sofre os efeitos de fome ou sede, mas ainda precisa de descanso para recarregar suas energias internas e realizar manutenção (descanso curto, médio e longo funcionam normalmente, representando reparos e recalibragem). Fonte de Energia: Seu corpo é alimentado por um núcleo de energia — uma pedra elemental, um selo mágico ou um motor a vapor, definido na criação. Você escolhe um tipo de energia (Aura, Mana ou Fé) que alimenta seu funcionamento. Sempre que sofrer dano elemental desse tipo, você reduz o dano em 2 pontos e pode usar uma Ação de Suporte para absorver a energia, recuperando 1d4 PV (uma vez por combate). Reparo, não Cura: Você não pode ser curado por meios naturais (poções de cura comuns, ervas, medicina tradicional). Em vez disso, qualquer efeito de cura mágica funciona com metade da eficácia (arredondado para baixo). Para se recuperar plenamente, você precisa de reparos: um aliado com a perícia adequada (Ofício: Engenharia, Mecânica ou similar) pode restaurar seus PVs como se estivesse curando, usando ferramentas e materiais (custo: 10 Bronzes em peças por ponto de vida restaurado). Em um descanso longo, você pode se auto-reparar sem custo. Resistência Física: Seu corpo de metal, pedra ou cerâmica reforçada é difícil de amassar. +3 Constituição. Vulnerabilidade: Por sua natureza construída, você é vulnerável a dano Elétrico (choques sobrecarregam seus circuitos) e Corrosivo (ácidos danificam sua estrutura). Sofre +2 de dano desses tipos.",
  "optionalTraits": [
   "Canhão Embutido: Seu corpo abriga uma arma integrada, fruto de sua fabricação original. Pode ser um canhão de pulso elemental no braço, uma lâmina retrátil no antebraço ou um disparador de projéteis no peito. Você nunca fica desarmado. Sua arma integrada causa 1d8 de dano (tipo físico ou elemental, definido na criação) e usa Força, Destreza e Foco para atacar, à sua escolha. Uma vez por combate, pode sobrecarregá-la para causar +1d6 de dano extra, mas sofre 1d4 de dano de feedback.",
   "Blindagem Pesada: Você foi construído para a linha de frente. Placas espessas de metal ou cerâmica revestem seu corpo. +2 na Defesa base. Reduz qualquer dano físico recebido em 1 ponto.",
   "Módulo de Combate: Sua programação ou instinto artificial é voltado para a guerra. +2 em testes de ataque com armas corpo a corpo ou integradas. Quando usa a ação Bloquear, pode gastar 2 pontos de Estamina para contra-atacar imediatamente (uma vez por rodada), como se tivesse sucesso em um parry.",
   "Sensor de Alvo: Olhos de cristal ou uma placa sensora na testa permitem que você analise ameaças com precisão fria. +2 Foco. Você pode gastar uma Ação de Suporte para escanear um inimigo: na próxima rodada, seus ataques contra ele têm +2 de bônus. Visão no escuro até 12 metros.",
   "Núcleo Pensante: Você não tem cérebro, tem um processador. Sua mente lógica é implacável. +2 Intelecto. Vantagem em testes para resistir a ilusões, encantamentos e efeitos mentais que afetam emoções (seu processamento lógico ignora apelos sentimentais).",
   "Propulsores Auxiliares: Pequenos propulsores em suas pernas ou costas permitem saltos e deslocamentos rápidos. +3 metros de deslocamento. +2 em Esquiva.",
   "Mira Calculada: Seu processador calcula trajetórias, vento e distância em frações de segundo. +2 em testes de ataque à distância. Uma vez por combate, você pode declarar um ataque à distância como \"tiro completamente calculado\": dando vantagem no teste de acerto."
  ]
 },
 {
  "id": "raca-kinguian",
  "name": "Kinguian",
  "flavor": [
   "Os Kinguians são o povo das marés, descendentes de uma antiga civilização que abandonou a superfície para habitar as profundezas dos oceanos. Dizem as lendas que foram abençoados — ou amaldiçoados — por uma entidade abissal que os transformou em seres anfíbios, capazes de viver tanto sob as ondas quanto na terra firme. Sua aparência é uma mistura de traços humanoides e aquáticos: pele em tons de azul, verde-mar, coral ou prateado, frequentemente coberta por escamas suaves em áreas como ombros, costas e laterais do rosto. Seus olhos são grandes e adaptados à escuridão das fossas oceânicas, brilhando com bioluminescência natural em cores que variam do azul ao violeta. Membranas entre os dedos, guelras no pescoço ou nas costelas e cristas em forma de barbatanas ao longo dos braços e pernas completam sua silhueta inconfundível.",
   "Sua sociedade é organizada em cidades-submersas de coral vivo, pedra vulcânica ou cristais cultivados, iluminadas por criaturas bioluminescentes e protegidas por barreiras de correnteza mágica. Valorizam a comunidade, a harmonia com o ecossistema marinho e a exploração dos mistérios que as profundezas escondem. Para um Kinguian, a superfície é um lugar fascinante e perigoso — cheia de oportunidades, mas também de secura, calor implacável e estranhos que nunca ouviram o canto das baleias. Aventureiros Kinguians são frequentemente embaixadores, exploradores ou exilados que buscam entender o mundo acima das ondas."
  ],
  "fixedTrait": "Herança das Marés: Seu corpo foi moldado para as profundezas, e o oceano reconhece você como um de seus filhos. Anfíbio: Você pode respirar tanto na água quanto no ar. Em terra firme, sua respiração é normal; submerso, suas guelras se abrem automaticamente. Natação Natural: Seu deslocamento de natação é de 10 metros (em vez dos 5 metros de deslocamento terrestre base). Você não sofre penalidades por atacar ou agir debaixo d'água. Resistência às Profundezas: Seu corpo suporta a pressão e o frio das fossas oceânicas. Você é imune aos efeitos negativos de pressão subaquática extrema e recebe +2 em testes de Constituição contra dano Gélido e efeitos de Congelamento. Vulnerabilidade à Secura: A ausência prolongada de água enfraquece você. Se passar mais de 24 horas sem submergir o corpo em água (ou umedecê-lo completamente), sofre -1 em todos os modificadores de atributo. A cada 24 horas adicionais sem água, a penalidade aumenta em -1 (máximo de -6). A penalidade é removida assim que você se submerge novamente.",
  "optionalTraits": [
   "Ecolocalização: Você emite cliques sonoros inaudíveis para a maioria das criaturas e interpreta os ecos que retornam, como um golfinho. Mesmo em escuridão total ou cegueira temporária, você \"enxerga\" o ambiente em um raio de 10 metros (formas, tamanhos e movimentos, mas não cores ou detalhes finos). +2 em testes de Foco para perceber inimigos invisíveis ou ocultos.",
   "Canto das Profundezas: Você consegue emitir sons em frequências impossíveis para a maioria das criaturas de superfície. Você produz vibrações sonoras que podem ser calmantes ou ensurdecedoras. Você pode emitir um zumbido grave que preenche um raio de até 10 metros, permitindo comunicação simples com criaturas aquáticas e aliados mesmo em silêncio absoluto (eles \"sentem\" o som). Uma vez por combate, como Ação de Suporte, você pode liberar um pulso sonoro devastador em um cone de 3 metros: inimigos devem fazer um teste de Constituição (CD 15) ou ficarão atordoados por 2 turnos e sofrerão 1d4 de dano. A frequência e o timbre são definidos na criação (grave como baleia, agudo como golfinho, etc.).",
   "Camuflagem Abissal: Sua pele pode mudar de cor e textura como a de um polvo, adaptando-se ao ambiente. +2 em testes de Furtividade. Em ambientes subaquáticos ou de penumbra, você pode se esconder mesmo sem cobertura física, desde que permaneça imóvel (ação livre para ativar ou desativar).",
   "Pele de Tubarão: Sua epiderme é coberta por microescamas ásperas e resistentes, como a de um tubarão. +2 Defesa base. Qualquer inimigo que tente agarrá-lo sofre 1 ponto de dano cortante (suas escamas são abrasivas). Nadar em silêncio sem ter penalidades.",
   "Jato de Água: Você armazena água em câmaras internas e pode dispará-la como projétil ou ferramenta. Ação Principal: dispara um jato de água de alta pressão contra um alvo a até 6 metros. Dano: 1d6 + Constituição (dano contundente). Se o alvo falhar em um teste de Força (CD 15), é empurrado 3 metros para trás. Gasta uma ação principal para acumular a água; após isso, você consegue atirar até 2 vezes. Fora de combate, pode usar o jato para apagar pequenas chamas, limpar superfícies ou encher recipientes.",
   "Vínculo Marinho: Você possui uma conexão empática com as criaturas do oceano. Peixes, moluscos e outras criaturas marinhas não hostis e hostis não o atacarão, e podem até mesmo trazer-lhe pequenos objetos ou informações se você se comunicar com eles (a critério do mestre). +2 em testes de Intuição e Sobrevivência em ambientes aquáticos.."
  ]
 },
 {
  "id": "raca-platae",
  "name": "Platae",
  "flavor": [
   "Os Platae são uma raça de plantas sencientes, nascidos do coração de florestas ancestrais, jardins místicos ou pântanos esquecidos. Sua aparência é um reflexo de sua natureza botânica: corpos que mesclam forma humanoide com texturas e cores vegetais, pétalas ao redor do rosto, vinhas que serpenteiam pelos braços, musgo cobrindo os ombros, olhos como gotas de seiva ou pequenas flores. Não são criaturas de carne e osso, mas de fibra, seiva e clorofila. Não precisam comer no sentido tradicional; alimentam-se da luz do sol, da água e dos nutrientes do solo, embora possam absorver energia de outras fontes em ambientes inóspitos.",
   "A sociedade Platae é diversa, refletindo as inúmeras formas de vida vegetal que existem no mundo. No entanto, duas grandes variações se destacam entre os aventureiros: os Espinhentos, guerreiros naturais cobertos de espinhos e vinhas resistentes, e os Florais, seres de beleza serena que exalam fragrâncias curativas e protetoras. A variação de um Platae é determinada por sua linhagem genética e pelo ambiente onde germinou, e define tanto sua função no ecossistema quanto seu papel em um grupo de aventureiros."
  ],
  "fixedTrait": "Fisiologia Vegetal: Você é uma planta consciente. Seu corpo funciona de maneira diferente das criaturas de carne, concedendo vantagens e impondo desafios únicos. Fotossíntese: Você não precisa comer alimentos. Desde que receba pelo menos 4 horas de luz solar (ou equivalente mágico) por dia, você se mantém nutrido. Em ambientes sem luz, pode sobreviver absorvendo nutrientes do solo ou de matéria orgânica em decomposição (como um fungo), mas sofre -1 em testes físicos até se alimentar adequadamente. Hidratação: Você precisa de água regularmente. Se passar mais de 48 horas sem absorver água (por imersão, chuva ou ingestão), sofre -1 em todos os modificadores de atributo. A penalidade aumenta em -1 a cada 24 horas adicionais (máximo -3). Recupera-se após 10 minutos de hidratação adequada. Vulnerabilidade ao Fogo: Seu corpo de fibras e seiva é inflamável. Sofre +2 de dano de fontes de Calor (fogo, lava, etc.) e qualquer efeito de Queimadura tem sua duração dobrada em você. Raízes Estabilizadoras: Você pode se enraizar ao solo como uma Ação de Movimento. Enquanto enraizado, seu deslocamento é 0, mas você recebe +2 em testes para resistir a empurrões, agarrões e desequilíbrios, e qualquer cura recebida é aumentada em +1 PV. Desenraizar-se é uma Ação de Movimento gratuita.",
  "variantChoice": {
   "label": "Variação Platae",
   "hint": "Escolha obrigatória durante a criação do personagem: seu Platae é Espinhento ou Floral.",
   "options": [
    {
     "name": "Platae Espinhento (Combate)",
     "desc": "Sua forma é robusta e defensiva, coberta por espinhos afiados e vinhas resistentes. +1 Força, +1 Constituição. Seus ataques desarmados causam 1d6 + Força de dano Perfurante (devido aos espinhos). Quando um inimigo erra um ataque corpo a corpo contra você, você pode usar sua Reação para causar 1d4 de dano Perfurante a ele (os espinhos arranham o agressor)."
    },
    {
     "name": "Platae Floral (Suporte)",
     "desc": "Sua forma é delicada e cheia de flores bioluminescentes que exalam fragrâncias benéficas. +1 Intelecto, +1 Vontade. Como Ação de Suporte, você pode liberar um perfume calmante em um raio de 3 metros (custo: 2 pontos de Estamina): aliados na área recuperam 1d4 PV (uma vez por aliado por cena) e recebem +1 no próximo teste de resistência contra medo ou encantamento. Além disso, você pode usar a perícia Medicina com Vontade em vez de Intelecto, se tiver treinamento."
    }
   ]
  },
  "optionalTraits": [
   "Floração Sazonal: Suas flores mudam com as estações, adaptando seus efeitos. Uma vez por descanso longo, escolha um benefício ativo até o próximo descanso: +2 em testes de Persuasão (flores belas), +2 em testes de Furtividade (pétalas que absorvem luz), ou +2 em testes de Atletismo (vinhas flexíveis).",
   "Vinhas Estranguladoras: Você pode estender suas vinhas para agarrar inimigos à distância. Ação Principal: faça um teste de Força contra a Defesa do alvo a até 4 metros. Se passar, o alvo fica Agarrado (sem deslocamento, -2 em testes de ataque) até o início do seu próximo turno. Manter a vinha não consome ação, mas você não pode usar o mesmo membro para atacar enquanto agarra.-",
   "Casca Reforçada: Sua pele vegetal é grossa como a de uma árvore anciã. +2 na Defesa base. Reduz qualquer dano físico recebido em 1 ponto.",
   "Esporos de Confusão: Você libera esporos alucinógenos que afetam a mente dos inimigos. Uma vez por combate, como Ação de Suporte, libera esporos em um raio de 3 metros. Inimigos na área fazem teste de Vontade (CD 15) ou ficam Confusos (nível 1) por 2 turnos. Aliados são imunes.",
   "Seiva Vital: Sua seiva tem propriedades curativas excepcionais. Quando você sofre dano Cortante ou Perfurante, você pode gastar uma Reação para liberar seiva sobre si mesmo ou um aliado adjacente, curando 1d4+1 PV. Uma vez por descanso curto.-",
   "Absorção Solar: Você pode se sobrecarregar com luz solar para aumentar seu poder. Uma vez por dia, se estiver sob luz solar direta, você pode entrar em estado de \"Florescimento\" por 2 Rodadas: +2 em todos os modificadores de atributo. Após o efeito, sofre -2 em todos os modificadores por 2 rodadas (exaustão)."
  ]
 },
 {
  "id": "raca-undead",
  "name": "Undead",
  "flavor": [
   "Os Undead são aqueles que desafiaram a morte e perderam — ou venceram, dependendo do ponto de vista. Não são uma raça unificada, mas uma condição: homens e mulheres que, por maldição, pacto, magia negra ou simples recusa em partir, continuam a caminhar entre os vivos. Alguns são esqueletos descarnados, outros zumbis de carne pálida, e há ainda aqueles cuja aparência é quase humana, preservada por embalsamamento ou pura força de vontade. Um Undead não precisa ser um monstro podre — pode ser um cavaleiro de armadura impecável, um sábio emaciado ou uma dama pálida cujos olhos não refletem mais a luz.",
   "O que todos compartilham é a ausência de vida. Seus corpos não sangram, não respiram, não envelhecem. Ferimentos que matariam um mortal são meros inconvenientes para eles — desde que a cabeça permaneça intacta. Mas essa imortalidade tem um preço: a energia sagrada queima sua carne como ácido, e a sociedade os encara com medo, repulsa ou ódio. Muitos Undead vagam em busca de um propósito que justifique sua existência; outros abraçam o papel de monstro que o mundo lhes impôs."
  ],
  "fixedTrait": "Natureza Morta-Viva: Você não está vivo. Seu corpo é uma casca animada por energia necrótica, e isso altera profundamente sua existência. Morte Verdadeira Apenas pela Cabeça: Seguindo as regras de HP por parte do corpo, você só morre se o HP da sua Cabeça chegar a 0. Quando o HP do seu Tronco chegar a 0, você não morre nem entra em agonia como os vivos — em vez disso, sofre os efeitos normais de tronco zerado (hemorragia interna, desvantagens, etc.) mas continua consciente e capaz de agir, desde que sua Cabeça permaneça intacta. Se a Cabeça for destruída (HP 0), você morre imediatamente, sem direito a teste. A Margem Distante não se aplica a você. Imunidade a Efeitos de Vida: Você é imune a efeitos que exijam um corpo vivo. Sangramento, Envenenamento, Doenças, Sufocamento, Afogamento, Fadiga por esforço físico extremo (mas não Estamina), e efeitos de envelhecimento não o afetam. Você não precisa comer, beber, dormir ou respirar. Fraqueza a Energia Sagrada: Toda fonte de dano de energia sagrada (como magias de Luxios, Helinas, ou armas abençoadas) causa o dobro do dano em você. Além disso, efeitos de status causados por fontes sagradas (como queimadura radiante) têm seu nível aumentado em +1 contra você. Mente Inabalável (parcial): Você é imune a efeitos de medo causados por criaturas vivas (sua mente já não responde ao instinto de sobrevivência). No entanto, efeitos de controle mental (enfeitiçado, dominação) funcionam normalmente, pois sua vontade continua sua. Repouso em Vez de Sono: Durante um descanso longo, você não dorme. Em vez disso, entra em um estado de torpor imóvel por 6 a 8 horas. Você permanece consciente do ambiente, mas não pode agir. Recupera recursos normalmente.",
  "optionalTraits": [
   "Ossos de Aço: Seu esqueleto é denso e resistente, mesmo entre os mortos-vivos. +2 Constituição. Reduz 1 ponto de dano físico (contundente, cortante, perfurante) recebido.",
   "Toque Necrótico: Suas mãos drenam o calor vital dos vivos. Seus ataques desarmados causam 1d4 de dano necrótico adicional. Ao causar dano desarmado, você pode gastar uma Ação de Suporte para recuperar 2 PV (uma vez por rodada).",
   "Presença Aterrorizante: Sua aparência lembra aos vivos o destino que os espera. +2 em testes de Intimidação. Inimigos vivos sofrem -1 em testes de ataque contra você.",
   "Olhos Mortos: Seus olhos vazios enxergam onde os vivos não conseguem. Visão no escuro total até 18 metros. Você percebe a presença de energia necrótica ou almas próximas em um raio de 24 metros, mesmo através de paredes.",
   "Regeneração Cadavérica: Seu corpo morto-vivo se reconstitui lentamente, mesmo com feridas graves. No início de cada turno em combate, recupera 1 PV, desde que sua Cabeça esteja com mais de 3 HP. Durante um descanso curto, recupera 50% do HP máximo (em vez dos 20% normais).",
   "Domínio Necrótico: Você exerce um controle instintivo sobre criaturas mortas-vivas menores. Uma vez por cena, pode comandar um zumbi ou esqueleto não-inteligente para obedecer uma ordem simples por 1 minuto. Mortos-vivos hostis de baixo nível sofrem -2 em testes de ataque contra você.",
   "Inimigo da Luz: A luz solar não o destrói, mas o enfraquece. Sob luz solar direta: -1 em testes de ataque. Em compensação, sua natureza sombria se intensifica: +2 em Furtividade e Intimidação em ambientes escuros ou noturnos, e você enxerga através de escuridão mágica."
  ]
 },
 {
  "id": "raca-gnomo",
  "name": "Gnomo",
  "flavor": [
   "Pequenos, curiosos e incansavelmente inventivos, os gnomos são uma das raças mais subestimadas de Heartsoul. Medem entre 90 centímetros e 1,10 metro, mas compensam o tamanho com uma energia mental que parece nunca se esgotar. Sua pele varia do moreno claro ao bronzeado, seus cabelos costumam ser vibrantes (ruivos, castanhos, negros ou até mesmo verdes e azuis em linhagens mais místicas), e seus olhos brilham com a centelha de quem está sempre tramando algo.",
   "A sociedade gnômica gira em torno de duas paixões: inventar e descobrir. Eles não constroem grandes reinos nem exércitos imponentes; preferem oficinas abarrotadas, bibliotecas empoeiradas e laboratórios onde cheiros estranhos escapam pelas janelas. Um gnomo entediado é um perigo para si mesmo e para os outros — é quando as engenhocas explodem, as poções mudam de cor e os experimentos \"quase deram certo\". Apesar disso, são criaturas fundamentalmente bondosas, leais a seus amigos e capazes de uma bravura surpreendente quando alguém que amam está em perigo.",
   "Em Heartsoul, os gnomos são encontrados principalmente em cidades multiraciais, onde trabalham como artesãos, alquimistas, relojoeiros e engenheiros. Muitos sonham em estudar na Universidade de Meridiana ou na Fundição Livre de Ferrum, e não é raro que um gnomo se aventure pelo mundo em busca de um componente raro ou de uma ideia que ainda não teve."
  ],
  "fixedTrait": "Mente Inventiva: Sua mente é uma fornalha de ideias, e suas mãos transformam sucata em ferramentas. Você nasceu para criar, consertar e improvisar. Engenhosidade: +1 Intelecto. +2 em testes de criação, reparo ou improviso de itens e mecanismos simples. Improviso Rápido: Uma vez por cena, como Ação de Suporte, você pode construir uma ferramenta improvisada (uma alavanca, uma corda, uma pequena bomba de fumaça, um abre-fechaduras rudimentar, etc.) usando materiais disponíveis. A ferramenta funciona por 1 hora ou até ser usada, o que acontecer primeiro. O mestre define a eficácia exata. Aprendiz Acelerado: Você recebe +1 Ponto de Perícia adicional durante a criação do personagem, que deve ser gasto em uma perícia de Ofício ou Conhecimento. Curiosidade Compulsiva: Sempre que você se deparar com um mecanismo, artefato ou enigma que nunca viu antes, deve fazer um teste de Vontade (CD 12). Se falhar, fica distraído por 1 rodada, fascinado pelo objeto. Este efeito pode ser ignorado gastando 1 Ponto de Inspiração ou se um aliado gastar uma Ação de Suporte para chamá-lo de volta à realidade.",
  "optionalTraits": [
   "Alquimista de Borda: Você cresceu entre frascos, ervas e explosões. A alquimia é sua segunda língua. +1 Intelecto. Você pode criar poções simples (cura, ácido, solvente) com metade do custo em materiais e metade do tempo normal. Uma vez por descanso longo, pode preparar uma poção de efeito improvisado (aprovado pelo mestre) sem custo.",
   "Ilusionista Nato: Sua mente é treinada para enganar os sentidos, criando imagens e sons que não estão lá. +1 Foco. Você conhece uma ilusão menor: pode criar uma imagem ou som falso a até 6 metros, que dura enquanto você mantiver concentração (até 1 minuto). Útil para distrair, assustar ou esconder. Uma vez por cena, pode usar essa ilusão para impor -2 no próximo ataque de um inimigo (ele hesita com o que vê).",
   "Amigo dos Animais: Pequenos animais confiam em você instintivamente, e os grandes raramente o veem como ameaça. +1 Foco. Criaturas naturais de tamanho pequeno ou menor não o atacam, a menos que você as machuque primeiro. Você pode se comunicar de forma básica com animais (entender intenções simples e transmitir emoções).",
   "Sorte Gnômica: Dizem que os gnomos nasceram sob uma estrela brincalhona, e você é a prova disso. Uma vez por sessão, quando você falhar em um teste de sorte, pode rolar novamente e ficar com o segundo resultado. +5 em todas as rolagens de Dado de Sorte (1d100).",
   "Resistência a Magia: Sua linhagem carrega uma resistência natural aos efeitos arcanos. +1 Vontade. Você tem vantagem em testes de resistência contra encantamentos e ilusões. Sempre que sofrer dano mágico, reduz o dano em 1 ponto (após outras reduções).",
   "Reflexos Diminutos: Seu corpo pequeno e ágil escapa com facilidade de golpes maiores. +1 Destreza. Criaturas de tamanho maior que você sofrem -1 em testes de ataque corpo a corpo contra você.",
   "Olho para Detalhes: Sua curiosidade o torna naturalmente atento a pequenos detalhes que outros ignoram. +1 Foco. +2 em testes de Percepção para notar armadilhas, passagens secretas ou objetos escondidos."
  ]
 },
 {
  "id": "raca-soulbeast",
  "name": "Soulbeast",
  "flavor": [
   "Os Soulbeasts são humanos que carregam dentro de si uma alma que não lhes pertence. Por meio de rituais antigos, pactos desesperados, maldições hereditárias ou acidentes mágicos, a essência de um ser poderoso foi aprisionada em seus corpos, fundindo-se à sua própria alma. Essa união não é pacífica — é uma dança constante entre a vontade do hospedeiro e os instintos da criatura aprisionada. Alguns Soulbeasts dominam sua alma interior e a usam como fonte de poder; outros são dominados por ela, perdendo-se gradualmente na identidade do ser que carregam.",
   "A aparência de um Soulbeast reflete a natureza da alma presa. Um Soulbeast Celestial pode ter olhos que brilham com luz dourada e uma aura de serenidade. Um Corrupto pode exibir veias escuras sob a pele e um sorriso que nunca alcança os olhos. Um Abissal pode ter escamas, garras ou olhos negros como o vazio. Um Bestial pode possuir orelhas pontudas, presas ou uma pelagem sutil. Um Elemental pode ter cabelos que ondulam como chamas, pele fria como gelo ou uma estática constante no ar ao seu redor.",
   "Seja qual for a variação, todos os Soulbeasts compartilham a experiência de nunca estarem verdadeiramente sozinhos. A alma aprisionada sussurra, sonha, deseja. Cabe ao hospedeiro decidir se a trata como aliada, prisioneira ou maldição."
  ],
  "fixedTrait": "Alma Aprisionada: Você carrega dentro de si a essência de um ser que não é humano. No momento da criação do personagem, escolha uma das cinco variações abaixo. Essa escolha define os poderes concedidos e as marcas que a alma deixa em seu corpo. Dualidade Interior: Você possui uma segunda presença dentro de sua mente. Em momentos de extremo estresse (ao sofrer um acerto crítico, ao falhar em um teste de Vontade por 5 ou mais, ou quando o mestre julgar apropriado), a alma aprisionada pode tentar assumir o controle. Faça um teste de Vontade (CD 15). Se falhar, a alma assume por 1d4 turnos, e o mestre controla suas ações de acordo com a natureza do ser (um Celestial tentará proteger aliados; um Corrupto tentará causar sofrimento; um Bestial atacará o alvo mais próximo; etc.). Se passar, você mantém o controle e recebe +1 em todos os testes físicos por 2 turnos (a adrenalina da luta interna). Fonte de Poder: Dependendo da variação escolhida, você recebe bônus e habilidades adicionais conforme descrito a seguir.",
  "variantChoice": {
   "label": "Variação Soulbeast",
   "hint": "Escolha obrigatória durante a criação do personagem: qual a natureza da alma aprisionada em você.",
   "options": [
    {
     "name": "Celestial",
     "desc": "A alma aprisionada pertence a um ser de luz divina. Dons da Luz: +1 Vontade, +1 Foco. Seus ataques causam +1 de dano radiante. Você emite luz natural em um raio de 3 metros (pode ser suprimida com concentração). Bênção Protetora: uma vez por combate, como Ação de Suporte, você pode curar 1d6+1 PV em um aliado tocado; se o aliado estiver sob efeito de medo ou enfeitiçado, ele recebe um novo teste de resistência imediato. Fardo Celestial: você não pode mentir sem sofrer as consequências. Sempre que tentar enganar alguém, sofre -3 no teste e perde 1 ponto de Sanidade."
    },
    {
     "name": "Corrupto",
     "desc": "A alma aprisionada é a de uma criatura corrompida. Dons da Corrupção: +1 Vontade, +1 Destreza. Seus ataques causam +1 de dano necrótico. Seus olhos brilham na escuridão (visão no escuro até 12 metros). Toque Corruptor: uma vez por combate, como Ação Principal, você pode tocar um inimigo e drenar sua vitalidade: causa 1d6 de dano necrótico e recupera metade do dano causado em PV. Fardo da Corrupção: sempre que você causar dano a um inimigo indefeso ou rendido, a alma o recompensa com +1 em todos os testes físicos por 2 turnos; recusar-se a causar sofrimento quando a oportunidade surge exige um teste de Vontade (CD 15) ou você sofre -1 em todos os testes físicos por 2 turnos."
    },
    {
     "name": "Abissal",
     "desc": "A alma aprisionada pertence a uma criatura do abismo profundo. Dons do Abismo: +1 Força, +1 Constituição. Você pode respirar debaixo d'água. Seus ataques desarmados causam 1d4 de dano perfurante (garras ou presas abissais). Fúria Predatória: uma vez por combate, quando você reduzir um inimigo a 0 PV em qualquer parte do corpo, pode entrar em frenesi: +1 em testes de ataque corpo a corpo por 2 turnos, mas não pode recuar ou se esquivar. Fardo do Abismo: sob luz solar direta, você sofre -1 em todos os testes físicos; se passar mais de 24 horas sem imergir em água, sofre -1 em todos os modificadores de atributo (recupera ao se submergir)."
    },
    {
     "name": "Bestial",
     "desc": "A alma aprisionada é a de um animal selvagem. Dons Bestiais: +1 Força, +1 Destreza. +2 em testes de Percepção (audição e olfato). Uma vez por combate, você pode rolar novamente um teste de Iniciativa falho. Garras e Presas: seus ataques desarmados causam 1d6 + Força de dano cortante ou perfurante (à sua escolha); nunca fica desarmado. Fardo Bestial: sempre que sentir cheiro de sangue (aliado ou inimigo ferido), deve fazer um teste de Vontade (CD 12) ou atacar o alvo mais próximo no próximo turno; uma vez por combate, pode ignorar essa penalidade gastando uma Ação de Suporte para se recompor."
    },
    {
     "name": "Elemental",
     "desc": "A alma aprisionada pertence a um espírito elemental. Dons Elementais: +1 Intelecto, +1 Foco. Escolha um elemento (fogo, gelo, vento, terra ou raio); seus ataques causam +1 de dano desse elemento e você tem resistência a ele (reduz 1 ponto de dano recebido). Manifestação Elemental: uma vez por combate, como Ação Principal, libera uma rajada do seu elemento: causa 1d6 + Foco de dano em um alvo a até 6 metros; se o alvo falhar em um teste de Constituição (CD 15), sofre o efeito de status correspondente por 1 turno. Fardo Elemental: quando sofre dano do elemento oposto, o dano recebido é aumentado em 2; em ambientes dominados pelo elemento oposto, sofre -1 em todos os testes físicos."
    }
   ]
  },
  "optionalTraits": [
   "Sintonia de Almas: Você e sua alma aprisionada chegaram a um acordo. Você ganha vantagem nos testes de Vontade para resistir ao controle da alma. Uma vez por dia, pode pedir ajuda à alma: recebe +2 em um teste de qualquer atributo (declara antes de rolar).",
   "Fusão Parcial: Você pode permitir que a alma assuma parcialmente, fundindo-se ao seu corpo. Uma vez por combate, como Ação de Suporte, você entra em estado de Fusão por 3 turnos: +1 Força, +1 Destreza, +1 Constituição, e seus ataques causam +1d4 de dano elemental ou necrótico (dependendo da variação). Após o efeito, sofre -3 em todos os testes físicos por 3 turnos (exaustão).",
   "Barreira Espiritual: A alma aprisionada cria um escudo invisível ao seu redor. +1 Defesa. Uma vez por combate, você pode reduzir o dano de um ataque em 2d4 (Reação).",
   "Visão da Alma: Você enxerga o mundo através dos olhos da alma. +2 Foco. Você pode sentir a presença de criaturas sobrenaturais (mortos-vivos, demônios, celestiais, elementais) a até 12 metros, mesmo através de paredes.",
   "Poder Despertado: Sua alma aprisionada despertou um poder latente. Escolha um atributo. Você recebe +1 permanente nesse atributo. Além disso, sempre que sua alma tentar assumir o controle (e você resistir), você ganha +1 em todos os testes por 3 turnos em vez de 2.",
   "Resistência Sobrenatural: Sua carne foi fortalecida pela presença da alma. +1 Constituição. Uma vez por descanso curto, você pode gastar uma Reação para reduzir o dano recebido de um ataque em 1d6 (a alma desvia o golpe instintivamente)."
  ]
 },
 {
  "id": "raca-meio-elemental",
  "name": "Meio-Elemental",
  "flavor": [
   "Os Meio-Elementais são o resultado da união — rara e frequentemente acidental — entre um mortal e um espírito elemental puro. Não são elementais completos, mas também não são totalmente mortais: carregam na alma e no sangue a essência de um dos elementos primordiais. Essa herança se manifesta em sua aparência e em seus poderes. Um Meio-Elemental Ígneo pode ter cabelos que ondulam como chamas e olhos cor de brasa; um Aquático pode ter escamas translúcidas no pescoço e nos ombros; um Telúrico pode ter a pele acinzentada como rocha; um Eólio pode sussurrar sem querer quando fala; e um Fulminante pode ter uma estática constante nos fios de cabelo.",
   "Diferente dos elementais puros, os Meio-Elementais têm corpo de carne e osso. Precisam comer, dormir e respirar. Mas seu sangue carrega o eco do elemento, concedendo resistência ao seu próprio elemento e vulnerabilidade ao elemento oposto. Essa dualidade molda suas personalidades: são intensos, instáveis e fascinantes, como a força da natureza que carregam dentro de si."
  ],
  "fixedTrait": "Herança Elemental: Você carrega a essência de um elemento primordial. No momento da criação do personagem, escolha uma das variações abaixo. Essa escolha define seus bônus de atributos, resistências, vulnerabilidades e sua manifestação elemental básica. Resistência Elemental: Você recebe resistência ao seu elemento: reduz em 2 pontos qualquer dano recebido desse tipo. Vulnerabilidade Elemental: Você sofre +2 de dano do elemento oposto ao seu. Manifestação Básica: Você pode realizar um pequeno efeito elemental à vontade (detalhado em cada variação).",
  "variantChoice": {
   "label": "Variação Meio-Elemental",
   "hint": "Escolha obrigatória durante a criação do personagem: qual elemento primordial corre em seu sangue.",
   "options": [
    {
     "name": "Ígneo (Fogo)",
     "desc": "+1 Força, +1 Vontade. Resistência a Calor; vulnerabilidade a Gélido. Manifestação: você pode acender ou apagar pequenas chamas (velas, tochas, fogueiras) com um toque. Seus ataques desarmados podem causar 1 de dano de Calor adicional (uma vez por turno)."
    },
    {
     "name": "Aquático (Água)",
     "desc": "+1 Constituição, +1 Foco. Resistência a Gélido e dano de Água; vulnerabilidade a Raio. Manifestação: você pode respirar debaixo d'água por até 10 minutos e criar até 1 litro de água potável por dia. Seu deslocamento de natação é de 6 metros."
    },
    {
     "name": "Telúrico (Terra)",
     "desc": "+1 Força, +1 Constituição. Resistência a dano Contundente e Perfurante; vulnerabilidade a dano de Ar (rajadas cortantes, tempestades). Manifestação: você pode moldar pequenas porções de terra ou pedra (até 1 kg) com as mãos, como se fossem argila."
    },
    {
     "name": "Eólio (Ar)",
     "desc": "+1 Destreza, +1 Foco. Resistência a dano de Vento e efeitos de empurrão; vulnerabilidade a dano de Terra (pedras, esmagamento). Manifestação: você pode planar de grandes alturas sem sofrer dano de queda e criar uma brisa leve capaz de apagar velas ou mover folhas."
    },
    {
     "name": "Fulminante (Raio)",
     "desc": "+1 Destreza, +1 Intelecto. Resistência a dano Elétrico; vulnerabilidade a dano de Água (pressão, jatos d'água cortantes). Manifestação: você pode gerar pequenas descargas estáticas que causam 1 de dano Elétrico ao toque e carregar pequenos objetos metálicos."
    },
    {
     "name": "Tenebrio (Escuridão)",
     "desc": "+1 Foco, +1 Vontade. Resistência a dano Necrótico e de Escuridão; vulnerabilidade a dano Radiante (Luz). Manifestação: você pode apagar pequenas fontes de luz (velas, tochas) a até 3 metros com um gesto, e seus olhos enxergam no escuro total até 12 metros. Em áreas de escuridão, recebe +2 em testes de Furtividade."
    },
    {
     "name": "Luminoso (Luz)",
     "desc": "+1 Vontade, +1 Intelecto. Resistência a dano Radiante (Luz); vulnerabilidade a dano Necrótico e de Escuridão. Manifestação: você emite luz natural em um raio de até 6 metros (pode reduzir a intensidade à vontade) e, uma vez por cena, pode liberar um flash que ofusca inimigos a até 3 metros (teste de Constituição CD 15 ou cegueira por 1 turno). Sob a luz do sol, recebe +1 em testes físicos."
    },
    {
     "name": "Gélido (Gelo)",
     "desc": "+1 Constituição, +1 Vontade. Resistência a dano Gélido; vulnerabilidade a dano de Calor. Manifestação: você pode congelar pequenas porções de água com um toque (criar até 1 litro de gelo por dia) e sua pele é fria ao toque, mas não lhe causa dano. Em ambientes frios, recebe +2 em testes de Sobrevivência."
    }
   ]
  },
  "optionalTraits": [
   "Explosão Elemental: Você pode liberar uma rajada concentrada do seu elemento em combate. Uma vez por combate, como Ação Principal, cause 2d6 + Foco/Intelecto de dano elemental (tipo conforme sua variação) em um alvo a até 9 metros. O alvo deve fazer um teste de Destreza (CD 16) para reduzir o dano à metade. Se o alvo for vulnerável ao seu elemento, o dano é dobrado.",
   "Pele Elemental: Sua pele se adaptou ao seu elemento, tornando-se mais resistente. +1 Defesa. Você não sofre penalidades ambientais relacionadas ao seu elemento (calor extremo para Ígneo, frio extremo para Aquático, etc.). Seu elemento oposto causa penalidades ambientais dobradas em você (ex.: Ígneo sofre -2 em ambientes gelados em vez de -1).",
   "Fusão Elemental Parcial: Você pode permitir que a essência elemental se manifeste parcialmente, envolvendo seu corpo. Uma vez por combate, como Ação de Suporte, entre em estado de Fusão por 2 turnos: +1 em Força, Destreza e Constituição. Seus ataques corpo a corpo causam +1d4 de dano elemental (tipo da sua variação). Após o efeito, sofre -2 em todos os testes físicos por 2 turnos (exaustão).",
   "Sentidos Elementais: Você percebe o mundo através do seu elemento. +1 Foco. Você pode sentir a presença do seu elemento a até 24 metros (fontes de fogo para Ígneo, corpos d'água para Aquático, minérios para Telúrico, correntes de ar para Eólio, cargas elétricas para Fulminante). Em ambientes ricos no seu elemento, você recebe +2 em testes de Percepção.",
   "Afinidade Elemental Superior: Sua conexão com o elemento é mais profunda. +2 de dano com ataques e habilidades do seu elemento. Se sua classe usar Mana, recebe +2 pontos de Mana adicionais. Se usar Aura ou Fé, recebe +1 ponto adicional da energia correspondente.",
   "Arma Elemental: Você pode infundir sua arma com seu elemento, tornando-a uma extensão do seu poder. Uma vez por combate, como Ação de Suporte, você pode imbuir sua arma com seu elemento. A arma causa +1d4 de dano elemental e emite luz ou efeito visual correspondente.",
   "Poder do Núcleo: O núcleo elemental dentro de você é mais denso, concedendo força física superior. +2 Força, +2 Constituição. Seus ataques desarmados causam +1d4 de dano do seu elemento."
  ]
 }
];
