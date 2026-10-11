/*
 * ScreenTalk "Rehearse the talk": scripted, branching practice conversation with a parent
 * who pushes back. Content + a pure engine (runs in the browser and in Node for tests).
 * Every coaching tip cites the ACS, NCI, or CDC page it comes from (all checked Oct 10, 2026).
 */
(function (root) {
  'use strict';

  var SRC = {
    CDC_SYM: { org: 'CDC', name: { en: 'CDC: Symptoms of Colorectal Cancer', es: 'CDC: Síntomas del cáncer colorrectal (en inglés)' }, url: 'https://www.cdc.gov/colorectal-cancer/symptoms/index.html' },
    CDC_SCREEN: { org: 'CDC', name: { en: 'CDC: Screening for Colorectal Cancer', es: 'CDC: Pruebas de detección del cáncer colorrectal (en inglés)' }, url: 'https://www.cdc.gov/colorectal-cancer/screening/index.html' },
    CDC_BREAST: { org: 'CDC', name: { en: 'CDC: Screening for Breast Cancer (free or low-cost mammograms)', es: 'CDC: Detección del cáncer de mama y mamografías gratis o de bajo costo (en inglés)' }, url: 'https://www.cdc.gov/breast-cancer/screening/index.html' },
    NCI_MYTHS: { org: 'NCI', name: { en: 'NCI: Common Cancer Myths and Misconceptions', es: 'NCI: Mitos comunes sobre el cáncer (en inglés)' }, url: 'https://www.cancer.gov/about-cancer/causes-prevention/risk/myths' },
    ACS_RISK: { org: 'ACS', name: { en: 'ACS: Colorectal Cancer Risk Factors', es: 'ACS: Factores de riesgo del cáncer colorrectal (en inglés)' }, url: 'https://www.cancer.org/cancer/types/colon-rectal-cancer/causes-risks-prevention/risk-factors.html' },
    ACS_TESTS: { org: 'ACS', name: { en: 'ACS: Colorectal Cancer Screening Tests', es: 'ACS: Pruebas de detección del cáncer colorrectal (en inglés)' }, url: 'https://www.cancer.org/cancer/types/colon-rectal-cancer/detection-diagnosis-staging/screening-tests-used.html' },
    ACS_COVER: { org: 'ACS', name: { en: 'ACS: Insurance Coverage for Colorectal Cancer Screening', es: 'ACS: Cobertura de seguro para la detección del cáncer colorrectal (en inglés)' }, url: 'https://www.cancer.org/cancer/types/colon-rectal-cancer/detection-diagnosis-staging/screening-coverage-laws.html' },
    ACS_HOW: { org: 'ACS', name: { en: 'ACS: How to Get Screened for Cancer', es: 'ACS: Cómo hacerse las pruebas de detección del cáncer (en inglés)' }, url: 'https://www.cancer.org/cancer/screening/how-to-get-screened-for-cancer-if-you-dont-have-a-doctor.html' }
  };

  var POINTS = { strong: 2, ok: 1, weak: 0 };
  var MOOD = { strong: 20, ok: 0, weak: -15 };
  var START_MOOD = 50;

  // Each round: one pushback, three replies (one strong, one ok, one weak).
  // The parent's opening line depends on how open they are after the last round.
  var ROUNDS = [
    {
      key: 'fine',
      label: { en: '"I feel fine"', es: '"Me siento bien"' },
      open: { en: 'I feel fine. Why would I get tested when nothing is wrong?', es: 'Me siento bien. ¿Para qué hacerme pruebas si no tengo nada?' },
      guarded: { en: 'I feel fine. Why would I get tested when nothing is wrong?', es: 'Me siento bien. ¿Para qué hacerme pruebas si no tengo nada?' },
      options: [
        { quality: 'strong',
          text: { en: 'That\u2019s actually the point. Screening is for people who feel fine. Polyps and early colon cancer often don\u2019t cause symptoms, and screening can find polyps so they\u2019re removed before they ever turn into cancer.',
                  es: 'Justo de eso se trata. Las pruebas de detección son para personas que se sienten bien. Los pólipos y el cáncer de colon temprano muchas veces no dan síntomas, y la prueba puede encontrar pólipos para quitarlos antes de que se vuelvan cáncer.' },
          reply: { en: 'Huh. I didn\u2019t know you could have something and not feel it.', es: 'Mmm. No sabía que uno podía tener algo y no sentirlo.' },
          tip: { en: 'Screening is meant for people with no symptoms. CDC says polyps and colorectal cancer don\u2019t always cause symptoms, and screening can find polyps so they can be removed before they turn into cancer.',
                 es: 'Las pruebas de detección son para personas sin síntomas. Los CDC dicen que los pólipos y el cáncer colorrectal no siempre causan síntomas, y que la detección puede encontrar pólipos para quitarlos antes de que se conviertan en cáncer.' },
          src: ['CDC_SYM', 'CDC_SCREEN'] },
        { quality: 'ok',
          text: { en: 'Lots of people feel fine. It\u2019s still smart to check.', es: 'Mucha gente se siente bien. Igual es buena idea revisarse.' },
          reply: { en: 'Maybe. But I really do feel fine.', es: 'Puede ser. Pero de verdad me siento bien.' },
          tip: { en: 'Good instinct, but give the reason: CDC says you can have polyps or colorectal cancer and not know it, which is why screening matters even when you feel healthy.',
                 es: 'Buena idea, pero da la razón: los CDC dicen que se pueden tener pólipos o cáncer colorrectal sin saberlo, y por eso la detección importa aunque uno se sienta sano.' },
          src: ['CDC_SYM'] },
        { quality: 'weak',
          text: { en: 'You never know. You could have cancer right now.', es: 'Nunca se sabe. Podrías tener cáncer ahora mismo.' },
          reply: { en: 'Wow, thanks for scaring me. Can we not do this at dinner?', es: 'Vaya, gracias por asustarme. ¿Podemos no hablar de esto en la cena?' },
          tip: { en: 'Fear tends to shut the talk down. Lead with care, then the hopeful fact: CDC says screening can find polyps before they become cancer, and find cancer early, when treatment works best.',
                 es: 'El miedo suele cerrar la conversación. Empieza con cariño y luego el dato esperanzador: los CDC dicen que la detección puede encontrar pólipos antes de que sean cáncer, y encontrar el cáncer temprano, cuando el tratamiento funciona mejor.' },
          src: ['CDC_SCREEN'] }
      ]
    },
    {
      key: 'family',
      label: { en: '"No family history"', es: '"No hay antecedentes en la familia"' },
      open: { en: 'Okay, but nobody in our family has had cancer. I think I\u2019m safe.', es: 'Bueno, pero nadie en nuestra familia ha tenido cáncer. Creo que estoy a salvo.' },
      guarded: { en: 'Anyway, nobody in our family has had cancer. I don\u2019t need this.', es: 'De todos modos, nadie en la familia ha tenido cáncer. No me hace falta.' },
      options: [
        { quality: 'strong',
          text: { en: 'I get why that feels reassuring. But most people who get colon cancer don\u2019t have a family history of it, and only about 5 to 10% of cancers come from genes passed down from parents.',
                  es: 'Entiendo que eso te dé tranquilidad. Pero la mayoría de las personas con cáncer de colon no tienen antecedentes familiares, y solo entre el 5 y el 10% de los cánceres vienen de genes heredados de los padres.' },
          reply: { en: 'Really? I always thought it was mostly in the genes.', es: '¿En serio? Siempre pensé que era casi todo genético.' },
          tip: { en: 'ACS says most colorectal cancers are found in people without a family history of it. NCI says only about 5 to 10% of cancers are caused by harmful gene changes inherited from parents.',
                 es: 'La ACS dice que la mayoría de los cánceres colorrectales se encuentran en personas sin antecedentes familiares. El NCI dice que solo entre el 5 y el 10% de los cánceres se deben a cambios genéticos heredados de los padres.' },
          src: ['ACS_RISK', 'NCI_MYTHS'] },
        { quality: 'ok',
          text: { en: 'Family history isn\u2019t the only thing that matters.', es: 'Los antecedentes familiares no son lo único que importa.' },
          reply: { en: 'What else is there? I don\u2019t even smoke.', es: '¿Qué más hay? Ni siquiera fumo.' },
          tip: { en: 'True, and stronger with the fact behind it: ACS says most colorectal cancers are found in people without a family history.',
                 es: 'Es cierto, y suena más fuerte con el dato: la ACS dice que la mayoría de los cánceres colorrectales aparecen en personas sin antecedentes familiares.' },
          src: ['ACS_RISK'] },
        { quality: 'weak',
          text: { en: 'Well, you don\u2019t actually know everyone\u2019s medical history.', es: 'Bueno, en realidad no sabes el historial médico de todos.' },
          reply: { en: 'Are you saying I don\u2019t know my own family?', es: '¿Me estás diciendo que no conozco a mi propia familia?' },
          tip: { en: 'Questioning what they know can feel like an attack. Agree with the feeling first, then share the fact: NCI says most cancers are not caused by inherited genes.',
                 es: 'Cuestionar lo que saben puede sentirse como un ataque. Primero valida lo que sienten y luego comparte el dato: el NCI dice que la mayoría de los cánceres no se deben a genes heredados.' },
          src: ['NCI_MYTHS'] }
      ]
    },
    {
      key: 'scared',
      label: { en: '"Scared of a colonoscopy"', es: '"Me da miedo la colonoscopia"' },
      open: { en: 'To be honest, I\u2019m scared of a colonoscopy. It sounds awful.', es: 'La verdad, me da miedo la colonoscopia. Suena horrible.' },
      guarded: { en: 'And I am not doing a colonoscopy. No way.', es: 'Y no me voy a hacer una colonoscopia. De ninguna manera.' },
      options: [
        { quality: 'strong',
          text: { en: 'That\u2019s a really normal worry. Colonoscopy isn\u2019t the only choice. There are stool tests you do in private at home, and your doctor can help pick one. The cancer society says the most important thing is getting screened, whichever test you choose.',
                  es: 'Es una preocupación muy normal. La colonoscopia no es la única opción. Hay pruebas de heces que se hacen en privado en casa, y el médico te puede ayudar a escoger. La Sociedad Americana Contra el Cáncer dice que lo más importante es hacerse la prueba, la que sea.' },
          reply: { en: 'At home? I didn\u2019t know that was a thing. That I could maybe do.', es: '¿En casa? No sabía que existía. Eso tal vez sí lo puedo hacer.' },
          tip: { en: 'ACS lists stool-based tests done at home (for example FIT, once a year) and says the most important thing is to get screened, no matter which test. If a home test is abnormal, a colonoscopy is the next step (ACS, CDC).',
                 es: 'La ACS menciona pruebas de heces que se hacen en casa (por ejemplo la FIT, una vez al año) y dice que lo más importante es hacerse la prueba, sin importar cuál. Si la prueba en casa sale anormal, el siguiente paso es una colonoscopia (ACS, CDC).' },
          src: ['ACS_TESTS', 'CDC_SCREEN'] },
        { quality: 'ok',
          text: { en: 'Lots of people get them. They usually give you medicine so you sleep through it.', es: 'Mucha gente se la hace. Normalmente te dan medicina para que duermas durante la prueba.' },
          reply: { en: 'Maybe. I still don\u2019t like the idea.', es: 'Puede ser. Igual no me gusta la idea.' },
          tip: { en: 'Accurate: ACS says sedation is usually used for colonoscopy (so someone drives you home). Even better, mention that at-home stool tests are another option to ask about.',
                 es: 'Correcto: la ACS dice que normalmente se usa sedación en la colonoscopia (y alguien te tiene que llevar a casa). Mejor aún, menciona que las pruebas de heces en casa son otra opción para preguntar.' },
          src: ['ACS_TESTS'] },
        { quality: 'weak',
          text: { en: 'It\u2019s not a big deal. Just get over it.', es: 'No es para tanto. Ya supéralo.' },
          reply: { en: 'Easy for you to say. You\u2019re not the one doing it.', es: 'Fácil para ti decirlo. No eres tú quien se la va a hacer.' },
          tip: { en: 'Brushing off fear makes people dig in. Name the worry, then offer choices: ACS describes several test options, including stool tests done at home.',
                 es: 'Minimizar el miedo hace que la persona se cierre más. Nombra la preocupación y ofrece opciones: la ACS describe varias pruebas, incluidas las de heces que se hacen en casa.' },
          src: ['ACS_TESTS'] }
      ]
    },
    {
      key: 'cost',
      label: { en: '"Too expensive"', es: '"Es muy caro"' },
      open: { en: 'Even if I wanted to, these tests are too expensive.', es: 'Aunque quisiera, esas pruebas son muy caras.' },
      guarded: { en: 'Besides, I can\u2019t afford all these tests.', es: 'Además, no puedo pagar todas esas pruebas.' },
      options: [
        { quality: 'strong',
          text: { en: 'Can we check together? Most insurance plans have to cover colon screening tests with no co-pay or deductible. I can sit with you while you call the number on your card and ask what you\u2019d pay. And there are free or low-cost programs for some screenings if you ever don\u2019t have insurance.',
                  es: '¿Lo revisamos juntos? La mayoría de los seguros tienen que cubrir las pruebas de detección de colon sin copago ni deducible. Te acompaño mientras llamas al número de tu tarjeta y preguntas cuánto pagarías. Y si algún día no tienes seguro, hay programas gratis o de bajo costo para algunas pruebas.' },
          reply: { en: 'No co-pay? Okay. If you help me call, I\u2019ll ask.', es: '¿Sin copago? Bueno. Si me ayudas a llamar, pregunto.' },
          tip: { en: 'ACS: the Affordable Care Act requires private insurers and Medicare to cover recommended colorectal screening tests with no co-pays or deductibles, and you should ask the insurer ahead of time about follow-up costs. CDC offers free or low-cost mammograms through the National Breast and Cervical Cancer Early Detection Program.',
                 es: 'ACS: la Ley de Cuidado de Salud a Bajo Precio exige que los seguros privados y Medicare cubran las pruebas recomendadas de detección colorrectal sin copagos ni deducibles, y conviene preguntar antes al seguro por costos de seguimiento. Los CDC ofrecen mamografías gratis o de bajo costo con el Programa Nacional de Detección Temprana del Cáncer de Mama y de Cuello Uterino.' },
          src: ['ACS_COVER', 'CDC_BREAST'] },
        { quality: 'ok',
          text: { en: 'Insurance might pay for it.', es: 'Tal vez el seguro lo pague.' },
          reply: { en: 'Might. Or I get a surprise bill.', es: 'Tal vez. O me llega una factura sorpresa.' },
          tip: { en: 'Be specific: CDC says colorectal screening tests are covered by most health insurance without a deductible or co-pay, and ACS says to ask the insurer before the test to avoid surprise costs.',
                 es: 'Sé específico: los CDC dicen que la mayoría de los seguros cubren las pruebas de detección colorrectal sin deducible ni copago, y la ACS recomienda preguntar al seguro antes de la prueba para evitar costos sorpresa.' },
          src: ['CDC_SCREEN', 'ACS_COVER'] },
        { quality: 'weak',
          text: { en: 'It\u2019s worth any price. Your health matters more than money.', es: 'Vale cualquier precio. Tu salud importa más que el dinero.' },
          reply: { en: 'That\u2019s easy to say when you\u2019re not paying the bills.', es: 'Eso es fácil de decir cuando no eres tú quien paga las cuentas.' },
          tip: { en: 'Money worries are real. Swap the lecture for facts and an offer to help: ACS says recommended colorectal screening should have no out-of-pocket cost with most insurance.',
                 es: 'Las preocupaciones de dinero son reales. Cambia el sermón por datos y una oferta de ayuda: la ACS dice que con la mayoría de los seguros la detección colorrectal recomendada no debería costar nada de su bolsillo.' },
          src: ['ACS_COVER'] }
      ]
    },
    {
      key: 'time',
      label: { en: '"No time"', es: '"No tengo tiempo"' },
      open: { en: 'I just don\u2019t have time right now. Maybe next year.', es: 'Ahorita no tengo tiempo. Tal vez el próximo año.' },
      guarded: { en: 'Look, I\u2019m too busy for this. Next year.', es: 'Mira, no tengo tiempo para esto. El próximo año.' },
      options: [
        { quality: 'strong',
          text: { en: 'What if I make it easy? I\u2019ll find the clinic\u2019s number and sit with you while you call, and we can ask if an at-home test is an option. You could do that one without taking time off.',
                  es: '¿Y si te lo hago fácil? Busco el número de la clínica, me siento contigo mientras llamas y preguntamos si hay una prueba en casa. Esa la puedes hacer sin pedir tiempo libre.' },
          reply: { en: 'If you find the number, I\u2019ll call this week.', es: 'Si encuentras el número, llamo esta semana.' },
          tip: { en: 'Offer one small, concrete step. ACS says stool-based tests are collected at home and mailed or returned, while colonoscopy might mean missing a day of work. ACS also notes some facilities let people self-refer for certain screening, like mammograms.',
                 es: 'Ofrece un paso pequeño y concreto. La ACS dice que las pruebas de heces se recogen en casa y se envían o entregan, mientras que la colonoscopia puede significar perder un día de trabajo. La ACS también dice que algunos centros permiten pedir ciertas pruebas, como la mamografía, sin orden médica.' },
          src: ['ACS_TESTS', 'ACS_HOW'] },
        { quality: 'ok',
          text: { en: 'Can you at least put it on your calendar?', es: '¿Por lo menos lo puedes anotar en tu calendario?' },
          reply: { en: 'I\u2019ll try to remember.', es: 'Voy a tratar de acordarme.' },
          tip: { en: 'A reminder helps, but a concrete offer helps more: find the number, or ask about an at-home stool test that can be done in private at home (ACS).',
                 es: 'Un recordatorio ayuda, pero una oferta concreta ayuda más: busca el número o pregunta por una prueba de heces que se hace en privado en casa (ACS).' },
          src: ['ACS_TESTS'] },
        { quality: 'weak',
          text: { en: 'You always say that.', es: 'Siempre dices lo mismo.' },
          reply: { en: 'And this is exactly why I don\u2019t like talking about it.', es: 'Y por esto mismo no me gusta hablar del tema.' },
          tip: { en: 'Blame ends the conversation. Make the next step small and offer to help, for example asking whether an at-home test is an option (ACS).',
                 es: 'Culpar termina la conversación. Haz que el siguiente paso sea pequeño y ofrece ayuda, por ejemplo preguntar si hay una prueba en casa (ACS).' },
          src: ['ACS_TESTS'] }
      ]
    }
  ];

  // Interface strings. {p} = the parent's name, {n}/{t}/{s}/{m} = numbers.
  var STRINGS = {
    en: {
      langLabel: 'Language', parentLabel: 'Practice with', parents: { mom: 'Mom', dad: 'Dad', grandma: 'Grandma', grandpa: 'Grandpa' },
      intro: '{p} is going to push back five times, the way real parents do. Pick what you\u2019d say. {p} reacts, and you get a coaching tip backed by the American Cancer Society, the National Cancer Institute, or the CDC.',
      keys: 'Tip: use Tab and Enter, or press 1, 2, or 3 to answer.',
      start: 'Start rehearsal', round: 'Round {n} of {t}', score: 'Score: {s}', meter: '{p}\u2019s openness',
      you: 'You', choose: 'What do you say?', next: 'Next pushback \u2192', finish: 'See my feedback \u2192',
      quality: { strong: 'Great reply', ok: 'Okay reply', weak: 'That backfired' },
      sources: 'Sources:', resultTitle: 'Your rehearsal feedback', scoreLine: 'You scored {s} of {m}.',
      rating: { ready: 'Ready for the real talk.', almost: 'Almost there.', practice: 'Keep practicing. Every try makes it easier.' },
      ending: {
        yes: '{p}: \u201cOkay. Help me call this week, and let\u2019s ask about the at-home test.\u201d',
        maybe: '{p}: \u201cLet me think about it. Bring it up again after the weekend.\u201d',
        no: '{p}: \u201cCan we drop this for now?\u201d (That\u2019s okay. You planted the idea. Try a gentler approach next time.)'
      },
      reviewTitle: 'Round by round', keep: 'What worked', tryThis: 'Try saying',
      again: 'Practice again', toTalk: 'Write my real message \u2192',
      disclaimer: 'Practice only. Scripted replies, not a real person, and not medical advice.',
      announceChoice: '{q}. {p} says: {r}', announceEnd: 'Rehearsal finished. You scored {s} of {m}.'
    },
    es: {
      langLabel: 'Idioma', parentLabel: 'Practicar con', parents: { mom: 'Mamá', dad: 'Papá', grandma: 'Abuela', grandpa: 'Abuelo' },
      intro: '{p} va a poner cinco objeciones, como hacen los padres de verdad. Elige qué dirías. {p} reacciona y recibes un consejo basado en la Sociedad Americana Contra el Cáncer, el Instituto Nacional del Cáncer o los CDC.',
      keys: 'Consejo: usa Tab y Enter, o presiona 1, 2 o 3 para responder.',
      start: 'Empezar a practicar', round: 'Ronda {n} de {t}', score: 'Puntos: {s}', meter: 'Apertura de {p}',
      you: 'Tú', choose: '¿Qué le dices?', next: 'Siguiente objeción \u2192', finish: 'Ver mis resultados \u2192',
      quality: { strong: 'Muy buena respuesta', ok: 'Respuesta regular', weak: 'Eso salió mal' },
      sources: 'Fuentes:', resultTitle: 'Tus resultados', scoreLine: 'Obtuviste {s} de {m} puntos.',
      rating: { ready: '¡Ya puedes tener la conversación de verdad!', almost: 'Ya casi.', practice: 'Sigue practicando. Cada intento lo hace más fácil.' },
      ending: {
        yes: '{p}: \u201cEstá bien. Ayúdame a llamar esta semana y preguntamos por la prueba en casa.\u201d',
        maybe: '{p}: \u201cDéjame pensarlo. Vuelve a mencionarlo después del fin de semana.\u201d',
        no: '{p}: \u201c¿Podemos dejar el tema por ahora?\u201d (Está bien. Ya sembraste la idea. La próxima vez prueba con más calma.)'
      },
      reviewTitle: 'Ronda por ronda', keep: 'Lo que funcionó', tryThis: 'Prueba decir',
      again: 'Practicar otra vez', toTalk: 'Escribir mi mensaje real \u2192',
      disclaimer: 'Solo para practicar. Respuestas guionizadas, no una persona real, y no es consejo médico.',
      announceChoice: '{q}. {p} dice: {r}', announceEnd: 'Práctica terminada. Obtuviste {s} de {m} puntos.'
    }
  };

  var LANGS = ['en', 'es'];
  var PARENTS = ['mom', 'dad', 'grandma', 'grandpa'];

  function fmt(str, vars) {
    return String(str).replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] != null ? vars[k] : m; });
  }
  function lang(l) { return LANGS.indexOf(l) >= 0 ? l : 'en'; }
  function t(l, key) { return STRINGS[lang(l)][key]; }
  function parentName(l, p) { return STRINGS[lang(l)].parents[PARENTS.indexOf(p) >= 0 ? p : 'mom']; }

  // Small seeded RNG so option order can be shuffled but reproduced in tests.
  function rng(seed) {
    var s = (seed >>> 0) || 1;
    return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  function shuffledOrder(n, rand) {
    var a = []; for (var i = 0; i < n; i++) a.push(i);
    for (var j = n - 1; j > 0; j--) { var k = Math.floor(rand() * (j + 1)); var x = a[j]; a[j] = a[k]; a[k] = x; }
    return a;
  }

  function create(opts) {
    opts = opts || {};
    var rand = rng(opts.seed != null ? opts.seed : Date.now());
    return {
      parent: PARENTS.indexOf(opts.parent) >= 0 ? opts.parent : 'mom',
      round: 0, score: 0, mood: START_MOOD, picks: [],
      order: ROUNDS.map(function (r) { return opts.shuffle === false ? [0, 1, 2] : shuffledOrder(r.options.length, rand); })
    };
  }
  function clamp(v) { return Math.max(0, Math.min(100, v)); }
  function isDone(state) { return state.round >= ROUNDS.length; }

  // Which line the parent opens the current round with (branches on openness).
  function parentLine(state, l) {
    var r = ROUNDS[state.round]; if (!r) return '';
    return (state.mood >= START_MOOD ? r.open : r.guarded)[lang(l)];
  }
  // Options for the current round, in display order: [{index, text}]
  function options(state, l) {
    var r = ROUNDS[state.round]; if (!r) return [];
    return state.order[state.round].map(function (i) { return { index: i, text: r.options[i].text[lang(l)] }; });
  }
  // Pick option `index` (original index in ROUNDS[round].options). Returns the new state.
  function choose(state, index) {
    if (isDone(state)) return state;
    var r = ROUNDS[state.round];
    var o = r.options[index];
    if (!o) return state;
    var mood = clamp(state.mood + MOOD[o.quality]);
    return {
      parent: state.parent, order: state.order,
      round: state.round + 1,
      score: state.score + POINTS[o.quality],
      mood: mood,
      picks: state.picks.concat([{ round: state.round, index: index, quality: o.quality, opened: state.mood >= START_MOOD ? 'open' : 'guarded', mood: mood }])
    };
  }
  // Everything the UI needs to show after a pick.
  function feedback(roundIdx, index, l) {
    l = lang(l);
    var o = ROUNDS[roundIdx].options[index];
    return {
      quality: o.quality,
      label: STRINGS[l].quality[o.quality],
      reply: o.reply[l],
      tip: o.tip[l],
      sources: o.src.map(function (k) { return { org: SRC[k].org, name: SRC[k].name[l], url: SRC[k].url }; })
    };
  }
  function maxScore() { return ROUNDS.length * POINTS.strong; }
  function ratingKey(score) {
    var m = maxScore();
    if (score >= m - 1) return 'ready';
    if (score >= Math.ceil(m * 0.6)) return 'almost';
    return 'practice';
  }
  function endingKey(mood) { return mood >= 70 ? 'yes' : mood >= 40 ? 'maybe' : 'no'; }
  function result(state, l) {
    l = lang(l);
    var S = STRINGS[l];
    var p = parentName(l, state.parent);
    return {
      score: state.score, max: maxScore(),
      rating: ratingKey(state.score), ratingText: S.rating[ratingKey(state.score)],
      ending: endingKey(state.mood), endingText: fmt(S.ending[endingKey(state.mood)], { p: p }),
      rounds: state.picks.map(function (pk) {
        var r = ROUNDS[pk.round];
        var best = r.options.filter(function (o) { return o.quality === 'strong'; })[0];
        var picked = r.options[pk.index];
        return {
          key: r.key, label: r.label[l], quality: pk.quality, qualityText: S.quality[pk.quality],
          said: picked.text[l], best: best.text[l],
          tip: (pk.quality === 'strong' ? picked : best).tip[l],
          sources: (pk.quality === 'strong' ? picked : best).src.map(function (k) { return { org: SRC[k].org, name: SRC[k].name[l], url: SRC[k].url }; })
        };
      })
    };
  }

  var api = {
    ROUNDS: ROUNDS, SOURCES: SRC, STRINGS: STRINGS, LANGS: LANGS, PARENTS: PARENTS,
    POINTS: POINTS, MOOD: MOOD, START_MOOD: START_MOOD,
    fmt: fmt, t: t, parentName: parentName,
    create: create, isDone: isDone, parentLine: parentLine, options: options, choose: choose,
    feedback: feedback, maxScore: maxScore, ratingKey: ratingKey, endingKey: endingKey, result: result
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ScreenTalkRehearse = api;
})(this);
