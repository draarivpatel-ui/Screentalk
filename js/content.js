/*
 * ScreenTalk content: conversation-starter templates, Myth-or-Fact cards, habits, resources.
 * Every fact card cites the page it came from (accessed Oct 10, 2026).
 * English and Spanish: helpers take a language ('en' default, 'es'). Spanish is pending native-speaker review.
 */
(function (root) {
  'use strict';

  var NCI_MYTHS = 'https://www.cancer.gov/about-cancer/causes-prevention/risk/myths';
  var ACS_GUIDE = 'https://www.cancer.org/cancer/screening/american-cancer-society-guidelines-for-the-early-detection-of-cancer.html';
  var ACS_HPV = 'https://www.cancer.org/cancer/risk-prevention/hpv/acs-recommendations-for-hpv-vaccine-use.html';
  var ACS_HOW = 'https://www.cancer.org/cancer/screening/how-to-get-screened-for-cancer-if-you-dont-have-a-doctor.html';

  // Spanish pages used as sources in Spanish (checked Oct 10, 2026). Pages that only exist in
  // English keep the English link and are marked "(en inglés)".
  var NCI_MYTHS_ES = 'https://www.cancer.gov/espanol/cancer/causas-prevencion/riesgo/mitos';
  var NCI_CONTACT_ES = 'https://www.cancer.gov/espanol/contactenos';
  var ACS_HOW_ES = 'https://www.cancer.org/es/cancer/pruebas-de-deteccion/como-hacer-las-pruebas-de-deteccion-del-cancer-si-no-cuenta-con-un-proveedor-de-atencion-medica.html';
  var CDC_NBCCEDP_ES = 'https://www.cdc.gov/breast-cervical-cancer-screening/es/about/screenings.html';
  var CDC_HPV_ES = 'https://www.cdc.gov/hpv/es/vaccines/vacuna-contra-el-vph.html';

  var LANGS = ['en', 'es'];
  function lang(l) { return LANGS.indexOf(l) >= 0 ? l : 'en'; }
  function fmt(str, vars) {
    return String(str).replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] != null ? vars[k] : m; });
  }
  var NCI_NAME = { en: 'National Cancer Institute', es: 'Instituto Nacional del Cáncer' };
  var ACS_NAME = { en: 'American Cancer Society', es: 'Sociedad Americana Contra el Cáncer (en inglés)' };

  // ---------- Myth or Fact ----------
  // English fields (claim, why, src, srcName) stay as before; Spanish lives in `es`.
  var CARDS = [
    { claim: 'Cancer is contagious. You can catch it from someone who has it.', answer: 'myth',
      why: 'In general, no. Cancer does not spread person to person. Some viruses (like HPV) can spread and can sometimes lead to cancer, but the cancer itself is not contagious.', src: NCI_MYTHS, srcName: NCI_NAME.en,
      es: { claim: 'El cáncer es contagioso. Te lo puede pasar alguien que lo tiene.',
            why: 'En general, no. El cáncer no se pasa de una persona a otra. Algunos virus (como el VPH) sí se transmiten y a veces pueden causar cáncer, pero el cáncer en sí no es contagioso.', src: NCI_MYTHS_ES, srcName: NCI_NAME.es } },
    { claim: 'If nobody in my family has had cancer, I am risk-free.', answer: 'myth',
      why: 'About 39% of people will be diagnosed with cancer at some point in their lives. Most cancers come from genetic changes that happen during life, from aging and exposures like tobacco smoke.', src: NCI_MYTHS, srcName: NCI_NAME.en,
      es: { claim: 'Si nadie en mi familia ha tenido cáncer, no tengo ningún riesgo.',
            why: 'Cerca de 4 de cada 10 personas recibirán un diagnóstico de cáncer en algún momento de su vida. La mayoría de los cánceres se deben a cambios genéticos que ocurren durante la vida, por el envejecimiento y por exposiciones como el humo del tabaco.', src: NCI_MYTHS_ES, srcName: NCI_NAME.es } },
    { claim: 'Only about 5 to 10% of cancers are caused by harmful gene changes inherited from parents.', answer: 'fact',
      why: 'Right. The other 90 to 95% come from changes that happen during a person\u2019s lifetime. Family history still matters and is worth telling a doctor about.', src: NCI_MYTHS, srcName: NCI_NAME.en,
      es: { claim: 'Solo entre el 5 y el 10% de los cánceres se deben a cambios dañinos en los genes heredados de los padres.',
            why: 'Correcto. El otro 90 a 95% se debe a cambios que ocurren durante la vida de la persona. Aun así, los antecedentes familiares importan y vale la pena contárselos al médico.', src: NCI_MYTHS_ES, srcName: NCI_NAME.es } },
    { claim: 'Cell phones cause cancer.', answer: 'myth',
      why: 'Not according to the best studies so far. Cell phones give off low-frequency energy that does not damage genes.', src: NCI_MYTHS, srcName: NCI_NAME.en,
      es: { claim: 'Los teléfonos celulares causan cáncer.',
            why: 'No, según los mejores estudios hasta ahora. Los celulares emiten un tipo de energía de baja frecuencia que no daña los genes.', src: NCI_MYTHS_ES, srcName: NCI_NAME.es } },
    { claim: 'Antiperspirants and deodorants cause breast cancer.', answer: 'myth',
      why: 'The best studies so far found no evidence linking the chemicals in antiperspirants and deodorants to changes in breast tissue.', src: NCI_MYTHS, srcName: NCI_NAME.en,
      es: { claim: 'Los antitranspirantes y desodorantes causan cáncer de mama.',
            why: 'Los mejores estudios hasta ahora no han encontrado evidencia que relacione las sustancias químicas de los antitranspirantes y desodorantes con cambios en el tejido mamario.', src: NCI_MYTHS_ES, srcName: NCI_NAME.es } },
    { claim: 'Herbal products can cure cancer.', answer: 'myth',
      why: 'No herbal product has been shown to treat cancer, and some can interfere with chemotherapy or radiation. Patients should tell their doctor about any supplements.', src: NCI_MYTHS, srcName: NCI_NAME.en,
      es: { claim: 'Los productos de hierbas pueden curar el cáncer.',
            why: 'Ningún producto de hierbas ha demostrado tratar el cáncer, y algunos pueden interferir con la quimioterapia o la radioterapia. Los pacientes deben contarle a su médico sobre cualquier suplemento.', src: NCI_MYTHS_ES, srcName: NCI_NAME.es } },
    { claim: 'A cancer diagnosis is a death sentence.', answer: 'myth',
      why: 'The chance of dying from cancer in the US has dropped steadily since the 1990s. Five-year survival for some cancers, like breast, prostate, and thyroid, is 90% or better.', src: NCI_MYTHS, srcName: NCI_NAME.en,
      es: { claim: 'Un diagnóstico de cáncer es una sentencia de muerte.',
            why: 'En Estados Unidos, la probabilidad de morir por cáncer ha bajado de forma constante desde la década de 1990. La supervivencia a cinco años de algunos cánceres, como el de mama, próstata y tiroides, es del 90% o más.', src: NCI_MYTHS_ES, srcName: NCI_NAME.es } },
    { claim: 'Screening tests look for cancer before a person has any symptoms.', answer: 'fact',
      why: 'That is the point of screening: finding pre-cancers and cancers early, before they have a chance to spread.', src: ACS_GUIDE, srcName: ACS_NAME.en,
      es: { claim: 'Las pruebas de detección buscan el cáncer antes de que una persona tenga síntomas.',
            why: 'Para eso son: encontrar precánceres y cánceres temprano, antes de que tengan la oportunidad de propagarse.', src: ACS_GUIDE, srcName: ACS_NAME.es } },
    { claim: 'Colorectal cancer screening for people at average risk starts at age 50.', answer: 'myth',
      why: 'The American Cancer Society recommends starting at 45 for people at average risk.', src: ACS_GUIDE, srcName: ACS_NAME.en,
      es: { claim: 'Las pruebas de detección del cáncer colorrectal para personas con riesgo promedio empiezan a los 50 años.',
            why: 'La Sociedad Americana Contra el Cáncer recomienda empezar a los 45 años para personas con riesgo promedio.', src: ACS_GUIDE, srcName: ACS_NAME.es } },
    { claim: 'If you got the HPV vaccine, you never need cervical cancer screening.', answer: 'myth',
      why: 'People with a cervix still need regular screening after the vaccine, because it does not cover every HPV type that can cause cervical cancer.', src: ACS_HPV, srcName: ACS_NAME.en,
      es: { claim: 'Si te pusiste la vacuna contra el VPH, nunca vas a necesitar pruebas de detección del cáncer de cuello uterino.',
            why: 'Las personas con cuello uterino siguen necesitando pruebas regulares después de la vacuna, porque no cubre todos los tipos de VPH que pueden causar cáncer de cuello uterino.', src: ACS_HPV, srcName: ACS_NAME.es } },
    { claim: 'The HPV vaccine works best when given between ages 9 and 12.', answer: 'fact',
      why: 'ACS recommends 2 doses between 9 and 12, before most people are exposed to HPV. Teens and young adults through 26 who missed it should get it as soon as possible.', src: ACS_HPV, srcName: ACS_NAME.en,
      es: { claim: 'La vacuna contra el VPH funciona mejor cuando se pone entre los 9 y los 12 años.',
            why: 'La ACS recomienda 2 dosis entre los 9 y los 12 años, antes de que la mayoría de las personas estén expuestas al VPH. Adolescentes y adultos jóvenes de hasta 26 años que no la recibieron deben ponérsela lo antes posible.', src: ACS_HPV, srcName: ACS_NAME.es } },
    { claim: 'Eating sugar makes cancer grow faster.', answer: 'myth',
      why: 'No studies show eating sugar makes cancer worse. But a high-sugar diet can lead to weight gain, and obesity is linked to a higher risk of several cancers.', src: NCI_MYTHS, srcName: NCI_NAME.en,
      es: { claim: 'Comer azúcar hace que el cáncer crezca más rápido.',
            why: 'Ningún estudio ha demostrado que comer azúcar empeore el cáncer. Pero una alimentación con mucha azúcar puede causar aumento de peso, y la obesidad está asociada a un mayor riesgo de varios tipos de cáncer.', src: NCI_MYTHS_ES, srcName: NCI_NAME.es } }
  ];
  /** One card in the chosen language: { claim, answer, why, src, srcName }. */
  function card(c, l) {
    if (lang(l) === 'es' && c.es) return { claim: c.es.claim, answer: c.answer, why: c.es.why, src: c.es.src, srcName: c.es.srcName };
    return { claim: c.claim, answer: c.answer, why: c.why, src: c.src, srcName: c.srcName };
  }

  // ---------- Habits (ACS "Take control of your health") ----------
  var HABITS = [
    'Stay away from all forms of tobacco.',
    'Get to and stay at a healthy weight.',
    'Get moving with regular physical activity.',
    'Eat healthy with plenty of fruits and vegetables.',
    'It\u2019s best not to drink alcohol.',
    'Protect your skin.',
    'Know yourself, your family history, and your risks.',
    'Get regular checkups and cancer screening tests.'
  ];
  var HABITS_ES = [
    'Aléjate de todas las formas de tabaco.',
    'Llega a un peso saludable y mantenlo.',
    'Muévete con actividad física regular.',
    'Come sano, con muchas frutas y verduras.',
    'Lo mejor es no tomar alcohol.',
    'Protege tu piel.',
    'Conócete: tus antecedentes familiares y tus riesgos.',
    'Hazte chequeos regulares y pruebas de detección del cáncer.'
  ];
  function habits(l) { return lang(l) === 'es' ? HABITS_ES : HABITS; }

  // ---------- Resources ----------
  var RESOURCES = [
    { name: 'American Cancer Society 24/7 helpline', detail: '1-800-227-2345, any time of day or night', href: 'tel:18002272345',
      es: { name: 'Línea de ayuda de la Sociedad Americana Contra el Cáncer, 24/7', detail: '1-800-227-2345, a cualquier hora del día o de la noche, en inglés y español', href: 'tel:18002272345' } },
    { name: 'National Cancer Institute Cancer Information Service', detail: '1-800-4-CANCER (1-800-422-6237), plus live chat. Free and confidential.', href: 'https://www.cancer.gov/contact',
      es: { name: 'Servicio de Información de Cáncer del Instituto Nacional del Cáncer', detail: '1-800-422-6237 (1-800-4-CANCER) y chat en vivo, en español e inglés, de lunes a viernes de 9 a. m. a 9 p. m., hora del Este. Gratis y confidencial.', href: NCI_CONTACT_ES } },
    { name: 'How to get screened (even without a doctor)', detail: 'ACS guide to clinics, community health centers, and screening events', href: ACS_HOW,
      es: { name: 'Cómo hacerse las pruebas de detección (aun sin médico)', detail: 'Guía de la ACS sobre clínicas, centros de salud comunitarios y eventos de detección', href: ACS_HOW_ES } },
    { name: 'Free or low-cost breast and cervical screening', detail: 'National Breast and Cervical Cancer Early Detection Program. CDC: 1-800-232-4636', href: 'https://www.cancer.org/cancer/financial-insurance-matters/understanding-health-insurance/nbccedp.html',
      es: { name: 'Pruebas de mama y cuello uterino gratis o de bajo costo', detail: 'Programa Nacional de Detección Temprana del Cáncer de Mama y de Cuello Uterino. CDC: 1-800-232-4636', href: CDC_NBCCEDP_ES } },
    { name: 'Free vaccines for eligible kids and teens', detail: 'Vaccines for Children program (under 19), including the HPV vaccine. 1-800-232-4636', href: ACS_HPV,
      es: { name: 'Vacunas gratis para niños y adolescentes que reúnen los requisitos', detail: 'Programa Vacunas para Niños (menores de 19 años), incluida la vacuna contra el VPH. 1-800-232-4636', href: CDC_HPV_ES } },
    { name: 'Free help to quit tobacco', detail: 'ACS Empowered to Quit program, or call 1-800-227-2345', href: 'https://www.cancer.org/cancer/risk-prevention/tobacco/empowered-to-quit.html',
      es: { name: 'Ayuda gratis para dejar el tabaco', detail: 'Línea del NCI para dejar de fumar, en español e inglés: 1-877-448-7848', href: NCI_CONTACT_ES } }
  ];
  function resources(l) {
    return RESOURCES.map(function (r) { return lang(l) === 'es' && r.es ? r.es : { name: r.name, detail: r.detail, href: r.href }; });
  }

  // ---------- Conversation starters ----------
  // Short, plain-language lines a teen can say or text. Picked by topic + tone.
  var TOPIC_PHRASES = {
    en: {
      breast: 'breast cancer screening (mammograms)',
      colorectal: 'colon cancer screening',
      cervical: 'cervical cancer screening',
      lung: 'lung cancer screening',
      prostate: 'whether prostate cancer testing makes sense',
      hpv: 'the HPV vaccine'
    },
    es: {
      breast: 'la detección del cáncer de mama (mamografías)',
      colorectal: 'la detección del cáncer de colon',
      cervical: 'la detección del cáncer de cuello uterino',
      lung: 'la detección del cáncer de pulmón',
      prostate: 'si tiene sentido la prueba del cáncer de próstata',
      hpv: 'la vacuna contra el VPH'
    }
  };
  var STARTER = {
    en: {
      blank: 'there', and: 'and', nextYear: 'next year', inN: 'in {n} years',
      endo: 'ACS also says it\u2019s good to know the signs of uterine cancer after menopause, like unexpected bleeding or spotting, and to tell a doctor about them.',
      endoText: 'Hey {who} \u2764\ufe0f I\u2019ve been learning about cancer prevention. {endo} Just wanted you to know!',
      endoTalk: '{who}, I\u2019ve been learning about cancer prevention. {endo} Can we keep that in mind together?',
      nothing: 'Nothing in these ACS guidelines lines up for {who} right now. A regular checkup is still a great habit.',
      laterText: 'Hey {who}! Fun fact from my cancer-prevention project: the American Cancer Society says {topic} comes up for you {when}. Just putting it on your radar \u2764\ufe0f',
      laterTalk: 'No screening conversation is due for {who} yet, but {topic} comes up {when}. Worth a mention at the next checkup.',
      text: 'Hey {who}, random question \ud83d\ude42 I\u2019ve been learning about cancer prevention, and the American Cancer Society says it\u2019s a good time for you to ask your doctor about {list}.{extra} Have you talked to them about it? I can help find an appointment if you want!',
      heartfelt: '{who}, I\u2019ve been reading about how finding cancer early can make a real difference, and it made me think about you. The American Cancer Society guidelines say it\u2019s a good time for you to talk with your doctor about {list}.{extra} Would you be willing to bring it up at your next appointment? I\u2019d really like you around for a long time.',
      casual: 'Hey {who}, I learned something in a project: the American Cancer Society says it\u2019s a good time for you to ask your doctor about {list}.{extra} When\u2019s your next checkup? I can help you write down questions.'
    },
    es: {
      blank: 'familia', and: 'y', nextYear: 'el próximo año', inN: 'dentro de {n} años',
      endo: 'La ACS también dice que es bueno conocer las señales del cáncer de útero después de la menopausia, como sangrado o manchado inesperado, y contárselas a un médico.',
      endoText: 'Hola, {who} \u2764\ufe0f He estado aprendiendo sobre la prevención del cáncer. {endo} ¡Solo quería que lo supieras!',
      endoTalk: '{who}, he estado aprendiendo sobre la prevención del cáncer. {endo} ¿Lo tenemos presente juntos?',
      nothing: 'Nada en estas guías de la ACS aplica a {who} ahora mismo. Igual, un chequeo regular es un gran hábito.',
      laterText: '¡Hola, {who}! Un dato de mi proyecto de prevención del cáncer: la Sociedad Americana Contra el Cáncer dice que {when} será momento de hablar de {topic}. Solo para que lo tengas presente \u2764\ufe0f',
      laterTalk: 'Todavía no le toca a {who} ninguna conversación sobre pruebas de detección, pero {when} será momento de hablar de {topic}. Vale la pena mencionarlo en el próximo chequeo.',
      text: 'Hola, {who}, una pregunta \ud83d\ude42 He estado aprendiendo sobre la prevención del cáncer, y la Sociedad Americana Contra el Cáncer dice que es buen momento para que le preguntes a tu médico sobre {list}.{extra} ¿Ya lo hablaste con tu médico? ¡Si quieres, te ayudo a buscar una cita!',
      heartfelt: '{who}, he estado leyendo sobre cómo encontrar el cáncer temprano puede hacer una gran diferencia, y pensé en ti. Las guías de la Sociedad Americana Contra el Cáncer dicen que es buen momento para que hables con tu médico sobre {list}.{extra} ¿Te animas a mencionarlo en tu próxima cita? Quiero tenerte conmigo por mucho tiempo.',
      casual: 'Hola, {who}, aprendí algo en un proyecto: la Sociedad Americana Contra el Cáncer dice que es buen momento para que le preguntes a tu médico sobre {list}.{extra} ¿Cuándo es tu próximo chequeo? Te puedo ayudar a escribir tus preguntas.'
    }
  };

  function joinList(items, l) {
    var and = STARTER[lang(l)].and;
    if (items.length <= 1) return items.join('');
    if (items.length === 2) return items[0] + ' ' + and + ' ' + items[1];
    // English keeps the serial comma; Spanish does not use one.
    return items.slice(0, -1).join(', ') + (lang(l) === 'es' ? ' ' : ', ') + and + ' ' + items[items.length - 1];
  }

  function phrase(t, l) { return TOPIC_PHRASES[lang(l)][t.key] || t.title.toLowerCase(); }

  /**
   * Build a conversation starter for one person.
   * Only "Talk now" and "Discuss" topics are named as things to ask about. Awareness items
   * (endometrial) get their own gentle line; topics that do not apply as entered are left out.
   * tone: 'casual' | 'heartfelt' | 'text'; l: 'en' (default) | 'es'
   */
  function starter(label, topics, tone, l) {
    l = lang(l);
    var S = STARTER[l];
    topics = topics || [];
    var who = String(label || '').trim() || S.blank;
    var ask = topics.filter(function (t) { return t.status === 'talk-now' || t.status === 'option'; });
    var endo = topics.some(function (t) { return t.key === 'endometrial'; });

    if (!ask.length) {
      if (endo) return fmt(tone === 'text' ? S.endoText : S.endoTalk, { who: who, endo: S.endo });
      var next = topics.filter(function (t) { return t.status === 'upcoming'; })[0];
      if (!next) return fmt(S.nothing, { who: who });
      var when = next.startsIn === 1 ? S.nextYear : fmt(S.inN, { n: next.startsIn });
      return fmt(tone === 'text' ? S.laterText : S.laterTalk, { who: who, topic: phrase(next, l), when: when });
    }
    var vars = { who: who, list: joinList(ask.map(function (t) { return phrase(t, l); }), l), extra: endo ? ' ' + S.endo : '' };
    if (tone === 'text') return fmt(S.text, vars);
    if (tone === 'heartfelt') return fmt(S.heartfelt, vars);
    return fmt(S.casual, vars);
  }

  // ---------- Questions to bring to a checkup ----------
  var QUESTIONS = {
    en: {
      breastOption: 'Should I start yearly mammograms now, or wait until 45?',
      breastNow: 'When was my last mammogram, and when should the next one be?',
      crcNow: 'Which colorectal screening test fits me: a stool test I can do at home, or a colonoscopy?',
      crcOption: 'At my age and health, should I keep getting colorectal screening?',
      cxNow: 'Am I up to date on cervical screening, and is an HPV test right for me?',
      cxOption: 'Have my past cervical tests been normal enough to stop screening?',
      endo: 'What signs of uterine cancer should I watch for after menopause?',
      lungNow: 'Does a yearly low-dose CT scan for lung cancer make sense for me? What are the benefits and harms?',
      lungInfo: 'Can you help me work out my pack-years for lung screening?',
      quit: 'What help is available to quit smoking?',
      prostate: 'What are the pros and cons of a PSA test for me?',
      hpv: 'Is my HPV vaccine series complete?',
      family: 'With our family history, should my screening plan be different from the average-risk guidelines?'
    },
    es: {
      breastOption: '¿Debo empezar a hacerme una mamografía cada año ahora, o esperar hasta los 45?',
      breastNow: '¿Cuándo fue mi última mamografía y cuándo debería ser la siguiente?',
      crcNow: '¿Qué prueba de detección colorrectal me conviene: una prueba de heces que puedo hacer en casa o una colonoscopia?',
      crcOption: 'Con mi edad y mi salud, ¿debo seguir haciéndome pruebas de detección colorrectal?',
      cxNow: '¿Estoy al día con las pruebas de detección del cáncer de cuello uterino? ¿Me conviene la prueba del VPH?',
      cxOption: '¿Mis pruebas anteriores de cuello uterino han sido normales para poder dejar de hacérmelas?',
      endo: '¿Qué señales del cáncer de útero debo vigilar después de la menopausia?',
      lungNow: '¿Tiene sentido para mí una tomografía computarizada de baja dosis cada año para detectar el cáncer de pulmón? ¿Cuáles son los beneficios y los daños?',
      lungInfo: '¿Me puede ayudar a calcular mis paquetes-año para la detección del cáncer de pulmón?',
      quit: '¿Qué ayuda hay para dejar de fumar?',
      prostate: '¿Cuáles son los pros y los contras de la prueba del PSA en mi caso?',
      hpv: '¿Está completa mi serie de la vacuna contra el VPH?',
      family: 'Con nuestros antecedentes familiares, ¿mi plan de pruebas de detección debería ser diferente al de las guías para riesgo promedio?'
    }
  };
  function questions(person, topics, l) {
    var Q = QUESTIONS[lang(l)];
    var out = [];
    (topics || []).forEach(function (t) {
      var s = t.status;
      if (t.key === 'breast' && s === 'option') out.push(Q.breastOption);
      if (t.key === 'breast' && s === 'talk-now') out.push(Q.breastNow);
      if (t.key === 'colorectal' && s === 'talk-now') out.push(Q.crcNow);
      if (t.key === 'colorectal' && s === 'option') out.push(Q.crcOption);
      if (t.key === 'cervical' && s === 'talk-now') out.push(Q.cxNow);
      if (t.key === 'cervical' && s === 'option') out.push(Q.cxOption);
      if (t.key === 'endometrial') out.push(Q.endo);
      if (t.key === 'lung' && s === 'talk-now') out.push(Q.lungNow);
      if (t.key === 'lung' && s === 'info') out.push(Q.lungInfo);
      if (t.key === 'lung' && t.extra) out.push(Q.quit);
      if (t.key === 'prostate' && s === 'option') out.push(Q.prostate);
      if (t.key === 'hpv') out.push(Q.hpv);
    });
    if (person && person.familyHistory) out.push(Q.family);
    return out;
  }

  // ---------- Progress tracker ----------
  var PROGRESS = [
    { value: 'not-started', label: 'Not talked yet', es: 'Todavía no lo hablamos' },
    { value: 'talked', label: 'We talked about it', es: 'Ya lo hablamos' },
    { value: 'booked', label: 'Checkup booked', es: 'Cita programada' },
    { value: 'done', label: 'Up to date', es: 'Al día' }
  ];
  function progressLabel(p, l) { return lang(l) === 'es' ? p.es : p.label; }

  // ---------- Saved-data hygiene ----------
  function str(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, '').trim().slice(0, max); }
  function numStr(v, lo, hi) {
    if (v === '' || v == null) return '';
    var n = Number(v);
    return isFinite(n) && n >= lo && n <= hi ? String(n) : '';
  }
  /** Clean one saved person so bad or old localStorage data can never break the page. */
  function sanitizePerson(raw, packYearsFn) {
    raw = raw && typeof raw === 'object' ? raw : {};
    var age = parseInt(raw.age, 10);
    var smoking = raw.smoking === 'never' || raw.smoking === 'former' || raw.smoking === 'current' ? raw.smoking : (raw.smokes ? 'current' : 'never');
    var fam = raw.prostateFamily === 'none' || raw.prostateFamily === 'one' || raw.prostateFamily === 'multiple' ? raw.prostateFamily : (raw.fatherBrotherProstateUnder65 ? 'one' : 'none');
    var p = {
      id: str(raw.id, 40) || 'p' + Math.random().toString(36).slice(2, 10),
      label: str(raw.label, 24) || 'Family member',
      age: age >= 0 && age <= 120 ? age : 0,
      breasts: !!raw.breasts, cervix: !!raw.cervix,
      uterus: typeof raw.uterus === 'boolean' ? raw.uterus : !!raw.cervix,
      prostate: !!raw.prostate, menopause: !!raw.menopause,
      smoking: smoking,
      ppd: numStr(raw.ppd, 0, 10), years: numStr(raw.years, 0, 120),
      quitYears: smoking === 'former' ? numStr(raw.quitYears, 0, 120) : '',
      africanAmerican: !!raw.africanAmerican, prostateFamily: fam,
      familyHistory: !!raw.familyHistory,
      progress: PROGRESS.some(function (x) { return x.value === raw.progress; }) ? raw.progress : 'not-started'
    };
    if (!p.uterus && !p.cervix) p.menopause = false;
    if (p.quitYears !== '' && Number(p.quitYears) > p.age) p.quitYears = '';
    var py = packYearsFn ? packYearsFn(p.ppd, p.years) : 0;
    p.packYears = smoking === 'never' ? 0 : (py || (Number(raw.packYears) >= 0 && Number(raw.packYears) <= 400 ? Number(raw.packYears) : 0));
    return p;
  }

  // ---------- Calendar reminder (.ics), built on the device ----------
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function icsDate(d) { return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()); }
  function icsStamp(d) { return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z'; }
  function icsEscape(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
  function fold(line) {
    var out = [];
    while (line.length > 74) { out.push(line.slice(0, 74)); line = ' ' + line.slice(74); }
    out.push(line);
    return out.join('\r\n');
  }
  /** opts = { title, description, date (Date, all-day), now (Date), uid } */
  function buildICS(opts) {
    var day = opts.date, next = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
    var lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ScreenTalk//Family screening reminder//EN', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:' + (opts.uid || 'screentalk') + '@screentalk.local',
      'DTSTAMP:' + icsStamp(opts.now || new Date()),
      'DTSTART;VALUE=DATE:' + icsDate(day),
      'DTEND;VALUE=DATE:' + icsDate(next),
      'SUMMARY:' + icsEscape(opts.title),
      'DESCRIPTION:' + icsEscape(opts.description || ''),
      'END:VEVENT', 'END:VCALENDAR'
    ];
    return lines.map(fold).join('\r\n') + '\r\n';
  }


  // ---------- One-page checkup sheet (printable) ----------
  var SHEET = {
    en: {
      status: { 'talk-now': 'ACS recommends now', 'option': 'A choice to discuss', 'info': 'Good to know', 'upcoming': 'Coming up', 'past': 'Past the ACS age range' },
      tests: {
        breast: 'Mammogram', colorectal: 'Stool test (FIT) or colonoscopy', cervical: 'HPV test or Pap test',
        lung: 'Low-dose CT scan', prostate: 'PSA blood test (if chosen)', hpv: 'HPV vaccine doses', endometrial: 'Any unexpected bleeding?'
      },
      title: 'Checkup sheet: {name}, age {age}', blankName: 'Family member', later: '{title} at {age}',
      current: 'Smokes now', former: 'Used to smoke',
      pyLine: ' \u00b7 about {py} pack-years', pyDetail1: ' ({ppd} pack a day for {years} years)', pyDetailN: ' ({ppd} packs a day for {years} years)',
      pyMissing: ' \u00b7 pack-years not entered',
      quitLine: ' \u00b7 quit {n} ago', yr1: '1 year', yrN: '{n} years', yr0: 'less than a year',
      costTag: 'No copay*',
      costNote: '* No copay: most health plans must cover these screenings with no copay or deductible from an in-network provider ($0 is not guaranteed; check the plan).',
      costLungFormer: ' For lung screening in people who used to smoke, this applies if they quit in the past 15 years.',
      costLungQuitIn: ' For lung screening, they quit {n} ago, within 15 years, so this applies.',
      footer: 'Made with ScreenTalk. General American Cancer Society guidelines for people at average risk with no symptoms. Education only, not medical advice. Anyone with symptoms should see a provider.'
    },
    es: {
      status: { 'talk-now': 'La ACS lo recomienda ahora', 'option': 'Una opción para conversar', 'info': 'Bueno saberlo', 'upcoming': 'Más adelante', 'past': 'Fuera del rango de edad de la ACS' },
      tests: {
        breast: 'Mamografía', colorectal: 'Prueba de heces (FIT) o colonoscopia', cervical: 'Prueba del VPH o de Papanicoláu',
        lung: 'TC de baja dosis', prostate: 'Prueba de sangre del PSA (si se elige)', hpv: 'Dosis de la vacuna contra el VPH', endometrial: '¿Algún sangrado inesperado?'
      },
      title: 'Hoja para el chequeo: {name}, {age} años', blankName: 'Familiar', later: '{title} a los {age}',
      current: 'Fuma actualmente', former: 'Fumaba antes',
      pyLine: ' \u00b7 unos {py} paquetes-año', pyDetail1: ' ({ppd} paquete al día durante {years} años)', pyDetailN: ' ({ppd} paquetes al día durante {years} años)',
      pyMissing: ' \u00b7 paquetes-año sin escribir',
      quitLine: ' \u00b7 dejó de fumar hace {n}', yr1: '1 año', yrN: '{n} años', yr0: 'menos de un año',
      costTag: 'Sin copago*',
      costNote: '* Sin copago: la mayoría de los planes de salud deben cubrir estas pruebas de detección sin copago ni deducible con un proveedor de la red (no siempre cuesta $0; conviene confirmarlo con el plan).',
      costLungFormer: ' Para la detección del cáncer de pulmón en quienes fumaron, aplica si dejaron de fumar en los últimos 15 años.',
      costLungQuitIn: ' Para la detección del cáncer de pulmón, dejó de fumar hace {n}, dentro de los últimos 15 años, así que aplica.',
      footer: 'Hecho con ScreenTalk. Guías generales de la Sociedad Americana Contra el Cáncer para personas con riesgo promedio y sin síntomas. Solo para educación, no es consejo médico. Cualquier persona con síntomas debe consultar a un proveedor de atención médica.'
    }
  };
  var SHEET_STATUS = SHEET.en.status;
  /**
   * Data for a one-page sheet to bring to a checkup. Pure data, so it can be tested in Node.
   * rows   = topics to bring up now (talk-now, option, info), each with a fill-in "last test" row
   * later  = topics whose ACS window starts later, as "Breast cancer screening at 40"
   * smoking = a plain line with pack-years, since providers ask for it for lung screening
   * Pass the result of evaluate(person, l) in the same language l.
   */
  function checkupSheet(person, result, l) {
    l = lang(l);
    var S = SHEET[l];
    person = person || {};
    result = result || { topics: [], notes: [] };
    var age = Number(person.age) || 0;
    var rows = [], later = [];
    (result.topics || []).forEach(function (t) {
      if (t.status === 'upcoming') {
        later.push(fmt(S.later, { title: t.title, age: age + (t.startsIn || 0) }));
      } else if (t.status !== 'past') {
        rows.push({ key: t.key, title: t.title, status: t.status, statusLabel: S.status[t.status] || '', test: S.tests[t.key] || '', summary: t.summary, source: t.source,
          uspstf: t.uspstf ? { text: t.uspstf.text, differs: !!t.uspstf.differs } : null, cost: t.cost ? t.cost.text : '', costTag: t.cost ? S.costTag : '' });
      }
    });
    var smoking = '';
    var q = person.smoking === 'former' && person.quitYears !== '' && person.quitYears != null ? Number(person.quitYears) : NaN;
    var quitSpan = q >= 0 ? (q < 1 ? S.yr0 : q === 1 ? S.yr1 : fmt(S.yrN, { n: q })) : '';
    if (person.smoking === 'former' || person.smoking === 'current') {
      var py = Number(person.packYears) || 0;
      smoking = (person.smoking === 'current' ? S.current : S.former) +
        (py > 0 ? fmt(S.pyLine, { py: py }) + (person.ppd && person.years ? fmt(Number(person.ppd) === 1 ? S.pyDetail1 : S.pyDetailN, { ppd: person.ppd, years: person.years }) : '') : S.pyMissing) +
        (quitSpan ? fmt(S.quitLine, { n: quitSpan }) : '');
    }
    var lungCost = rows.some(function (r) { return r.key === 'lung' && r.cost; });
    return {
      title: fmt(S.title, { name: String(person.label || '').trim() || S.blankName, age: age }),
      rows: rows,
      later: later,
      questions: questions(person, result.topics, l),
      smoking: smoking,
      // One no-copay note under the table (rows only carry a short tag) so the sheet stays on one page
      costNote: rows.some(function (r) { return r.cost; }) ? S.costNote + (person.smoking === 'former' && lungCost ? (quitSpan ? fmt(S.costLungQuitIn, { n: quitSpan }) : S.costLungFormer) : '') : '',
      familyHistory: !!person.familyHistory,
      notes: (result.notes || []).slice(),
      footer: S.footer
    };
  }

  var api = {
    CARDS: CARDS, HABITS: HABITS, HABITS_ES: HABITS_ES, RESOURCES: RESOURCES, PROGRESS: PROGRESS, LANGS: LANGS,
    STARTER: STARTER, TOPIC_PHRASES: TOPIC_PHRASES, QUESTIONS: QUESTIONS, SHEET: SHEET, SHEET_STATUS: SHEET_STATUS,
    card: card, habits: habits, resources: resources, progressLabel: progressLabel,
    starter: starter, joinList: joinList, questions: questions, sanitizePerson: sanitizePerson, buildICS: buildICS, checkupSheet: checkupSheet
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ScreenTalkContent = api;
})(typeof window !== 'undefined' ? window : this);
