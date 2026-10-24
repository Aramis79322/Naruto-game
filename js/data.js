/* ============================================================
   NARUTO: SHINOBI LEGACY — Datos del juego
   Fan game no oficial. Todos los personajes pertenecen a sus autores.
   ============================================================ */
(function () {
  'use strict';

  const RANKS = {
    D: { id: 'D', name: 'D', label: 'Fácil', color: '#7bd88f', desc: 'Trabajos de aldea, entregas y patrullas.', req: 0, xp: 120, ryo: 180 },
    C: { id: 'C', name: 'C', label: 'Medio', color: '#5ec8e5', desc: 'Escoltas, bandidos y ninjas desertores.', req: 3, xp: 320, ryo: 480 },
    B: { id: 'B', name: 'B', label: 'Difícil', color: '#f4b942', desc: 'Ninjas de élite y bestias con chakra.', req: 6, xp: 700, ryo: 1100 },
    A: { id: 'A', name: 'A', label: 'Muy difícil', color: '#ff8c42', desc: 'Akatsuki, sannin y amenazas de guerra.', req: 10, xp: 1400, ryo: 2400 },
    S: { id: 'S', name: 'S', label: 'Extremo', color: '#ff4d5e', desc: 'Kage, jinchūriki y dioses. Sin margen de error.', req: 15, xp: 2800, ryo: 5000 }
  };

  const SHINOBI_RANKS = [
    { id: 'genin', name: 'Genin', jp: '下忍', color: '#3d7bd6', band: '#1b2d4f', plate: '#c9d2da', desc: 'Recién graduado de la Academia. Misiones D y C.' },
    { id: 'chunin', name: 'Chūnin', jp: '中忍', color: '#33a06f', band: '#163d33', plate: '#c9d2da', desc: 'Líder de escuadrón. Misiones C y B.' },
    { id: 'jonin', name: 'Jōnin', jp: '上忍', color: '#b8862e', band: '#2a2118', plate: '#d7c08a', desc: 'Ninja de élite. Misiones A.' },
    { id: 'anbu', name: 'ANBU', jp: '暗部', color: '#8b3fd1', band: '#0d0d12', plate: '#b9b9c8', desc: 'Fuerza especial secreta. Misiones A y S.' },
    { id: 'kage', name: 'Kage', jp: '影', color: '#e0433e', band: '#f2f2f2', plate: '#e3c56b', desc: 'La cima de la aldea. Leyenda viviente.' }
  ];

  const VILLAGES = [
    {
      id: 'konoha', name: 'Aldea Oculta de la Hoja', short: 'Konoha', country: 'País del Fuego', symbol: 'leaf',
      colors: ['#2f7a3e', '#d64535'], status: 'available', kage: 'Hiruzen Sarutobi',
      desc: 'La aldea de la Hoja, cuna de la Voluntad del Fuego. Bosques infinitos, el Monumento de los Hokage y el aroma del ramen flotan en el aire.',
      bonus: 'Afinidad con el Estilo Viento y Fuego. +5% de experiencia en misiones de la Hoja.'
    },
    {
      id: 'suna', name: 'Aldea Oculta de la Arena', short: 'Suna', country: 'País del Viento', symbol: 'sand',
      colors: ['#c99a4b', '#7b4b2a'], status: 'locked', kage: 'Gaara',
      desc: 'Murallas de arena y tormentas eternas. Sus ninjas luchan con marionetas, veneno y el poder del desierto.',
      bonus: 'Afinidad con el Estilo Arena. Próximamente.'
    },
    {
      id: 'kiri', name: 'Aldea Oculta de la Niebla', short: 'Kiri', country: 'País del Agua', symbol: 'mist',
      colors: ['#3a7e8f', '#1b3b4a'], status: 'locked', kage: 'Mei Terumī',
      desc: 'La aldea del vapor y la niebla. Conocida por sus Siete Espadachines y por el examen más cruel del mundo ninja.',
      bonus: 'Afinidad con el Estilo Agua. Próximamente.'
    },
    {
      id: 'kumo', name: 'Aldea Oculta de la Nube', short: 'Kumo', country: 'País del Rayo', symbol: 'cloud',
      colors: ['#9db4c9', '#3f5d78'], status: 'locked', kage: 'A (Cuarto Raikage)',
      desc: 'Montañas que perforan las nubes. La velocidad y la fuerza bruta de sus ninjas son legendarias.',
      bonus: 'Afinidad con el Estilo Rayo. Próximamente.'
    },
    {
      id: 'iwa', name: 'Aldea Oculta de la Piedra', short: 'Iwa', country: 'País de la Tierra', symbol: 'stone',
      colors: ['#a0784f', '#5c4530'], status: 'locked', kage: 'Ōnoki',
      desc: 'Fortalezas excavadas en la roca. Sus ninjas resisten cualquier asedio y dominan el Estilo Tierra.',
      bonus: 'Afinidad con el Estilo Tierra. Próximamente.'
    },
    {
      id: 'taki', name: 'Aldea Oculta de la Cascada', short: 'Taki', country: 'País de la Cascada', symbol: 'waterfall',
      colors: ['#2f9e8f', '#145f66'], status: 'locked', kage: 'Shibuki',
      desc: 'Oculta tras una catarata, guarda el agua de los héroes y a un jinchūriki que pocos conocen.',
      bonus: 'Afinidad con el Estilo Agua. Próximamente.'
    },
    {
      id: 'oto', name: 'Aldea Oculta del Sonido', short: 'Oto', country: 'País del Sonido', symbol: 'sound',
      colors: ['#7c5a9e', '#2d1a3d'], status: 'locked', kage: 'Orochimaru',
      desc: 'Laboratorios subterráneos y experimentos prohibidos. El hogar de los Cinco del Sonido.',
      bonus: 'Afinidad con técnicas prohibidas. Próximamente.'
    },
    {
      id: 'ame', name: 'Aldea Oculta de la Lluvia', short: 'Ame', country: 'País de la Lluvia', symbol: 'rain',
      colors: ['#4f6f8f', '#26394d'], status: 'locked', kage: 'Pain',
      desc: 'Lluvia perpetua, torres de acero y el silencio de un dios. El corazón de Amegakure.',
      bonus: 'Afinidad con el Estilo Agua. Próximamente.'
    },
    {
      id: 'kusa', name: 'Aldea Oculta de la Hierba', short: 'Kusa', country: 'País de la Hierba', symbol: 'grass',
      colors: ['#679b3e', '#31552b'], status: 'locked', kage: 'Desconocido',
      desc: 'Praderas interminables entre fronteras. Sus ninjas sobreviven gracias al ingenio y al camuflaje.',
      bonus: 'Afinidad con el Estilo Tierra. Próximamente.'
    },
    {
      id: 'uzu', name: 'Aldea Oculta del Remolino', short: 'Uzushio', country: 'País del Remolino', symbol: 'whirl',
      colors: ['#c8553d', '#6e2a24'], status: 'locked', kage: 'Desconocido',
      desc: 'Ruinas de un pueblo orgulloso, hogar del clan Uzumaki y maestro de los sellos ninja.',
      bonus: 'Afinidad con el Estilo Sellos. Próximamente.'
    }
  ];

  const CHARACTERS = [
    {
      id: 'naruto', name: 'Naruto Uzumaki', short: 'Naruto', villager: 'konoha', role: 'Jinchūriki del Kyūbi',
      title: 'El Ninja Número Uno Hiperactivo', portrait: 'assets/portraits/naruto.png',
      stats: { nin: 9, tai: 7, gen: 3, spd: 8, def: 6 }, element: 'Viento',
      quote: 'No me rindo. Ese es mi nindō.',
      bio: 'Un huérfano que creció bajo las miradas de odio del pueblo. A pesar de todo, sueña con convertirse en Hokage para que todos lo reconozcan.',
      burden: 'Los aldeanos lo llaman «ese niño». Nadie le dice por qué. Solo que dentro de él vive algo que destruyó la Hoja.',
      jutsu: [
        { name: 'Rasengan', type: 'dash', cost: 22, color: '#4aa8ff', desc: 'Embestida con una esfera de chakra gira.' },
        { name: 'Clon de Sombra', type: 'projectile', cost: 16, color: '#ff9d3d', desc: 'Lanza un clon que explota en humo.' }
      ],
      ultimate: { name: 'Rasenshuriken', color: '#55c8ff', desc: 'Un shuriken de viento que desgarra todo a su paso.' },
      art: { skin: '#f4c9a3', hair: '#f2c53d', hair2: '#c8961f', style: 'spiky', eye: '#2f6fd0', outfit: '#f26a1b', outfit2: '#1b1b22', trim: '#ffcf5c', band: '#1c2b4a', accessory: 'whiskers' }
    },
    {
      id: 'sasuke', name: 'Sasuke Uchiha', short: 'Sasuke', villager: 'konoha', role: 'Último Uchiha',
      title: 'El Vengador del Sharingan', portrait: 'assets/portraits/sasuke.png',
      stats: { nin: 8, tai: 7, gen: 6, spd: 9, def: 6 }, element: 'Rayo',
      quote: 'Tengo un objetivo. Nada más importa.',
      bio: 'Sobreviviente de la masacre del clan Uchiha. Su talento es tan frío como la noche en que lo perdió todo.',
      burden: 'La noche del exterminio te dejó un Sharingan y un hermano al que odiar. En la Academia, todos saben tu apellido antes que tu nombre.',
      jutsu: [
        { name: 'Chidori', type: 'dash', cost: 24, color: '#9fdcff', desc: 'Una descarga de rayos en la palma, a velocidad mortal.' },
        { name: 'Bola de Fuego', type: 'projectile', cost: 18, color: '#ff6a2a', desc: 'Un gran proyectil ígneo que quema al impactar.' }
      ],
      ultimate: { name: 'Susanoo', color: '#a56bff', desc: 'El guerrero espectral del Mangekyō aplasta el campo.' },
      art: { skin: '#f1c6a0', hair: '#252a38', hair2: '#111420', style: 'duck', eye: '#3b3f4a', outfit: '#2b3550', outfit2: '#151a26', trim: '#c7ccd4', band: '#1c2b4a', accessory: 'sharingan' }
    },
    {
      id: 'sakura', name: 'Sakura Haruno', short: 'Sakura', villager: 'konoha', role: 'Kunoichi médica',
      title: 'La Flor del Equipo 7', portrait: 'assets/portraits/sakura.png',
      stats: { nin: 7, tai: 8, gen: 7, spd: 7, def: 6 }, element: 'Chakra',
      quote: 'Ya no quiero ser la que mira la espalda de los demás.',
      bio: 'De niña insegura a una de las kunoichis más fuertes de la Hoja. Su control de chakra es tan preciso que puede reventar una montaña.',
      burden: 'Nacida en una familia sin clan, todos esperan que seas una simple kunoichi de apoyo. «Solo eres la chica del equipo», dicen.',
      jutsu: [
        { name: 'Puño Demoledor', type: 'nova', cost: 21, color: '#ff7fa7', desc: 'Un puñetazo que fractura el suelo a tu alrededor.' },
        { name: 'Palma Curativa', type: 'heal', cost: 26, color: '#72f0b3', desc: 'Cierra tus heridas con chakra médico.' }
      ],
      ultimate: { name: 'Cien Fuerzas · Byakugō', color: '#ff5f8d', desc: 'Libera la marca en tu frente y desata un torrente de fuerza.' },
      art: { skin: '#f7cdb0', hair: '#f29ab8', hair2: '#c2658a', style: 'long', eye: '#4ea66d', outfit: '#d94b6b', outfit2: '#2c2f4a', trim: '#f7a8c1', band: '#1c2b4a', accessory: 'forehead' }
    },
    {
      id: 'kakashi', name: 'Kakashi Hatake', short: 'Kakashi', villager: 'konoha', role: 'Jōnin · Sharingan',
      title: 'El Ninja Copia', portrait: 'assets/portraits/kakashi.png',
      stats: { nin: 9, tai: 7, gen: 8, spd: 8, def: 7 }, element: 'Rayo',
      quote: 'Los que abandonan a sus amigos son peores que la escoria.',
      bio: 'El sensei del Equipo 7. Libros prohibidos, pereza fingida y un Sharingan que ha copiado mil técnicas. Bajo el mask, un pasado que pesa.',
      burden: 'Te llaman «el amigo asesino». Cada misión te recuerda a Obito y a Rin. El pueblo te respeta; tú no te perdonas.',
      jutsu: [
        { name: 'Raikiri', type: 'dash', cost: 24, color: '#bfe9ff', desc: 'Corta el rayo con la mano y atraviesa al enemigo.' },
        { name: 'Sabueso Ninja', type: 'projectile', cost: 17, color: '#8a6a4a', desc: 'Invoca un sabueso que persigue al objetivo.' }
      ],
      ultimate: { name: 'Kamui', color: '#b270ff', desc: 'El Mangekyō abre un vórtice que borra el espacio.' },
      art: { skin: '#f0c6a2', hair: '#d7dde2', hair2: '#9aa4ad', style: 'silver', eye: '#2e2e36', outfit: '#1f3b4d', outfit2: '#13232f', trim: '#c5d0d8', band: '#1c2b4a', accessory: 'mask' }
    },
    {
      id: 'hinata', name: 'Hinata Hyūga', short: 'Hinata', villager: 'konoha', role: 'Heredera del Byakugan',
      title: 'La Flor del Clan Hyūga', portrait: 'assets/portraits/hinata.png',
      stats: { nin: 6, tai: 7, gen: 4, spd: 7, def: 6 }, element: 'Chakra',
      quote: 'Siempre he querido ser más fuerte... por mí misma.',
      bio: 'Tímida, amable y poseedora del Byakugan. Durante años fue considerada una decepción para su clan; hoy su voluntad es más dura que el acero.',
      burden: 'La heredera que no podía mirar a los ojos. Tu padre te llamó fracaso delante de todo el clan. En la Academia, los rumores te siguieron.',
      jutsu: [
        { name: '64 Palmas', type: 'nova', cost: 20, color: '#b9e6ff', desc: 'Golpea los chakra points de todos los enemigos cercanos.' },
        { name: 'León Gemelo', type: 'dash', cost: 23, color: '#8ed8ff', desc: 'Dos leones de chakra girando en embestida.' }
      ],
      ultimate: { name: 'Vacío Gentil · 128 Palmas', color: '#c9a8ff', desc: 'Cierra todos los puntos de chakra del enemigo.' },
      art: { skin: '#f7d3bd', hair: '#2b2f52', hair2: '#171a33', style: 'long', eye: '#d9e6f2', outfit: '#d8d2c4', outfit2: '#5d5a6e', trim: '#9ac9d8', band: '#1c2b4a', accessory: 'byakugan' }
    },
    {
      id: 'shikamaru', name: 'Shikamaru Nara', short: 'Shikamaru', villager: 'konoha', role: 'Genio del Clan Nara',
      title: 'La Sombra del Equipo 10', portrait: 'assets/portraits/shikamaru.png',
      stats: { nin: 7, tai: 5, gen: 9, spd: 5, def: 5 }, element: 'Sombra',
      quote: 'Qué pereza... pero si tengo que hacerlo, lo haré bien.',
      bio: 'El genio perezoso de la Hoja. Prefiere mirar las nubes antes que pelear, aunque su mente es el arma más afilada del equipo.',
      burden: 'El hijo del jefe del clan, el que siempre saca diez sin estudiar. Los demás te ven como un arrogante al que todo le sale fácil.',
      jutsu: [
        { name: 'Posesión de Sombra', type: 'field', cost: 18, color: '#5a4b9e', desc: 'Extiende la sombra y paraliza a quien pise.' },
        { name: 'Kage Nui', type: 'projectile', cost: 16, color: '#40356e', desc: 'Agujas de sombra que atraviesan la distancia.' }
      ],
      ultimate: { name: 'Estrategia de las 200 Jugadas', color: '#8f7bd8', desc: 'El tablero está decidido antes de que empiece.' },
      art: { skin: '#eac39c', hair: '#1e1e28', hair2: '#101016', style: 'ponytail', eye: '#3a3a46', outfit: '#2f3b30', outfit2: '#1c241d', trim: '#b7a46b', band: '#1c2b4a', accessory: 'none' }
    },
    {
      id: 'rocklee', name: 'Rock Lee', short: 'Lee', villager: 'konoha', role: 'Especialista en Taijutsu',
      title: 'El Poder de la Juventud', portrait: 'assets/portraits/rocklee.png',
      stats: { nin: 1, tai: 10, gen: 2, spd: 10, def: 7 }, element: 'Taijutsu',
      quote: 'El esfuerzo supera al talento. ¡Eso es ser un ninja!',
      bio: 'Incapaz de usar ninjutsu, convirtió su cuerpo en un arma. Su ceño, sus vendas y su pasión por la juventud son inconfundibles.',
      burden: 'No puedes moldear chakra. Los demás se ríen de tus sueños y tu sensei te llama «el chico sin talento». Hoy entrenas diez veces más.',
      jutsu: [
        { name: 'Loto Escondido', type: 'dash', cost: 20, color: '#7ad66b', desc: 'Una patada aérea que abre las puertas del dolor.' },
        { name: 'Huracán de la Juventud', type: 'nova', cost: 22, color: '#9ef08a', desc: 'Golpea a todos a tu alrededor con el poder de las puertas.' }
      ],
      ultimate: { name: 'Ocho Puertas · Dragón', color: '#ff6b35', desc: 'Abres la puerta de la muerte. Tu cuerpo arde en verde.' },
      art: { skin: '#f2c9a4', hair: '#14141a', hair2: '#0a0a0e', style: 'bowl', eye: '#2d2d38', outfit: '#2f7a3e', outfit2: '#1c2a24', trim: '#d6533a', band: '#1c2b4a', accessory: 'brows' }
    },
    {
      id: 'gaara', name: 'Gaara', short: 'Gaara', villager: 'suna', role: 'Quinto Kazekage',
      title: 'El Jinchūriki del Shukaku', portrait: 'assets/portraits/gaara.png',
      stats: { nin: 10, tai: 4, gen: 5, spd: 5, def: 10 }, element: 'Arena',
      quote: 'El amor propio es el único que necesito... ya no.',
      bio: 'Nacido como jinchūriki del Shukaku, creció odiado por su propia aldea. Hoy protege a Suna como el Kazekage más joven de la historia.',
      burden: 'Tu padre ordenó tu muerte seis veces. El pueblo te teme, tu hermano te evita y tu madre solo vive en la arena que te protege.',
      jutsu: [
        { name: 'Ataúd de Arena', type: 'nova', cost: 23, color: '#e0b36a', desc: 'Una ola de arena sepulta a los enemigos cercanos.' },
        { name: 'Shuriken de Arena', type: 'projectile', cost: 17, color: '#caa05b', desc: 'Arena comprimida que corta el aire.' }
      ],
      ultimate: { name: 'Shukaku · Lanza de Arena', color: '#d8953f', desc: 'El tanuki de una cola despierta bajo tus pies.' },
      art: { skin: '#f0ddc8', hair: '#b23a33', hair2: '#7a2723', style: 'short', eye: '#7ba6b8', outfit: '#8c3d3a', outfit2: '#3b2428', trim: '#d9b38c', band: '#1c2b4a', accessory: 'gaara' }
    },
    {
      id: 'neji', name: 'Neji Hyūga', short: 'Neji', villager: 'konoha', role: 'Prodigio del Byakugan',
      title: 'El Genio del Destino', portrait: 'assets/portraits/neji.png',
      stats: { nin: 7, tai: 8, gen: 6, spd: 8, def: 6 }, element: 'Chakra',
      quote: 'El destino no se puede cambiar... o eso creía.',
      bio: 'El genio de la rama secundaria. Su mirada lo ve todo, incluso las jaulas que nadie más quiere nombrar.',
      burden: 'La marca en tu frente te recuerda cada día que naciste para servir. Los de la rama principal te llaman «herramienta», no primo.',
      jutsu: [
        { name: 'Palma Vacía', type: 'dash', cost: 21, color: '#a8dfff', desc: 'Un golpe de chakra que expulsa al enemigo.' },
        { name: 'Rotación Celestial', type: 'nova', cost: 24, color: '#d6f4ff', desc: 'Una cúpula giratoria que rechaza todo.' }
      ],
      ultimate: { name: '64 Palmas · Destino', color: '#b9c7ff', desc: 'El Byakugan revela cada punto vital.' },
      art: { skin: '#f2d1b4', hair: '#2c2a30', hair2: '#17161b', style: 'ponytail', eye: '#e8eef4', outfit: '#d6cbb8', outfit2: '#544b3e', trim: '#9a8a6a', band: '#1c2b4a', accessory: 'byakugan' }
    },
    {
      id: 'kiba', name: 'Kiba Inuzuka', short: 'Kiba', villager: 'konoha', role: 'Ninja de la Caza',
      title: 'El Colmillo de la Hoja', portrait: 'assets/portraits/kiba.png',
      stats: { nin: 5, tai: 8, gen: 3, spd: 9, def: 6 }, element: 'Fuego',
      quote: '¡Akamaru y yo somos el mejor equipo de la Hoja!',
      bio: 'Impulsivo, ruidoso y leal. Kiba pelea junto a Akamaru, su compañero canino, con una ferocidad que iguala a su olfato.',
      burden: 'El chico que siempre va acompañado de un perro. «Ni siquiera puedes pelear solo», se burlaban. Akamaru fue tu única familia.',
      jutsu: [
        { name: 'Colmillo de Garra', type: 'dash', cost: 20, color: '#ffb45c', desc: 'Tú y Akamaru girando como una sierra.' },
        { name: 'Tornado de Garra', type: 'nova', cost: 23, color: '#e8954a', desc: 'Un vendaval de garras y polvo.' }
      ],
      ultimate: { name: 'Hombre Lobo de Dos Cabezas', color: '#ff7a2f', desc: 'La fusión definitiva de humano y bestia.' },
      art: { skin: '#efc49c', hair: '#5b4630', hair2: '#3a2c1e', style: 'spiky', eye: '#3e3428', outfit: '#4b5a63', outfit2: '#2a3339', trim: '#d6c6a8', band: '#1c2b4a', accessory: 'fangs' }
    },
    {
      id: 'shino', name: 'Shino Aburame', short: 'Shino', villager: 'konoha', role: 'Maestro de los Insectos',
      title: 'El Silencio del Clan Aburame', portrait: 'assets/portraits/shino.png',
      stats: { nin: 8, tai: 5, gen: 6, spd: 6, def: 6 }, element: 'Insectos',
      quote: 'Los insectos nunca mienten. Las personas sí.',
      bio: 'Miembro del clan Aburame, porta un enjambre de kikaichū que devora chakra. Habla poco, pero observa todo.',
      burden: 'Tu cuerpo es una colmena. Los niños se apartaban al verte, y los adultos susurraban que traías la plaga.',
      jutsu: [
        { name: 'Enjambre Devorador', type: 'field', cost: 18, color: '#6d8a4e', desc: 'Insectos que drenan el chakra de quien se acerque.' },
        { name: 'Escarabajo Parásito', type: 'projectile', cost: 17, color: '#4f623a', desc: 'Un kikaichū que persigue su objetivo.' }
      ],
      ultimate: { name: 'Nube de Kikaichū', color: '#93b56b', desc: 'Un enjambre infinito cubre el cielo.' },
      art: { skin: '#e8c5a2', hair: '#201f25', hair2: '#101014', style: 'spiky', eye: '#3b3a3f', outfit: '#4a5745', outfit2: '#2b3328', trim: '#9caa8d', band: '#1c2b4a', accessory: 'glasses' }
    },
    {
      id: 'ino', name: 'Ino Yamanaka', short: 'Ino', villager: 'konoha', role: 'Especialista Mental',
      title: 'La Flor del Clan Yamanaka', portrait: 'assets/portraits/ino.png',
      stats: { nin: 6, tai: 4, gen: 8, spd: 6, def: 5 }, element: 'Mente',
      quote: 'Una mente fuerte vale más que mil kunais.',
      bio: 'Extrovertida, estratega y experta en el control mental. La rivalidad con Sakura es tan famosa como su puntería con las flores.',
      burden: 'La niña popular que todos creen superficial. Nadie ve el peso de ser la futura líder del clan Yamanaka.',
      jutsu: [
        { name: 'Transferencia Mental', type: 'field', cost: 19, color: '#d9a7ff', desc: 'Una zona que confunde y ralentiza.' },
        { name: 'Flor Cortante', type: 'projectile', cost: 16, color: '#ff9ecb', desc: 'Pétalos de chakra afilados como agujas.' }
      ],
      ultimate: { name: 'Control Total · Flor Mental', color: '#f07bd1', desc: 'Tu mente ocupa el campo de batalla entero.' },
      art: { skin: '#f4cbb1', hair: '#f5d76e', hair2: '#c9a53a', style: 'ponytail', eye: '#5a9bd6', outfit: '#5d4b7a', outfit2: '#322a44', trim: '#c7b3e8', band: '#1c2b4a', accessory: 'none' }
    },
    {
      id: 'choji', name: 'Chōji Akimichi', short: 'Chōji', villager: 'konoha', role: 'Fuerza del Clan Akimichi',
      title: 'El Corazón Más Grande', portrait: 'assets/portraits/choji.png',
      stats: { nin: 5, tai: 8, gen: 4, spd: 4, def: 8 }, element: 'Fuerza',
      quote: 'No te metas con mis amigos... o te arrepentirás.',
      bio: 'El alma amable del Equipo 10. Su tamaño esconde una técnica de expansión capaz de aplastar montañas... y un corazón enorme.',
      burden: 'Los apodos crueles te acompañaron desde niño. «Gordo», «lento», «el que solo come». Tu padre te enseñó a convertirlo en fuerza.',
      jutsu: [
        { name: 'Expansión de Carne', type: 'nova', cost: 20, color: '#e8a36b', desc: 'Tu cuerpo se expande y arrasa a tu alrededor.' },
        { name: 'Bola Humana', type: 'dash', cost: 22, color: '#f0b47a', desc: 'Ruedas como una avalancha imparable.' }
      ],
      ultimate: { name: 'Mariposa de Chakra', color: '#ffcf5c', desc: 'Las alas de la mariposa Akimichi te elevan.' },
      art: { skin: '#f2c9a5', hair: '#8a5530', hair2: '#5a3620', style: 'spiky', eye: '#3d2f23', outfit: '#3d8a55', outfit2: '#223f2c', trim: '#e7d2a6', band: '#1c2b4a', accessory: 'swirl' }
    },
    {
      id: 'tenten', name: 'Tenten', short: 'Tenten', villager: 'konoha', role: 'Maestra de Armas',
      title: 'La Arsenal de la Hoja', portrait: 'assets/portraits/tenten.png',
      stats: { nin: 6, tai: 7, gen: 3, spd: 7, def: 5 }, element: 'Armas',
      quote: 'Cien armas, una sola verdad: la puntería lo decide todo.',
      bio: 'La kunoichi del Equipo Guy. Su precisión con kunais, shuriken y sellos explosivos convierte el campo en una tormenta de acero.',
      burden: 'Sin clan ni técnicas legendarias, todos te subestiman. Tu fuerza nació de mil lanzamientos frente a un poste.',
      jutsu: [
        { name: 'Lluvia de Kunai', type: 'projectile', cost: 16, color: '#c7d2da', desc: 'Una lluvia de acero desde el pergamino.' },
        { name: 'Cadena de Dragones', type: 'nova', cost: 23, color: '#ffb24a', desc: 'Armas girando en todas direcciones.' }
      ],
      ultimate: { name: 'Sello Explosivo · Arsenal', color: '#ff8c42', desc: 'El cielo se llena de armas y explosiones.' },
      art: { skin: '#f2cdb0', hair: '#4a3428', hair2: '#2b1d15', style: 'buns', eye: '#4a3a30', outfit: '#c96a6a', outfit2: '#3a2b2b', trim: '#e8d8b8', band: '#1c2b4a', accessory: 'scroll' }
    },
    {
      id: 'temari', name: 'Temari', short: 'Temari', villager: 'suna', role: 'Kunoichi del Viento',
      title: 'La Segadora de Suna', portrait: 'assets/portraits/temari.png',
      stats: { nin: 8, tai: 4, gen: 5, spd: 7, def: 6 }, element: 'Viento',
      quote: 'Si el viento sopla a mi favor, no hay defensa que valga.',
      bio: 'Hermana mayor de Gaara y Kankuro. Su abanico gigante corta el aire y la arrogancia enemiga por igual.',
      burden: 'La hermana que debía mantener unida a una familia rota. Mientras todos temían a Gaara, tú debías sonreír y fingir que todo estaba bien.',
      jutsu: [
        { name: 'Corte de Viento', type: 'projectile', cost: 18, color: '#8fe3c9', desc: 'Una cuchilla de aire comprimido.' },
        { name: 'Remolino', type: 'nova', cost: 22, color: '#b9f2df', desc: 'Un ciclón que barre a los enemigos cercanos.' }
      ],
      ultimate: { name: 'Kamatari · Corte de la Guadaña', color: '#7be0b4', desc: 'La comadreja de viento arrasa el campo.' },
      art: { skin: '#f0c8a6', hair: '#d9c26a', hair2: '#a88f3e', style: 'twintails', eye: '#4d6d5a', outfit: '#6b5a8e', outfit2: '#342c4a', trim: '#d7c74a', band: '#1c2b4a', accessory: 'fan' }
    },
    {
      id: 'kankuro', name: 'Kankurō', short: 'Kankurō', villager: 'suna', role: 'Maestro Titiritero',
      title: 'El Teatro de la Arena', portrait: 'assets/portraits/kankuro.png',
      stats: { nin: 8, tai: 5, gen: 5, spd: 6, def: 6 }, element: 'Marionetas',
      quote: 'El escenario está listo. Que empiece la función.',
      bio: 'El hermano mayor de Gaara. Sus marionetas, Karasu y Kuroari, convierten cada combate en una obra macabra.',
      burden: 'Creciste protegiendo a un hermano que podía matarte y a una hermana que cargaba con todos. Nadie te preguntó qué querías tú.',
      jutsu: [
        { name: 'Karasu · Filo', type: 'projectile', cost: 17, color: '#c4874e', desc: 'La marioneta lanza una hoja envenenada.' },
        { name: 'Teatro de Marionetas', type: 'field', cost: 20, color: '#9a6a3a', desc: 'Marionetas que atacan en un área.' }
      ],
      ultimate: { name: 'Sanshōuo · Armadura Negra', color: '#e09a56', desc: 'La marioneta definitiva se abre como una fortaleza.' },
      art: { skin: '#efc6a1', hair: '#2b2a33', hair2: '#17161c', style: 'hood', eye: '#3d3a42', outfit: '#2c2a33', outfit2: '#17151c', trim: '#7a4b8c', band: '#1c2b4a', accessory: 'paint' }
    },
    {
      id: 'sai', name: 'Sai', short: 'Sai', villager: 'konoha', role: 'Artista de la Tinta',
      title: 'La Sonrisa Falsa', portrait: 'assets/portraits/sai.png',
      stats: { nin: 7, tai: 6, gen: 5, spd: 8, def: 6 }, element: 'Tinta',
      quote: 'Una sonrisa puede ocultar cualquier cosa.',
      bio: 'Criado por la Fundación de Danzō, Sai dibuja criaturas de tinta que cobran vida. Su sonrisa aprendida esconde un corazón que aún despierta.',
      burden: 'Te enseñaron a no sentir. En la Hoja, tu sonrisa parece falsa y tus ojos no tienen nombre. Nadie sabe qué hay debajo.',
      jutsu: [
        { name: 'León de Tinta', type: 'projectile', cost: 17, color: '#5d5d6e', desc: 'Una bestia dibujada que salta al enemigo.' },
        { name: 'Bestia Super', type: 'dash', cost: 22, color: '#7a7a8c', desc: 'Una criatura de tinta te impulsa en embestida.' }
      ],
      ultimate: { name: 'Dibujo Infinito · Dragón', color: '#9b9bbd', desc: 'El pincel dibuja un dragón que lo devora todo.' },
      art: { skin: '#f4d2ba', hair: '#1d1d24', hair2: '#0d0d12', style: 'short', eye: '#22222a', outfit: '#22222a', outfit2: '#111116', trim: '#d6d6dc', band: '#1c2b4a', accessory: 'midriff' }
    },
    {
      id: 'yamato', name: 'Yamato', short: 'Yamato', villager: 'konoha', role: 'Ninja de Estilo Madera',
      title: 'El Bosque que Camina', portrait: 'assets/portraits/yamato.png',
      stats: { nin: 9, tai: 6, gen: 7, spd: 6, def: 8 }, element: 'Madera',
      quote: 'Respira. La madera crece con calma... y te atrapa.',
      bio: 'Portador de las células de Hashirama. Su estilo Madera puede levantar fortalezas y encarcelar a un jinchūriki.',
      burden: 'Un experimento de Orochimaru con la cara de un extraño. La Hoja te dio un nombre, pero a veces no sabes cuál es el tuyo.',
      jutsu: [
        { name: 'Prisión de Madera', type: 'field', cost: 20, color: '#7a9a4e', desc: 'Raíces que atrapan a los enemigos en el área.' },
        { name: 'Lanza de Madera', type: 'projectile', cost: 16, color: '#5e7a39', desc: 'Una estaca de madera endurecida.' }
      ],
      ultimate: { name: 'Casa de Madera · Bosque', color: '#9ab86a', desc: 'Un bosque entero nace de tus manos.' },
      art: { skin: '#efc8a4', hair: '#4a3526', hair2: '#2c1f16', style: 'spiky', eye: '#3d3026', outfit: '#3b4a5a', outfit2: '#222c36', trim: '#c8d0d8', band: '#1c2b4a', accessory: 'plate' }
    },
    {
      id: 'jiraiya', name: 'Jiraiya', short: 'Jiraiya', villager: 'konoha', role: 'Sannin Legendario',
      title: 'El Sabio de los Siete Sapos', portrait: 'assets/portraits/jiraiya.png',
      stats: { nin: 9, tai: 7, gen: 7, spd: 7, def: 8 }, element: 'Fuego',
      quote: 'Un ninja no se mide por cómo vive, sino por cómo muere... ¡pero yo pienso vivir mucho!',
      bio: 'Escritor, pervertido y uno de los tres Sannin. Fue maestro de Minato y de Naruto, y el hombre que descubrió el secreto de Pain.',
      burden: 'El alumno que nunca pudo salvar a su amigo. Cada risa tuya es una armadura contra la culpa de no haber vuelto a tiempo.',
      jutsu: [
        { name: 'Rasengan Gigante', type: 'dash', cost: 24, color: '#5ab8ff', desc: 'Una esfera de chakra del tamaño de un puño de titán.' },
        { name: 'Sapo Invocado', type: 'nova', cost: 25, color: '#e07a3a', desc: 'Un sapo gigante cae sobre el campo.' }
      ],
      ultimate: { name: 'Modo Sabio · Rasengan Ultra', color: '#ff9d3d', desc: 'El chakra natural fluye y el mundo se tiñe de naranja.' },
      art: { skin: '#f0c7a0', hair: '#d8dde2', hair2: '#a0a7b0', style: 'mane', eye: '#3b3b44', outfit: '#b23a35', outfit2: '#6b2a28', trim: '#e8d8b8', band: '#1c2b4a', accessory: 'scroll' }
    },
    {
      id: 'tsunade', name: 'Tsunade', short: 'Tsunade', villager: 'konoha', role: 'Quinta Hokage',
      title: 'La Sannin de la Curación', portrait: 'assets/portraits/tsunade.png',
      stats: { nin: 9, tai: 8, gen: 6, spd: 6, def: 8 }, element: 'Chakra',
      quote: 'El título de Hokage no se lleva en la frente. Se lleva en el corazón.',
      bio: 'Nieta de Hashirama y la mejor médica ninja del mundo. Su fuerza puede partir montañas; su corazón, cargar con una aldea.',
      burden: 'Perdiste a tu hermano y al hombre que amabas. El juego y la bebida fueron tu refugio... hasta que alguien te recordó lo que significa proteger.',
      jutsu: [
        { name: 'Palma Curativa', type: 'heal', cost: 26, color: '#72f0b3', desc: 'Regenera tus heridas con chakra médico.' },
        { name: 'Puño de la Montaña', type: 'nova', cost: 23, color: '#ffb36b', desc: 'Un golpe que agrieta el suelo entero.' }
      ],
      ultimate: { name: 'Byakugō · Fuerza de una Diosa', color: '#ff7ba0', desc: 'La marca se libera y tu fuerza rompe el cielo.' },
      art: { skin: '#f6d2b4', hair: '#e8d27a', hair2: '#b9a34a', style: 'twintails', eye: '#a67c45', outfit: '#4d7a5a', outfit2: '#2c4a36', trim: '#e8cf7a', band: '#1c2b4a', accessory: 'diamond' }
    },
    {
      id: 'killerbee', name: 'Killer Bee', short: 'Bee', villager: 'kumo', role: 'Jinchūriki del Hachibi',
      title: 'El Ocho Colas Rapero', portrait: 'assets/portraits/killerbee.png',
      stats: { nin: 9, tai: 8, gen: 4, spd: 8, def: 9 }, element: 'Rayo',
      quote: 'Yo soy el Bee, el que nunca dice quizá. ¡Ocho colas, mi flow no tiene final!',
      bio: 'El jinchūriki del Gyūki y rapero de día. Su control sobre el Hachibi es perfecto, y sus espadas de siete filos no perdonan.',
      burden: 'El pueblo te temía por la bestia. Aprendiste a convertir el dolor en rimas y a sonreír aunque todos te señalaran.',
      jutsu: [
        { name: 'Lariat de Acero', type: 'dash', cost: 22, color: '#ffe45c', desc: 'Un golpe con la potencia de un rayo.' },
        { name: 'Bijuudama', type: 'projectile', cost: 27, color: '#9f6bff', desc: 'Una esfera de chakra de bestia con cola.' }
      ],
      ultimate: { name: 'Hachibi · Ocho Colas', color: '#b07bff', desc: 'El Gyūki ruge y el campo se vuelve un cráter.' },
      art: { skin: '#8a5a3a', hair: '#f2ead8', hair2: '#c9c0aa', style: 'short', eye: '#3a2a20', outfit: '#d9d3c4', outfit2: '#3a3a40', trim: '#e0433e', band: '#1c2b4a', accessory: 'sunglasses' }
    },
    {
      id: 'minato', name: 'Minato Namikaze', short: 'Minato', villager: 'konoha', role: 'Cuarto Hokage',
      title: 'El Relámpago Amarillo de la Hoja', portrait: 'assets/portraits/minato.png',
      stats: { nin: 10, tai: 7, gen: 5, spd: 10, def: 7 }, element: 'Rayo',
      quote: 'El verdadero valor no está en no caer, sino en levantarse por los demás.',
      bio: 'El Cuarto Hokage, el ninja más rápido de su era. Su Hiraishin cambió el curso de la Tercera Guerra Mundial.',
      burden: 'El héroe que selló al Kyūbi dentro de su hijo recién nacido. Nadie te enseña cómo ser padre cuando tu destino ya está escrito.',
      jutsu: [
        { name: 'Hiraishin · Nivel 2', type: 'dash', cost: 22, color: '#ffe45c', desc: 'Te teletransportas tras el enemigo y cortas.' },
        { name: 'Rasengan', type: 'projectile', cost: 18, color: '#5ab8ff', desc: 'La esfera de chakra que creaste.' }
      ],
      ultimate: { name: 'Dios del Trueno Volador', color: '#ffe066', desc: 'Mil kunais marcados. Un solo instante.' },
      art: { skin: '#f2c9a6', hair: '#f2d65c', hair2: '#c9a83a', style: 'spiky', eye: '#3f6fb5', outfit: '#e8e2d2', outfit2: '#2b3a5a', trim: '#d64535', band: '#1c2b4a', accessory: 'coat' }
    }
  ];

  const CHAR_MAP = Object.fromEntries(CHARACTERS.map(function (c) { return [c.id, c]; }));

  /* ---------- Enemigos / jefes ---------- */
  const ENEMIES = {
    bandido: { name: 'Bandido', tier: 'minion', hp: 70, atk: 7, speed: 120, color: '#7a5a42', hair: '#2a2118', range: 46, kind: 'melee' },
    ronin: { name: 'Rōnin', tier: 'minion', hp: 95, atk: 9, speed: 135, color: '#5b4a3a', hair: '#241e18', range: 52, kind: 'melee' },
    ninja_oto: { name: 'Ninja de Oto', tier: 'minion', hp: 110, atk: 11, speed: 150, color: '#4b3a5a', hair: '#1b1622', range: 150, kind: 'ranged', proj: '#c46bff' },
    ninja_iwa: { name: 'Ninja de Iwa', tier: 'minion', hp: 120, atk: 12, speed: 130, color: '#7a6248', hair: '#332a20', range: 54, kind: 'melee' },
    ninja_kiri: { name: 'Ninja de Kiri', tier: 'minion', hp: 105, atk: 11, speed: 145, color: '#3a5a66', hair: '#1c2a33', range: 50, kind: 'melee' },
    akatsuki: { name: 'Akatsuki', tier: 'minion', hp: 140, atk: 14, speed: 155, color: '#23232a', hair: '#121218', range: 160, kind: 'ranged', proj: '#ff5c5c' },
    marioneta: { name: 'Marioneta', tier: 'minion', hp: 90, atk: 13, speed: 100, color: '#9a7448', hair: '#5e4327', range: 180, kind: 'ranged', proj: '#d9b36a' },
    zetsu: { name: 'Zetsu Blanco', tier: 'minion', hp: 100, atk: 10, speed: 140, color: '#d8ded8', hair: '#6a7a6a', range: 48, kind: 'melee' },
    mizuki: { name: 'Mizuki', tier: 'boss', hp: 420, atk: 10, speed: 140, color: '#4b4a56', hair: '#c9c9d4', range: 62, kind: 'boss', portrait: '', art: { skin: '#e8c4a0', hair: '#c9c9d4', style: 'short', outfit: '#3b3a48', outfit2: '#22222a', band: '#1c2b4a' } },
    zabuza: { name: 'Zabuza Momochi', tier: 'boss', hp: 700, atk: 17, speed: 155, color: '#3b5560', hair: '#1c252b', range: 70, kind: 'boss', portrait: 'assets/portraits/zabuza.png', art: { skin: '#d8b394', hair: '#1c252b', style: 'short', outfit: '#3b5560', outfit2: '#1e2a30', band: '#7a2a2a', accessory: 'mask' } },
    haku: { name: 'Haku', tier: 'boss', hp: 560, atk: 15, speed: 175, color: '#c9e2ec', hair: '#20232c', range: 190, kind: 'boss', portrait: 'assets/portraits/haku.png', art: { skin: '#f2d4bd', hair: '#20232c', style: 'long', outfit: '#c9e2ec', outfit2: '#5d6f7a', band: '#7a2a2a' } },
    orochimaru: { name: 'Orochimaru', tier: 'boss', hp: 900, atk: 20, speed: 165, color: '#d8d2c8', hair: '#2a2630', range: 200, kind: 'boss', portrait: 'assets/portraits/orochimaru.png', art: { skin: '#f0e4d4', hair: '#2a2630', style: 'long', outfit: '#d8d2c8', outfit2: '#4b3a5a', band: '#1c2b4a', accessory: 'snake' } },
    gaara_boss: { name: 'Gaara', tier: 'boss', hp: 820, atk: 19, speed: 150, color: '#8c3d3a', hair: '#b23a33', range: 220, kind: 'boss', portrait: 'assets/portraits/gaara.png', art: { skin: '#f0ddc8', hair: '#b23a33', style: 'short', outfit: '#8c3d3a', outfit2: '#3b2428', band: '#1c2b4a', accessory: 'gaara' } },
    kabuto: { name: 'Kabuto Yakushi', tier: 'boss', hp: 760, atk: 18, speed: 165, color: '#5a5a66', hair: '#c9c9c9', range: 190, kind: 'boss', portrait: 'assets/portraits/kabuto.png', art: { skin: '#f0d0b0', hair: '#c9c9c9', style: 'ponytail', outfit: '#5a5a66', outfit2: '#2a2a33', band: '#1c2b4a', accessory: 'glasses' } },
    aoi: { name: 'Aoi Rokushō', tier: 'boss', hp: 620, atk: 16, speed: 160, color: '#3a5a6a', hair: '#202a30', range: 120, kind: 'boss', portrait: '', art: { skin: '#e8c4a0', hair: '#202a30', style: 'short', outfit: '#3a5a6a', outfit2: '#1c2a33', band: '#1c2b4a' } },
    sasuke_boss: { name: 'Sasuke Uchiha', tier: 'boss', hp: 980, atk: 22, speed: 190, color: '#2b3550', hair: '#252a38', range: 120, kind: 'boss', portrait: 'assets/portraits/sasuke.png', art: { skin: '#f1c6a0', hair: '#252a38', style: 'duck', outfit: '#2b3550', outfit2: '#151a26', band: '#1c2b4a' } },
    raiga: { name: 'Raiga Kurosuki', tier: 'boss', hp: 700, atk: 17, speed: 155, color: '#3b3b4a', hair: '#20202a', range: 150, kind: 'boss', portrait: '', art: { skin: '#dfc0a0', hair: '#20202a', style: 'short', outfit: '#3b3b4a', outfit2: '#1c1c26', band: '#1c2b4a' } },
    ido: { name: 'Ido', tier: 'boss', hp: 800, atk: 18, speed: 170, color: '#2a2233', hair: '#0e0c12', range: 200, kind: 'boss', portrait: '', art: { skin: '#d8c4d0', hair: '#0e0c12', style: 'long', outfit: '#2a2233', outfit2: '#110d18', band: '#1c2b4a' } },
    menma: { name: 'Menma', tier: 'boss', hp: 480, atk: 13, speed: 150, color: '#5a6a4a', hair: '#3a2a1a', range: 70, kind: 'boss', portrait: '', art: { skin: '#e8c4a0', hair: '#3a2a1a', style: 'spiky', outfit: '#5a6a4a', outfit2: '#2a3324', band: '#1c2b4a' } },
    sora: { name: 'Sora', tier: 'boss', hp: 680, atk: 17, speed: 165, color: '#5a4a3a', hair: '#2a2018', range: 130, kind: 'boss', portrait: '', art: { skin: '#e8c4a0', hair: '#2a2018', style: 'spiky', outfit: '#5a4a3a', outfit2: '#2a2018', band: '#1c2b4a' } },
    sasori: { name: 'Sasori', tier: 'boss', hp: 1100, atk: 24, speed: 160, color: '#7a3a3a', hair: '#a83a33', range: 210, kind: 'boss', portrait: 'assets/portraits/sasori.png', art: { skin: '#e8c4a0', hair: '#a83a33', style: 'short', outfit: '#7a3a3a', outfit2: '#2a1a1a', band: '#1c2b4a', accessory: 'puppet' } },
    hidan: { name: 'Hidan', tier: 'boss', hp: 1050, atk: 25, speed: 150, color: '#2a2a33', hair: '#d8d8de', range: 90, kind: 'boss', portrait: 'assets/portraits/hidan.png', art: { skin: '#d8b8a0', hair: '#d8d8de', style: 'short', outfit: '#2a2a33', outfit2: '#111116', band: '#1c2b4a', accessory: 'scythe' } },
    kakuzu: { name: 'Kakuzu', tier: 'boss', hp: 1150, atk: 24, speed: 150, color: '#3a3a2a', hair: '#20201a', range: 220, kind: 'boss', portrait: 'assets/portraits/kakuzu.png', art: { skin: '#8a6a4a', hair: '#20201a', style: 'short', outfit: '#3a3a2a', outfit2: '#1a1a14', band: '#1c2b4a', accessory: 'stitches' } },
    guren: { name: 'Guren', tier: 'boss', hp: 980, atk: 21, speed: 165, color: '#4a6a8a', hair: '#3a5a8a', range: 200, kind: 'boss', portrait: '', art: { skin: '#f0d0b8', hair: '#3a5a8a', style: 'long', outfit: '#4a6a8a', outfit2: '#1c2a3a', band: '#1c2b4a' } },
    itachi: { name: 'Itachi Uchiha', tier: 'boss', hp: 1500, atk: 30, speed: 185, color: '#2a2a38', hair: '#17171f', range: 230, kind: 'boss', portrait: 'assets/portraits/itachi.png', art: { skin: '#f0cbb0', hair: '#17171f', style: 'ponytail', outfit: '#2a2a38', outfit2: '#111118', band: '#1c2b4a', accessory: 'sharingan' } },
    pain: { name: 'Pain', tier: 'boss', hp: 1800, atk: 32, speed: 175, color: '#2a2a33', hair: '#c96a3a', range: 250, kind: 'boss', portrait: 'assets/portraits/pain.png', art: { skin: '#e8d0c0', hair: '#c96a3a', style: 'spiky', outfit: '#2a2a33', outfit2: '#111116', band: '#1c2b4a', accessory: 'rinnegan' } },
    danzo: { name: 'Danzō Shimura', tier: 'boss', hp: 1350, atk: 27, speed: 155, color: '#3a3a33', hair: '#20201a', range: 210, kind: 'boss', portrait: 'assets/portraits/danzo.png', art: { skin: '#d8c0a8', hair: '#20201a', style: 'short', outfit: '#3a3a33', outfit2: '#1a1a14', band: '#1c2b4a', accessory: 'bandage' } },
    deidara: { name: 'Deidara', tier: 'boss', hp: 1250, atk: 26, speed: 180, color: '#2a2a33', hair: '#e8d27a', range: 260, kind: 'boss', portrait: 'assets/portraits/deidara.png', art: { skin: '#f0c9a8', hair: '#e8d27a', style: 'ponytail', outfit: '#2a2a33', outfit2: '#111116', band: '#1c2b4a', accessory: 'scope' } },
    kisame: { name: 'Kisame Hoshigaki', tier: 'boss', hp: 1450, atk: 29, speed: 165, color: '#3a5a7a', hair: '#2a4a6a', range: 150, kind: 'boss', portrait: 'assets/portraits/kisame.png', art: { skin: '#6a8aa0', hair: '#2a4a6a', style: 'shark', outfit: '#2a2a33', outfit2: '#111116', band: '#1c2b4a', accessory: 'samehada' } },
    konan: { name: 'Konan', tier: 'boss', hp: 1200, atk: 25, speed: 170, color: '#2a2a33', hair: '#5a6aa8', range: 230, kind: 'boss', portrait: 'assets/portraits/konan.png', art: { skin: '#f0d0c0', hair: '#5a6aa8', style: 'bob', outfit: '#2a2a33', outfit2: '#111116', band: '#1c2b4a', accessory: 'paper' } },
    madara: { name: 'Madara Uchiha', tier: 'boss', hp: 2200, atk: 38, speed: 190, color: '#3a2a2a', hair: '#141418', range: 260, kind: 'boss', portrait: 'assets/portraits/madara.png', art: { skin: '#e8c4a0', hair: '#141418', style: 'mane', outfit: '#3a2a2a', outfit2: '#181014', band: '#1c2b4a', accessory: 'sharingan' } },
    obito: { name: 'Obito Uchiha', tier: 'boss', hp: 1900, atk: 33, speed: 195, color: '#2a2a38', hair: '#17171f', range: 210, kind: 'boss', portrait: 'assets/portraits/obito.png', art: { skin: '#e8c4a0', hair: '#17171f', style: 'spiky', outfit: '#2a2a38', outfit2: '#111118', band: '#1c2b4a', accessory: 'mask' } },
    kaguya: { name: 'Kaguya Ōtsutsuki', tier: 'boss', hp: 2600, atk: 42, speed: 180, color: '#e8e0e8', hair: '#e8e8f0', range: 280, kind: 'boss', portrait: 'assets/portraits/kaguya.png', art: { skin: '#f4e4dc', hair: '#e8e8f0', style: 'long', outfit: '#e8e0e8', outfit2: '#8a7a9a', band: '#1c2b4a', accessory: 'horns' } },
    indra: { name: 'Indra Ōtsutsuki', tier: 'boss', hp: 1600, atk: 31, speed: 190, color: '#3a3a5a', hair: '#20202a', range: 220, kind: 'boss', portrait: '', art: { skin: '#f0d0b8', hair: '#20202a', style: 'mane', outfit: '#3a3a5a', outfit2: '#181824', band: '#1c2b4a', accessory: 'sharingan' } },
    furido: { name: 'Furido', tier: 'boss', hp: 900, atk: 20, speed: 160, color: '#4a3a2a', hair: '#2a2018', range: 200, kind: 'boss', portrait: '', art: { skin: '#e8c4a0', hair: '#2a2018', style: 'spiky', outfit: '#4a3a2a', outfit2: '#221a12', band: '#1c2b4a' } },
    utakata: { name: 'Utakata', tier: 'boss', hp: 1050, atk: 23, speed: 170, color: '#5a6a7a', hair: '#2a2a33', range: 210, kind: 'boss', portrait: '', art: { skin: '#f0d0b8', hair: '#2a2a33', style: 'bob', outfit: '#5a6a7a', outfit2: '#2a333a', band: '#1c2b4a' } },
    kimimaro: { name: 'Kimimaro', tier: 'boss', hp: 860, atk: 19, speed: 165, color: '#d8d2c8', hair: '#c9c9c9', range: 110, kind: 'boss', portrait: '', art: { skin: '#e8d8cc', hair: '#c9c9c9', style: 'long', outfit: '#d8d2c8', outfit2: '#5a4a4a', band: '#1c2b4a' } }
  };

  /* ---------- Jefes de arcos ---------- */
  const ARCS_P1 = [
    { id: 'p1-01', name: 'Prólogo', eps: '1–5', rank: 'D', boss: 'mizuki', arena: 'academia', summary: 'Naruto se gradúa por fin, pero Mizuki le revela el secreto del Kyūbi. Iruka elige protegerlo y nace el primer lazo verdadero del futuro Hokage.', chars: ['Iruka', 'Mizuki', 'Hiruzen'] },
    { id: 'p1-02', name: 'País de las Olas', eps: '6–19', rank: 'C', boss: 'zabuza', arena: 'puente', summary: 'El Equipo 7 escolta a Tazuna. Zabuza y Haku muestran que el mundo ninja no es blanco ni negro: la primera gran lección sobre el dolor.', chars: ['Zabuza', 'Haku', 'Kakashi'] },
    { id: 'p1-03', name: 'Exámenes Chūnin', eps: '20–67', rank: 'C', boss: 'gaara_boss', arena: 'arena', summary: 'La Hoja reúne a sus jóvenes promesas. Entre pruebas escritas, el Bosque de la Muerte y combates, Orochimaru coloca su marca en Sasuke.', chars: ['Orochimaru', 'Gaara', 'Neji'] },
    { id: 'p1-04', name: 'Destrucción de la Hoja', eps: '68–80', rank: 'B', boss: 'orochimaru', arena: 'arena', summary: 'Orochimaru ataca Konoha durante la final. El Tercer Hokage entrega su alma para detenerlo y la aldea llora a su líder.', chars: ['Hiruzen', 'Orochimaru', 'Gaara'] },
    { id: 'p1-05', name: 'Búsqueda de Tsunade', eps: '81–100', rank: 'B', boss: 'kabuto', arena: 'bosque', summary: 'Jiraiya y Naruto buscan a la Sannin perdida. Tsunade debe vencer su miedo a la sangre y decidir si vuelve a cargar con la Hoja.', chars: ['Jiraiya', 'Tsunade', 'Kabuto'] },
    { id: 'p1-06', name: 'Escolta al País del Té', eps: '102–106', rank: 'C', boss: 'aoi', arena: 'camino', summary: 'Una carrera entre equipos revela la espada Raijin y a un ninja dispuesto a vender su aldea por poder.', chars: ['Aoi', 'Idate', 'Naruto'] },
    { id: 'p1-07', name: 'Rescate de Sasuke', eps: '107–135', rank: 'A', boss: 'sasuke_boss', arena: 'valle', summary: 'Sasuke abandona la Hoja por Orochimaru. Cada miembro del equipo arriesga la vida para traerlo de vuelta al final del Valle del Fin.', chars: ['Sasuke', 'Naruto', 'Shikamaru'] },
    { id: 'p1-08', name: 'Investigación del País de los Arrozales', eps: '136–141', rank: 'C', boss: 'kabuto', arena: 'bosque', summary: 'Jiraiya y Naruto investigan los experimentos secretos de Orochimaru en un país devastado por la guerra.', chars: ['Jiraiya', 'Kabuto', 'Orochimaru'] },
    { id: 'p1-09', name: 'Rastreo de Mizuki', eps: '142–147', rank: 'C', boss: 'mizuki', arena: 'prision', summary: 'Mizuki escapa de prisión y busca el pergamino prohibido. Iruka enfrenta al culpable de su propio pasado.', chars: ['Iruka', 'Mizuki', 'Naruto'] },
    { id: 'p1-10', name: 'Búsqueda del Bikōchū', eps: '148–151', rank: 'D', boss: 'bandido', arena: 'bosque', summary: 'El Equipo 8 busca un insecto legendario para curar a Sasuke. Una misión de rastreo que se convierte en una prueba de confianza.', chars: ['Hinata', 'Shino', 'Kiba'] },
    { id: 'p1-11', name: 'Familia Kurosuki', eps: '152–157', rank: 'C', boss: 'raiga', arena: 'montaña', summary: 'Rock Lee y Naruto llegan a un pueblo oprimido por el clan Kurosuki y su líder, el esquizofrénico Raiga de los Siete Espadachines.', chars: ['Rock Lee', 'Raiga', 'Naruto'] },
    { id: 'p1-12', name: 'Captura de Gosunkugi', eps: '159–160', rank: 'D', boss: 'bandido', arena: 'camino', summary: 'Un ladrón torpe se cruza con el Equipo 7. Lo que parece una misión sencilla esconde una lección sobre la codicia.', chars: ['Naruto', 'Sakura', 'Gosunkugi'] },
    { id: 'p1-13', name: 'Exterminio del Guerrero Maldito', eps: '162–167', rank: 'C', boss: 'sora', arena: 'templo', summary: 'Un guerrero fantasma aterroriza una aldea. El equipo descubre que la maldición nace de un juramento roto y un chakra oscuro.', chars: ['Naruto', 'Neji', 'Sora'] },
    { id: 'p1-14', name: 'Captura del Kaima', eps: '169–173', rank: 'C', boss: 'kimimaro', arena: 'bosque', summary: 'Una bestia de chakra devora almas en el bosque. La investigación revela un sello antiguo y a un ninja que se niega a morir.', chars: ['Naruto', 'Ino', 'Kiba'] },
    { id: 'p1-15', name: 'Expedición del Oro Enterrado', eps: '175–176', rank: 'D', boss: 'bandido', arena: 'ruinas', summary: 'Un mapa del tesoro lleva al equipo a unas ruinas llenas de trampas. El verdadero premio no es el oro.', chars: ['Naruto', 'Chōji', 'Kiba'] },
    { id: 'p1-16', name: 'Guardia Estelar', eps: '178–183', rank: 'C', boss: 'furido', arena: 'montaña', summary: 'Naruto es asignado a proteger a la aldea de la Estrella y a un joven que teme no heredar el poder de su familia.', chars: ['Naruto', 'Sumaru', 'Furido'] },
    { id: 'p1-17', name: 'Escolta de Vendedores', eps: '187–191', rank: 'D', boss: 'bandido', arena: 'camino', summary: 'Una caravana atraviesa territorio hostil. Lo que parecía un trabajo aburrido se vuelve una lección sobre la avaricia y la amistad.', chars: ['Naruto', 'Hinata', 'Chōji'] },
    { id: 'p1-18', name: 'Tercera Gran Bestia', eps: '195–196', rank: 'C', boss: 'kimimaro', arena: 'bosque', summary: 'Una criatura gigantesca despierta en las montañas. El equipo debe detenerla antes de que llegue a la Hoja.', chars: ['Jiraiya', 'Naruto', 'Tsunade'] },
    { id: 'p1-19', name: 'Planes de Recaptura de la Hoja', eps: '197–201', rank: 'C', boss: 'mizuki', arena: 'ruinas', summary: 'Un grupo de desertores planea atacar Konoha desde las sombras. La respuesta de la Hoja es rápida y silenciosa.', chars: ['Shikamaru', 'Naruto', 'Kakashi'] },
    { id: 'p1-20', name: 'Rescate de Yakumo', eps: '203–207', rank: 'B', boss: 'ido', arena: 'mansión', summary: 'Una heredera con un poder sellado vive atrapada entre la realidad y su propia pesadilla. Kurenai se juega todo por salvarla.', chars: ['Kurenai', 'Yakumo', 'Ido'] },
    { id: 'p1-21', name: 'Escolta de Gantetsu', eps: '209–212', rank: 'C', boss: 'bandido', arena: 'prision', summary: 'Un convoy escolta a un criminal arrepentido. En el camino, Naruto descubre que el perdón también se puede elegir.', chars: ['Naruto', 'Shino', 'Gantetsu'] },
    { id: 'p1-22', name: 'Búsqueda de la Memoria de Menma', eps: '213–215', rank: 'D', boss: 'menma', arena: 'camino', summary: 'Un niño amnésico busca su pasado. La memoria, como el corazón, a veces decide mentir para protegerse.', chars: ['Naruto', 'Menma', 'Sakura'] },
    { id: 'p1-23', name: 'Apoyo a Sunagakure', eps: '216–220', rank: 'B', boss: 'sasori', arena: 'desierto', summary: 'La Hoja envía refuerzos a la Arena. Una amenaza enterrada bajo la duna pone a prueba la nueva alianza entre aldeas.', chars: ['Gaara', 'Temari', 'Naruto'] },
    { id: 'p1-24', name: 'Historias Paralelas de la Hoja', eps: 'Extra', rank: 'D', boss: 'bandido', arena: 'hoja', summary: 'Pequeñas historias de la aldea: el día a día de los genin, sus familias y los lazos que sostienen la Voluntad del Fuego.', chars: ['Konohamaru', 'Iruka', 'Naruto'] }
  ];

  const ARCS_P2 = [
    { id: 'p2-01', name: 'Rescate del Kazekage', eps: '1–32', rank: 'B', boss: 'sasori', arena: 'desierto', summary: 'Gaara es capturado por Akatsuki. Naruto y Sakura se unen a la vieja Chiyo para rescatarlo antes del ritual de extracción del Shukaku.', chars: ['Gaara', 'Sasori', 'Sakura'] },
    { id: 'p2-02', name: 'Reencuentro en el Puente Tenchi', eps: '33–53', rank: 'A', boss: 'orochimaru', arena: 'puente', summary: 'Sai y Yamato entran al equipo. El reencuentro con Sasuke en el Puente Tenchi confirma que el camino de vuelta a casa ya no es sencillo.', chars: ['Sasuke', 'Orochimaru', 'Sai'] },
    { id: 'p2-03', name: 'Los Doce Guardianes Ninja', eps: '54–71', rank: 'B', boss: 'furido', arena: 'templo', summary: 'Una organización atenta contra el País del Fuego usando a los antiguos guardianes del daimyō. Asuma se enfrenta a su pasado.', chars: ['Asuma', 'Naruto', 'Furido'] },
    { id: 'p2-04', name: 'Los Inmortales Hidan y Kakuzu', eps: '72–88', rank: 'A', boss: 'hidan', arena: 'bosque', summary: 'Akatsuki caza al jinchūriki de Dos Colas. Shikamaru planea la venganza perfecta contra Hidan, y Naruto estrena el Rasenshuriken.', chars: ['Shikamaru', 'Hidan', 'Kakuzu'] },
    { id: 'p2-05', name: 'La Tortuga de Tres Colas', eps: '89–112', rank: 'B', boss: 'guren', arena: 'cueva', summary: 'Orochimaru y Guren buscan al jinchūriki de Tres Colas. Un cristal, una aldea pequeña y la pregunta de qué significa proteger a alguien.', chars: ['Guren', 'Yūkimaru', 'Naruto'] },
    { id: 'p2-06', name: 'Profecía y Venganza', eps: '113–143', rank: 'S', boss: 'itachi', arena: 'cueva', summary: 'Jiraiya muere frente a Pain. Sasuke enfrenta a Itachi en su batalla final, y la verdad del clan Uchiha cae como un trueno.', chars: ['Jiraiya', 'Pain', 'Itachi'] },
    { id: 'p2-07', name: 'Crónicas de Kakashi: El Chico del Campo de Batalla', eps: '119–120', rank: 'B', boss: 'ninja_iwa', arena: 'puente', summary: 'Kakashi, Obito y Rin en la Tercera Guerra. El día que Obito «murió» y el Sharingan cambió de dueño para siempre.', chars: ['Kakashi', 'Obito', 'Rin'] },
    { id: 'p2-08', name: 'El Pergamino Ninja de Jiraiya', eps: '127–128', rank: 'B', boss: 'pain', arena: 'hoja', summary: 'El origen del sueño de Jiraiya y el nacimiento del Pergamino Ninja. La historia de cómo un fracaso puede inspirar a un héroe.', chars: ['Jiraiya', 'Naruto', 'Nagato'] },
    { id: 'p2-09', name: 'La Babosa de Seis Colas', eps: '144–151', rank: 'A', boss: 'utakata', arena: 'bosque', summary: 'Naruto busca a Utakata, jinchūriki de Seis Colas, antes que Akatsuki. Una historia sobre maestros, discípulos y despedidas.', chars: ['Naruto', 'Utakata', 'Hotaru'] },
    { id: 'p2-10', name: 'Dos Salvadores', eps: '152–175', rank: 'S', boss: 'pain', arena: 'hoja', summary: 'Pain destruye Konoha. Naruto regresa como Sabio y enfrenta al dios que quiere enseñar dolor al mundo. La Hoja renace.', chars: ['Pain', 'Naruto', 'Hinata'] },
    { id: 'p2-11', name: 'La Búsqueda del Legado del Cuarto', eps: '170–171', rank: 'C', boss: 'bandido', arena: 'ruinas', summary: 'Una aventura por el legado de Minato lleva a Naruto a unas ruinas llenas de trampas y viejos recuerdos de su padre.', chars: ['Naruto', 'Minato', 'Tenten'] },
    { id: 'p2-12', name: 'El Lugar de Konoha', eps: '176–196', rank: 'B', boss: 'orochimaru', arena: 'hoja', summary: 'Relatos del pasado de la Hoja: la fundación, los clanes y las heridas que nunca cerraron. La aldea también tiene memoria.', chars: ['Hiruzen', 'Danzo', 'Orochimaru'] },
    { id: 'p2-13', name: 'La Reunión de los Cinco Kage', eps: '197–221', rank: 'A', boss: 'danzo', arena: 'cumbre', summary: 'Sasuke ataca la Cumbre de los Kage. Danzō revela el Sharingan de Shisui y la verdad sobre la masacre Uchiha.', chars: ['Sasuke', 'Danzo', 'Itachi'] },
    { id: 'p2-14', name: 'Paraíso en un Barco', eps: '222–242', rank: 'C', boss: 'bandido', arena: 'mar', summary: 'Naruto, Yamato y un grupo de ninjas viajan en barco mientras se preparan para la guerra. El paraíso también puede ser una jaula.', chars: ['Naruto', 'Yamato', 'Aoba'] },
    { id: 'p2-15', name: 'Dominio del Kyūbi', eps: '243–275', rank: 'S', boss: 'kisame', arena: 'isla', summary: 'Naruto aprende a dominar al Kyūbi en la Isla Tortuga. Bee se convierte en su maestro y el mundo se prepara para la guerra.', chars: ['Naruto', 'Killer Bee', 'Kisame'] },
    { id: 'p2-16', name: 'Los Siete Espadachines', eps: '276–289', rank: 'A', boss: 'zabuza', arena: 'mar', summary: 'Kabuto resucita a los Siete Espadachines de la Niebla. Kakashi y los suyos enfrentan a los muertos que conocieron en vida.', chars: ['Kakashi', 'Zabuza', 'Haku'] },
    { id: 'p2-17', name: 'Poder', eps: '290–295', rank: 'A', boss: 'hidan', arena: 'ruinas', summary: 'Un arco de relleno sobre el precio del poder y los ecos de Akatsuki en una aldea olvidada por los mapas.', chars: ['Naruto', 'Sakura', 'Hidan'] },
    { id: 'p2-18', name: 'Guerra: Asaltantes del Más Allá', eps: '296–320', rank: 'A', boss: 'deidara', arena: 'guerra', summary: 'Comienza la Cuarta Gran Guerra Ninja. Los ejércitos de Zetsu y las reencarnaciones de Akatsuki avanzan sobre los cinco países.', chars: ['Gaara', 'Deidara', 'Naruto'] },
    { id: 'p2-19', name: 'Sasuke e Itachi', eps: '321–348', rank: 'S', boss: 'kabuto', arena: 'guerra', summary: 'Sasuke se une a Itachi para detener a Kabuto y el Edo Tensei. La verdad de un clan y el peso de un apellido.', chars: ['Sasuke', 'Itachi', 'Kabuto'] },
    { id: 'p2-20', name: 'Kakashi: Sombra de los ANBU', eps: '349–361', rank: 'B', boss: 'danzo', arena: 'hoja', summary: 'El pasado de Kakashi en los ANBU, el peso de la Fundación y la oscuridad que casi lo consume antes de ser sensei.', chars: ['Kakashi', 'Danzo', 'Yamato'] },
    { id: 'p2-21', name: 'El Regreso del Equipo 7', eps: '362–372', rank: 'S', boss: 'obito', arena: 'guerra', summary: 'Naruto, Sasuke y Sakura vuelven a luchar juntos. El Equipo 7 renace en medio de la guerra, frente al hombre que lo destruyó todo.', chars: ['Naruto', 'Sasuke', 'Sakura'] },
    { id: 'p2-22', name: 'Obito Uchiha', eps: '373–393', rank: 'S', boss: 'obito', arena: 'guerra', summary: 'La máscara cae. Obito, el niño que soñaba con ser Hokage, revela su plan y su dolor, y Naruto se niega a rendirse.', chars: ['Obito', 'Kakashi', 'Naruto'] },
    { id: 'p2-23', name: 'La Invocación del Tsukuyomi Infinito', eps: '414–431', rank: 'S', boss: 'madara', arena: 'guerra', summary: 'Madara lanza el Tsukuyomi Infinito. El mundo se cubre de capullos y los sueños perfectos se convierten en la última prisión.', chars: ['Madara', 'Obito', 'Naruto'] },
    { id: 'p2-24', name: 'Jiraiya Shinobi Handbook', eps: '432–450', rank: 'B', boss: 'orochimaru', arena: 'templo', summary: 'El ficticio «Libro Ninja de Jiraiya» reimagina la historia de Naruto. Un cuento dentro del cuento, con héroes y finales alternativos.', chars: ['Jiraiya', 'Naruto', 'Orochimaru'] },
    { id: 'p2-25', name: 'Itachi Shinden: Libro de la Luz y la Oscuridad', eps: '451–458', rank: 'B', boss: 'danzo', arena: 'hoja', summary: 'La juventud de Itachi: el prodigio que amaba a su hermano y eligió mancharse las manos para evitar una guerra.', chars: ['Itachi', 'Shisui', 'Danzo'] },
    { id: 'p2-26', name: 'El Origen del Ninshū: Indra y Ashura', eps: '459–468', rank: 'A', boss: 'indra', arena: 'templo', summary: 'La historia de los dos hijos del Sabio de los Seis Caminos. El origen del conflicto que separa a Naruto y Sasuke.', chars: ['Hagoromo', 'Indra', 'Ashura'] },
    { id: 'p2-27', name: 'Naruto y Sasuke', eps: '470–479', rank: 'S', boss: 'sasuke_boss', arena: 'valle', summary: 'La batalla final en el Valle del Fin. Dos hermanos por elección, dos caminos irreconciliables y una respuesta que cambia el mundo.', chars: ['Naruto', 'Sasuke', 'Sakura'] },
    { id: 'p2-28', name: 'Días Nostálgicos', eps: '480–483', rank: 'D', boss: 'bandido', arena: 'hoja', summary: 'La paz llega a la Hoja. Los recuerdos, las risas y las pequeñas misiones llenan el tiempo que la guerra robó.', chars: ['Naruto', 'Hinata', 'Konohamaru'] },
    { id: 'p2-29', name: 'Sasuke Shinden: Libro del Amanecer', eps: '484–488', rank: 'B', boss: 'zetsu', arena: 'bosque', summary: 'Sasuke investiga una amenaza residual y descubre que la paz exige vigilar las sombras. Su viaje continúa lejos de casa.', chars: ['Sasuke', 'Sakura', 'Naruto'] },
    { id: 'p2-30', name: 'Shikamaru Hiden: Una Nube en la Oscuridad', eps: '489–493', rank: 'B', boss: 'zetsu', arena: 'hoja', summary: 'Shikamaru se infiltra en una aldea cerrada para desmantelar una conspiración que amenaza la paz recién ganada.', chars: ['Shikamaru', 'Temari', 'Naruto'] },
    { id: 'p2-31', name: 'Konoha Hiden: El Día Perfecto para una Boda', eps: '494–500', rank: 'D', boss: 'bandido', arena: 'hoja', summary: 'La boda de Naruto y Hinata. Toda la Hoja colabora en secreto para regalarles el día perfecto. El final de una era y el inicio de otra.', chars: ['Naruto', 'Hinata', 'Iruka'] },
    { id: 'p2-32', name: 'En los Pasos de Naruto: Caminos de Amigos', eps: '394–413', rank: 'C', boss: 'zetsu', arena: 'hoja', summary: 'Antología de relleno sobre los compañeros de la Hoja: sus sueños, sus familias y el legado de la nueva generación.', chars: ['Naruto', 'Hinata', 'Kiba'] }
  ];

  /* ---------- Tablero de misiones ---------- */
  const MISSIONS = [
    { id: 'm-d1', rank: 'D', title: 'Atrapa a Tora', giver: 'Señora Shijimi', icon: 'cat', desc: 'El gato más escurridizo del País del Fuego volvió a escapar. Encuéntralo en el mercado antes del atardecer.', type: 'collect', goal: 3, reward: { ryo: 320, xp: 90 }, location: 'Mercado de Konoha', arena: 'hoja' },
    { id: 'm-d2', rank: 'D', title: 'Malas hierbas ninja', giver: 'Iruka Umino', icon: 'leaf', desc: 'El campo de entrenamiento está cubierto de maleza. Arranca los tres brotes de chakra antes de la clase.', type: 'collect', goal: 3, reward: { ryo: 250, xp: 80 }, location: 'Campo de entrenamiento', arena: 'hoja' },
    { id: 'm-d3', rank: 'D', title: 'Entregas de Ichiraku', giver: 'Teuchi', icon: 'ramen', desc: 'Tres clientes esperan su ramen. Llévalo caliente y no tropees por el camino.', type: 'collect', goal: 3, reward: { ryo: 300, xp: 85 }, location: 'Aldea de la Hoja', arena: 'hoja' },
    { id: 'm-d4', rank: 'D', title: 'El niño perdido', giver: 'Mujer del mercado', icon: 'talk', desc: 'Un niño se separó de su madre cerca de la puerta principal. Búscalo y devuélvelo sano y salvo.', type: 'battle', enemies: ['bandido'], reward: { ryo: 360, xp: 110 }, location: 'Puerta de Konoha', arena: 'hoja' },
    { id: 'm-c1', rank: 'C', title: 'Bandidos en el camino', giver: 'Hiruzen Sarutobi', icon: 'blade', desc: 'Una banda asalta a los comerciantes en el camino este. Elimina la amenaza.', type: 'battle', enemies: ['bandido', 'bandido', 'ronin'], reward: { ryo: 700, xp: 280 }, location: 'Camino del País del Fuego', arena: 'camino' },
    { id: 'm-c2', rank: 'C', title: 'El puente de la frontera', giver: 'Kakashi Hatake', icon: 'bridge', desc: 'Mercenarios de la Niebla bloquean el puente. Escolta a los aldeanos y despeja el paso.', type: 'battle', enemies: ['ninja_kiri', 'ninja_kiri'], reward: { ryo: 760, xp: 300 }, location: 'Puente de la frontera', arena: 'puente' },
    { id: 'm-c3', rank: 'C', title: 'Mensaje cifrado', giver: 'Shikamaru Nara', icon: 'scroll', desc: 'Tres pergaminos con información enemiga se perdieron en el bosque. Recupéralos antes de que Akatsuki los encuentre.', type: 'collect', goal: 3, enemies: ['ninja_oto'], reward: { ryo: 820, xp: 320 }, location: 'Bosque de Konoha', arena: 'bosque' },
    { id: 'm-c4', rank: 'C', title: 'El demonio de la niebla', giver: 'Anciano del puerto', icon: 'mist', desc: 'Un espadachín conocido como Zabuza ha vuelto a las costas. Protégé a los pescadores.', type: 'boss', boss: 'zabuza', enemies: ['ninja_kiri', 'ninja_kiri'], reward: { ryo: 1100, xp: 450 }, location: 'Costa de las Olas', arena: 'mar' },
    { id: 'm-b1', rank: 'B', title: 'La guarida de las serpientes', giver: 'Jiraiya', icon: 'snake', desc: 'Orochimaru dejó atrás un laboratorio con experimentos vivos. Destrúyelo y libera a los prisioneros.', type: 'boss', boss: 'kabuto', enemies: ['ninja_oto', 'ninja_oto'], reward: { ryo: 1500, xp: 750 }, location: 'Guarida de Oto', arena: 'cueva' },
    { id: 'm-b2', rank: 'B', title: 'Ruinas del Valle del Fin', giver: 'Tsunade', icon: 'statue', desc: 'Restos de la marca de Orochimaru laten con chakra oscuro. Investiga y elimina la fuente.', type: 'boss', boss: 'sasuke_boss', enemies: ['ninja_oto'], reward: { ryo: 1650, xp: 800 }, location: 'Valle del Fin', arena: 'valle' },
    { id: 'm-b3', rank: 'B', title: 'La aldea de la Estrella', giver: 'Sumaru', icon: 'star', desc: 'El poder de la estrella corrompe a los ninjas de la aldea. Detén al impostor que la utiliza.', type: 'boss', boss: 'furido', enemies: ['ninja_iwa', 'ninja_iwa'], reward: { ryo: 1700, xp: 820 }, location: 'Aldea de la Estrella', arena: 'montaña' },
    { id: 'm-b4', rank: 'B', title: 'El precio de un cristal', giver: 'Guren', icon: 'crystal', desc: 'Una fortaleza de cristal emerge del lago. Alguien está usando a un niño para despertar a una bestia.', type: 'boss', boss: 'guren', enemies: ['ninja_oto'], reward: { ryo: 1800, xp: 900 }, location: 'Lago de las Tres Colas', arena: 'cueva' },
    { id: 'm-a1', rank: 'A', title: 'Arte es una explosión', giver: 'Kakashi Hatake', icon: 'clay', desc: 'Deidara ha colocado bombas de arcilla alrededor de la aldea. Desactívalas derrotándolo.', type: 'boss', boss: 'deidara', enemies: ['akatsuki'], reward: { ryo: 2800, xp: 1450 }, location: 'Afueras de Konoha', arena: 'ruinas' },
    { id: 'm-a2', rank: 'A', title: 'El titiritero de la arena', giver: 'Gaara', icon: 'puppet', desc: 'Sasori secuestró a un emisario de Suna. Recupera el cuerpo y detén la marioneta.', type: 'boss', boss: 'sasori', enemies: ['marioneta', 'marioneta'], reward: { ryo: 3000, xp: 1550 }, location: 'Cañón de Suna', arena: 'desierto' },
    { id: 'm-a3', rank: 'A', title: 'El inmortal', giver: 'Shikamaru Nara', icon: 'scythe', desc: 'Hidan atacó un templo del Fuego. Este es el plan: aislarlo y enterrarlo. No falles.', type: 'boss', boss: 'hidan', enemies: ['akatsuki'], reward: { ryo: 3200, xp: 1650 }, location: 'Templo del Fuego', arena: 'templo' },
    { id: 'm-a4', rank: 'A', title: 'Corazones de la cascada', giver: 'Tsunade', icon: 'hearts', desc: 'Kakuzu ha tomado el control de una aldea minera. Sus corazones lo hacen casi inmortal.', type: 'boss', boss: 'kakuzu', enemies: ['akatsuki'], reward: { ryo: 3400, xp: 1750 }, location: 'Cañón de la Cascada', arena: 'cañon' },
    { id: 'm-s1', rank: 'S', title: 'El dios del trueno', giver: 'Hiruzen Sarutobi', icon: 'storm', desc: 'Pain se dirige a la Hoja. Detenlo antes de que el Shinra Tensei reduzca la aldea a escombros.', type: 'boss', boss: 'pain', enemies: ['akatsuki', 'akatsuki'], reward: { ryo: 5200, xp: 2900 }, location: 'Konoha', arena: 'hoja' },
    { id: 'm-s2', rank: 'S', title: 'El ojo de la luna', giver: 'Kakashi Hatake', icon: 'moon', desc: 'Itachi ha activado un genjutsu sobre la aldea. Rompe el Tsukuyomi derrotándolo.', type: 'boss', boss: 'itachi', enemies: ['akatsuki'], reward: { ryo: 5600, xp: 3100 }, location: 'Bosque de la Hoja', arena: 'bosque' },
    { id: 'm-s3', rank: 'S', title: 'El alba escarlata', giver: 'Tsunade', icon: 'war', desc: 'Madara Uchiha ha regresado. La Cuarta Guerra depende de que lo detengas aquí y ahora.', type: 'boss', boss: 'madara', enemies: ['zetsu', 'zetsu'], reward: { ryo: 6000, xp: 3400 }, location: 'Campo de batalla', arena: 'guerra' },
    { id: 'm-s4', rank: 'S', title: 'La diosa conejo', giver: 'Hagoromo', icon: 'moon', desc: 'Kaguya despierta y el mundo se convierte en su jardín. Sella a la madre de todo chakra.', type: 'boss', boss: 'kaguya', enemies: ['zetsu'], reward: { ryo: 7000, xp: 4000 }, location: 'Dimensión de Kaguya', arena: 'kaguya' }
  ];

  /* ---------- Escenas de apertura ---------- */
  const BURDENS = {
    naruto: [
      { scene: 'village', title: 'Konoha, hace doce años', text: 'La noche en que el Kyūbi atacó, el cielo se tiñó de rojo. Un hombre selló a la bestia dentro de un recién nacido.' },
      { scene: 'street', speaker: 'Aldeana', portrait: 'iruka', text: '«No te acerques a ese niño, cariño. Es él. El que trajo la desgracia a la aldea.»', mood: 'cold' },
      { scene: 'academy', speaker: 'Niño', text: '«¿Por qué no tienes padres, Naruto? ¿Naciste de un monstruo?»', mood: 'rain' },
      { scene: 'academy', speaker: 'Iruka Umino', portrait: 'iruka', text: '¡Basta! Naruto es un alumno de esta academia. Y es mi alumno. El que se ría de él, se las verá conmigo.', mood: 'warm' },
      { scene: 'academy', speaker: 'Iruka Umino', portrait: 'iruka', text: 'No necesitas demostrarle nada a nadie. Solo tienes que encontrar aquello que quieres proteger. Ese será tu nindō.' },
      { scene: 'monument', title: 'Hoy', text: 'En la Academia Ninja de Konoha comienza una nueva generación. Y tú, por primera vez, decides quién quieres ser.' }
    ],
    sasuke: [
      { scene: 'village', title: 'Konoha, hace siete años', text: 'El clan Uchiha fue exterminado en una sola noche. Solo quedó un niño, mirando el cielo desde el tejado de una casa vacía.' },
      { scene: 'street', speaker: 'Aldeano', text: '«Ese es el pequeño Uchiha. Dicen que su propio hermano mató a toda su familia. ¿Y si vuelve a pasar?»', mood: 'cold' },
      { scene: 'academy', speaker: 'Niño', text: '«¿Por qué no lloraste en el funeral, Sasuke? ¿Qué clase de monstruo eres?»', mood: 'rain' },
      { scene: 'academy', speaker: 'Iruka Umino', portrait: 'iruka', text: 'El dolor no se mide en lágrimas. No tienes que cargar con el apellido de tu clan a solas, Sasuke. Estás en la Hoja.', mood: 'warm' },
      { scene: 'academy', speaker: 'Iruka Umino', portrait: 'iruka', text: 'La venganza no devuelve a los muertos. Pero tú puedes elegir qué hacer con el tiempo que te queda. Elige bien.' },
      { scene: 'monument', title: 'Hoy', text: 'En la Academia Ninja de Konoha comienza una nueva generación. El Sharingan despierta, y contigo, una pregunta: ¿qué es más importante, el clan o el camino?' }
    ],
    sakura: [
      { scene: 'village', title: 'Konoha, infancia', text: 'En una familia sin clan, una niña con una frente ancha aprendía a esconderse detrás de su pelo.' },
      { scene: 'street', speaker: 'Niña', text: '«Sakura, ¿por qué llevas el pelo largo? ¿Para tapar tu frente? Mi mamá dice que parece una bola de billar.»', mood: 'cold' },
      { scene: 'academy', speaker: 'Niño', text: '«Las kunoichis no sirven para pelear. Tú solo estás aquí porque eres lista. Cuando haya problemas, alguien te salvará.»', mood: 'rain' },
      { scene: 'academy', speaker: 'Iruka Umino', portrait: 'iruka', text: 'Inteligencia y corazón también son armas, Sakura. La kunoichi más fuerte no es la que golpea más duro, sino la que decide quedarse cuando todos huyen.', mood: 'warm' },
      { scene: 'academy', speaker: 'Iruka Umino', portrait: 'iruka', text: 'No necesitas ser la sombra de nadie. Tú puedes ser la luz que cure a este equipo.' },
      { scene: 'monument', title: 'Hoy', text: 'En la Academia Ninja de Konoha comienza una nueva generación. Y la chica de la frente ancha está a punto de descubrir de qué está hecha.' }
    ],
    hinata: [
      { scene: 'village', title: 'Konoha, casa Hyūga', text: 'El clan más antiguo de la Hoja medía el valor de sus hijos en golpes. La heredera no daba uno solo.' },
      { scene: 'street', speaker: 'Hiashi Hyūga', text: '«Eres la heredera del Byakugan y ni siquiera puedes mirar a los ojos a tu padre. Eres una decepción para este clan.»', mood: 'cold' },
      { scene: 'academy', speaker: 'Niño', text: '«¿Esa es la Hyūga? Se sonroja hasta cuando le hablan. Suspirar por un chico no te hará más fuerte.»', mood: 'rain' },
      { scene: 'academy', speaker: 'Iruka Umino', portrait: 'iruka', text: 'Hinata. La amabilidad no es debilidad. Y el valor no siempre grita: a veces tiembla y aun así da un paso adelante. Eso es coraje.', mood: 'warm' },
      { scene: 'academy', speaker: 'Iruka Umino', portrait: 'iruka', text: 'No tienes que cambiar quién eres para ser fuerte. Solo tienes que dejar de pedir permiso para serlo.' },
      { scene: 'monument', title: 'Hoy', text: 'En la Academia Ninja de Konoha comienza una nueva generación. El Byakugan de Hinata empieza a ver un destino distinto.' }
    ],
    gaara: [
      { scene: 'village', title: 'Sunagakure, hace años', text: 'Un niño nació con arena en lugar de sangre. Su padre ordenó su muerte antes de que aprendiera a caminar.' },
      { scene: 'street', speaker: 'Habitante de Suna', text: '«No lo mires a los ojos. Ese niño no es humano. Es el demonio que vive bajo la duna.»', mood: 'cold' },
      { scene: 'academy', speaker: 'Niño', text: '«¿Por qué estás siempre solo, Gaara? Hasta tu hermano tiene miedo de jugar contigo.»', mood: 'rain' },
      { scene: 'academy', speaker: 'Iruka Umino', portrait: 'iruka', text: 'He venido desde la Hoja para acompañar a los genin de la Arena. Escúchame: el amor no es una resta. No tienes que merecerlo.', mood: 'warm' },
      { scene: 'academy', speaker: 'Iruka Umino', portrait: 'iruka', text: 'Algún día alguien te mirará y verá a Gaara, no a la bestia. Hasta entonces, no dejes que la arena decida por ti.' },
      { scene: 'monument', title: 'Hoy', text: 'En la Academia Ninja de Konoha comienza una nueva generación. Y el niño que nunca pudo dormir está a punto de cerrar los ojos.' }
    ]
  };

  const DEFAULT_INTRO = [
    { scene: 'village', title: 'Konoha, la Aldea de la Hoja', text: 'Bajo el Monumento de los Hokage, una nueva generación de ninjas se prepara para escribir su historia.' },
    { scene: 'street', speaker: 'Aldeano', text: '«Dicen que ese estudiante no pertenece aquí. Su clan, su pasado... nada encaja en la Hoja.»', mood: 'cold' },
    { scene: 'academy', speaker: 'Niño', text: '«¿Por qué te esfuerzas tanto? Nunca vas a ser como los demás. Es patético.»', mood: 'rain' },
    { scene: 'academy', speaker: 'Iruka Umino', portrait: 'iruka', text: 'Escúchame bien. La aldea no se construye con gente perfecta. Se construye con personas que eligen levantarse cada día.', mood: 'warm' },
    { scene: 'academy', speaker: 'Iruka Umino', portrait: 'iruka', text: 'No importa lo que digan los demás. Tu historia empieza hoy, y solo tú puedes decidir cómo termina.' },
    { scene: 'monument', title: 'Hoy', text: 'En la Academia Ninja de Konoha comienza una nueva generación. La Voluntad del Fuego espera en tus manos.' }
  ];

  const NPC_DIALOGUES = {
    iruka: [
      '¡Llegas tarde otra vez! ...Pero al menos llegaste. Eso ya es algo.',
      'La Academia no enseña a ganar. Enseña a levantarse. Y tú tienes más práctica que nadie.',
      'Cuando termines tus misiones, vuelve. Siempre hay un plato de ramen esperando... digo, una lección.'
    ],
    hokage: [
      'La Voluntad del Fuego no es una llama que se hereda. Es una decisión que se toma cada día.',
      'El tablero de misiones está abierto. Empieza por las D. Hasta los Hokage empezaron recogiendo basura.',
      'En Konoha, cada persona es una hoja de este árbol. Tu deber es proteger a las demás.'
    ],
    kakashi: [
      'Llegas tarde... aunque yo llegué antes. No importa. Vamos a entrenar.',
      'Un ninja que solo sabe pelear es una herramienta. Uno que sabe cuándo no hacerlo es un shinobi.',
      'El Campo de Entrenamiento 3 está detrás de la Academia. Si quieres sparring, ya sabes.'
    ],
    sakura: [
      '¡Hola! Si necesitas curarte, el hospital de Konoha está en el centro. Puedo enseñarte técnicas médicas.',
      'La fuerza no lo es todo, pero ayuda muchísimo cuando un taladro gigante viene hacia ti.',
      'Naruto y Sasuke... bueno. A veces los extraño. A veces quiero golpearlos.'
    ],
    sasuke: [
      'No tengo tiempo para charlas.',
      'Si quieres ser fuerte, deja de esperar que alguien venga a salvarte.',
      'La aldea te da un techo. A mí me dio una misión. No son lo mismo.'
    ],
    shikamaru: [
      'Qué pereza... pero si hay una misión de rango B, necesito pensar. Y pensar da sueño.',
      'La mayoría de los ninjas mueren por correr. Un buen estratega gana antes de desenvainar.',
      '¿Escuchaste? El tablero de misiones tiene nuevos trabajos. Ve a la Torre.'
    ],
    hinata: [
      '¡Ah! N-no me asustes así... Perdón. Hola.',
      'Cuando entrenas, ¿también sientes que tu chakra tiembla? A veces el mío parece tener miedo.',
      'Algún día quiero mirar a los ojos a mi padre y decirle: «esto es lo que elegí».'
    ],
    rocklee: [
      '¡La juventud arde hoy más que nunca! ¿Quieres entrenar conmigo?',
      'Un genio y un fracaso pueden llegar al mismo lugar. La diferencia es cuántas veces se levantan.',
      '¡Cien vueltas alrededor de la aldea! ¡Ese es el desayuno!'
    ],
    teuchi: [
      '¡Bienvenido a Ichiraku! El ramen del día está en oferta... bueno, siempre está en oferta para ti.',
      'Un plato caliente arregla muchas cosas. No todas, pero muchas.',
      'Tu ramen. Con extra de naruto, como le gusta a cierto cliente ruidoso.'
    ],
    gate: [
      'La puerta está cerrada por orden del Hokage. Las rutas exteriores aún no están cartografiadas.',
      'Si vas a viajar fuera, necesitarás un permiso. Vuelve cuando la Hoja expanda el mapa.'
    ],
    hokage_office: [
      'Acércate. Hay misiones que solo tú puedes aceptar.',
      'El rango no te hace fuerte. Las decisiones que tomas con ese rango, sí.'
    ]
  };

  /* ---------- Creación de personaje (estilo Xenoverse) ---------- */
  const CLANS = [
    { id: 'uzumaki', name: 'Uzumaki', color: '#e2643d', symbol: 'whirl', desc: 'Energía vital desbordante y reservas de chakra enormes. El clan del Remolino nunca se rinde.', bonus: { nin: 1, tai: 0, gen: 0, spd: 0, def: 0, hp: 24, chakra: 18 }, hair: '#c9462f', accessory: 'whiskers', perk: 'Vitalidad +24 · Chakra +18' },
    { id: 'uchiha', name: 'Uchiha', color: '#b23a33', symbol: 'leaf', desc: 'Ninjutsu de fuego y genjutsu con el Sharingan. El orgullo de un clan que lo perdió todo.', bonus: { nin: 2, tai: 0, gen: 1, spd: 0, def: 0, hp: 0, chakra: 10 }, hair: '#252a38', accessory: 'sharingan', perk: 'Ninjutsu +2 · Genjutsu +1' },
    { id: 'hyuga', name: 'Hyūga', color: '#d8cfc0', symbol: 'leaf', desc: 'El Byakugan ve el flujo de chakra. Sus puños cierran los puntos vitales del enemigo.', bonus: { nin: 0, tai: 2, gen: 1, spd: 1, def: 0, hp: 8, chakra: 6 }, hair: '#2e2a38', accessory: 'byakugan', perk: 'Taijutsu +2 · Genjutsu +1' },
    { id: 'nara', name: 'Nara', color: '#4f6b45', symbol: 'leaf', desc: 'Estrategas natos. La sombra es su arma y la paciencia su mejor técnica.', bonus: { nin: 0, tai: 0, gen: 2, spd: 0, def: 1, hp: 6, chakra: 12 }, hair: '#2a2118', accessory: 'none', perk: 'Genjutsu +2 · Defensa +1' },
    { id: 'akimichi', name: 'Akimichi', color: '#c9793a', symbol: 'leaf', desc: 'La expansión corporal convierte el cuerpo en una montaña. Un muro que protege a los suyos.', bonus: { nin: 0, tai: 1, gen: 0, spd: 0, def: 3, hp: 36, chakra: 0 }, hair: '#8a4a2a', accessory: 'none', perk: 'Defensa +3 · Vitalidad +36' },
    { id: 'inuzuka', name: 'Inuzuka', color: '#7a5a42', symbol: 'leaf', desc: 'Instinto, olfato y velocidad. Luchan en manada y nunca dejan atrás a un compañero.', bonus: { nin: 0, tai: 2, gen: 0, spd: 2, def: 0, hp: 8, chakra: 0 }, hair: '#3a2a1a', accessory: 'fangs', perk: 'Taijutsu +2 · Velocidad +2' },
    { id: 'aburame', name: 'Aburame', color: '#5a6a4a', symbol: 'leaf', desc: 'Su cuerpo es un panal de kikaichū. La información y el veneno viajan con ellos.', bonus: { nin: 2, tai: 0, gen: 1, spd: 0, def: 0, hp: 0, chakra: 14 }, hair: '#1f2420', accessory: 'glasses', perk: 'Ninjutsu +2 · Chakra +14' },
    { id: 'yamanaka', name: 'Yamanaka', color: '#d8b04a', symbol: 'leaf', desc: 'La mente es el campo de batalla. Controlan recuerdos, emociones y voluntades.', bonus: { nin: 1, tai: 0, gen: 3, spd: 0, def: 0, hp: 0, chakra: 16 }, hair: '#e8d27a', accessory: 'none', perk: 'Genjutsu +3 · Chakra +16' },
    { id: 'sarutobi', name: 'Sarutobi', color: '#4a6a8a', symbol: 'leaf', desc: 'La Voluntad del Fuego en su forma más pura. Equilibrio, técnica y corazón.', bonus: { nin: 1, tai: 1, gen: 1, spd: 1, def: 1, hp: 12, chakra: 8 }, hair: '#2a2a33', accessory: 'none', perk: 'Todas las estadísticas +1' },
    { id: 'hatake', name: 'Hatake', color: '#c9d2da', symbol: 'leaf', desc: 'Talentos precoces y una velocidad imposible de seguir. La espada blanca de la Hoja.', bonus: { nin: 1, tai: 1, gen: 0, spd: 3, def: 0, hp: 0, chakra: 8 }, hair: '#c9c9d4', accessory: 'mask', perk: 'Velocidad +3 · Ninjutsu +1' },
    { id: 'civil', name: 'Sin clan', color: '#7a8a9a', symbol: 'leaf', desc: 'Naciste en una familia de civiles. No heredaste un don: te lo vas a ganar tú.', bonus: { nin: 0, tai: 0, gen: 0, spd: 0, def: 0, hp: 0, chakra: 0 }, hair: '#3b2a22', accessory: 'none', perk: '+12% de EXP y +10% de ryō' }
  ];

  const FIGHT_STYLES = [
    { id: 'balance', name: 'Equilibrado', desc: 'Un shinobi completo. Toda técnica tiene su momento.', bonus: { nin: 1, tai: 1, gen: 0, spd: 0, def: 1 } },
    { id: 'ninjutsu', name: 'Ninjutsu', desc: 'Domina el combate a distancia y las técnicas de elemento.', bonus: { nin: 3, tai: 0, gen: 1, spd: 0, def: 0 } },
    { id: 'taijutsu', name: 'Taijutsu', desc: 'Cuerpo a cuerpo puro. Más vida y golpes demoledores.', bonus: { nin: 0, tai: 3, gen: 0, spd: 1, def: 1 } },
    { id: 'genjutsu', name: 'Genjutsu', desc: 'Controla la mente del rival y castiga sus errores.', bonus: { nin: 1, tai: 0, gen: 3, spd: 0, def: 0 } },
    { id: 'speed', name: 'Velocidad', desc: 'Golpea primero, desaparece después. Esquiva es ganar.', bonus: { nin: 0, tai: 1, gen: 0, spd: 3, def: 0 } }
  ];

  const HAIR_STYLES = [
    { id: 'spiky', name: 'Esponjado' }, { id: 'duck', name: 'Patito' }, { id: 'long', name: 'Largo' },
    { id: 'ponytail', name: 'Coleta' }, { id: 'twintails', name: 'Dos colas' }, { id: 'buns', name: 'Moños' },
    { id: 'bowl', name: 'Tazón' }, { id: 'silver', name: 'Plateado' }, { id: 'mane', name: 'Melena' },
    { id: 'short', name: 'Corto' }, { id: 'bob', name: 'Bob' }, { id: 'hood', name: 'Capucha' }, { id: 'shark', name: 'Tiburón' }
  ];

  const ACCESSORIES = [
    { id: 'none', name: 'Ninguno' }, { id: 'whiskers', name: 'Bigotes' }, { id: 'fangs', name: 'Colmillos' },
    { id: 'sharingan', name: 'Sharingan' }, { id: 'byakugan', name: 'Byakugan' }, { id: 'glasses', name: 'Gafas' },
    { id: 'mask', name: 'Máscara' }, { id: 'paint', name: 'Pintura' }, { id: 'diamond', name: 'Diamante' },
    { id: 'brows', name: 'Cejas' }, { id: 'bandage', name: 'Vendas' }
  ];

  const HEIGHTS = [
    { id: 'baja', name: 'Baja', scale: 0.92 },
    { id: 'media', name: 'Media', scale: 1 },
    { id: 'alta', name: 'Alta', scale: 1.08 }
  ];

  const BODIES = [
    { id: 'slim', name: 'Delgado' }, { id: 'normal', name: 'Atlético' }, { id: 'broad', name: 'Robusto' }
  ];

  const NOSES = ['Pequeña', 'Recta', 'Ancha'];
  const MOUTHS = ['Sonrisa', 'Neutra', 'Seria'];
  const EARS = ['Normales', 'Pequeñas'];
  const PUPILS = ['Redondas', 'Rasgadas', 'Anillo'];

  const SKIN_COLORS = ['#fbe3cf', '#f4c9a3', '#e8b98c', '#d29a6a', '#b97a4e', '#8a5a3b', '#6b4429'];
  const HAIR_COLORS = ['#f2c53d', '#e8d27a', '#c9462f', '#b23a33', '#3b2a22', '#252a38', '#17171f', '#c9c9d4', '#5a6aa8', '#4f8a6a', '#e8e8f0', '#7a4b8c'];
  const EYE_COLORS = ['#2f6fd0', '#4aa8ff', '#3f8a4a', '#8a6a3a', '#6a3a8a', '#c62e2e', '#d8d8de', '#2a2a33', '#c96a3a', '#3a8a8a'];
  const OUTFIT_COLORS = ['#f26a1b', '#d64535', '#2f6a4a', '#2b4a7a', '#6a3a8a', '#2a2a33', '#d8d2c8', '#c9b88a', '#3a7e8f', '#7a2a3a'];
  const OUTFIT2_COLORS = ['#1b1b22', '#151a26', '#22222a', '#2a2118', '#0d0d12', '#3a3a44', '#5a4a3a', '#1c2a33'];
  const BAND_COLORS = ['#1c2b4a', '#3a1c2a', '#1b3d33', '#2a2118', '#0d0d12', '#e9e9e9', '#7a2a2a'];

  const CUSTOM_BASE_ART = {
    skin: '#f4c9a3', hair: '#3b2a22', hair2: '#241a14', style: 'spiky', eye: '#2f6fd0',
    outfit: '#f26a1b', outfit2: '#1b1b22', trim: '#ffcf5c', band: '#1c2b4a',
    accessory: 'none', villageSymbol: 'leaf', build: 'normal', nose: 0, mouth: 0, ears: 0, pupils: 0,
    height: 'media', body: 'normal'
  };

  const LEVEL_XP = function (level) { return 120 + level * 110; };
  const MAX_LEVEL = 30;
  const RANK_LEVEL = { genin: 1, chunin: 4, jonin: 8, anbu: 12, kage: 18 };

  const WORLD_FACTS = [
    'Konoha fue fundada por Hashirama Senju y Madara Uchiha sobre la aldea de la Hoja.',
    'El Monumento de los Hokage talla el rostro de cada líder de la aldea en la roca.',
    'Ichiraku Ramen es el restaurante favorito de Naruto. Su ramen favorito es el miso con cerdo.',
    'La Academia Ninja enseña la Voluntad del Fuego antes que cualquier técnica.',
    'El Bosque de la Muerte es el escenario de la segunda prueba del Examen Chūnin.',
    'Un ninja de rango D gana lo suficiente para un plato de ramen. Apenas.',
    'El Escuadrón 7 estaba formado por Naruto, Sasuke, Sakura y Kakashi Hatake.',
    'La Hoja tiene diez clanes fundadores, entre ellos los Uchiha, Hyūga y Nara.',
    'El Hokage no es el ninja más fuerte: es el que está dispuesto a morir por todos los demás.',
    'Las bandanas de Konoha llevan el símbolo de la hoja. Un rasguño significa renuncia a la aldea.'
  ];

  const TRAINING_TIPS = [
    'El dash (Shift) te da invulnerabilidad breve. Úsalo para atravesar ataques.',
    'Las jutsu consumen chakra. El chakra se regenera con el tiempo y al golpear.',
    'La barra naranja es tu Nivel de Caos. Se llena al atacar y al recibir daño.',
    'Los jefes telegrafían sus golpes con círculos rojos en el suelo.',
    'Los combos de 3 golpes hacen más daño que golpear sin ritmo.',
    'En MODO HISTORIA desbloqueas recompensas únicas por cada arco.'
  ];

  const CREDITS = 'NARUTO: SHINOBI LEGACY es un fan game no oficial creado como homenaje a la obra de Masashi Kishimoto. Los personajes y el universo pertenecen a sus respectivos autores. Retratos de personajes obtenidos de Naruto Wiki (Fandom) con fines ilustrativos. Sprites, escenarios y música generados proceduralmente para este proyecto. Modelos 3D de Sketchfab: Naruto y Sasuke por ronildo.facanha (CC BY 4.0); aldea de Konoha por kyrox (CC BY 4.0); Kakashi por Tigerar1 (Sketchfab Standard). Motor 3D: Three.js r128 (MIT).';

  window.GameData = {
    RANKS, SHINOBI_RANKS, VILLAGES, CHARACTERS, CHAR_MAP, ENEMIES,
    ARCS_P1, ARCS_P2, MISSIONS, BURDENS, DEFAULT_INTRO, NPC_DIALOGUES,
    CLANS, FIGHT_STYLES, HAIR_STYLES, ACCESSORIES, HEIGHTS, BODIES,
    NOSES, MOUTHS, EARS, PUPILS, SKIN_COLORS, HAIR_COLORS, EYE_COLORS,
    OUTFIT_COLORS, OUTFIT2_COLORS, BAND_COLORS, CUSTOM_BASE_ART,
    LEVEL_XP, MAX_LEVEL, RANK_LEVEL, WORLD_FACTS,
    TRAINING_TIPS, CREDITS
  };
})();
