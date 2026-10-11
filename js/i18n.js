/*
 * ScreenTalk i18n: one language for the whole page (English or Spanish).
 * Same pattern as the rehearsal: STRINGS[lang][key], t(lang, key), fmt('{name}', vars).
 * Static text in index.html carries data-i18n (text), data-i18n-html (trusted markup from this
 * file only), or data-i18n-attr="placeholder:key;aria-label:key".
 * Spanish: neutral Latin American Spanish; medical terms follow the CDC and NCI Spanish pages
 * (docs/glossary-es.md). Pending review by a native speaker.
 * Works in the browser (window.ScreenTalkI18n) and in Node (module.exports) for tests.
 */
(function (root) {
  'use strict';

  var ACS_GUIDE = 'https://www.cancer.org/cancer/screening/american-cancer-society-guidelines-for-the-early-detection-of-cancer.html';
  var ACS_HPV = 'https://www.cancer.org/cancer/risk-prevention/hpv/acs-recommendations-for-hpv-vaccine-use.html';
  var NCI_MYTHS = 'https://www.cancer.gov/about-cancer/causes-prevention/risk/myths';
  // CDC NCCDPHP page, read Oct 10, 2026: "In 2022, 61% of U.S. adults aged 45 to 75 were up-to-date with colorectal cancer screening."
  var CDC_CRC_STAT = 'https://www.cdc.gov/nccdphp/priorities/colorectal-cancer.html';
  var A = function (href, text) { return '<a href="' + href + '" target="_blank" rel="noopener noreferrer">' + text + '</a>'; };

  var STRINGS = {
    en: {
      // ---- page
      docTitle: 'ScreenTalk: help your family get cancer screening on time',
      docDesc: 'ScreenTalk helps teens turn American Cancer Society screening guidelines into a family plan and a conversation starter. Free, private, no sign-up.',
      skip: 'Skip to content', navLabel: 'Sections',
      navPlan: 'Family plan', navTalk: 'Start the talk', navRehearse: 'Rehearse', navGame: 'Myth or Fact', navHabits: 'Habits', navHelp: 'Get help',
      langChanged: 'Language: English',
      printHeadA: 'ScreenTalk family screening plan',
      printHeadB: 'Bring this to a checkup. Based on American Cancer Society guidelines for people at average risk. Not medical advice.',
      // ---- hero
      heroEyebrow: 'Prevention &amp; Education · built by a teen, for teens',
      heroH1: 'You can\u2019t order your parents a colonoscopy.<br /><span>But you can start the conversation.</span>',
      heroLead: 'Screening tests can find some cancers early, before symptoms, when they are easier to treat. ScreenTalk turns the American Cancer Society (ACS) guidelines into a simple plan for the people you love, then helps you bring it up.',
      heroStat: 'In 2022, only 61% of U.S. adults ages 45 to 75 were up to date with colorectal cancer screening, so about 4 in 10 were behind (' + A(CDC_CRC_STAT, 'CDC') + ').',
      heroBtnPlan: 'Build my family plan', heroBtnGame: 'Play Myth or Fact',
      trust1: 'Nothing leaves your device', trust2: 'Every fact links to ACS, NCI, or CDC', trust3: 'Education, not a diagnosis',
      howAria: 'How it works',
      how1: '<strong>Add family members</strong> by nickname and age. No names, no accounts.',
      how2: '<strong>See what ACS recommends</strong> for each person: talk now, a choice to discuss, or coming up later.',
      how3: '<strong>Get a conversation starter</strong> you can say at dinner or send as a text.',
      how4: '<strong>Print a one-page checkup sheet</strong> for each person, with questions and blanks to fill in at the appointment.',
      disclaimer: '<strong>Important:</strong> ScreenTalk shares general ACS guidelines for people at <em>average risk</em> with <em>no symptoms</em>. It does not diagnose, estimate anyone\u2019s risk, or replace a healthcare provider. Anyone with symptoms or a strong family history should talk with a provider.',
      reviewNote: 'Also in Spanish (Español, top of the page). The Spanish version is waiting for review by a native speaker; its medical terms follow the CDC and NCI Spanish pages.',
      // ---- plan form
      planH2: '1 · Your family screening plan',
      planP: 'Add the adults in your life. Use nicknames like \u201cMom\u201d or \u201cNana\u201d. Everything is saved only in this browser.',
      formAdd: 'Add a family member', formEdit: 'Edit {name}',
      lblNickname: 'Nickname', lblAge: 'Age', phNickname: 'Mom',
      legendBody: 'Body <span class="legend-note">(decides which screenings apply)</span>', quickAria: 'Quick choices',
      presetFemale: 'Female', presetMale: 'Male', presetCustom: 'Choose myself',
      chkBreasts: 'Has breast tissue', chkCervix: 'Has a cervix', chkUterus: 'Has a uterus', chkProstate: 'Has a prostate', chkMeno: 'Has reached menopause',
      hintHyst: 'Total hysterectomy (uterus and cervix removed, not for cancer)? ACS says cervical screening stops, so uncheck both. After a partial hysterectomy the cervix stays.',
      legendSmoking: 'Smoking', smokeNever: 'Never smoked', smokeFormer: 'Used to smoke', smokeCurrent: 'Smokes now',
      lblPpd: 'Packs per day', lblYears: 'Years smoked', pyUnit: 'pack-years',
      hintPy: 'A pack-year is 1 pack (about 20 cigarettes) a day for a year (ACS). Rough numbers are fine.',
      lblQuit: 'Years since quitting <span class="legend-note">(optional)</span>',
      hintQuit: 'USPSTF lung screening stops once someone has not smoked for 15 years. ACS has no such limit.',
      errQuit: 'Years since quitting plus years smoked can\u2019t be more than their age.',
      legendFh: 'Family history <span class="legend-note">(optional)</span>',
      chkFh: 'Family history of cancer or a known inherited condition', chkAa: 'Is African American',
      lblPfam: 'Father or brother with prostate cancer before 65', optNone: 'No / not sure', optOne: 'One', optMulti: 'More than one',
      hintFh: 'These only change which ACS guideline note we show. We never calculate risk.',
      saveAdd: 'Add to plan', saveEdit: 'Save changes', cancel: 'Cancel',
      errNick: 'Add a nickname (like \u201cDad\u201d).', errAge: 'Enter a whole-number age from 0 to 120.',
      errBody: 'Pick Female, Male, or check the body parts that apply, so we know which screenings to show.',
      errPpd: 'Packs per day should be between 0 and 10.', errYears: 'Years smoked can\u2019t be more than their age.',
      added: 'Added {name}.', updated: 'Updated {name}.', removed: 'Removed {name}.', removeConfirm: 'Remove {name} from your plan?',
      // ---- plan output
      checkedLine: 'Guidelines last checked: October 2026 (ACS pages on Oct 10, 2026, with each page\u2019s own revision date on its topic; USPSTF and HealthCare.gov on Oct 11, 2026).',
      planNote: 'These are general ACS guidelines for people at <strong>average risk</strong> with <strong>no symptoms</strong>. Anyone with symptoms should see a provider, whatever their age. Each topic also shows what the U.S. Preventive Services Task Force (USPSTF), which many doctors and insurance plans follow, says, and whether it differs from ACS.',
      empty: '<strong>No one added yet.</strong> Add someone with the form, or load a made-up demo family to see how it works.',
      demoBtn: 'Load demo family', printBtn: 'Print / save as PDF', clearBtn: 'Clear all data',
      status: { 'talk-now': 'Talk now', 'option': 'Discuss', 'upcoming': 'Coming up', 'info': 'Good to know', 'past': 'Past range' },
      ageLine: '\u00b7 age {age}', cardAria: '{name}, age {age}',
      edit: 'Edit', editAria: 'Edit {name}', remove: 'Remove', removeAria: 'Remove {name}', progress: 'Progress', progressChanged: '{name}: {status}.',
      sheetBtn: '\ud83e\ude7a Checkup sheet', sheetAria: 'Print a one-page checkup sheet for {name}',
      remindBtn: '\ud83d\udcc5 Remind me in 2 weeks', remindAria: 'Download a calendar reminder to check in with {name}',
      moreAcs: 'More from ACS', quitHelp: 'Free quit help', readAcs: 'Read the ACS guideline \u2197', readEs: '',
      usSame: 'Same as ACS', usDiff: 'Differs from ACS', usLink: 'USPSTF \u2197', costLink: 'HealthCare.gov \u2197',
      talkWithBtn: 'Start the talk with {name}', talkWithAria: 'Write a conversation starter for {name}',
      questionsSummary: 'Questions to bring to the next checkup ({n})',
      icsTitle: 'Check in with {name} about cancer screening', icsDesc: 'Check in with {name} about cancer screening.',
      icsTopics: ' Topics from the American Cancer Society guidelines: {list}.', icsTail: ' Made with ScreenTalk. Education only, not medical advice.',
      icsFile: 'reminder', icsDone: 'Calendar reminder downloaded. Open it to add it to your calendar.',
      statPeople1: 'person in your plan', statPeopleN: 'people in your plan', statTalk1: 'topic to talk about now', statTalkN: 'topics to talk about now',
      statOf: '{a} of {b}', statMoving: 'have talked, booked, or are up to date',
      soonest1: 'Next one coming up: {topic} for {who} in 1 year.', soonestN: 'Next one coming up: {topic} for {who} in {n} years.',
      clearConfirm: 'Delete your whole plan and habit checks from this browser?', cleared: 'All ScreenTalk data was deleted from this browser.',
      demoNames: ['Mom', 'Dad', 'Nana', 'Big sis'], demoLoaded: 'Loaded a made-up demo family of 4.',
      // ---- timeline
      tlH2: 'Family timeline',
      tlP: 'When each ACS guideline applies. <strong>Solid</strong> = ACS recommends it. <strong>Lighter</strong> = a choice to discuss with a provider. \u25bc = age today. \u201c90+\u201d bars continue while ACS says screening still makes sense for that person\u2019s health.',
      tlTextAria: 'Timeline in words',
      band: { breast: 'Breast', colorectal: 'Colorectal', cervical: 'Cervical', lung: 'Lung', prostate: 'Prostate talk' }, bandShortProstate: 'Prostate',
      tlSoft: ' (a choice to discuss)', tlSolid: ' (recommended)', tlAge: 'Age', tlAgeArrow: 'Age \u2192', tlEmpty: 'No screening windows yet',
      tlLine: '{name}, age {age}: {list}.', tlNoneWords: 'no screening windows shown',
      legendSoft: 'Lighter = a choice to discuss with a provider', legendAge: 'Age today',
      // ---- talk
      talkH2: '2 · Start the talk', talkP: 'Health talks are awkward. Pick a person and a style, then say it out loud or send it.',
      lblWho: 'Who', lblStyle: 'Style', lblDocLang: 'Write it in', docLangAuto: 'Same as the app', docLangHint: 'Teens often write for a parent who reads a different language. This sets the language of the message and of the printed checkup sheet; the rest of the app stays as it is.', docLangSet: 'Message and checkup sheet will be in English.', toneCasual: 'Casual (at dinner)', toneHeart: 'Heartfelt', toneText: 'Text message',
      talkLabel: 'Your message <span class="legend-note">(edit it so it sounds like you)</span>',
      talkEmptyOpt: 'Add someone to your plan first', talkEmpty: 'Add someone to your plan first, then pick a style.',
      copy: 'Copy', share: 'Share\u2026', copied: 'Copied!', copyFail: 'Couldn\u2019t copy automatically. Select the text and copy it.',
      shareFail: 'Sharing isn\u2019t supported in this browser. Use Copy instead.',
      tipsSummary: 'Tips that make it easier',
      tip1: 'Pick a calm moment, not right after bad news or during an argument.',
      tip2: 'Lead with care: \u201cI want you around for a long time.\u201d',
      tip3: 'Offer one concrete thing: find the clinic number, sit with them while they call, or set a reminder.',
      tip4: 'If they say no, that is okay. You planted the idea. Try again in a few weeks.',
      // ---- rehearse (section head; the simulator has its own strings in rehearse.js)
      rhH2: 'Rehearse the talk',
      rhP: 'Practice with a parent who pushes back: \u201cI feel fine,\u201d \u201ctoo expensive,\u201d \u201cscared of a colonoscopy,\u201d \u201cno family history,\u201d \u201cno time.\u201d Every coaching tip is backed by ACS, NCI, or CDC. In English or Spanish.',
      // ---- game
      gameH2: '3 · Myth or Fact?', gameP: 'Twelve claims you have probably heard. Each answer links to the source.',
      gameCard: 'Card {n} of {t}', gameScore: 'Score: {s}', btnMyth: 'Myth', btnFact: 'Fact', srcLabel: 'Source:',
      gameNext: 'Next card \u2192', gameSeeScore: 'See my score \u2192', correct: 'Correct! ', notQuite: 'Not quite. ',
      itsMyth: 'It\u2019s a myth.', itsFact: 'It\u2019s a fact.',
      gameFinal: 'You got {s} of {t} right', gamePerfect: '. Perfect score!', gameNice: '. Nice work!', gameKnow: '. Now you know the facts.',
      gameDone: 'Done!', gameShare: 'Share the one that surprised you most with someone at home.', gameRestart: 'Play again',
      // ---- habits
      habitsH2: '4 · Habits for you, starting now',
      habitsP: 'Screening is for adults, but prevention starts in your teens. These are the ACS steps to help reduce cancer risk. Check the ones you\u2019ll commit to.',
      habitCount: 'You\u2019ve committed to {n} of {t} habits.',
      habitsSrc: 'Source: \u201cTake control of your health\u201d in the ' + A(ACS_GUIDE, 'ACS screening guidelines') + '. One more for teens: ACS says anyone 13 through 26 who hasn\u2019t finished the HPV vaccine should get it as soon as possible (' + A(ACS_HPV, 'ACS HPV vaccines') + ').',
      // ---- help + footer
      helpH2: 'Get help and get screened', helpP: 'Free, trusted places to call or visit, including options without insurance or a doctor.',
      footer: '<strong>ScreenTalk</strong> is an educational project for the 2026 International CodeTheCure Hackathon (Prevention &amp; Education). Content summarizes the ' + A(ACS_GUIDE, 'ACS Guidelines for the Early Detection of Cancer') + ' (revised May 27, 2026), ' + A(ACS_HPV, 'ACS HPV Vaccines') + ' (revised Sep 3, 2026), ' + A(NCI_MYTHS, 'NCI Common Cancer Myths') + ', and, for the rehearsal coaching tips, CDC pages on ' + A('https://www.cdc.gov/colorectal-cancer/screening/index.html', 'colorectal screening') + ', ' + A('https://www.cdc.gov/colorectal-cancer/symptoms/index.html', 'colorectal symptoms') + ', and ' + A('https://www.cdc.gov/breast-cancer/screening/index.html', 'breast screening') + '. Each screening topic is cross-checked with the ' + A('https://www.uspreventiveservicestaskforce.org/uspstf/recommendation-topics', 'USPSTF recommendations') + ' (breast 2024, colorectal and lung 2021, cervical and prostate 2018, with updates in progress), and the no-copay rule comes from ' + A('https://www.healthcare.gov/preventive-care-adults/', 'HealthCare.gov') + '. Every guideline and tip was checked against the live ACS, NCI, and CDC pages on October 10, 2026, and against USPSTF and HealthCare.gov on October 11, 2026. The Spanish version uses the medical terms of the CDC and NCI Spanish pages and is waiting for review by a native speaker. Not affiliated with or endorsed by ACS, NCI, or CDC. Not medical advice. Guidelines are for the United States.',
      // ---- checkup sheet (printed)
      sheetPrinted: 'Printed {date}', sheetAppt: 'Appointment date: ________________',
      sheetIntro: 'Bring this to the next checkup. Fill in what you know before the visit, then write down what the provider says.',
      sheetTopics: 'Screenings to bring up', sheetTh: ['Topic', 'ACS guideline', 'Last test (date)', 'Result', 'Next due'],
      sheetNothing: 'Nothing in these ACS guidelines lines up right now. A regular checkup is still a great habit.',
      sheetLater: 'Coming up later: ', sheetSmoke: 'Smoking history: ', sheetSmokeTail: '. Providers use pack-years to decide about lung screening.',
      sheetQs: 'Questions to ask', sheetFh: 'Family history to mention', sheetFhTh: ['Relative', 'Type of cancer', 'Age when diagnosed'],
      sheetSaid: 'What the provider said', sheetGuides: ' Guidelines: cancer.org/screening \u00b7 USPSTF: uspreventiveservicestaskforce.org \u00b7 Cost: healthcare.gov', sheetOpening: 'Opening a one-page checkup sheet for {name}.'
    },
    es: {
      docTitle: 'ScreenTalk: ayuda a tu familia a hacerse las pruebas de detección del cáncer a tiempo',
      docDesc: 'ScreenTalk ayuda a adolescentes a convertir las guías de detección de la Sociedad Americana Contra el Cáncer en un plan familiar y una forma de empezar la conversación. Gratis, privado y sin registro.',
      skip: 'Saltar al contenido', navLabel: 'Secciones',
      navPlan: 'Plan familiar', navTalk: 'Inicia la conversación', navRehearse: 'Practica', navGame: '¿Mito o realidad?', navHabits: 'Hábitos', navHelp: 'Ayuda',
      langChanged: 'Idioma: español',
      printHeadA: 'Plan familiar de detección de ScreenTalk',
      printHeadB: 'Lleva esto a un chequeo. Basado en las guías de la Sociedad Americana Contra el Cáncer para personas con riesgo promedio. No es consejo médico.',
      heroEyebrow: 'Prevención y educación · hecho por un adolescente, para adolescentes',
      heroH1: 'No puedes pedirles una colonoscopia a tus papás.<br /><span>Pero sí puedes empezar la conversación.</span>',
      heroLead: 'Las pruebas de detección pueden encontrar algunos cánceres temprano, antes de que haya síntomas, cuando son más fáciles de tratar. ScreenTalk convierte las guías de la Sociedad Americana Contra el Cáncer (ACS) en un plan sencillo para las personas que quieres y luego te ayuda a sacar el tema.',
      heroStat: 'En 2022, solo el 61% de los adultos de 45 a 75 años en EE. UU. estaba al día con las pruebas de detección del cáncer colorrectal; es decir, cerca de 4 de cada 10 estaban atrasados (' + A(CDC_CRC_STAT, 'CDC, en inglés') + ').',
      heroBtnPlan: 'Crear mi plan familiar', heroBtnGame: 'Jugar ¿Mito o realidad?',
      trust1: 'Nada sale de tu dispositivo', trust2: 'Cada dato enlaza a la ACS, el NCI o los CDC', trust3: 'Educación, no un diagnóstico',
      howAria: 'Cómo funciona',
      how1: '<strong>Agrega a tus familiares</strong> con un apodo y la edad. Sin nombres ni cuentas.',
      how2: '<strong>Mira lo que recomienda la ACS</strong> para cada persona: hablar ahora, una opción para conversar o algo para más adelante.',
      how3: '<strong>Recibe una forma de empezar la conversación</strong> que puedes decir en la cena o enviar por mensaje.',
      how4: '<strong>Imprime una hoja de una página para el chequeo</strong> de cada persona, con preguntas y espacios para llenar en la cita.',
      disclaimer: '<strong>Importante:</strong> ScreenTalk comparte las guías generales de la ACS para personas con <em>riesgo promedio</em> y <em>sin síntomas</em>. No diagnostica, no calcula el riesgo de nadie y no reemplaza a un proveedor de atención médica. Cualquier persona con síntomas o con antecedentes familiares importantes debe hablar con un proveedor.',
      reviewNote: 'Versión en español pendiente de revisión por un hablante nativo. Los términos médicos siguen las páginas en español de los CDC y del Instituto Nacional del Cáncer (NCI). Las guías de la ACS que resume esta página están en inglés.',
      planH2: '1 · El plan de detección de tu familia',
      planP: 'Agrega a los adultos de tu vida. Usa apodos como \u201cMamá\u201d o \u201cAbue\u201d. Todo se guarda solo en este navegador.',
      formAdd: 'Agregar a un familiar', formEdit: 'Editar a {name}',
      lblNickname: 'Apodo', lblAge: 'Edad', phNickname: 'Mamá',
      legendBody: 'Cuerpo <span class="legend-note">(define qué pruebas de detección aplican)</span>', quickAria: 'Opciones rápidas',
      presetFemale: 'Mujer', presetMale: 'Hombre', presetCustom: 'Elegir yo',
      chkBreasts: 'Tiene tejido mamario', chkCervix: 'Tiene cuello uterino', chkUterus: 'Tiene útero', chkProstate: 'Tiene próstata', chkMeno: 'Ya pasó por la menopausia',
      hintHyst: '¿Histerectomía completa (se quitaron el útero y el cuello uterino, no por cáncer)? La ACS dice que las pruebas de cuello uterino se suspenden, así que desmarca ambas casillas. Después de una histerectomía parcial, el cuello uterino se queda.',
      legendSmoking: 'Tabaquismo', smokeNever: 'Nunca ha fumado', smokeFormer: 'Fumaba antes', smokeCurrent: 'Fuma actualmente',
      lblPpd: 'Paquetes por día', lblYears: 'Años fumando', pyUnit: 'paquetes-año',
      hintPy: 'Un paquete-año es fumar 1 paquete (unos 20 cigarrillos) al día durante un año (ACS). Con números aproximados basta.',
      lblQuit: 'Años desde que dejó de fumar <span class="legend-note">(opcional)</span>',
      hintQuit: 'Según el USPSTF, la detección del cáncer de pulmón se suspende cuando la persona lleva 15 años sin fumar. La ACS no tiene ese límite.',
      errQuit: 'Los años desde que dejó de fumar más los años fumando no pueden ser más que la edad.',
      legendFh: 'Antecedentes familiares <span class="legend-note">(opcional)</span>',
      chkFh: 'Antecedentes familiares de cáncer o una condición hereditaria conocida', chkAa: 'Es afroamericano',
      lblPfam: 'Padre o hermano con cáncer de próstata antes de los 65', optNone: 'No / no sé', optOne: 'Uno', optMulti: 'Más de uno',
      hintFh: 'Esto solo cambia qué nota de la guía de la ACS mostramos. Nunca calculamos el riesgo.',
      saveAdd: 'Agregar al plan', saveEdit: 'Guardar cambios', cancel: 'Cancelar',
      errNick: 'Escribe un apodo (como \u201cPapá\u201d).', errAge: 'Escribe una edad en números enteros, de 0 a 120.',
      errBody: 'Elige Mujer u Hombre, o marca las partes del cuerpo que apliquen, para saber qué pruebas mostrar.',
      errPpd: 'Los paquetes por día deben estar entre 0 y 10.', errYears: 'Los años fumando no pueden ser más que la edad.',
      added: 'Se agregó a {name}.', updated: 'Se actualizó a {name}.', removed: 'Se quitó a {name}.', removeConfirm: '¿Quitar a {name} de tu plan?',
      checkedLine: 'Guías verificadas por última vez: octubre de 2026 (páginas de la ACS el 10 de octubre de 2026, con la fecha de revisión de cada página en su tema; USPSTF y CuidadoDeSalud.gov el 11 de octubre de 2026).',
      planNote: 'Estas son guías generales de la ACS para personas con <strong>riesgo promedio</strong> y <strong>sin síntomas</strong>. Cualquier persona con síntomas debe consultar a un proveedor, sin importar su edad. Los enlaces \u201cEn español\u201d llevan a páginas de los CDC, que siguen las recomendaciones del Grupo de Trabajo sobre Servicios Preventivos de los Estados Unidos (USPSTF), así que algunas edades pueden variar un poco. Cada tema también muestra lo que dice el USPSTF, que siguen muchos médicos y planes de salud, y si es distinto de la ACS.',
      empty: '<strong>Todavía no has agregado a nadie.</strong> Agrega a alguien con el formulario o carga una familia de ejemplo inventada para ver cómo funciona.',
      demoBtn: 'Cargar familia de ejemplo', printBtn: 'Imprimir / guardar como PDF', clearBtn: 'Borrar todos los datos',
      status: { 'talk-now': 'Hablar ahora', 'option': 'Para decidir', 'upcoming': 'Más adelante', 'info': 'Bueno saberlo', 'past': 'Pasó la edad' },
      ageLine: '\u00b7 {age} años', cardAria: '{name}, {age} años',
      edit: 'Editar', editAria: 'Editar a {name}', remove: 'Quitar', removeAria: 'Quitar a {name}', progress: 'Progreso', progressChanged: '{name}: {status}.',
      sheetBtn: '\ud83e\ude7a Hoja para el chequeo', sheetAria: 'Imprimir una hoja de una página para el chequeo de {name}',
      remindBtn: '\ud83d\udcc5 Recordarme en 2 semanas', remindAria: 'Descargar un recordatorio de calendario para hablar con {name}',
      moreAcs: 'Más de la ACS', quitHelp: 'Ayuda gratis para dejar de fumar', readAcs: 'Leer la guía de la ACS (en inglés) \u2197', readEs: 'En español: CDC \u2197',
      usSame: 'Igual que la ACS', usDiff: 'Distinto de la ACS', usLink: 'USPSTF (en inglés) \u2197', costLink: 'CuidadoDeSalud.gov \u2197',
      talkWithBtn: 'Empezar la conversación con {name}', talkWithAria: 'Escribir un mensaje para empezar la conversación con {name}',
      questionsSummary: 'Preguntas para llevar al próximo chequeo ({n})',
      icsTitle: 'Hablar con {name} sobre las pruebas de detección del cáncer', icsDesc: 'Hablar con {name} sobre las pruebas de detección del cáncer.',
      icsTopics: ' Temas de las guías de la Sociedad Americana Contra el Cáncer: {list}.', icsTail: ' Hecho con ScreenTalk. Solo para educación, no es consejo médico.',
      icsFile: 'recordatorio', icsDone: 'Se descargó el recordatorio. Ábrelo para agregarlo a tu calendario.',
      statPeople1: 'persona en tu plan', statPeopleN: 'personas en tu plan', statTalk1: 'tema para hablar ahora', statTalkN: 'temas para hablar ahora',
      statOf: '{a} de {b}', statMoving: 'ya lo hablaron, tienen cita o están al día',
      soonest1: 'Lo próximo: {topic} para {who} dentro de 1 año.', soonestN: 'Lo próximo: {topic} para {who} dentro de {n} años.',
      clearConfirm: '¿Borrar todo tu plan y los hábitos marcados de este navegador?', cleared: 'Se borraron todos los datos de ScreenTalk de este navegador.',
      demoNames: ['Mamá', 'Papá', 'Abuela', 'Hermana mayor'], demoLoaded: 'Se cargó una familia de ejemplo inventada de 4 personas.',
      tlH2: 'Línea de tiempo familiar',
      tlP: 'Cuándo aplica cada guía de la ACS. <strong>Color sólido</strong> = la ACS lo recomienda. <strong>Color claro</strong> = una opción para conversar con un proveedor. \u25bc = edad actual. Las barras de \u201c90+\u201d continúan mientras la ACS diga que la prueba todavía tiene sentido según la salud de esa persona.',
      tlTextAria: 'Línea de tiempo en palabras',
      band: { breast: 'Mama', colorectal: 'Colorrectal', cervical: 'Cuello uterino', lung: 'Pulmón', prostate: 'Charla de próstata' }, bandShortProstate: 'Próstata',
      tlSoft: ' (una opción para conversar)', tlSolid: ' (recomendado)', tlAge: 'Edad', tlAgeArrow: 'Edad \u2192', tlEmpty: 'Todavía no hay pruebas',
      tlLine: '{name}, {age} años: {list}.', tlNoneWords: 'no se muestran pruebas',
      legendSoft: 'Color claro = una opción para conversar con un proveedor', legendAge: 'Edad actual',
      talkH2: '2 · Inicia la conversación', talkP: 'Hablar de salud da pena. Elige a una persona y un estilo, y luego dilo en voz alta o envíalo.',
      lblWho: 'Quién', lblStyle: 'Estilo', lblDocLang: 'Escribirlo en', docLangAuto: 'El mismo que la app', docLangHint: 'Muchos jóvenes escriben para un padre o una madre que lee en otro idioma. Esto cambia el idioma del mensaje y de la hoja impresa para el chequeo; el resto de la app no cambia.', docLangSet: 'El mensaje y la hoja para el chequeo estarán en español.', toneCasual: 'Casual (en la cena)', toneHeart: 'Del corazón', toneText: 'Mensaje de texto',
      talkLabel: 'Tu mensaje <span class="legend-note">(edítalo para que suene como tú)</span>',
      talkEmptyOpt: 'Primero agrega a alguien a tu plan', talkEmpty: 'Primero agrega a alguien a tu plan y luego elige un estilo.',
      copy: 'Copiar', share: 'Compartir\u2026', copied: '¡Copiado!', copyFail: 'No se pudo copiar automáticamente. Selecciona el texto y cópialo.',
      shareFail: 'Este navegador no permite compartir. Usa Copiar.',
      tipsSummary: 'Consejos para que sea más fácil',
      tip1: 'Elige un momento tranquilo, no justo después de una mala noticia ni en medio de una discusión.',
      tip2: 'Empieza con cariño: \u201cQuiero tenerte conmigo por mucho tiempo.\u201d',
      tip3: 'Ofrece algo concreto: busca el número de la clínica, quédate a su lado mientras llama o pon un recordatorio.',
      tip4: 'Si dice que no, está bien. Ya sembraste la idea. Vuelve a intentarlo en unas semanas.',
      rhH2: 'Practica la conversación',
      rhP: 'Practica con un familiar que pone objeciones: \u201cMe siento bien\u201d, \u201cEs muy caro\u201d, \u201cMe da miedo la colonoscopia\u201d, \u201cNo hay antecedentes en la familia\u201d, \u201cNo tengo tiempo\u201d. Cada consejo está respaldado por la ACS, el NCI o los CDC. En inglés o en español.',
      gameH2: '3 · ¿Mito o realidad?', gameP: 'Doce afirmaciones que seguro has oído. Cada respuesta enlaza a la fuente.',
      gameCard: 'Tarjeta {n} de {t}', gameScore: 'Puntos: {s}', btnMyth: 'Mito', btnFact: 'Realidad', srcLabel: 'Fuente:',
      gameNext: 'Siguiente tarjeta \u2192', gameSeeScore: 'Ver mi puntaje \u2192', correct: '¡Correcto! ', notQuite: 'No exactamente. ',
      itsMyth: 'Es un mito.', itsFact: 'Es realidad.',
      gameFinal: 'Acertaste {s} de {t}', gamePerfect: '. ¡Puntaje perfecto!', gameNice: '. ¡Buen trabajo!', gameKnow: '. Ahora ya conoces los datos.',
      gameDone: '¡Listo!', gameShare: 'Comparte con alguien en casa la que más te sorprendió.', gameRestart: 'Jugar otra vez',
      habitsH2: '4 · Hábitos para ti, desde ahora',
      habitsP: 'Las pruebas de detección son para adultos, pero la prevención empieza en la adolescencia. Estos son los pasos de la ACS para ayudar a reducir el riesgo de cáncer. Marca los que te comprometes a seguir.',
      habitCount: 'Te comprometiste con {n} de {t} hábitos.',
      habitsSrc: 'Fuente: \u201cTake control of your health\u201d (toma el control de tu salud) en las ' + A(ACS_GUIDE, 'guías de detección de la ACS (en inglés)') + '. Uno más para adolescentes: la ACS dice que toda persona de 13 a 26 años que no haya terminado la vacuna contra el VPH debe ponérsela lo antes posible (' + A(ACS_HPV, 'vacunas contra el VPH de la ACS, en inglés') + '; en español: ' + A('https://www.cdc.gov/hpv/es/vaccines/vacuna-contra-el-vph.html', 'vacuna contra el VPH de los CDC') + ').',
      helpH2: 'Busca ayuda y hazte las pruebas', helpP: 'Lugares gratuitos y confiables para llamar o visitar, incluidas opciones sin seguro médico o sin médico.',
      footer: '<strong>ScreenTalk</strong> es un proyecto educativo para el International CodeTheCure Hackathon 2026 (Prevención y educación). El contenido resume las ' + A(ACS_GUIDE, 'Guías de la ACS para la detección temprana del cáncer (en inglés)') + ' (revisadas el 27 de mayo de 2026), ' + A(ACS_HPV, 'Vacunas contra el VPH de la ACS (en inglés)') + ' (revisada el 3 de septiembre de 2026), ' + A('https://www.cancer.gov/espanol/cancer/causas-prevencion/riesgo/mitos', 'Mitos comunes e ideas falsas acerca del cáncer del NCI') + ' y, para los consejos de práctica, páginas de los CDC (en inglés) sobre ' + A('https://www.cdc.gov/colorectal-cancer/screening/index.html', 'detección colorrectal') + ', ' + A('https://www.cdc.gov/colorectal-cancer/symptoms/index.html', 'síntomas colorrectales') + ' y ' + A('https://www.cdc.gov/breast-cancer/screening/index.html', 'detección del cáncer de mama') + '. Cada tema de detección se compara con las ' + A('https://www.uspreventiveservicestaskforce.org/uspstf/recommendation-topics', 'recomendaciones del USPSTF (en inglés)') + ' (mama 2024, colorrectal y pulmón 2021, cuello uterino y próstata 2018, con actualizaciones en curso), y la regla de cero copago viene de ' + A('https://www.cuidadodesalud.gov/es/preventive-care-adults/', 'CuidadoDeSalud.gov') + '. Cada guía y consejo se comparó con las páginas de la ACS, el NCI y los CDC el 10 de octubre de 2026, y con el USPSTF y CuidadoDeSalud.gov el 11 de octubre de 2026. Los términos médicos en español siguen las páginas en español de los CDC (' + A('https://www.cdc.gov/colorectal-cancer/es/screening/index.html', 'colorrectal') + ', ' + A('https://www.cdc.gov/breast-cancer/es/screening/index.html', 'mama') + ', ' + A('https://www.cdc.gov/cervical-cancer/es/screening/index.html', 'cuello uterino') + ', ' + A('https://www.cdc.gov/lung-cancer/es/screening/index.html', 'pulmón') + ', ' + A('https://www.cdc.gov/prostate-cancer/es/screening/index.html', 'próstata') + ') y del ' + A('https://www.cancer.gov/espanol/cancer/causas-prevencion/riesgo/mitos', 'NCI') + '. La traducción está pendiente de revisión por un hablante nativo. No está afiliado a la ACS, el NCI ni los CDC, ni cuenta con su respaldo. No es consejo médico. Las guías son para Estados Unidos.',
      sheetPrinted: 'Impreso el {date}', sheetAppt: 'Fecha de la cita: ________________',
      sheetIntro: 'Lleva esta hoja al próximo chequeo. Llena lo que sepas antes de la visita y luego anota lo que diga el proveedor.',
      sheetTopics: 'Pruebas de detección para mencionar', sheetTh: ['Tema', 'Guía de la ACS', 'Última prueba (fecha)', 'Resultado', 'Próxima fecha'],
      sheetNothing: 'Nada en estas guías de la ACS aplica ahora mismo. Igual, un chequeo regular es un gran hábito.',
      sheetLater: 'Más adelante: ', sheetSmoke: 'Historial de tabaquismo: ', sheetSmokeTail: '. Los proveedores usan los paquetes-año para decidir sobre la detección del cáncer de pulmón.',
      sheetQs: 'Preguntas para hacer', sheetFh: 'Antecedentes familiares para mencionar', sheetFhTh: ['Familiar', 'Tipo de cáncer', 'Edad al diagnóstico'],
      sheetSaid: 'Lo que dijo el proveedor', sheetGuides: ' Guías (en inglés): cancer.org/screening \u00b7 uspreventiveservicestaskforce.org \u00b7 Costos: cuidadodesalud.gov', sheetOpening: 'Abriendo la hoja para el chequeo de {name}.'
    }
  };

  var LANGS = ['en', 'es'];
  var KEY = 'screentalk.lang.v1';
  var LOCALE = { en: undefined, es: 'es-419' };
  function lang(l) { return LANGS.indexOf(l) >= 0 ? l : 'en'; }
  function fmt(str, vars) {
    return String(str).replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] != null ? vars[k] : m; });
  }
  function t(l, key) { var v = STRINGS[lang(l)][key]; return v == null ? STRINGS.en[key] : v; }

  var api = { STRINGS: STRINGS, LANGS: LANGS, KEY: KEY, LOCALE: LOCALE, fmt: fmt, t: t, lang: lang };

  if (typeof document !== 'undefined') {
    var current = 'en';
    var listeners = [];
    (function init() {
      var fromUrl = null;
      try { fromUrl = new URLSearchParams(location.search).get('lang'); } catch (e) {}
      var saved = null;
      try {
        saved = localStorage.getItem(KEY);
        if (!saved) saved = (JSON.parse(localStorage.getItem('screentalk.rehearse.v1') || '{}') || {}).lang || null; // older rehearsal preference
      } catch (e) {}
      if (LANGS.indexOf(fromUrl) >= 0) current = fromUrl;
      else if (LANGS.indexOf(saved) >= 0) current = saved;
      else if (typeof navigator !== 'undefined' && /^es\b/i.test(navigator.language || '')) current = 'es';
    })();

    api.getLang = function () { return current; };
    api.locale = function () { return LOCALE[current]; };
    api.s = function (key) { return t(current, key); };
    api.onChange = function (fn) { listeners.push(fn); };
    api.apply = function (rootEl) {
      var r = rootEl || document;
      var S = STRINGS[current];
      if (!rootEl) {
        document.documentElement.setAttribute('lang', current);
        document.title = S.docTitle;
        var md = document.querySelector('meta[name="description"]');
        if (md) md.setAttribute('content', S.docDesc);
      }
      r.querySelectorAll('[data-i18n]').forEach(function (n) { n.textContent = t(current, n.getAttribute('data-i18n')); });
      r.querySelectorAll('[data-i18n-html]').forEach(function (n) { n.innerHTML = t(current, n.getAttribute('data-i18n-html')); });
      r.querySelectorAll('[data-i18n-attr]').forEach(function (n) {
        n.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
          var kv = pair.split(':');
          if (kv.length === 2) n.setAttribute(kv[0].trim(), t(current, kv[1].trim()));
        });
      });
      r.querySelectorAll('[data-setlang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-setlang') === current)); });
    };
    api.setLang = function (l) {
      l = lang(l);
      try { localStorage.setItem(KEY, l); } catch (e) {}
      if (l === current) return;
      current = l;
      api.apply();
      listeners.forEach(function (fn) { try { fn(current); } catch (e) { if (root.console) root.console.error(e); } });
    };
    api.apply();
    document.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('[data-setlang]') : null;
      if (b) { api.setLang(b.getAttribute('data-setlang')); b.focus(); }
    });
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ScreenTalkI18n = api;
})(typeof window !== 'undefined' ? window : this);
