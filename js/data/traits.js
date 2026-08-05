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
    },
    {
     "name": "Sangue Grosso",
     "cost": 1,
     "desc": "Seu sangue coagula com rapidez incomum, fechando ferimentos antes que se agravem. +2 em testes de Constituição para resistir a sangramento. Sempre que sofrer sangramento, reduza sua duração em 1 turno (mínimo 1)."
    },
    {
     "name": "Velocidade de Ataque",
     "cost": 2,
     "desc": "Você consegue desferir golpes em rápida sucessão, sacrificando a precisão pela quantidade. Uma vez por combate, ao realizar a ação Atacar, você pode fazer um ataque extra com -2 no teste de acerto."
    },
    {
     "name": "Fera da Resistência",
     "cost": 2,
     "desc": "Quanto mais longo o combate, mais seu corpo se adapta, liberando adrenalina e força. A partir da 2ª rodada de combate contínuo, você ganha +1 Força. Na 4ª rodada, esse bônus aumenta para +2. O bônus permanece até o fim do combate."
    },
    {
     "name": "Sobrevivente Nato",
     "cost": 1,
     "desc": "Você é sempre o último a cair, recusando-se a ceder mesmo quando o corpo já desistiu. Uma vez por combate, quando o HP de uma parte vital (cabeça ou tronco) chegar a 0, você pode fazer um teste de Constituição (CD 18). Se passar, permanece com 1 HP nessa parte e continua consciente."
    },
    {
     "name": "Arranque Relâmpago",
     "cost": 1,
     "desc": "Sua aceleração inicial é explosiva, como um predador saltando sobre a presa. +2 Iniciativa. No primeiro turno de cada combate, seu deslocamento aumenta em 3 metros."
    },
    {
     "name": "Corrida Explosiva",
     "cost": 1,
     "desc": "Você consegue atingir velocidades absurdas em curtas distâncias. +1 Destreza. Uma vez por combate, ao usar a ação de Movimento, você pode dobrar a distância percorrida nesse turno."
    },
    {
     "name": "Assassino Silencioso",
     "cost": 2,
     "desc": "Você é um especialista em golpes letais furtivos, atacando de onde o inimigo menos espera. +2 em testes de ataque ao realizar emboscadas ou atacar de surpresa. Se o alvo não percebeu você, seu dano crítico é triplicado em vez de dobrado."
    },
    {
     "name": "Comando de Operações Especiais",
     "cost": 2,
     "desc": "Você foi treinado para missões furtivas e de alto risco, sabendo se mover nas sombras e neutralizar ameaças rapidamente. +1 em Furtividade, +1 em testes para sabotar equipamentos ou armadilhas, +1 em ataque corpo a corpo em espaços confinados (becos, salas pequenas, túneis)."
    },
    {
     "name": "Mestre em Mobilidade Silenciosa",
     "cost": 1,
     "desc": "Você se move sem fazer o menor ruído, mesmo nos solos mais traiçoeiros. +2 Furtividade. Pisos difíceis (metal, vidro, cascalho) não impõem desvantagem em seus testes de Furtividade."
    },
    {
     "name": "Veterano de Zona de Extermínio",
     "cost": 2,
     "desc": "Você sobreviveu a várias operações em áreas infestadas de criaturas hostis. Seus nervos são de aço. +1 Constituição, +2 Vontade para resistir a medo e horrores."
    },
    {
     "name": "Determinação de Aço",
     "cost": 2,
     "desc": "Mesmo ferido, você não recua; a dor só o fortalece. Quando o HP de uma parte vital (cabeça ou tronco) ficar abaixo de 50%, você ganha +1 Força e +1 Constituição até o fim do combate."
    },
    {
     "name": "Memória de Combate",
     "cost": 2,
     "desc": "Após receber um ataque, seu corpo aprende e reage melhor. Após sofrer um ataque de um inimigo, você ganha +1 Defesa contra ataques subsequentes dele. Acumula até +2. O bônus dura até o fim do combate."
    },
    {
     "name": "Corpo Intacto",
     "cost": 1,
     "desc": "Seu corpo parece estar mais forte enquanto não sofre um arranhão. Enquanto você não tiver sofrido dano em nenhuma parte do corpo, ganha +1 Força e +1 Destreza. O bônus se perde ao receber o primeiro dano."
    },
    {
     "name": "Flexibilidade Extrema",
     "cost": 1,
     "desc": "Você consegue passar por espaços apertados e fazer movimentos de contorcionista. +1 Destreza, +2 em testes de Acrobacia para contorcionismo ou fuga de amarras."
    },
    {
     "name": "Pulso Rápido",
     "cost": 2,
     "desc": "Seu coração bombeia sangue de forma mais eficiente, aumentando sua energia em momentos críticos. +1 Constituição. Uma vez por combate, você pode realizar uma Ação de Suporte extra (não acumula com outras fontes)."
    },
    {
     "name": "Resistência Tóxica",
     "cost": 1,
     "desc": "Seu corpo é menos afetado por venenos e toxinas. +2 em testes de Constituição para resistir a venenos e toxinas. Reduz em 1 o nível de efeitos de Envenenamento sofridos (mínimo 1)."
    },
    {
     "name": "Quebra-Guarda",
     "cost": 1,
     "desc": "Você sabe muito bem como desestabilizar a defesa de um inimigo antes de atacar. Após acertar um ataque corpo a corpo, você pode gastar uma Ação de Suporte para forçar o alvo a um teste de Destreza (CD 15). Se falhar, ele sofre -1 Defesa por 1 turno."
    },
    {
     "name": "Resistência a Dor",
     "cost": 1,
     "desc": "Mesmo com o corpo ferido gravemente, você consegue continuar lutando. Uma vez por combate, você pode ignorar todas as penalidades de ferimentos por 2 rodadas."
    },
    {
     "name": "Reflexos Felinos",
     "cost": 2,
     "desc": "Seu tempo de reação é absurdo, como um felino pronto para o bote. +1 Destreza, +2 em testes de Esquiva."
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
    },
    {
     "name": "Líder de Vanguarda",
     "cost": 2,
     "desc": "Você lidera a linha de frente, inspirando seus aliados com sua determinação inabalável. +1 Vontade. Aliados em alcance corpo a corpo (adjacentes) recebem +1 em testes de defesa enquanto você estiver consciente e lutando."
    },
    {
     "name": "Estratégia de Encurralamento",
     "cost": 1,
     "desc": "Você sabe como forçar os inimigos a se moverem para onde você deseja, como um caçador conduzindo a presa. +2 em testes para criar ou perceber armadilhas. Inimigos encurralados (cercados por você e aliados) sofrem -1 em Defesa."
    },
    {
     "name": "Manipulador Psicológico",
     "cost": 2,
     "desc": "Você sabe como jogar com a mente dos seus inimigos, plantando dúvidas e hesitações. +2 em testes de Enganação e Persuasão. Uma vez por combate, ao usar uma Ação de Suporte, você pode fazer um teste de Persuasão ou Enganação (CD 15). Se passar, um inimigo hesita e sofre -2 em seu próximo teste de ataque."
    },
    {
     "name": "Coração de Ferro",
     "cost": 2,
     "desc": "Mesmo diante do horror, você nunca perde a compostura, e sua calma serve de âncora para seus aliados. +2 em testes de Vontade contra medo e desespero. Aliados próximos que possam vê-lo recebem +1 nesses mesmos testes."
    },
    {
     "name": "Líder Imponente",
     "cost": 1,
     "desc": "Sua simples presença inspira seus subordinados a lutar com mais intensidade. +2 em testes de Intimidação e Liderança. Uma vez por descanso curto, ao usar uma Ação de Suporte, você pode motivar um aliado que esteja hesitando ou com medo, concedendo +2 no próximo teste dele."
    },
    {
     "name": "Mestre em Disfarces",
     "cost": 1,
     "desc": "Você sabe se infiltrar e se misturar em qualquer ambiente, passando-se por outra pessoa com naturalidade. +2 em testes de Atuação e Enganação ao se disfarçar ou interpretar um papel."
    },
    {
     "name": "Intimidador Nato",
     "cost": 1,
     "desc": "Sua presença causa temor. +2 Intimidação."
    },
    {
     "name": "Instinto Assassino",
     "cost": 1,
     "desc": "Sua mente é adaptada para combate furtivo. +1 Destreza ao realizar ataques furtivos ou emboscadas."
    },
    {
     "name": "Concentração de Ferro",
     "cost": 1,
     "desc": "É quase impossível você perder o foco em batalha. +2 Vontade para resistir a distrações e interrupções de concentração."
    },
    {
     "name": "Adaptável",
     "cost": 1,
     "desc": "Você se adapta rápido a novas situações. +2 em testes de improviso ou ao usar ferramentas/perícias que não domina."
    },
    {
     "name": "Mentalidade de Predador",
     "cost": 1,
     "desc": "Você está sempre em alerta, como um caçador. +1 em Percepção e +1 em Investigação."
    },
    {
     "name": "Psicopata",
     "cost": 2,
     "desc": "Você não tem senso de empatia e consegue manipular os outros com frieza. +2 em testes de Enganação, Intimidação e Persuasão. Uma vez por cena, ao manipular alguém, você pode forçar o alvo a um teste de Vontade (CD 15). Se falhar, ele age como você sugerir por 1 rodada (não pode causar dano direto a si mesmo)."
    },
    {
     "name": "Mestre Analista de Combate",
     "cost": 1,
     "desc": "Você consegue analisar padrões com rapidez. Após 1 rodada enfrentando o mesmo inimigo, você ganha +1 Esquiva contra os ataques dele (não acumula)."
    },
    {
     "name": "Concentração Venenosa",
     "cost": 1,
     "desc": "Sua mente fica mais afiada sob efeitos de envenenamento. Enquanto estiver sob efeito de veneno, você ganha +1 Foco em testes de ataque e perícias cognitivas."
    },
    {
     "name": "Imunidade ao Medo",
     "cost": 3,
     "desc": "Sua mente é uma fortaleza contra o medo. +3 Vontade para resistir a efeitos de medo, pânico e terror. Uma vez por sessão, ao falhar em um teste contra medo, você pode repeti-lo com vantagem."
    },
    {
     "name": "Fúria Calculada",
     "cost": 1,
     "desc": "Mesmo com raiva extrema, você mantém o controle total. +2 Vontade para resistir a efeitos de Frenesi. Enquanto estiver sob efeito de raiva (como Fúria de Batalha), você não sofre penalidades em testes de ataque por emoção."
    },
    {
     "name": "Adaptador de Status",
     "cost": 2,
     "desc": "Sua mente cria rapidamente uma resposta ao que está sofrendo. Reduz em 1 turno a duração de efeitos de status mentais (medo, confusão, enfeitiçado, etc.). Uma vez por combate, ao sofrer um desses efeitos, você pode fazer um teste de Vontade (CD 15) para reduzi-lo em mais 1 turno."
    },
    {
     "name": "Comando de Unidade",
     "cost": 2,
     "desc": "Você sabe coordenar esquadrões de forma mais eficiente. Aliados próximos que possam ouvi-lo recebem +1 em testes de ataque enquanto você estiver consciente e comandando."
    },
    {
     "name": "Perseguidor Incansável",
     "cost": 1,
     "desc": "Quando você escolhe um alvo, não desiste dele. +2 em testes de rastreamento e perseguição. Uma vez por cena, ao falhar em um teste de rastreamento, você pode repeti-lo imediatamente."
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
    },
    {
     "name": "Coração de Fogo",
     "cost": 2,
     "desc": "Você nasceu com uma centelha de fogo no peito. Seu sangue é quente demais para o frio tocá-lo, e suas mãos podem incendiar o que tocam. +2 em testes de Constituição contra ambientes frios e dano Gélido. Seus ataques desarmados podem causar 1d4 de dano de Calor adicional (uma vez por turno)."
    },
    {
     "name": "Chamas da Paixão",
     "cost": 2,
     "desc": "Sua vontade é uma fornalha que não se apaga. Quanto mais ferido, mais quente sua chama queima. Quando estiver com metade ou menos do HP total, seus ataques corpo a corpo causam +2 de dano de Calor. +1 Vontade."
    },
    {
     "name": "Tocha Viva",
     "cost": 1,
     "desc": "Seu corpo emite um calor reconfortante que aquece aliados e repele o frio. Luz natural em um raio de 3 metros. Aliados nesse raio ignoram penalidades de frio ambiental leve. Resistência a dano de Calor: reduz 1 ponto de dano recebido."
    },
    {
     "name": "Explosão Contida",
     "cost": 2,
     "desc": "Você pode liberar uma onda de calor devastadora quando encurralado, mas isso drena suas forças. Uma vez por combate, como Ação de Suporte, cause 2d4 de dano de Calor em um raio de 3 metros ao seu redor (aliados são imunes). Após usar, sofre -1 em testes físicos por 1 rodada."
    },
    {
     "name": "Pele de Brasa",
     "cost": 1,
     "desc": "Sua pele é áspera e quente como carvão em brasa. Inimigos que errarem ataques corpo a corpo contra você sofrem 1 de dano de Calor. Você não sofre dano por tocar superfícies quentes (como metal aquecido)."
    },
    {
     "name": "Sangue Glacial",
     "cost": 2,
     "desc": "O frio das montanhas corre em suas veias. O gelo não o fere — ele o acolhe. +2 em testes de Constituição contra ambientes quentes e dano de Calor. Seus ataques desarmados podem causar 1d4 de dano Gélido adicional (uma vez por turno)."
    },
    {
     "name": "Toque do Inverno",
     "cost": 2,
     "desc": "Suas mãos carregam o frio da nevasca. Onde toca, o gelo se forma. Ao acertar um ataque desarmado, o alvo deve fazer um teste de Constituição (CD 15). Se falhar, sofre Congelamento nível 1 por 2 turnos. Uma vez por combate."
    },
    {
     "name": "Muralha de Gelo",
     "cost": 1,
     "desc": "Você pode condensar a umidade do ar em uma barreira de gelo protetora. Uma vez por combate, como Reação ao ser atacado, você pode criar um escudo de gelo que concede +2 de Defesa até o início do seu próximo turno. O escudo se quebra após absorver o primeiro golpe."
    },
    {
     "name": "Nevasca Interior",
     "cost": 2,
     "desc": "Mesmo sob o sol escaldante, você carrega o inverno dentro de si. Imune a penalidades de calor ambiental leve. Uma vez por combate, como Ação de Suporte, você pode criar uma aura de frio em 3 metros: inimigos na área têm seu deslocamento reduzido em 2 metros por 2 rodadas."
    },
    {
     "name": "Lágrimas de Gelo",
     "cost": 1,
     "desc": "Você pode congelar a própria dor, ignorando ferimentos por breves momentos. Uma vez por combate, ao sofrer dano, você pode reduzir o dano recebido em 1d4. Se o dano for de Calor, a redução é de apenas 1."
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
    },
    {
     "name": "Chama Maldita",
     "cost": 2,
     "desc": "Suas chamas queimam mais forte, mas se alimentam de você. +2 de dano de Calor em todos os ataques. Sempre que causar dano de Calor, role 1d4. Com 1, você também sofre 1d4 de dano de Calor (a chama lambe sua própria carne)."
    },
    {
     "name": "Abraço do Inverno",
     "cost": 2,
     "desc": "O frio que você carrega é tão intenso que machuca quem se aproxima — inclusive aliados. Inimigos que terminem seus turnos adjacentes a você sofrem 1 de dano Gélido. Aliados adjacentes também sofrem 1 de dano Gélido (você não pode desligar essa aura). +2 em testes de Intimidação (sua presença gélida é assustadora)."
    },
    {
     "name": "Coração Congelado",
     "cost": 2,
     "desc": "Você sacrificou suas emoções para dominar o gelo absoluto. Imune a efeitos de medo e encantamento (seu coração não sente). +2 Vontade. -2 em testes de Persuasão e Diplomacia (você é frio e distante). Você não pode usar empatia ou intuição para entender os sentimentos alheios."
    },
    {
     "name": "Maldição do Gelo Eterno",
     "cost": 3,
     "desc": "Você foi amaldiçoado por uma entidade glacial. O gelo obedece, mas cobra seu preço. Seus ataques com gelo causam +1d6 de dano Gélido adicional. Sempre que usar uma habilidade de gelo, role 1d6. Com 1, uma parte aleatória do seu corpo sofre Congelamento nível 2 por 3 turnos (ignore imunidades). Você nunca sente calor — mesmo sob o sol, sua pele é fria como um cadáver."
    }
   ]
  }
};
