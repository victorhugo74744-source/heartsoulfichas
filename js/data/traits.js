// Dados de traços adicionais (físicos/mentais/especiais, benignos/malignos)
// do sistema Heartsoul (extraído de js/data.js). Ver nota em races.js.
window.HEARTSOUL_TRAITS = {
  "physical_benign": {
   "title": "Traços Físicos — Benignos",
   "items": [
    {
     "name": "Reflexos Rápidos",
     "cost": 1,
     "desc": "Seus reflexos são apurados desde a infância. Você reage antes mesmo de pensar. +2 Foco em testes para evitar armadilhas, emboscadas ou surpresas. Perícia: Prontidão."
    },
    {
     "name": "Corpo Flexível",
     "cost": 1,
     "desc": "Suas articulações parecem desconectadas. Atravessa espaços apertados sem penalidade e realiza contorcionismo com facilidade. +1 Constituição."
    },
    {
     "name": "Resistência Condicionada",
     "cost": 1,
     "desc": "Seu fôlego é invejável. Você não cansa à toa. +2 de Estamina máxima."
    },
    {
     "name": "Braços Fortes",
     "cost": 1,
     "desc": "Seus braços são desproporcionalmente musculosos. +2 em testes de Força que envolvam levantar, empurrar ou carregar. Perícia: Levantar e Carregar."
    },
    {
     "name": "Olhos Aguçados",
     "cost": 1,
     "desc": "Seus olhos varrem o ambiente com precisão analítica. Nada escapa. +1 Foco. Perícia sugerida: Observação."
    },
    {
     "name": "Audição Apurada",
     "cost": 1,
     "desc": "Capta sussurros e ruídos mínimos, mas ignora sons altos do cotidiano. +1 Foco para detectar ameaças ou escutar conversas. Perícia: Escutar."
    },
    {
     "name": "Postura Imponente",
     "cost": 1,
     "desc": "Sua coluna é reta e seu olhar, firme. Sabe se portar em qualquer ambiente social. +1 Vontade. Perícia: Etiqueta ou Persuasão."
    },
    {
     "name": "Corredor Ágil",
     "cost": 1,
     "desc": "Passou a juventude correndo. Sua passada é larga e eficiente. +1 Destreza. Perícia: Correr e Fugir."
    },
    {
     "name": "Equilíbrio Natural",
     "cost": 1,
     "desc": "Anda sobre cordas e beiradas como se fosse chão plano. +1 em testes para se equilibrar em superfícies instáveis. Perícia: Acrobacia."
    },
    {
     "name": "Punhos de Pedra",
     "cost": 1,
     "desc": "Suas mãos são calejadas e duras como rocha. Seus ataques desarmados causam +2 de dano contundente."
    },
    {
     "name": "Ambidestro",
     "cost": 2,
     "desc": "Nasceu com destreza igual em ambas as mãos. Pode realizar ações simultâneas sem penalidade (ex.: atacar com duas armas)."
    },
    {
     "name": "Condição Atlética",
     "cost": 1,
     "desc": "Seu porte chama atenção, mesmo sem treino pesado. +1 Constituição e +1 Força."
    },
    {
     "name": "Coordenação Precisa",
     "cost": 1,
     "desc": "Suas mãos obedecem a comandos milimétricos. +2 em testes que exigem mira ou controle fino, como desarmar armadilhas ou arremessar objetos."
    },
    {
     "name": "Estômago de Ferro",
     "cost": 2,
     "desc": "Come de tudo e nunca passa mal. +2 em testes de Constituição para resistir a venenos ingeridos ou alimentos estragados."
    },
    {
     "name": "Cicatrização Rápida",
     "cost": 1,
     "desc": "Sua regeneração natural é acelerada. Recupera +1 PV extra sempre que se curar ao fim de uma cena (desde que não esteja em combate)."
    },
    {
     "name": "Caminhante Incansável",
     "cost": 1,
     "desc": "Pé na estrada não te assusta. Reduz em 2 pontos o consumo de Estamina durante marchas longas ou viagens a pé."
    },
    {
     "name": "Estável como Rocha",
     "cost": 1,
     "desc": "Seu centro de gravidade é baixo e firme. +2 em testes para resistir a empurrões, agarrões ou desequilíbrios. Perícia: Resistir a manobras."
    },
    {
     "name": "Salto Poderoso",
     "cost": 1,
     "desc": "Suas pernas têm uma explosão muscular impressionante. +2 em testes de pulo e saltos. Perícia: Parkour."
    },
    {
     "name": "Especialista em Combate",
     "cost": 2,
     "desc": "Você foi treinado para lutar. +2 em testes de ataque corpo a corpo. Perícia: Combate Corpo a Corpo."
    },
    {
     "name": "Pulmões de Mergulhador",
     "cost": 1,
     "desc": "Seus pulmões são enormes. Pode prender a respiração por até 5 minutos (em vez de 1) e recebe +2 em testes para evitar sufocamento."
    },
    {
     "name": "Resistência Térmica",
     "cost": 2,
     "desc": "Seu corpo suporta temperaturas extremas. +2 em testes de Constituição contra dano de Calor ou Gélido, e reduz os níveis de Queimadura ou Congelamento em 1."
    },
    {
     "name": "Constituição de Ferro",
     "cost": 1,
     "desc": "Seu sistema imunológico é implacável. +2 em testes de Constituição contra doenças e infecções. Perícia sugerida: Saúde de Aço."
    },
    {
     "name": "Força Surpreendente",
     "cost": 1,
     "desc": "Você não parece, mas consegue levantar pesos enormes. +2 Força para testes de carga, mas não para ataque ou dano."
    },
    {
     "name": "Agilidade Acrobática",
     "cost": 1,
     "desc": "Você salta, rola e se contorce com precisão. +2 em testes de esquiva e acrobacias. Perícia: Acrobacia."
    },
    {
     "name": "Golpe Preciso",
     "cost": 1,
     "desc": "Sabe exatamente onde acertar. +2 em ataques que exijam precisão . Perícia: Ataque Crítico."
    },
    {
     "name": "Pele Endurecida",
     "cost": 1,
     "desc": "Sua pele é grossa e resistente. Reduz 2 pontos de dano de fontes físicas (contundente, cortante, perfurante)."
    },
    {
     "name": "Olhos Noturnos",
     "cost": 1,
     "desc": "Sua visão se adapta rápido ao escuro. Enxerga em penumbra como se fosse luz plena. +2 Foco. Perícia: Percepção Noturna."
    },
    {
     "name": "Movimento Fluido",
     "cost": 1,
     "desc": "Seu corpo segue ritmos com naturalidade. +2 em testes que envolvam movimentos rítmicos e padronizados (dança, luta coreografada). Perícia: Dança."
    },
    {
     "name": "Caçador Nascido",
     "cost": 1,
     "desc": "Você fareja rastros com obsessão. +2 Foco. Perícia: Rastreamento."
    },
    {
     "name": "Mãos Firmes",
     "cost": 1,
     "desc": "Seu pulso é mais firme que o de um cirurgião. Nunca treme em ações delicadas. +2 Destreza. Perícia: Precisão Manual."
    },
    {
     "name": "Músculos de Alta Densidade",
     "cost": 2,
     "desc": "Seus músculos são compactos e densos, parecendo menores do que realmente são. +2 Força, e +2 ao usar o corpo para bloquear."
    },
    {
     "name": "Veterano de Guerra",
     "cost": 2,
     "desc": "Sobreviveu a conflitos que mataram muitos. +2 Constituição, +2 Vontade. Perícia sugerida: Sobrevivência."
    }
   ]
  },
  "physical_malign": {
   "title": "Traços Físicos — Malignos",
   "items": [
    {
     "name": "Corpo Marcado",
     "cost": 1,
     "desc": "Cicatrizes profundas cobrem seu corpo, tornando-o assustador. -3 em testes sociais que dependam de aparência, mas +2 em Intimidação."
    },
    {
     "name": "Vício em Nicotina",
     "cost": 1,
     "desc": "A dependência reduz sua vitalidade. -1 Constituição. Gastar uma ação de suporte fumando concede +2 em testes mentais na próxima cena (apenas uma vez por descanso)."
    },
    {
     "name": "Ossos Leves",
     "cost": 1,
     "desc": "Seus ossos são frágeis como vidro. +3 de dano sofrido de quedas ou impactos, mas +2 Destreza em testes de velocidade."
    },
    {
     "name": "Membro Danificado",
     "cost": 1,
     "desc": "Você é aleijado. Escolha um braço ou perna dominante: sofre -3 em testes com esse membro, mas o membro oposto recebe +2 (ex.: perna boa corre melhor, braço bom ataca mais forte)."
    },
    {
     "name": "Reflexos Lentos",
     "cost": 1,
     "desc": "Seu corpo não acompanha sua mente. -2 em esquivas, mas sua mente acelerada concede +2 Intelecto."
    },
    {
     "name": "Condição Instável",
     "cost": 1,
     "desc": "Franzino e frágil, você se machuca à toa. Toda vez que falhar em um teste físico, role 1d3: com 1, sofre uma lesão (dano leve ou desvantagem temporária). Recebe +1 Intelecto (sua mente compensa o corpo)."
    },
    {
     "name": "Alcoólatra",
     "cost": 1,
     "desc": "A dependência do álcool é constante. Se passar mais de 24h sem beber, sofre -2 Constituição. Recebe +1 em testes de briga (acostumado a resolver conflitos no bar). Perícia sugerida: Briga de Rua."
    },
    {
     "name": "Músculos Enrijecidos",
     "cost": 2,
     "desc": "Seu corpo é uma armadura rígida. -3 em testes de flexibilidade, movimentos rápidos e mobilidade, mas +2 em testes de defesa (bloqueio) e resistência a manobras."
    }
   ]
  },
  "mental_benign": {
   "title": "Traços Mentais — Benignos",
   "items": [
    {
     "name": "Memória Fotográfica",
     "cost": 2,
     "desc": "Você se recorda com precisão do que viu ou leu. Pode refazer testes de memória com vantagem uma vez por cena. +1 Intelecto. Perícia: Recuperação de Informações."
    },
    {
     "name": "Estudioso Obsessivo",
     "cost": 1,
     "desc": "Sua obsessão por conhecimento o leva ao limite. Ao estudar um assunto por +1h, ganha +2 em testes ligados a ele por 24h. +1 Vontade."
    },
    {
     "name": "Mente Analítica",
     "cost": 1,
     "desc": "Sua mente processa fatos de forma lógica e chega a conclusões que outros ignoram. Pode usar Foco em vez de Intelecto para testes de dedução. +2 Foco."
    },
    {
     "name": "Imaginativo",
     "cost": 1,
     "desc": "Sua imaginação não tem limites. Você cria soluções inusitadas para problemas complexos, e o mestre pode conceder vantagem em testes criativos. +1 Foco."
    },
    {
     "name": "Erudição Oculta",
     "cost": 1,
     "desc": "Você estudou o que é proibido e conhece segredos que outros temem. +2 Intelecto em testes sobre saberes ocultos, rituais ou conhecimento proibido."
    },
    {
     "name": "Mentalidade Rigorosa",
     "cost": 1,
     "desc": "Sua concentração é inabalável. Reduz penalidades por distrações durante testes complexos. +1 Intelecto, +1 Vontade."
    },
    {
     "name": "Concentrado",
     "cost": 1,
     "desc": "Você mantém o foco em ações repetitivas por muito mais tempo que a maioria. Mantém o bônus em ações prolongadas. +1 Vontade."
    },
    {
     "name": "Poliglota",
     "cost": 2,
     "desc": "Você domina línguas antigas e sua evolução. Lê, escreve e pronuncia idiomas mortos sem penalidade. +2 Intelecto. Perícia: Linguística Arcana."
    },
    {
     "name": "Estrategista Natural",
     "cost": 1,
     "desc": "Líder nato, analítico e carismático. Coloca o bem maior acima do individual. +1 Intelecto, +1 Vontade. Perícia: Liderança."
    },
    {
     "name": "Calculista",
     "cost": 1,
     "desc": "Você sempre espera o pior, e frequentemente acerta. Capaz de prever consequências com alta precisão. +1 Intelecto, +1 Foco."
    },
    {
     "name": "Calma Racional",
     "cost": 1,
     "desc": "Você é anormalmente racional e controlado. Não se abala emocionalmente com facilidade. +2 Vontade em testes contra manipulação emocional ou intimidação."
    },
    {
     "name": "Arquivista",
     "cost": 1,
     "desc": "Você acumula documentos, contatos e fontes confiáveis. Possui acesso facilitado a informações privilegiadas. +1 Intelecto."
    },
    {
     "name": "Mestre dos Livros",
     "cost": 1,
     "desc": "Leitor ávido e perspicaz. +2 ao tentar encontrar pistas ocultas em tomos antigos. +1 Intelecto."
    },
    {
     "name": "Codificador",
     "cost": 1,
     "desc": "Obcecado por códigos, símbolos e regras lógicas. +2 ao criar e decifrar códigos e cifras. +1 Foco. Perícia: Criptografia."
    },
    {
     "name": "Crítico Preciso",
     "cost": 1,
     "desc": "Você enxerga falhas onde ninguém vê. +2 em testes para analisar erros conceituais, contradições ou pontos fracos. +1 Intelecto."
    },
    {
     "name": "Dominância Lógica",
     "cost": 1,
     "desc": "Sua inteligência é mediana, mas sua lábia é mestra. Pode refutar argumentos irracionais com vantagem. +1 Vontade, +1 Foco."
    },
    {
     "name": "Investigador de Campo",
     "cost": 1,
     "desc": "Estudado e prático na mesma medida. Capaz de aplicar teoria no mundo real sem penalidade. +1 Intelecto."
    },
    {
     "name": "Observar e Absorver",
     "cost": 2,
     "desc": "Aprende vendo. Ao tentar realizar algo que já viu antes, rola 1 dado de vantagem. +2 Foco, +1 Intelecto."
    },
    {
     "name": "Leitor Corporal",
     "cost": 1,
     "desc": "Percebe microexpressões e sinais que outros ignoram. +1 Foco. Perícia sugerida: Leitura de Comportamento."
    },
    {
     "name": "Teórico Místico",
     "cost": 1,
     "desc": "Compreende simbolismo oculto com intuição natural. +1 Intelecto, +1 Vontade."
    },
    {
     "name": "Refletivo",
     "cost": 1,
     "desc": "Prefere a solitude. Quando age sozinho, recebe +2 em testes mentais. +1 Vontade."
    },
    {
     "name": "Especialista em Escrita Antiga",
     "cost": 2,
     "desc": "Sua intuição guia seu conhecimento na tradução de textos arcanos. Traduções antigas impõem menos penalidades. +1 Intelecto, +1 Foco."
    },
    {
     "name": "Historiador",
     "cost": 2,
     "desc": "Conhece padrões temporais, ciclos místicos e eventos arcanos passados. +2 Vontade, +2 Intelecto. Perícia: História."
    },
    {
     "name": "Cartógrafo da Realidade",
     "cost": 2,
     "desc": "Sua memória espacial é sublime. Percebe anomalias no espaço com facilidade. +3 para identificar falhas dimensionais ou espaciais. +1 Foco."
    },
    {
     "name": "Leitura Dinâmica",
     "cost": 1,
     "desc": "Você aprendeu a ler e compreender textos com velocidade absurda. Lê o triplo da velocidade normal sem perder compreensão. +1 Intelecto."
    },
    {
     "name": "Controle Emocional",
     "cost": 1,
     "desc": "Lida com as próprias emoções com sabedoria. Rola com vantagem em testes contra manipulação emocional e provocações. +2 Vontade."
    },
    {
     "name": "Enciclopédia Viva",
     "cost": 2,
     "desc": "Sua capacidade de consumir conhecimento é assombrosa. Uma vez por sessão, pode substituir um teste de Intelecto por sucesso automático (não se aplica a testes de resistência)."
    },
    {
     "name": "Memória de Sonhos",
     "cost": 2,
     "desc": "Nunca esquece o que sonha e se lembra com perfeição. Sempre registra detalhes de sonhos proféticos, visões ou mensagens oníricas. +1 Vontade."
    },
    {
     "name": "Disciplina Rígida",
     "cost": 2,
     "desc": "Sua mente é uma fortaleza construída sobre sua vontade. Rola novamente falhas críticas (1 natural) em testes mentais. +1 Vontade."
    },
    {
     "name": "Observador Detalhista",
     "cost": 1,
     "desc": "Seu olhar é afiado para as nuances da vida. Percebe discrepâncias e inconsistências com facilidade. +1 Foco."
    },
    {
     "name": "Intuição Numérica",
     "cost": 1,
     "desc": "Você estima quantidades, distâncias e probabilidades com precisão quase matemática. +1 Foco para cálculos e estimativas."
    },
    {
     "name": "Gênio",
     "cost": 3,
     "desc": "Sua mente opera em um nível acima dos mortais comuns. Você não apenas aprende — você reinventa. Recebe +2 Intelecto e +2 Foco. Uma vez por sessão, ao enfrentar qualquer teste (seja mental, físico ou social), você pode declarar que sua genialidade encontra um caminho onde outros veem apenas muros: recebe sucesso automático no teste, como se já tivesse previsto a situação ou deduzido a solução perfeita. Este efeito representa um lampejo de brilhantismo inigualável."
    },
    {
     "name": "Determinação",
     "cost": 2,
     "desc": "Você não desiste. Não importa o quão sombria seja a situação, seu espírito se recusa a ceder. +2 Vontade. Uma vez por dia, quando seus PVs chegarem a 0 em uma parte vital (cabeça ou tronco), você pode continuar agindo por mais 2 rodadas inteiras antes de cair. Durante essas rodadas, você ignora todos os efeitos de ferimentos e penalidades de dor."
    },
    {
     "name": "Vontade Inquebrantável",
     "cost": 2,
     "desc": "Sua mente é uma fortaleza que nem a magia mais poderosa consegue penetrar facilmente. +2 Vontade. Sempre que falhar em um teste de resistência contra encantamento, medo ou controle mental, você pode gastar 1 Ponto de Inspiração para repetir o teste com +2 de bônus."
    },
    {
     "name": "Foco na Dor",
     "cost": 1,
     "desc": "Você transforma sofrimento em combustível. Quando ferido, sua concentração se intensifica. +1 Vontade. Sempre que você sofrer dano em combate, recebe +1 em todos os testes de Vontade e Foco até o final do seu próximo turno (não acumula)."
    },
    {
     "name": "Olhar de Aço",
     "cost": 1,
     "desc": "Seu olhar carrega uma intensidade que faz os outros hesitarem. +1 Vontade. Sempre que usar Intimidação, você pode substituir Vontade por Força no teste. Além disso, uma vez por cena, ao encarar um inimigo diretamente, pode forçá-lo a um teste de Vontade (CD 15), se falhar, ele sofre -2 no próximo ataque contra você."
    },
    {
     "name": "Paciência de Monge",
     "cost": 1,
     "desc": "Você consegue permanecer calmo e focado mesmo nas situações mais exasperantes. +1 Vontade. Você nunca sofre penalidades por pressa ou falta de tempo em testes mentais, e pode manter concentração em tarefas longas por até o dobro do tempo normal sem se cansar."
    },
    {
     "name": "Espírito Indomável",
     "cost": 1,
     "desc": "Sua força de vontade é tanta que, mesmo inconsciente, seu corpo continua lutando. +1 Vontade. Uma vez por combate, se você for nocauteado (inconsciente) mas ainda tiver Estamina, pode fazer um teste de Vontade (CD 18). Se passar, você permanece de pé com 1 PV na parte que foi zerada e pode agir por mais 1 rodada."
    }
   ]
  },
  "mental_malign": {
   "title": "Traços Mentais — Malignos",
   "items": [
    {
     "name": "Raciocínio Paranoico",
     "cost": 1,
     "desc": "Seu pessimismo beira a paranoia, mas às vezes ele está certo. +1 Foco em testes para prever armadilhas, emboscadas ou mentiras. -1 Vontade."
    },
    {
     "name": "Obsessão Racional",
     "cost": 1,
     "desc": "Você é cético ao extremo. Incapaz de aceitar o ilógico, seu ceticismo o corrói. +2 Intelecto. -2 Vontade contra efeitos sobrenaturais ou ilógicos."
    },
    {
     "name": "Fragmentação Mental",
     "cost": 1,
     "desc": "Eventos contraditórios ou misteriosos causam colapsos momentâneos. +2 Foco. Sempre que presenciar algo sobrenatural além de sua compreensão, role Vontade (CD 15) ou fique confuso por 1 turno."
    },
    {
     "name": "Conhecimento Proibido",
     "cost": 2,
     "desc": "Você sabe demais sobre rituais proibidos. +2 Intelecto em rituais e +3 ao realizá-los. Toda vez que usar esse conhecimento, perde 2 de Vontade temporariamente (recupera com descanso longo)."
    },
    {
     "name": "Curiosidade Irrefreável",
     "cost": 1,
     "desc": "Você não resiste a um mistério. Vantagem se for o primeiro a tentar resolver um enigma, mas -2 Vontade para resistir à tentação de investigar o desconhecido."
    },
    {
     "name": "Ego Maníaco Intelectual",
     "cost": 1,
     "desc": "Acredita ser superior a todos por seu intelecto. -2 em testes sociais (exceto Intimidação). +1 Intelecto."
    },
    {
     "name": "Dupla Personalidade",
     "cost": 2,
     "desc": "Duas mentes dividem seu corpo. Em situações cotidianas: -2 em testes sociais e práticos, +3 Intelecto. Em situações místicas: -2 Foco e Intelecto, +3 Vontade. O mestre pode forçar a troca em momentos de estresse."
    },
    {
     "name": "Vórtice Mental",
     "cost": 1,
     "desc": "Pensar demais o consome. -2 de Iniciativa (sua mente divaga). +2 Intelecto."
    },
    {
     "name": "Teimosia Fatal",
     "cost": 1,
     "desc": "Você é teimoso a ponto de ser autodestrutivo. +2 Vontade. Sempre que você for convencido a mudar de ideia ou desistir de algo (por aliados, magia ou circunstâncias), sofre 1d4 de dano de Sanidade. Além disso, você sofre -3 em testes de Persuasão e Diplomacia quando tenta convencer os outros, sua teimosia transparece."
    },
    {
     "name": "Convicção Absoluta",
     "cost": 2,
     "desc": "Você não apenas acredita – você sabe. Essa certeza inabalável molda a realidade ao seu redor. +2 Vontade. Uma vez por sessão, ao realizar um teste relacionado diretamente com suas crenças ou ideais (a critério do mestre), você pode declarar sucesso automático. Porém, se falhar em um teste de Vontade contra uma verdade que contrarie suas crenças, sofre 1d4 de dano de Sanidade."
    },
    {
     "name": "Hipertimesia",
     "cost": 2,
     "desc": "Você se lembra de absolutamente todos os fatos da sua vida, os bons e os terríveis. +2 Intelecto, +1 Foco. -1 Vontade. Além disso, role Vontade (CD 16) ao dormir; se falhar, tem pesadelos com memórias ruins e não recupera Estamina total no descanso."
    }
   ]
  },
  "special_benign": {
   "title": "Traços Especiais — Benignos",
   "items": [
    {
     "name": "Escolhido pelo Destino",
     "cost": 2,
     "desc": "O cosmos parece conspirar a seu favor. Você não é apenas sortudo, você é uma peça importante no tabuleiro do universo. +5 em todas as rolagens de Dado de Sorte (1d100). Uma vez por sessão, pode rolar novamente um dado qualquer (ataque, teste, resistência) que acabou de rolar, ficando com o segundo resultado."
    },
    {
     "name": "Lampejo de Genialidade",
     "cost": 2,
     "desc": "Você tem insights repentinos que desafiam a lógica. +2 Intelecto, +1 Foco. Uma vez por sessão, ao realizar um teste de Intelecto ou Foco, pode declarar um sucesso automático antes de rolar."
    },
    {
     "name": "Inquebrável",
     "cost": 2,
     "desc": "Sua força de vontade é uma muralha intransponível. +2 Vontade. Quando sofrer um efeito de status mental (confusão, medo, enfeitiçado), pode gastar 1 Ponto de Inspiração para anulá-lo completamente."
    },
    {
     "name": "Herança Elemental",
     "cost": 2,
     "desc": "Escolha um elemento: fogo, gelo, raio ou ácido. +2 de dano com ataques ou habilidades desse elemento. Resistência a esse elemento: reduz 2 pontos de dano recebido do tipo escolhido."
    },
    {
     "name": "Alma Gêmea",
     "cost": 2,
     "desc": "Você compartilha um vínculo místico com outro personagem (escolhido na criação, com acordo do jogador). Enquanto estiverem a até 10 metros um do outro, ambos recebem +1 em todas as rolagens. Uma vez por sessão, pode usar sua Ação de Suporte para permitir que o aliado vinculado role novamente um teste falho."
    },
    {
     "name": "Filho da Noite",
     "cost": 1,
     "desc": "Você pertence às sombras. +2 em testes de Furtividade durante a noite ou em ambientes escuros. Visão no escuro até 12 metros. Sob luz solar intensa, -1 em testes físicos."
    },
    {
     "name": "Mestre de Armas",
     "cost": 2,
     "desc": "Você tem uma afinidade natural com um tipo específico de arma (espadas, arcos, machados, etc.). +2 em testes de ataque com esse tipo de arma. Uma vez por combate, ao acertar um ataque com essa arma, pode adicionar +1d6 de dano extra."
    },
    {
     "name": "Sangue Mágico",
     "cost": 1,
     "desc": "Sua linhagem está impregnada de magia ancestral. +2 pontos de Mana (se sua classe for energia) ou +2 Intelecto (se não for energia). Uma vez por descanso longo, pode lançar um feitiço simples (aprovado pelo mestre) sem gastar Mana."
    },
    {
     "name": "Físico Perfeito",
     "cost": 2,
     "desc": "Seu corpo é o ápice da condição mortal. +2 Força, +1 Destreza, +1 Constituição. Seu deslocamento base aumenta em 2 metros. Recupera +1 PV extra em qualquer cura recebida."
    },
    {
     "name": "Visão do Além",
     "cost": 1,
     "desc": "Você tem vislumbres do futuro ou de planos distantes. +2 Foco. Uma vez por sessão, pode fazer uma pergunta ao mestre sobre as consequências imediatas de uma ação (ex.: \"Se eu abrir esta porta, algo ruim vai acontecer?\"). O mestre responde com uma palavra: sim, não ou incerto."
    },
    {
     "name": "Ecos do Passado",
     "cost": 1,
     "desc": "Memórias de vidas passadas afloram em sua mente. +2 Intelecto. Uma vez por sessão, ao enfrentar uma situação que seu personagem não poderia conhecer, pode declarar que se lembra de algo relevante de uma vida anterior (a critério do mestre, recebe uma dica ou informação útil)."
    },
    {
     "name": "Mimetismo Sombrio",
     "cost": 1,
     "desc": "Você se funde às sombras como se fosse parte delas. +2 em testes de Furtividade. Em ambientes de penumbra ou escuridão total, pode se esconder mesmo sem cobertura física (como se estivesse invisível, desde que não ataque ou grite)."
    },
    {
     "name": "Força Indomável",
     "cost": 1,
     "desc": "Seu espírito de luta transcende os limites do corpo. Quando o HP de uma parte do corpo chega a 0, você ainda pode usar essa parte por mais 1 turno (como se estivesse funcional). Uma vez por combate."
    },
    {
     "name": "Elo com a Natureza",
     "cost": 1,
     "desc": "Animais e plantas reconhecem algo familiar em você. Animais hostis não o atacam, a menos que provocados. +1 em testes de Sobrevivência e Intuição ao lidar com a fauna e flora."
    },
    {
     "name": "Olhar de Medusa",
     "cost": 2,
     "desc": "Seu olhar carrega o poder petrificante das lendas. Uma vez por combate, como Ação de Suporte, force um alvo a até 6 metros a fazer um teste de Vontade (CD 15). Se falhar, fica paralisado por 1 turno. Se errar por 5 ou mais, fica petrificado (nível 1) por 2 turnos."
    },
    {
     "name": "Sede de Sangue",
     "cost": 2,
     "desc": "A visão do sangue inimigo fortalece você. Sempre que causar sangramento (qualquer nível) em um inimigo, recupera 1d4 PV. +1 em testes de ataque contra alvos que estejam sangrando."
    },
    {
     "name": "Portador da Luz",
     "cost": 1,
     "desc": "Você emite uma luz suave e constante ao seu redor. Luz natural em um raio de 6 metros. Inimigos mortos-vivos, profanos ou sombrios sofrem -1 em testes de ataque enquanto estiverem nessa área."
    },
    {
     "name": "Mente Coletiva",
     "cost": 1,
     "desc": "Você pode tocar as mentes daqueles em quem confia. Comunicação telepática com aliados a até 100 metros. +1 Foco. Uma vez por cena, pode ajudar um aliado em um teste mental, concedendo +2."
    },
    {
     "name": "Arma Viva",
     "cost": 1,
     "desc": "Seu corpo é sua arma, e ela nunca o abandona. Pode transformar parte do corpo (braços, pernas) em uma arma natural (lâmina óssea, garras, etc.). Dano: 1d6 + Força (cortante ou perfurante). Nunca pode ser desarmado."
    },
    {
     "name": "Senhor do Tempo",
     "cost": 1,
     "desc": "Você tem uma percepção temporal ligeiramente distorcida. Uma vez por sessão, ao rolar iniciativa, você pode atrasar seu turno: pula sua vez e age em qualquer momento da rodada seguinte, mantendo seu turno original depois. +2 Foco."
    },
    {
     "name": "Imunidade a Venenos",
     "cost": 2,
     "desc": "Seu corpo rejeita qualquer toxina como se fosse água. Venenos e toxinas de nível 1 a 3 não causam efeito em você. Venenos de nível 4 são tratados como nível 1."
    },
    {
     "name": "Elo Empático",
     "cost": 1,
     "desc": "Você sente as emoções ao seu redor como se fossem ondas em um lago. +1 em testes de Intuição para detectar mentiras ou intenções. Uma vez por cena, pode gastar uma Ação de Suporte para sentir as emoções dominantes de um alvo (medo, raiva, alegria, etc.)."
    },
    {
     "name": "Mil Rostos",
     "cost": 1,
     "desc": "Você é um mestre do disfarce, capaz de se tornar outra pessoa. +2 em testes de Enganação e Atuação. Com 10 minutos de preparação, pode alterar sua aparência física (roupas, cabelo, postura, voz) sem magia. O efeito dura até ser removido voluntariamente ou até um descanso."
    },
    {
     "name": "Sobrecarga",
     "cost": 2,
     "desc": "Seu corpo pode suportar uma quantidade absurda de energia por um curto período. Uma vez por combate, como ação livre, dobre seu deslocamento e adicione +2 em testes de Destreza e Força por 2 rodadas. Após o efeito, sofre -2 em todos os testes físicos por 2 rodadas (exaustão)."
    },
    {
     "name": "Andarilho da Névoa",
     "cost": 1,
     "desc": "Você e a névoa são velhos conhecidos. +1 Furtividade em ambientes com neblina ou fumaça. Uma vez por descanso curto, pode se transformar em névoa por 1 turno: imune a dano físico, não pode atacar, e passa por frestas."
    },
    {
     "name": "Olho do Oráculo",
     "cost": 1,
     "desc": "Você vê fragmentos do que está por vir, mesmo que nem sempre entenda. +2 Intelecto. Uma vez por sessão, pode declarar que teve uma visão sobre um evento futuro. O mestre lhe dará uma dica enigmática sobre o que está por vir (sem spoilers diretos)."
    },
    {
     "name": "Alcateia Sombria",
     "cost": 2,
     "desc": "Você nunca está verdadeiramente sozinho. Pode invocar um companheiro espectral (lobo, corvo, pantera) uma vez por dia. O companheiro dura 12 horas, tem PVs iguais à sua Vontade, e pode atacar (1d4 + Vontade) ou farejar/rastrear por você."
    },
    {
     "name": "Véu da Morte",
     "cost": 2,
     "desc": "Você esteve tão perto do fim que ele agora é um velho amigo. Quando está com PV zerado em uma parte vital (cabeça ou tronco), você ainda pode agir por 1 rodada extra antes de cair. +1 Vontade."
    },
    {
     "name": "Estrela Guia",
     "cost": 1,
     "desc": "Você sempre sabe onde está o norte. Imune a se perder (sabe direções cardeais instintivamente). +2 em testes de Sobrevivência para navegação. Uma vez por sessão, pode encontrar o caminho mais seguro para um destino conhecido."
    }
   ]
  },
  "special_malign": {
   "title": "Traços Especiais — Malignos",
   "items": [
    {
     "name": "Marca do Abismo",
     "cost": 4,
     "desc": "Algo sombrio deixou sua marca em você, concedendo poder a um preço. +2 em todos os atributos, exceto Vontade. Sempre que causar dano a um inimigo, recupera 3 PV. Sofre -2 em testes de Vontade contra influências demoníacas e efeitos de medo."
    },
    {
     "name": "Sangue Frio",
     "cost": 3,
     "desc": "Suas emoções são um lago congelado, profundas, mas contidas. Imune a provocações e intimidação. +2 em testes de Vontade. Uma vez por cena, pode ignorar um efeito de medo ou encantamento que acabou de sofrer. (Nota: Embora seja uma defesa poderosa, seu custo elevado e a frieza emocional podem ser considerados uma maldição social.)"
    },
    {
     "name": "Sombra Interior",
     "cost": 2,
     "desc": "Uma entidade parasita habita sua mente, concedendo poder quando você cede o controle. Uma vez por sessão, pode entrar em estado de \"Sombra\" por 3 rodadas: +3 em Força, Destreza e Constituição, e seus ataques causam +1d6 de dano necrótico. No entanto, enquanto estiver nesse estado, o mestre pode fazer você atacar o alvo mais próximo, mesmo que seja um aliado (teste de Vontade CD 18 para resistir). Além disso, após o efeito, você não se lembra do que fez."
    },
    {
     "name": "Amaldiçoado pelo Toque",
     "cost": 2,
     "desc": "Sua pele carrega uma maldição que definha a vida. Uma vez por descanso, você pode realizar um ataque desarmado que impõe uma maldição: o alvo perde 2 PV por turno durante 6 turnos e sofre -2 em testes de Constituição. No entanto, você também sofre 2 de dano toda vez que usa esse poder (a maldição também o consome). Além disso, você não pode tocar em aliados sem causar esse efeito acidentalmente (a critério do mestre, em situações de desespero)."
    },
    {
     "name": "Olho Maldito",
     "cost": 2,
     "desc": "Você enxerga a verdade de forma distorcida, prevendo desgraças. +2 Foco. Uma vez por cena, você pode declarar que vê uma desgraça iminente: o mestre narra uma visão de algo ruim que vai acontecer (não necessariamente verdade, mas você acredita). Se a visão se concretizar, você recebe +2 em todos os testes relacionados a evitá-la. No entanto, você sofre -2 em testes sociais com pessoas supersticiosas que percebem seu olhar amaldiçoado."
    },
    {
     "name": "Hematofagia Maldita",
     "cost": 2,
     "desc": "Você precisa beber sangue para sobreviver, mas isso corrompe sua sanidade. Sempre que consome sangue de uma criatura, recupera 1d6 PV e ganha +1 em Força e Destreza por 1 hora. Porém, cada vez que o faz, perde 1 ponto de Sanidade (teste de Vontade CD 12 reduz pela metade). Se sua Sanidade chegar a 0, você entra em frenesi e ataca o ser vivo mais próximo indiscriminadamente."
    },
    {
     "name": "Fogo Interior Incontrolável",
     "cost": 3,
     "desc": "Você tem um poder destrutivo que pode explodir a qualquer momento. +2 em dano de fogo com quaisquer ataques. Uma vez por combate, pode explodir em chamas: todos num raio de 3 metros sofrem 2d6 de dano de fogo (teste de Destreza CD 15 para metade). No entanto, quando você falha num teste de Vontade (qualquer situação de estresse), deve imediatamente fazer esse mesmo teste ou a explosão acontece involuntariamente. Além disso, aliados no raio também são afetados."
    },
    {
     "name": "Saber do Proibido",
     "cost": 2,
     "desc": "Você sabe coisas que não deveria, e isso corrói sua mente. +2 Intelecto. Uma vez por sessão, pode fazer uma pergunta ao mestre sobre qualquer conhecimento obscuro (rituais, fraquezas de criaturas, história esquecida) e receber uma resposta verdadeira. No entanto, cada uso causa 1d4 de dano de Sanidade e você sussurra involuntariamente o que sabe por 1 minuto, podendo ser ouvido por aliados ou inimigos."
    },
    {
     "name": "Empata Amaldiçoado",
     "cost": 1,
     "desc": "Você sente a dor alheia como se fosse sua. +2 em testes de Intuição e empatia. Sempre que um aliado sofre dano a até 10 metros, você sofre metade desse dano em Sanidade (arredondado para baixo). Em compensação, você pode gastar uma Ação de Suporte para absorver completamente o dano de um aliado uma vez por turno (você sofre o dano no lugar dele)."
    },
    {
     "name": "Morto-Vivo Parcial",
     "cost": 2,
     "desc": "Você não está completamente vivo, mas também não está morto, e os dois mundos o rejeitam. Imune a doenças e venenos naturais. Não precisa comer, beber ou respirar. No entanto, você é afetado por cura como um morto-vivo: cura mágica só funciona com metade da eficácia, e você sofre 1d6 de dano de luz solar direta por turno. Além disso, animais e crianças o temem instintivamente."
    }
   ]
  }
};
