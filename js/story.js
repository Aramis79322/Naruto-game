/* ============================================================
   NARUTO: SHINOBI LEGACY — Historias, arcos y misiones
   Genera prólogos, epílogos, gauntlets y recompensas para los
   56 arcos de Naruto + Shippuden y las misiones del tablero.
   ============================================================ */
(function () {
  'use strict';

  const D = window.GameData;

  const RANK_ORDER = ['D', 'C', 'B', 'A', 'S'];
  const RANK_LEVEL = { D: 1, C: 3, B: 6, A: 10, S: 15 };
  const RANK_MOBS = {
    D: ['bandido'],
    C: ['bandido', 'ronin', 'ninja_kiri'],
    B: ['ninja_oto', 'ninja_iwa', 'ninja_kiri', 'zetsu'],
    A: ['akatsuki', 'marioneta', 'zetsu', 'ninja_oto'],
    S: ['akatsuki', 'zetsu', 'marioneta']
  };
  const WAVE_COUNT = { D: 1, C: 2, B: 2, A: 3, S: 3 };

  const NAME_KEYS = {
    'iruka': 'iruka', 'iruka umino': 'iruka',
    'hiruzen': 'hiruzen', 'hokage': 'hiruzen', 'tercer hokage': 'hiruzen',
    'kakashi': 'kakashi', 'kakashi hatake': 'kakashi',
    'naruto': 'naruto', 'naruto uzumaki': 'naruto',
    'sasuke': 'sasuke', 'sasuke uchiha': 'sasuke',
    'sakura': 'sakura', 'sakura haruno': 'sakura',
    'hinata': 'hinata', 'hinata hyuga': 'hinata', 'hinata hyūga': 'hinata',
    'shikamaru': 'shikamaru', 'shikamaru nara': 'shikamaru',
    'rock lee': 'rocklee', 'rocklee': 'rocklee', 'lee': 'rocklee',
    'gaara': 'gaara', 'neji': 'neji', 'kiba': 'kiba', 'shino': 'shino',
    'ino': 'ino', 'choji': 'choji', 'chōji': 'choji', 'tenten': 'tenten',
    'temari': 'temari', 'kankuro': 'kankuro', 'kankurō': 'kankuro',
    'sai': 'sai', 'yamato': 'yamato', 'jiraiya': 'jiraiya', 'tsunade': 'tsunade',
    'killer bee': 'killerbee', 'minato': 'minato', 'kushina': 'kushina',
    'asuma': 'asuma', 'kurenai': 'kurenai', 'shizune': 'shizune',
    'konohamaru': 'konohamaru', 'teuchi': 'teuchi', 'mizuki': 'mizuki',
    'orochimaru': 'orochimaru', 'kabuto': 'kabuto', 'zabuza': 'zabuza',
    'haku': 'haku', 'itachi': 'itachi', 'pain': 'pain', 'nagato': 'nagato',
    'konan': 'konan', 'obito': 'obito', 'madara': 'madara', 'kaguya': 'kaguya',
    'sasori': 'sasori', 'deidara': 'deidara', 'hidan': 'hidan', 'kakuzu': 'kakuzu',
    'kisame': 'kisame', 'danzo': 'danzo', 'danzō': 'danzo', 'shisui': 'shisui',
    'sora': 'sora', 'raiga': 'raiga', 'furido': 'furido', 'guren': 'guren',
    'utakata': 'utakata', 'kimimaro': 'kimimaro', 'menma': 'menma',
    'aoi': 'aoi', 'ido': 'ido', 'indra': 'indra'
  };

  const CHAR_LINES = {
    naruto: ['No me importa cuántas veces caiga. Mientras pueda levantarme, la misión no ha terminado.', 'Si alguien necesita ayuda, no hay nada que pensar. ¡Vamos!', 'Algún día seré Hokage. ¡Y nadie va a reírse de eso!'],
    sasuke: ['No tengo tiempo para discursos. Dime dónde está el objetivo.', 'El poder no se pide prestado. Se arrebata.', 'Solo hay un camino. Y pienso recorrerlo hasta el final.'],
    sakura: ['Puedo curar heridas, pero no puedo devolver a los muertos. Por eso hay que pelear bien.', 'No soy la misma niña que se escondía detrás de su pelo.', 'Confía en mí. Esta vez no me quedo atrás.'],
    kakashi: ['Un ninja debe ver lo que está debajo de lo que está debajo. A veces, la respuesta está en el barro.', 'No llegar tarde no es una virtud. Llegar cuando importa, sí.', 'Proteger a los compañeros es la primera regla. Las demás pueden esperar.'],
    shikamaru: ['Qué pereza... pero ya que estamos, escucha el plan. Solo hay una forma de salir vivos.', 'La fuerza sin estrategia es solo ruido. Yo me encargo del ruido.', 'El tablero está en movimiento. Y nosotros movemos primero.'],
    hinata: ['N-no puedo dejar que te lastimen. Aunque tenga miedo... voy a luchar.', 'El Byakugan ve el chakra, pero también ve el corazón de quien tienes enfrente.', 'Un paso pequeño también es avanzar.'],
    rocklee: ['¡El esfuerzo vence al talento! ¡Hoy arde la juventud más que ayer!', 'Si no puedo usar ninjutsu, usaré todo lo demás. ¡Eso es mi nindō!', 'Ochenta vueltas a la aldea. ¡Calentamiento!'],
    gaara: ['La arena protege a quien yo decido proteger. Esa es mi elección.', 'Ya no necesito que nadie me quiera para existir. Pero sí necesito protegerlos.', 'El Kazekage soy yo. Y Suna no caerá.'],
    jiraiya: ['Un sabio no nace. Se cae, se levanta y escribe sobre ello.', 'El verdadero poder no está en destruir, sino en cambiar el corazón de la gente.', 'Cuando la paz llega, la vigilancia se duerme. Grave error.'],
    tsunade: ['Una Hokage no llora delante de sus ninjas. Pero puede romper una montaña si hace falta.', 'La sanación más difícil es la del miedo. Empieza por ti.', 'No subestimes a una Sannin con resaca.'],
    itachi: ['Cada elección deja una sombra. Cargar con ella es el precio de vivir.', 'La aldea no es un lugar. Es la gente que queda dentro de ti.', 'No mires lo que hice. Mira lo que intenté proteger.'],
    pain: ['El dolor es el único lenguaje que todas las aldeas entienden.', 'La paz sin sufrimiento es un sueño. Yo traigo la vigilia.', 'El mundo debe conocer el dolor de perder algo irremplazable.'],
    obito: ['El infierno no es un lugar. Es mirar el mundo sin poder cambiar nada.', 'El sueño de ser Hokage murió con Rin. Ahora solo queda el plan.', 'La esperanza es cruel. Por eso hay que apagarla.'],
    madara: ['Despierta. El mundo sigue siendo un juego de niños.', 'La guerra es la única escuela donde todos aprenden rápido.', 'La luna te mostrará el sueño que mereces.'],
    kaguya: ['Este jardín es mío. Todos los chakra volverán a mí.', 'No conocéis el dolor de una madre. No conocéis nada.', 'El mundo debe volver al silencio del origen.'],
    guren: ['Un cristal no siente. Pero puede atraparte para siempre.', 'Proteger a alguien débil no te hace débil. Tarde lo comprendí.'],
    utakata: ['No soy un arma. No soy un recipiente. Soy un hombre que se equivocó.', 'Un maestro no te enseña a ganar. Te enseña a elegir por qué luchar.'],
    killerbee: ['¡Oye, escucha! ¡El rap del jinchūriki! Dame un beat y te enseño a rugir.', 'El Hachibi y yo no somos dos. Somos un ritmo.', 'Solo hay una regla: si caes, vuelve a subir al escenario.'],
    kushina: ['No dejes que nadie te diga lo que puedes ser. Ni siquiera tú mismo.', 'La cadena más fuerte es la que eliges cargar por amor.'],
    minato: ['Un padre no siempre puede proteger. Pero puede dejarle a su hijo el valor para hacerlo.', 'La velocidad no sirve si no sabes hacia dónde correr.']
  };

  const BOSS_LINES = {
    mizuki: 'Ese niño es el Kyūbi. ¿Por qué lo proteges, Iruka? ¡El pueblo tiene razón en odiarlo!',
    zabuza: 'Tu camino ninja es un cuento. En el campo de batalla, los sueños solo sirven para hacerte tropezar.',
    haku: 'Cuando alguien te da un propósito, ese propósito es tu existencia. No me pidas que abandone a Zabuza.',
    orochimaru: 'La aldea es una jaula. Los fuerte no necesitan jaulas. ¿Qué serás tú, pajarito?',
    gaara_boss: 'Mi madre vive en la arena. Si quieres tocarla, tendrás que atravesar el desierto... y a mí.',
    kabuto: 'El conocimiento lo es todo. Yo conozco tus movimientos antes de que los pienses.',
    aoi: 'La espada Raijin eligió a alguien con poder. No a un idealista de la Hoja.',
    sasuke_boss: 'No me sigas. Mi camino y el tuyo se separaron en la nieve.',
    raiga: '¡La lluvia! ¡El trueno! ¡Todo es mío! ¿No lo oyes? ¡Mis espadas cantan!',
    ido: 'Esta mansión es mi cuerpo. El miedo de Yakumo es mi sangre. Bienvenido a la pesadilla.',
    sora: 'El chakra oscuro no se vence. Se hereda. Se soporta. Se convierte en espada.',
    furido: 'El pasado no se entierra. Vuelve a cobrar el precio de cada traición.',
    sasori: 'El arte verdadero es eterno. La carne es un shock pasajero. Yo soy permanente.',
    hidan: '¡No puedes matar a la muerte! ¡Solo haz que este ritual dure más!',
    kakuzu: 'Un corazón no es una emoción. Es una pieza de repuesto. Tengo cinco.',
    guren: 'El cristal es mi voluntad. Si lloro, te cortas. Si grito, te entierro.',
    itachi: 'No puedes derrotar al Sharingan con rabia. Mírame a los ojos.',
    pain: 'Todo el mundo tiene un dolor que lo define. Voy a enseñarte el mío.',
    danzo: 'La Hoja necesita un puño, no una sonrisa. Yo he sostenido el árbol desde las raíces.',
    deidara: '¡El arte es una explosión! ¡Una breve, brillante y devastadora explosión!',
    kisame: 'Tu chakra sabe a miedo. Samehada y yo nos quedamos con los restos.',
    konan: 'El amor también puede convertirse en papel cortante. No lo olvides.',
    madara: 'Bailasteis bien. Pero esto es el final del mundo que conocéis.',
    obito: 'No quiero un mundo donde los héroes mueran antes que sus promesas.',
    kaguya: 'El chakra que robasteis de mí será devuelto. El mundo volverá a ser uno.',
    indra: 'La fuerza es la única herencia verdadera. El resto es debilidad disfrazada de amor.',
    utakata: 'No te acerques. Todo el que lo hizo terminó maldito... o muerto.',
    kimimaro: 'Mi cuerpo es un arma. Y está temblando de alegría porque por fin tengo un objetivo.'
  };

  const MAJOR_INTROS = {
    'p1-01': function (arc, p) {
      return [
        title('academy', 'KONOHA · LA ACADEMIA NINJA', 'Prólogo', 'El secreto del Kyūbi'),
        line('academy', 'Iruka Umino', 'iruka', '¡Naruto! ¡Si vuelves a crear un clon de papel y a escribir tonterías, te quedas sin graduación! ...{name}, tú también. ¿Quién te pidió que lo ayudaras?', 'warm', p),
        line('academy', 'Mizuki', 'mizuki', 'Mira a ese niño. Lo llaman héroe, pero el pueblo sabe la verdad. El Kyūbi está dentro de él. Debería estar encerrado, no sentado en esta clase.', 'cold', p),
        line('academy', 'Iruka Umino', 'iruka', 'Mizuki, cierra la boca. Delante de mis alumnos no. Y si vuelves a hablar de su pasado, te expulso del cuerpo docente.', 'warm', p),
        line('academy', 'Iruka Umino', 'iruka', 'Has sido víctima de la envidia y de los rumores, {name}. Pero esta bandana no se regala: se gana. Demuéstrame que sabes qué es proteger algo.', 'warm', p)
      ];
    },
    'p1-02': function (arc, p) {
      return [
        title('puente', 'PAÍS DE LAS OLAS · EL PUENTE', 'Arco 02', 'El demonio de la niebla'),
        line('puente', 'Kakashi Hatake', 'kakashi', 'La niebla se cerró sobre el puente antes de que Tazuna terminara. Alguien está esperando. Y no es un ladrón cualquiera.', 'cold', p),
        line('puente', 'Zabuza Momochi', 'zabuza', 'Kakashi el de la Hoja... tu Sharingan no sirve si no puedes ver el agua que te rodea. Hoy el puente será tu tumba.', 'cold', p),
        line('puente', 'Haku', 'haku', 'No quiero matarte, {name}. Pero Zabuza-sama me salvó cuando nadie más lo hizo. Mi vida le pertenece.', 'rain', p),
        line('puente', 'Kakashi Hatake', 'kakashi', 'Un ninja que no conoce el dolor del otro es solo un asesino. Hoy aprenderás la diferencia entre fuerza y crueldad.', 'warm', p)
      ];
    },
    'p1-04': function (arc, p) {
      return [
        title('arena', 'KONOHA · EXAMEN CHŪNIN', 'Arco 04', 'La Hoja en llamas'),
        line('arena', 'Hiruzen Sarutobi', 'hiruzen', 'El examen ha terminado. Pero el chakra que siento no viene de los estudiantes. Todos a sus puestos. Konoha está bajo ataque.', 'war', p),
        line('arena', 'Orochimaru', 'orochimaru', 'Sensei... viejo maestro. Tantos años cuidando esta aldea para que un discípulo te entierre en ella. Qué poético.', 'cold', p),
        line('arena', 'Hiruzen Sarutobi', 'hiruzen', 'La Hoja no muere conmigo. Cada niño que ha pasado por estas aulas es una raíz. Tú no puedes arrancar todas.', 'warm', p),
        line('arena', 'Hiruzen Sarutobi', 'hiruzen', '{name}, he visto muchas generaciones. Tú también llevarás esta llama. Pero primero, sobrevive. ¡Vive!', 'warm', p)
      ];
    },
    'p1-07': function (arc, p) {
      return [
        title('valle', 'VALLE DEL FIN · ATARDECER', 'Arco 07', 'El último Uchiha'),
        line('valle', 'Shikamaru Nara', 'shikamaru', 'Sasuke se marchó. El equipo está roto, la aldea en alerta y nosotros tenemos una sola noche para traerlo de vuelta. Qué pereza... pero vamos.', 'cold', p),
        line('valle', 'Sasuke Uchiha', 'sasuke', 'No vengas a hablarme de compañeros, {name}. Los compañeros no devuelven a los muertos. Solo el poder lo hace.', 'cold', p),
        line('valle', 'Naruto Uzumaki', 'naruto', '¡Sasuke! ¡No me importa si me odias! ¡No voy a dejarte ir con ese tipo!', 'warm', p),
        line('valle', 'Sasuke Uchiha', 'sasuke', 'Entonces demuéstralo. Si quieres llevarme de vuelta, tendrás que romperme. Y no sé si tienes estómago para eso.', 'cold', p)
      ];
    },
    'p2-01': function (arc, p) {
      return [
        title('desierto', 'SUNAGAKURE · BAJO LA Duna', 'Shippuden 01', 'El Kazekage secuestrado'),
        line('desierto', 'Sakura Haruno', 'sakura', 'Gaara fue capturado. Akatsuki planea extraer el Shukaku. Si no llegamos en tres días, ya no habrá nada que rescatar.', 'cold', p),
        line('desierto', 'Sasori', 'sasori', 'El Kazekage es solo otro títere. Y todos ustedes son marionetas con cuerdas más largas. ¿Quién las corta?', 'cold', p),
        line('desierto', 'Gaara', 'gaara', 'No necesito que me rescaten... Pero si han venido hasta aquí, no pienso morir sin devolverles la molestia.', 'warm', p),
        line('desierto', 'Chiyo', '', 'Un corazón de arena puede aprender a latir. Lo he visto. Hoy lo verás tú también, {name}.', 'warm', p)
      ];
    },
    'p2-06': function (arc, p) {
      return [
        title('cueva', 'AMEGAKURE · CUEVA DE PIEDRA', 'Shippuden 06', 'Profecía y venganza'),
        line('cueva', 'Jiraiya', 'jiraiya', 'Encontré al niño de la profecía entre la lluvia. Lo crié, lo perdí y ahora es un dios que quiere borrar el mundo. La culpa es mía.', 'rain', p),
        line('cueva', 'Pain', 'pain', 'Jiraiya-sensei siempre creyó que la paz se construye con esperanza. Yo aprendí que se construye con dolor.', 'cold', p),
        line('cueva', 'Itachi Uchiha', 'itachi', 'Sasuke... si realmente quieres matarme, no tienes que odiarme. Ya cargas con suficiente odio por los dos.', 'cold', p),
        line('cueva', 'Jiraiya', 'jiraiya', '¡Escucha, {name}! El mundo no se salva con una victoria. Se salva con la próxima generación. ¡Sé esa generación!', 'warm', p)
      ];
    },
    'p2-10': function (arc, p) {
      return [
        title('village', 'KONOHA · EL CIELO SE ROMPE', 'Shippuden 10', 'Dos salvadores'),
        line('village', 'Pain', 'pain', 'Konoha ha olvidado el dolor que causó. Hoy recordará el precio de ser una gran aldea.', 'war', p),
        line('village', 'Hinata Hyūga', 'hinata', 'Naruto-kun... siempre has dicho que no te rindes. Yo tampoco. Aunque no pueda ganar... ¡voy a protegerte!', 'warm', p),
        line('village', 'Naruto Uzumaki', 'naruto', '¡Ese es mi pueblo! ¡Esa es mi gente! ¡Y yo soy Naruto Uzumaki, el que nunca abandona una promesa!', 'warm', p),
        line('village', 'Iruka Umino', 'iruka', '{name}, la aldea está en ruinas. Pero mientras alguien esté de pie, Konoha sigue viva. ¡Hazlo por todos los que no pueden levantarse!', 'warm', p)
      ];
    },
    'p2-13': function (arc, p) {
      return [
        title('cumbre', 'CUMBRE DE LOS CINCO KAGE · PAÍS DEL HIERRO', 'Shippuden 13', 'La verdad del clan Uchiha'),
        line('cumbre', 'Sasuke Uchiha', 'sasuke', 'Todos estos Kage se sientan a decidir el destino del mundo. Mi clan fue borrado para mantener ese orden. Hoy vengo a cobrar.', 'cold', p),
        line('cumbre', 'Danzō Shimura', 'danzo', 'Itachi fue un héroe. Yo guardé el secreto. Tú deberías agradecerme por no cargar con esa verdad, muchacho.', 'cold', p),
        line('cumbre', 'Kakashi Hatake', 'kakashi', '{name}, la venganza de Sasuke ya no solo le pertenece. Está a punto de desatar una guerra. Detenlo... sin convertirte en él.', 'warm', p)
      ];
    },
    'p2-22': function (arc, p) {
      return [
        title('guerra', 'CUARTA GRAN GUERRA NINJA · FRENTE', 'Shippuden 22', 'Obito Uchiha'),
        line('guerra', 'Kakashi Hatake', 'kakashi', 'Obito... mi mejor amigo, el hombre al que creí muerto, el que me dio ese ojo. Ahora está detrás de la máscara.', 'rain', p),
        line('guerra', 'Obito Uchiha', 'obito', 'Tú no entiendes, Kakashi. No quiero un mundo donde la gente que amo tenga que morir. El Tsukuyomi Infinito es el único sueño limpio.', 'cold', p),
        line('guerra', 'Naruto Uzumaki', 'naruto', '¡Un sueño donde nadie puede elegir no es un sueño! ¡Es una jaula!', 'warm', p),
        line('guerra', 'Obito Uchiha', 'obito', 'Entonces ven a despertarme, niño. Demuéstrame que la realidad merece ser vivida.', 'war', p)
      ];
    },
    'p2-27': function (arc, p) {
      return [
        title('valle', 'VALLE DEL FIN · EL ÚLTIMO COMBATE', 'Shippuden 27', 'Naruto y Sasuke'),
        line('valle', 'Sasuke Uchiha', 'sasuke', 'El mundo de las aldeas solo produce dolor. Quiero borrarlo. Y para eso, tengo que empezar por ti.', 'cold', p),
        line('valle', 'Naruto Uzumaki', 'naruto', 'Si de verdad necesitas un enemigo para cargar con todo... entonces seré tu enemigo. Pero no te dejaré cargar solo.', 'warm', p),
        line('valle', 'Sasuke Uchiha', 'sasuke', 'No entiendes nada. Siempre has tenido a alguien que te esperaba. Yo solo tuve una casa vacía.', 'rain', p),
        line('valle', 'Sakura Haruno', 'sakura', 'No voy a interrumpir esta pelea. Pero cuando termine, voy a estar aquí. Para los dos. Esa es mi elección.', 'warm', p)
      ];
    },
    'p2-31': function (arc, p) {
      return [
        title('village', 'KONOHA · PRIMAVERA', 'Epílogo', 'El día perfecto'),
        line('village', 'Hinata Hyūga', 'hinata', 'Naruto-kun... cuando te vi por primera vez, solo quería tener el valor de mirarte. Hoy no aparto la vista.', 'warm', p),
        line('village', 'Naruto Uzumaki', 'naruto', '¡Hinata! ¡Prometí que algún día todos me reconocerían! ¡Nunca imaginé que también significaría esto!', 'warm', p),
        line('village', 'Iruka Umino', 'iruka', 'Siempre supe que este día llegaría. El niño que nadie quería está a punto de tener una familia propia. Qué increíble...', 'warm', p),
        line('village', 'Iruka Umino', 'iruka', '{name}, mira lo que se construye cuando alguien decide no rendirse. Esta aldea, esta paz... también tiene tu nombre.', 'warm', p)
      ];
    }
  };

  function clean(text, p) {
    if (!text) return '';
    return text.replace(/\{name\}/g, p && p.name ? p.name : 'shinobi')
      .replace(/  +/g, ' ');
  }

  function title(scene, kicker, chapter, heading) {
    return { type: 'title', scene: scene, kicker: kicker, chapter: chapter || '', title: heading || '' };
  }

  function line(scene, speaker, portrait, text, mood, p) {
    return { type: 'dialogue', scene: scene, speaker: speaker, portrait: portrait || NAME_KEYS[String(speaker || '').toLowerCase()] || '', text: clean(text, p), mood: mood || 'neutral' };
  }

  function arcScene(arc) {
    if (!arc) return 'hoja';
    if (arc.arena === 'hoja') return 'village';
    return arc.arena || 'hoja';
  }

  function allArcs() { return D.ARCS_P1.concat(D.ARCS_P2); }
  function getArc(id) { return allArcs().filter(function (a) { return a.id === id; })[0] || null; }
  function arcNumber(arc) {
    const arr = arc.id[0] === 'p' && arc.id[1] === '1' ? D.ARCS_P1 : D.ARCS_P2;
    return arr.indexOf(arc) + 1;
  }
  function recommendedLevel(arc) { return Math.max(1, (RANK_LEVEL[arc.rank] || 1) + 1); }
  function arcReward(arc, repeat) {
    const base = D.RANKS[arc.rank] || D.RANKS.D;
    const factor = repeat ? 0.25 : 1;
    return {
      xp: Math.round((base.xp * 2.1 + arcNumber(arc) * 8) * factor),
      ryo: Math.round((base.ryo * 2.3 + arcNumber(arc) * 12) * factor)
    };
  }

  function portraitFor(name) {
    return NAME_KEYS[String(name || '').toLowerCase()] || '';
  }

  function charQuote(name, p) {
    const key = NAME_KEYS[String(name || '').toLowerCase()];
    if (key && CHAR_LINES[key]) {
      const lines = CHAR_LINES[key];
      const idx = p ? (p.name.length + name.length) % lines.length : 0;
      return lines[idx];
    }
    return 'Esta misión no será fácil. Mantén los ojos abiertos y la cabeza fría.';
  }

  function buildArcIntro(arc, p) {
    if (MAJOR_INTROS[arc.id]) return MAJOR_INTROS[arc.id](arc, p);
    const scene = arcScene(arc);
    const chars = arc.chars || [];
    const bossName = (D.ENEMIES[arc.boss] && D.ENEMIES[arc.boss].name) || 'el objetivo';
    const first = chars[0] || 'Iruka Umino';
    const second = chars[1] || 'Kakashi Hatake';
    const bossKey = arc.boss || '';
    const beats = [
      title(scene, (arc.id.indexOf('p1') === 0 ? 'PARTE I · NARUTO' : 'PARTE II · SHIPPUDEN') + ' · RANGO ' + arc.rank,
        'ARCO ' + String(arcNumber(arc)).padStart(2, '0') + ' · EPISODIOS ' + arc.eps, arc.name)
    ];
    beats.push(line(scene, first, portraitFor(first),
      arc.summary + ' El expediente llega a tus manos, {name}. La Hoja necesita que esta historia no termine en tragedia.', 'cold', p));
    beats.push(line(scene, second, portraitFor(second), charQuote(second, p), arc.rank === 'S' || arc.rank === 'A' ? 'cold' : 'neutral', p));
    const bossLine = BOSS_LINES[bossKey] || 'Así que la Hoja envía a otro cachorro. Ven. Te mostraré por qué este mundo necesita un nuevo orden.';
    beats.push(line(scene, bossName, bossKey, bossLine, 'war', p));
    beats.push(line(scene, 'Iruka Umino', 'iruka',
      'Recuerda tus prioridades: proteger a tus compañeros, completar la misión y volver a casa. No hay ninguna misión que valga tu vida, {name}.', 'warm', p));
    return beats;
  }

  function buildArcOutro(arc, p) {
    const chars = arc.chars || [];
    const first = chars[0] || 'Iruka Umino';
    const isLast = arc.id === 'p2-32';
    const beats = [
      title(arcScene(arc), 'MISIÓN CUMPLIDA · RANGO ' + arc.rank, 'ARCO ' + String(arcNumber(arc)).padStart(2, '0'), arc.name + ' — concluido'),
      line(arcScene(arc), first, portraitFor(first),
        'Lo lograste, {name}. La historia de este arco cierra una puerta y abre otra. Pero hoy, la Hoja respira un poco mejor gracias a ti.', 'warm', p),
      line(arcScene(arc), 'Iruka Umino', 'iruka',
        arc.rank === 'S' ? 'Hasta los Kage tiemblan, y aun así se levantan. Lo que hiciste hoy no se olvidará. Estoy orgulloso de ti.' : 'Otro paso en tu camino, otro lazo que se fortalece. El Hokage querrá ver tu informe. Y yo quiero ver que comes algo antes del próximo entrenamiento.', 'warm', p)
    ];
    if (isLast) {
      beats.push(line('village', 'Hiruzen Sarutobi', 'hiruzen',
        'Has recorrido toda la historia de esta Hoja: sus guerras, sus pérdidas, sus milagros. El futuro ya no está escrito. Está en tus manos, {name}.', 'warm', p));
    }
    return beats;
  }

  function buildAcademyIntro(p, mode) {
    const base = (p && p.baseId && p.baseId !== 'custom') ? p.baseId : 'custom';
    let beats = [];
    if (mode === 'training') {
      beats = [
        title('academia', 'KONOHA · CAMPO DE ENTRENAMIENTO 3', 'Entrenamiento', 'Bienvenido a la Hoja'),
        line('academia', 'Iruka Umino', 'iruka', '¡{name}! Llegas justo a tiempo. En la Hoja, el camino empieza con una bandana y una promesa: proteger a los que no pueden protegerse.', 'warm', p),
        line('academia', 'Kakashi Hatake', 'kakashi', 'Yo me encargo de la parte interesante. El Campo de Entrenamiento 3 está al este de la Academia. Si quieres un combate de práctica, búscame.', 'neutral', p),
        line('academia', 'Iruka Umino', 'iruka', 'Explora la aldea, habla con sus ninjas y acepta misiones en la Torre. Todo lo que aprendas aquí será tuyo. Adelante, {name}.', 'warm', p)
      ];
      return beats;
    }
    const burden = D.BURDENS[base] || D.DEFAULT_INTRO;
    burden.forEach(function (b) {
      if (b.title) {
        beats.push({ type: 'title', scene: mapCutsceneScene(b.scene), kicker: 'LA ACADEMIA NINJA', chapter: '', title: b.title });
      }
      if (b.text) {
        const speaker = b.speaker || '';
        beats.push({
          type: 'dialogue', scene: mapCutsceneScene(b.scene), speaker: speaker,
          portrait: b.portrait || portraitFor(speaker), text: personalize(b.text, p), mood: b.mood || 'neutral'
        });
      }
    });
    const clan = D.CLANS.filter(function (c) { return c.id === p.clan; })[0];
    beats.push(line('academia', 'Iruka Umino', 'iruka',
      'Bienvenido a mi clase, {name}' + (clan ? ' del clan ' + clan.name : '') + '. Aquí no importa de dónde vengas ni cuánto poder tengas. Lo único que importa es lo que elijas hacer con él. La bandana está en tu pupitre. La promesa, en tus manos.', 'warm', p));
    beats.push(title('monument', 'KONOHA · MONUMENTO DE LOS HOKAGE', 'El primer día', 'La Voluntad del Fuego'));
    return beats;
  }

  function mapCutsceneScene(s) {
    const map = { village: 'village', street: 'street', academy: 'academy', monument: 'monument', forest: 'forest' };
    return map[s] || s || 'village';
  }

  function personalizationName(p) {
    if (!p) return 'shinobi';
    return p.name || 'shinobi';
  }

  function personalize(text, p) {
    if (!p) return text;
    let out = text;
    if (p.baseId && p.baseId !== 'custom' && D.CHAR_MAP[p.baseId]) {
      const c = D.CHAR_MAP[p.baseId];
      const short = c.short || c.name.split(' ')[0];
      out = out.replace(new RegExp('\\b' + escapeRe(c.name) + '\\b', 'g'), p.name);
      out = out.replace(new RegExp('\\b' + escapeRe(short) + '\\b', 'g'), p.name);
    }
    out = out.replace(/\bNaruto\b/g, p.baseId === 'naruto' ? p.name : 'Naruto');
    return out;
  }
  function escapeRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function buildMissionIntro(mission, p) {
    const giverKey = NAME_KEYS[String(mission.giver || '').toLowerCase()];
    const giver = mission.giver || 'Iruka Umino';
    const scene = mission.arena === 'hoja' ? 'village' : mission.arena;
    const beats = [
      title(scene, 'TABLERO DE MISIONES · RANGO ' + mission.rank, mission.location, mission.title),
      line(scene, giver, giverKey, mission.desc + ' La recompensa está garantizada, pero la seguridad no. ¿Aceptas, {name}?', 'neutral', p)
    ];
    const extra = mission.enemies && mission.enemies.length ? mission.enemies[0] : (mission.boss || '');
    if (extra && D.ENEMIES[extra]) {
      beats.push(line(scene, D.ENEMIES[extra].name, extra, 'Así que la Hoja manda a un novato. Perfecto. Necesitaba calentar.', 'war', p));
    }
    beats.push(line(scene, 'Iruka Umino', 'iruka', 'No subestimes una misión D. A veces, el trabajo más pequeño salva la vida más grande. Vuelve con todos los dedos.', 'warm', p));
    return beats;
  }

  function buildMissionOutro(mission, p) {
    const giverKey = NAME_KEYS[String(mission.giver || '').toLowerCase()];
    const scene = mission.arena === 'hoja' ? 'village' : mission.arena;
    return [
      title(scene, 'MISIÓN COMPLETADA · RANGO ' + mission.rank, mission.location, mission.title),
      line(scene, mission.giver || 'Iruka Umino', giverKey, 'Buen trabajo, {name}. El cliente está satisfecho y la Hoja puede dormir una noche más. Toma tu paga y no la gastes toda en ramen.', 'warm', p)
    ];
  }

  function buildBattle(arc, p, repeat) {
    const rank = arc.rank || 'D';
    const mobs = RANK_MOBS[rank] || RANK_MOBS.D;
    const waves = [];
    const count = WAVE_COUNT[rank] || 1;
    for (let w = 0; w < count; w++) {
      const wave = { enemies: [] };
      const n = rank === 'D' ? 2 : rank === 'C' ? (w === 0 ? 3 : 2) : rank === 'B' ? (w === 0 ? 3 : 2) : (w === 0 ? 3 : 2);
      for (let i = 0; i < n; i++) {
        const type = mobs[(w + i + arcNumber(arc)) % mobs.length];
        wave.enemies.push({ type: type, level: recommendedLevel(arc) + w });
      }
      waves.push(wave);
    }
    const boss = D.ENEMIES[arc.boss] ? { type: arc.boss, level: recommendedLevel(arc) + 2, boss: true } : null;
    return {
      kind: 'arc',
      arcId: arc.id,
      title: arc.name,
      subtitle: 'ARCO ' + String(arcNumber(arc)).padStart(2, '0') + ' · ' + (arc.id.indexOf('p1') === 0 ? 'NARUTO' : 'SHIPPUDEN'),
      arena: arc.arena || 'hoja',
      rank: rank,
      waves: waves,
      boss: boss,
      objective: { type: 'defeat' },
      recommended: recommendedLevel(arc),
      reward: arcReward(arc, repeat),
      intro: buildArcIntro(arc, p),
      outro: buildArcOutro(arc, p)
    };
  }

  function buildMissionBattle(mission, p, repeat) {
    const enemies = [];
    if (mission.enemies) {
      mission.enemies.forEach(function (type) { enemies.push({ type: type, level: RANK_LEVEL[mission.rank] + 2 }); });
    }
    let boss = null;
    if (mission.boss && D.ENEMIES[mission.boss]) boss = { type: mission.boss, level: RANK_LEVEL[mission.rank] + 4, boss: true };
    if (!enemies.length && !boss) {
      enemies.push({ type: mission.rank === 'D' ? 'bandido' : 'ronin', level: RANK_LEVEL[mission.rank] + 1 });
    }
    const isCollect = mission.type === 'collect';
    return {
      kind: 'mission',
      missionId: mission.id,
      title: mission.title,
      subtitle: mission.location + ' · RANGO ' + mission.rank,
      arena: mission.arena || 'hoja',
      rank: mission.rank,
      waves: [{ enemies: enemies }],
      boss: boss,
      objective: isCollect ? { type: 'collect', goal: mission.goal || 3, icon: mission.icon || 'scroll' } : { type: 'defeat' },
      recommended: RANK_LEVEL[mission.rank],
      reward: {
        xp: Math.round(mission.reward.xp * (repeat ? 0.25 : 1)),
        ryo: Math.round(mission.reward.ryo * (repeat ? 0.25 : 1))
      },
      intro: buildMissionIntro(mission, p),
      outro: buildMissionOutro(mission, p)
    };
  }

  function missionById(id) { return D.MISSIONS.filter(function (m) { return m.id === id; })[0] || null; }

  function arcProgress(state) {
    const done = (state && state.progress && state.progress.arcs) || [];
    return { p1: D.ARCS_P1.filter(function (a) { return done.indexOf(a.id) >= 0; }).length, p2: D.ARCS_P2.filter(function (a) { return done.indexOf(a.id) >= 0; }).length, done: done };
  }

  function nextArc(state) {
    const done = (state && state.progress && state.progress.arcs) || [];
    return allArcs().filter(function (a) { return done.indexOf(a.id) < 0; })[0] || null;
  }

  function nextRecommended(state) {
    const next = nextArc(state);
    if (next) return { type: 'arc', id: next.id, label: next.name };
    return { type: 'none', label: 'Todas las crónicas completadas' };
  }

  function buildTrainingBattle(p, opponentId) {
    const id = opponentId || 'kakashi';
    const c = D.CHAR_MAP[id] || D.CHAR_MAP.kakashi;
    const enemy = {
      name: c.name, tier: 'boss', hp: 520, atk: 11, speed: 170, color: c.art.outfit, hair: c.art.hair,
      range: 90, kind: 'boss', portrait: c.portrait, art: c.art
    };
    return {
      kind: 'training',
      title: 'Entrenamiento con ' + c.short,
      subtitle: 'CAMPO DE ENTRENAMIENTO 3 · COMBATE DE PRÁCTICA',
      arena: 'bosque',
      rank: 'D',
      waves: [],
      boss: { type: 'custom', level: 2, boss: true, custom: enemy },
      objective: { type: 'defeat' },
      recommended: 1,
      reward: { xp: 120, ryo: 80 },
      intro: [
        title('bosque', 'KONOHA · CAMPO DE ENTRENAMIENTO 3', 'Entrenamiento', 'Sparring'),
        line('bosque', c.name, id, 'Muéstrame lo que has aprendido. No te contengas... demasiado.', 'neutral', p)
      ],
      outro: [
        title('bosque', 'CAMPO DE ENTRENAMIENTO 3', 'Entrenamiento', 'Buen combate'),
        line('bosque', c.name, id, 'Nada mal, {name}. Tienes potencial. Vuelve cuando quieras; la próxima vez no seré tan amable.', 'warm', p)
      ]
    };
  }

  function getNpcLines(npcId, p) {
    const bank = D.NPC_DIALOGUES[npcId] || D.NPC_DIALOGUES.iruka;
    const idx = (p && p.name ? p.name.length : 0) + (npcId ? npcId.length : 0);
    return bank[idx % bank.length];
  }

  function arcColor(rank) { return (D.RANKS[rank] && D.RANKS[rank].color) || '#ffc247'; }

  window.Story = {
    allArcs: allArcs,
    getArc: getArc,
    arcNumber: arcNumber,
    recommendedLevel: recommendedLevel,
    arcReward: arcReward,
    buildArcIntro: buildArcIntro,
    buildArcOutro: buildArcOutro,
    buildAcademyIntro: buildAcademyIntro,
    buildMissionIntro: buildMissionIntro,
    buildMissionOutro: buildMissionOutro,
    buildBattle: buildBattle,
    buildMissionBattle: buildMissionBattle,
    buildTrainingBattle: buildTrainingBattle,
    missionById: missionById,
    arcProgress: arcProgress,
    nextArc: nextArc,
    nextRecommended: nextRecommended,
    getNpcLines: getNpcLines,
    arcColor: arcColor,
    portraitFor: portraitFor,
    RANK_MOBS: RANK_MOBS,
    RANK_LEVEL: RANK_LEVEL
  };
})();
