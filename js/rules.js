/*
 * ScreenTalk rules engine
 * Turns a family member's basic profile into a list of American Cancer Society (ACS)
 * guideline topics to TALK ABOUT with a healthcare provider.
 *
 * This is education, not diagnosis. It never says someone "needs" a test and never
 * estimates anyone's cancer risk. Every topic links to the ACS page it summarizes.
 *
 * Sources (re-checked Oct 10, 2026):
 *  - ACS Guidelines for the Early Detection of Cancer (last revised May 27, 2026)
 *  - ACS breast cancer early detection recommendations (last revised Jul 23, 2026)
 *  - ACS colorectal cancer screening recommendations (last revised May 27, 2026)
 *  - ACS cervical cancer screening guidelines (last revised Dec 4, 2025)
 *  - ACS endometrial cancer early detection (last revised Feb 28, 2025)
 *  - ACS lung cancer early detection (last revised Jan 29, 2024)
 *  - ACS prostate cancer early detection recommendations (last revised Nov 22, 2023)
 *  - ACS HPV Vaccines (last revised Sep 3, 2026)
 *
 * Cross-check (re-checked Oct 11, 2026): each screening topic also carries the U.S. Preventive
 * Services Task Force (USPSTF) recommendation, because many doctors and insurance plans follow it:
 *  - USPSTF Breast Cancer: Screening (final, Apr 30, 2024): every 2 years, ages 40 to 74
 *  - USPSTF Colorectal Cancer: Screening (final, 2021): 45 to 75; selectively 76 to 85
 *  - USPSTF Cervical Cancer: Screening (final, Aug 21, 2018; update in progress, draft Dec 2024)
 *  - USPSTF Lung Cancer: Screening (final, 2021): 50 to 80, 20 pack-years, smokes now or quit within 15 years
 *    (optional years-since-quitting field decides it; ACS has no such cutoff, checked Oct 11, 2026)
 *  - USPSTF Prostate Cancer: Screening (final, May 8, 2018; update in progress)
 * and the no-copay rule for these screenings from HealthCare.gov (preventive care for adults and women).
 *
 * English and Spanish: evaluate(person, 'es') returns the same topics with Spanish wording.
 * Works in the browser (window.ScreenTalkRules) and in Node (module.exports) for tests.
 */
(function (root) {
  'use strict';

  var SRC = {
    guidelines: 'https://www.cancer.org/cancer/screening/american-cancer-society-guidelines-for-the-early-detection-of-cancer.html',
    breast: 'https://www.cancer.org/cancer/types/breast-cancer/screening-tests-and-early-detection/american-cancer-society-recommendations-for-the-early-detection-of-breast-cancer.html',
    colorectal: 'https://www.cancer.org/cancer/types/colon-rectal-cancer/detection-diagnosis-staging/acs-recommendations.html',
    cervical: 'https://www.cancer.org/cancer/types/cervical-cancer/detection-diagnosis-staging/cervical-cancer-screening-guidelines.html',
    endometrial: 'https://www.cancer.org/cancer/types/endometrial-cancer/detection-diagnosis-staging/detection.html',
    lung: 'https://www.cancer.org/cancer/types/lung-cancer/detection-diagnosis-staging/detection.html',
    prostate: 'https://www.cancer.org/cancer/types/prostate-cancer/detection-diagnosis-staging/acs-recommendations.html',
    hpv: 'https://www.cancer.org/cancer/risk-prevention/hpv/acs-recommendations-for-hpv-vaccine-use.html',
    quit: 'https://www.cancer.org/cancer/risk-prevention/tobacco/empowered-to-quit.html'
  };
  var US = 'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/';
  var SRC_US = {
    breast: US + 'breast-cancer-screening',
    colorectal: US + 'colorectal-cancer-screening',
    cervical: US + 'cervical-cancer-screening',
    lung: US + 'lung-cancer-screening',
    prostate: US + 'prostate-cancer-screening'
  };
  // HealthCare.gov: plans must cover these screenings without a copay or coinsurance, even before the
  // deductible, when the provider is in-network ("$0 cost isn't guaranteed in all cases").
  var SRC_COST = {
    en: { breast: 'https://www.healthcare.gov/preventive-care-women/', cervical: 'https://www.healthcare.gov/preventive-care-women/',
      colorectal: 'https://www.healthcare.gov/preventive-care-adults/', lung: 'https://www.healthcare.gov/preventive-care-adults/' },
    es: { breast: 'https://www.cuidadodesalud.gov/es/preventive-care-women/', cervical: 'https://www.cuidadodesalud.gov/es/preventive-care-women/',
      colorectal: 'https://www.cuidadodesalud.gov/es/preventive-care-adults/', lung: 'https://www.cuidadodesalud.gov/es/preventive-care-adults/' }
  };

  // When each source was last checked, and each ACS topic page's own "last revised" date.
  // Every date below is copied from the source list at the top of this file; none is estimated.
  var CHECKED = { acs: '2026-10-10', uspstf: '2026-10-11', cost: '2026-10-11' };
  var REVISED = {
    guidelines: '2026-05-27', breast: '2026-07-23', colorectal: '2026-05-27', cervical: '2025-12-04',
    endometrial: '2025-02-28', lung: '2024-01-29', prostate: '2023-11-22', hpv: '2026-09-03'
  };
  // USPSTF final recommendation dates (year only where the source list gives only the year).
  var US_FINAL = { breast: '2024-04-30', colorectal: '2021', cervical: '2018-08-21', lung: '2021', prostate: '2018-05-08' };
  var MONTHS = {
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic']
  };
  /** '2026-07-23' -> 'Jul 23, 2026' (en) or '23 jul 2026' (es). */
  function shortDate(iso, l) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!m) return String(iso || '');
    var mon = MONTHS[lang(l)][Number(m[2]) - 1], d = Number(m[3]);
    return lang(l) === 'es' ? d + ' ' + mon + ' ' + m[1] : mon + ' ' + d + ', ' + m[1];
  }

  // Status values, ordered by how soon a conversation makes sense.
  var STATUS = {
    TALK_NOW: 'talk-now',      // inside an ACS recommended screening window
    OPTION: 'option',          // ACS says it is a choice / shared decision
    UPCOMING: 'upcoming',      // window starts in the future
    INFO: 'info',              // awareness item, or guideline does not apply as entered
    PAST: 'past'               // outside the window on the older side
  };

  var STATUS_ORDER = [STATUS.TALK_NOW, STATUS.OPTION, STATUS.INFO, STATUS.UPCOMING, STATUS.PAST];

  function num(v) {
    if (v === '' || v === null || v === undefined || typeof v === 'boolean') return NaN;
    var n = Number(v);
    return isFinite(n) ? n : NaN;
  }

  /** pack-years = packs per day x years smoked (ACS definition). */
  function packYears(packsPerDay, years) {
    var p = num(packsPerDay), y = num(years);
    if (!(p >= 0) || !(y >= 0)) return 0;
    return Math.round(p * y * 10) / 10;
  }

  /** Smoking status: 'never' | 'former' | 'current'. Accepts the old boolean `smokes` field. */
  function smokingStatus(person) {
    var s = person.smoking;
    if (s === 'never' || s === 'former' || s === 'current') return s;
    return person.smokes ? 'current' : 'never';
  }

  /** Father/brother with prostate cancer before 65: 'none' | 'one' | 'multiple'. */
  function prostateFamily(person) {
    var f = person.prostateFamily;
    if (f === 'none' || f === 'one' || f === 'multiple') return f;
    return person.fatherBrotherProstateUnder65 ? 'one' : 'none';
  }

  /** Has a uterus. Older saved plans had one "cervix / uterus" box, so fall back to cervix. */
  function hasUterus(person) {
    return typeof person.uterus === 'boolean' ? person.uterus : !!person.cervix;
  }

  /** ACS age to start the prostate testing conversation. */
  function prostateStartAge(person) {
    var fam = prostateFamily(person);
    if (fam === 'multiple') return 40;
    if (person.africanAmerican || fam === 'one') return 45;
    return 50;
  }

  // ---------- Text (English and Spanish) ----------
  // Same keys in both languages; tests/i18n.test.js fails if one is missing or a {placeholder} differs.
  // Spanish medical terms follow the CDC and NCI Spanish pages (see docs/glossary-es.md).
  // The Spanish text is pending review by a native speaker.
  var TEXT = {
    en: {
      ageError: 'Enter an age between 0 and 120.',
      revised: 'ACS page revised {date}',
      in1: 'in 1 year', inN: 'in {n} years',
      title: {
        breast: 'Breast cancer screening', colorectal: 'Colon and rectal cancer screening', cervical: 'Cervical cancer screening',
        endometrial: 'Endometrial (uterine) cancer awareness', lung: 'Lung cancer screening',
        prostate: 'Prostate cancer testing decision', hpv: 'HPV vaccine (helps prevent 6 types of cancer)'
      },
      breastUpS: 'ACS guidance starts at age 40 ({in}).',
      breastUpD: 'Women ages 40 to 44 have the option to start yearly mammograms. Until then, ACS says to know how your breasts normally look and feel and report any changes to a healthcare provider right away.',
      breastOptS: 'ACS: women 40 to 44 have the option to start yearly mammograms.',
      breastOptD: 'A good question for a provider: "Should I start yearly mammograms now or at 45?" ACS says all women should know the benefits, limits, and possible harms of screening.',
      breast45S: 'ACS: women 45 to 54 should get mammograms every year.',
      breast45D: 'Ask a provider when the last mammogram was and when the next one should be scheduled.',
      breast55S: 'ACS: women 55 and older can switch to mammograms every 2 years, or keep going every year.',
      breast55D: 'ACS says screening should continue as long as a woman is in good health and expected to live at least 10 more years. A provider can help choose the schedule.',
      crcUpS: 'ACS: people at average risk start regular screening at 45 ({in}).',
      crcUpD: 'Options include a stool-based test, a visual exam like colonoscopy, or (not preferred) a blood-based test.',
      crcNowS: 'ACS: people at average risk in good health should get regular colorectal screening from 45 through 75.',
      crcNowD: 'Options: a stool-based test (yearly FIT or high-sensitivity gFOBT, or a stool DNA or RNA test every 3 years), colonoscopy every 10 years, or CT colonography or sigmoidoscopy every 5 years. Blood-based tests are not preferred and are only for people unwilling to do the others. Any abnormal result on a test other than colonoscopy needs a follow-up colonoscopy. ACS: "No matter which test you choose, the most important thing is to get screened."',
      crcOptS: 'ACS: for ages 76 through 85, talk with a provider about whether to keep screening.',
      crcOptD: 'The choice depends on personal preferences, life expectancy, overall health, and past screening history.',
      crcPastS: 'ACS: people over 85 should no longer get colorectal cancer screening.',
      cxUpS: 'ACS: people with a cervix start screening at 25 ({in}).',
      cxUpD: 'Screening is still needed even after the HPV vaccine.',
      cxNowS: 'ACS: screen from 25 until at least 65. Preferred: an HPV test collected by a provider every 5 years.',
      cxNowD: 'Other options: a self-collected HPV test every 3 years (FDA-approved kits, only through a provider), an HPV + Pap co-test every 5 years, or a Pap test alone every 3 years if HPV testing is not available. Screening is still needed after the HPV vaccine, in a long-term relationship, or after menopause.',
      cxOptS: 'ACS: at 65 or older, screening can stop if regular screening has been normal.',
      cxOptD: 'That means the last 2 HPV tests (or co-tests) or the last 3 Pap tests were normal. If no one is sure when the last screening was, ACS says to keep screening until there are 2 normal HPV tests or 3 normal Pap tests in a row. A provider can confirm.',
      endoS: 'ACS: at menopause, women should be told about the risks and symptoms of endometrial cancer.',
      endoD: 'Report any unexpected vaginal bleeding, spotting, or discharge to a doctor. Some women, because of their history (for example, Lynch syndrome), may need to consider a yearly endometrial biopsy; a provider can advise.',
      lungNowS: 'ACS: yearly low-dose CT (LDCT) screening for people 50 to 80 who smoke or used to smoke and have at least a 20 pack-year history.',
      lungNowD: 'ACS says to talk with a healthcare professional first about the purpose, benefits, limits, and possible harms of screening. Screening is not advised for people with serious health problems that would likely limit how long they live.',
      lungUpS: 'ACS lung screening guidance starts at 50 for people with a 20+ pack-year history ({in}).',
      lungUpCurrent: 'The most helpful step right now is quitting. Free help is available.',
      lungUpFormer: 'Quitting was a big step. Keep the smoking history handy for future checkups.',
      lungPastS: 'The ACS lung screening guideline covers ages 50 to 80.',
      lungPastD: 'A provider can talk about what makes sense.',
      lungInfoKnown: 'ACS lung screening is for ages 50 to 80 with at least a 20 pack-year history. The number entered is {py}, so it does not apply as entered.',
      lungInfoUnknown: 'ACS lung screening is for ages 50 to 80 with at least a 20 pack-year history. Add packs per day and years smoked to check.',
      lungInfoD: 'Not sure about the numbers? A provider can help work them out. Pack-years = packs per day x years smoked.',
      lungQuit: 'ACS says people who still smoke should be offered help to quit.',
      prWhy40: 'ACS moves this talk to 40 for men with more than one father or brother who had prostate cancer before 65.',
      prWhy45: 'ACS moves this talk to 45 for African American men and men whose father or brother had prostate cancer before 65.',
      prWhy50: 'ACS recommends men make an informed decision with a provider about whether to be tested.',
      prUpS: 'ACS: the talk about prostate testing starts at {start} ({in}).',
      prOptS: 'ACS: men {start}+ should talk with a provider about the pros and cons of PSA testing and decide together.',
      prOptD: 'If testing is chosen, it is a PSA blood test, sometimes with a rectal exam; how often depends on the PSA level. ACS says men expected to live less than 10 more years should not be offered screening.',
      hpvKidS: 'ACS: girls and boys should get 2 doses of the HPV vaccine between ages 9 and 12.',
      hpvTeenS: 'ACS: teens and young adults 13 through 26 who are not vaccinated, or missed doses, should get the HPV vaccine as soon as possible.',
      hpvD: 'Check vaccine records or ask a provider whether the series is complete. The Vaccines for Children program gives free vaccines to eligible kids and teens under 19.',
      fhNote: 'Family history matters: ACS says some people, because of family history or an inherited condition, need a different screening plan (for example, starting earlier, testing more often, or adding tests). Bring the family history to a provider and ask whether the average-risk guidelines fit.',
      fhBreast: ' For breast cancer, ACS says some women at high risk get a yearly breast MRI plus a mammogram, typically starting at 30.',
      us: {
        breast: 'USPSTF: a mammogram every 2 years for women 40 to 74. For 75 and older, it says there is not enough evidence to decide.',
        colorectal: 'USPSTF: screening for adults 45 to 75; from 76 to 85, a provider can offer it to some people based on their health and past screening. Same ages as ACS.',
        cervical: 'USPSTF: a Pap test every 3 years from 21 to 29; from 30 to 65, a Pap test every 3 years, an HPV test every 5 years, or both together every 5 years. Its update is in progress.',
        lung: 'USPSTF: yearly low-dose CT from 50 to 80 with a 20 pack-year history, for people who smoke now or quit within the past 15 years. It stops once someone has not smoked for 15 years.',
        prostate: 'USPSTF: for men 55 to 69, PSA testing is an individual choice made with a provider; it recommends against routine PSA screening at 70 and older. Its update is in progress.'
      },
      usLungFormer: ' So the year they quit matters; add years since quitting, or ask a provider.',
      usLungQuitIn: ' They quit {n} ago (15 or fewer), so the USPSTF still recommends it.',
      usLungQuitInOnly: ' They quit {n} ago, inside the 15-year limit.',
      usLungQuitOver: ' They quit {n} ago (more than 15), so the USPSTF no longer recommends it, and the no-copay rule (quit in the past 15 years) does not apply. ACS has no years-since-quitting limit.',
      usLungQuitOverOnly: ' They quit {n} ago (more than 15), past the USPSTF 15-year limit. ACS has no years-since-quitting limit.',
      yr1: '1 year', yrN: '{n} years', yr0: 'less than a year',
      cost: 'Cost: most health plans must cover this screening with no copay or deductible from an in-network provider ($0 is not guaranteed; check the plan).',
      costLungFormer: ' For people who used to smoke, this applies if they quit in the past 15 years.',
      costLungQuitIn: ' They quit {n} ago, within 15 years, so this applies.'
    },
    es: {
      ageError: 'Escribe una edad entre 0 y 120.',
      revised: 'Página de la ACS revisada el {date}',
      in1: 'dentro de 1 año', inN: 'dentro de {n} años',
      title: {
        breast: 'Detección del cáncer de mama', colorectal: 'Detección del cáncer de colon y recto', cervical: 'Detección del cáncer de cuello uterino',
        endometrial: 'Información sobre el cáncer de endometrio (útero)', lung: 'Detección del cáncer de pulmón',
        prostate: 'Decisión sobre la prueba del cáncer de próstata', hpv: 'Vacuna contra el VPH (ayuda a prevenir 6 tipos de cáncer)'
      },
      breastUpS: 'La guía de la ACS empieza a los 40 años ({in}).',
      breastUpD: 'Las mujeres de 40 a 44 años pueden elegir empezar a hacerse una mamografía cada año. Mientras tanto, la ACS dice que conviene conocer cómo se ven y se sienten normalmente las mamas, e informar de inmediato cualquier cambio a un proveedor de atención médica.',
      breastOptS: 'ACS: las mujeres de 40 a 44 años pueden elegir empezar a hacerse una mamografía cada año.',
      breastOptD: 'Una buena pregunta para el proveedor: "¿Empiezo con las mamografías anuales ahora o a los 45?" La ACS dice que todas las mujeres deben conocer los beneficios, los límites y los posibles daños de las pruebas de detección.',
      breast45S: 'ACS: las mujeres de 45 a 54 años deben hacerse una mamografía cada año.',
      breast45D: 'Conviene preguntar al proveedor cuándo fue la última mamografía y cuándo hay que programar la siguiente.',
      breast55S: 'ACS: las mujeres de 55 años o más pueden cambiar a una mamografía cada 2 años, o seguir haciéndosela cada año.',
      breast55D: 'La ACS dice que las pruebas de detección deben continuar mientras la mujer tenga buena salud y se espere que viva al menos 10 años más. Un proveedor puede ayudar a elegir cada cuánto hacerla.',
      crcUpS: 'ACS: las personas con riesgo promedio empiezan las pruebas de detección regulares a los 45 años ({in}).',
      crcUpD: 'Las opciones incluyen una prueba de heces, un examen visual como la colonoscopia o (no es la preferida) una prueba de sangre.',
      crcNowS: 'ACS: las personas con riesgo promedio y buena salud deben hacerse pruebas de detección colorrectal con regularidad de los 45 a los 75 años.',
      crcNowD: 'Opciones: una prueba de heces (prueba inmunoquímica fecal [FIT] o prueba de sangre oculta en heces de alta sensibilidad [gFOBT] cada año, o una prueba de ADN o ARN en heces cada 3 años), colonoscopia cada 10 años, o colonografía por TC o sigmoidoscopia cada 5 años. Las pruebas de sangre no son las preferidas y son solo para quienes no quieren hacerse las otras. Si una prueba que no es colonoscopia sale anormal, se necesita una colonoscopia de seguimiento. La ACS dice que, sin importar qué prueba se elija, lo más importante es hacerse la prueba.',
      crcOptS: 'ACS: de los 76 a los 85 años, conviene hablar con un proveedor sobre si seguir con las pruebas de detección.',
      crcOptD: 'La decisión depende de las preferencias personales, la expectativa de vida, el estado de salud general y las pruebas de detección anteriores.',
      crcPastS: 'ACS: las personas mayores de 85 años ya no deben hacerse pruebas de detección del cáncer colorrectal.',
      cxUpS: 'ACS: las personas con cuello uterino empiezan las pruebas de detección a los 25 años ({in}).',
      cxUpD: 'Las pruebas de detección siguen siendo necesarias aun después de la vacuna contra el VPH.',
      cxNowS: 'ACS: hacerse pruebas de detección desde los 25 hasta al menos los 65 años. La preferida: una prueba del VPH tomada por un proveedor cada 5 años.',
      cxNowD: 'Otras opciones: una prueba del VPH autotomada cada 3 años (kits aprobados por la FDA, solo a través de un proveedor), una prueba conjunta del VPH y Papanicoláu cada 5 años, o una prueba de Papanicoláu sola cada 3 años si no hay prueba del VPH disponible. Las pruebas siguen siendo necesarias después de la vacuna contra el VPH, en una relación de muchos años o después de la menopausia.',
      cxOptS: 'ACS: a partir de los 65 años, las pruebas de detección pueden suspenderse si las pruebas regulares han sido normales.',
      cxOptD: 'Es decir, las últimas 2 pruebas del VPH (o pruebas conjuntas) o las últimas 3 pruebas de Papanicoláu fueron normales. Si nadie sabe cuándo fue la última prueba, la ACS dice que hay que seguir hasta tener 2 pruebas del VPH normales o 3 pruebas de Papanicoláu normales seguidas. Un proveedor lo puede confirmar.',
      endoS: 'ACS: al llegar a la menopausia, se debe informar a las mujeres sobre los riesgos y los síntomas del cáncer de endometrio.',
      endoD: 'Cualquier sangrado, manchado o flujo vaginal inesperado se le debe informar a un médico. Algunas mujeres, por sus antecedentes (por ejemplo, el síndrome de Lynch), podrían considerar una biopsia de endometrio cada año; un proveedor puede aconsejar.',
      lungNowS: 'ACS: una tomografía computarizada de baja dosis (TC de baja dosis o LDCT) cada año para personas de 50 a 80 años que fuman o fumaron y tienen un historial de al menos 20 paquetes-año.',
      lungNowD: 'La ACS dice que primero hay que hablar con un profesional de la salud sobre el propósito, los beneficios, los límites y los posibles daños de la prueba. No se aconseja para personas con problemas de salud graves que probablemente limiten cuánto tiempo vivirán.',
      lungUpS: 'La guía de la ACS para la detección del cáncer de pulmón empieza a los 50 años para personas con un historial de 20 paquetes-año o más ({in}).',
      lungUpCurrent: 'Lo que más ayuda ahora es dejar de fumar. Hay ayuda gratis.',
      lungUpFormer: 'Dejar de fumar fue un gran paso. Conviene tener a mano el historial de tabaquismo para futuros chequeos.',
      lungPastS: 'La guía de la ACS para la detección del cáncer de pulmón cubre de los 50 a los 80 años.',
      lungPastD: 'Un proveedor puede hablar sobre qué tiene sentido.',
      lungInfoKnown: 'La detección del cáncer de pulmón de la ACS es para personas de 50 a 80 años con un historial de al menos 20 paquetes-año. El número que escribiste es {py}, así que no aplica con estos datos.',
      lungInfoUnknown: 'La detección del cáncer de pulmón de la ACS es para personas de 50 a 80 años con un historial de al menos 20 paquetes-año. Agrega los paquetes por día y los años que fumó para revisarlo.',
      lungInfoD: '¿No sabes bien los números? Un proveedor puede ayudar a calcularlos. Paquetes-año = paquetes por día x años fumando.',
      lungQuit: 'La ACS dice que a las personas que todavía fuman se les debe ofrecer ayuda para dejar de fumar.',
      prWhy40: 'La ACS adelanta esta conversación a los 40 años para hombres con más de un padre o hermano que tuvo cáncer de próstata antes de los 65.',
      prWhy45: 'La ACS adelanta esta conversación a los 45 años para hombres afroamericanos y hombres cuyo padre o hermano tuvo cáncer de próstata antes de los 65.',
      prWhy50: 'La ACS recomienda que los hombres tomen una decisión informada con un proveedor sobre si hacerse la prueba.',
      prUpS: 'ACS: la conversación sobre la prueba de próstata empieza a los {start} años ({in}).',
      prOptS: 'ACS: los hombres de {start} años o más deben hablar con un proveedor sobre los pros y los contras de la prueba del PSA y decidir juntos.',
      prOptD: 'Si se decide hacer la prueba, es un análisis de sangre del antígeno prostático específico (PSA), a veces con un tacto rectal; la frecuencia depende del nivel de PSA. La ACS dice que no se debe ofrecer la prueba a hombres con una expectativa de vida de menos de 10 años.',
      hpvKidS: 'ACS: niñas y niños deben recibir 2 dosis de la vacuna contra el VPH entre los 9 y los 12 años.',
      hpvTeenS: 'ACS: adolescentes y adultos jóvenes de 13 a 26 años que no estén vacunados, o a quienes les falten dosis, deben vacunarse contra el VPH lo antes posible.',
      hpvD: 'Conviene revisar el registro de vacunas o preguntar a un proveedor si la serie está completa. El programa Vacunas para Niños (VFC) da vacunas gratis a niños y adolescentes menores de 19 años que reúnen los requisitos.',
      fhNote: 'Los antecedentes familiares importan: la ACS dice que algunas personas, por sus antecedentes familiares o una condición hereditaria, necesitan un plan de detección diferente (por ejemplo, empezar antes, hacerse pruebas con más frecuencia o agregar pruebas). Conviene llevar los antecedentes familiares al proveedor y preguntar si las guías para riesgo promedio aplican.',
      fhBreast: ' Para el cáncer de mama, la ACS dice que algunas mujeres con riesgo alto se hacen una resonancia magnética de las mamas cada año además de la mamografía, por lo general desde los 30 años.',
      us: {
        breast: 'USPSTF: una mamografía cada 2 años para mujeres de 40 a 74 años. Para 75 años o más, dice que la evidencia no alcanza para decidir.',
        colorectal: 'USPSTF: pruebas de detección para adultos de 45 a 75 años; de 76 a 85, un proveedor puede ofrecerlas a algunas personas según su salud y sus pruebas anteriores. Mismas edades que la ACS.',
        cervical: 'USPSTF: una prueba de Papanicoláu cada 3 años de los 21 a los 29; de los 30 a los 65, Papanicoláu cada 3 años, prueba del VPH cada 5 años o ambas juntas cada 5 años. Su actualización está en curso.',
        lung: 'USPSTF: una tomografía computarizada de baja dosis cada año de los 50 a los 80 años con un historial de 20 paquetes-año, para quienes fuman o dejaron de fumar en los últimos 15 años. Se suspende cuando la persona lleva 15 años sin fumar.',
        prostate: 'USPSTF: para hombres de 55 a 69 años, la prueba del PSA es una decisión personal con un proveedor; recomienda no hacer pruebas de PSA de rutina a partir de los 70. Su actualización está en curso.'
      },
      usLungFormer: ' Por eso importa el año en que dejó de fumar; agrega los años desde que dejó de fumar o pregunta a un proveedor.',
      usLungQuitIn: ' Dejó de fumar hace {n} (15 o menos), así que el USPSTF todavía la recomienda.',
      usLungQuitInOnly: ' Dejó de fumar hace {n}, dentro del límite de 15 años.',
      usLungQuitOver: ' Dejó de fumar hace {n} (más de 15), así que el USPSTF ya no la recomienda y la regla de cero copago (dejar de fumar en los últimos 15 años) no aplica. La ACS no tiene límite de años desde que dejó de fumar.',
      usLungQuitOverOnly: ' Dejó de fumar hace {n} (más de 15), fuera del límite de 15 años del USPSTF. La ACS no tiene límite de años desde que dejó de fumar.',
      yr1: '1 año', yrN: '{n} años', yr0: 'menos de un año',
      cost: 'Costo: la mayoría de los planes de salud deben cubrir esta prueba de detección sin copago ni deducible de un proveedor dentro de la red (no siempre cuesta $0; conviene confirmarlo con el plan).',
      costLungFormer: ' Para quienes fumaron, aplica si dejaron de fumar en los últimos 15 años.',
      costLungQuitIn: ' Dejó de fumar hace {n}, dentro de los últimos 15 años, así que aplica.'
    }
  };
  var LANGS = ['en', 'es'];
  function lang(l) { return LANGS.indexOf(l) >= 0 ? l : 'en'; }
  function fmt(str, vars) {
    return String(str).replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] != null ? vars[k] : m; });
  }

  // Spanish reading for each topic (CDC Spanish pages, checked Oct 10, 2026). CDC follows the
  // U.S. Preventive Services Task Force, so its ages can differ a little from the ACS guidelines
  // ScreenTalk uses; the app says so next to these links.
  var SRC_ES = {
    breast: 'https://www.cdc.gov/breast-cancer/es/screening/index.html',
    colorectal: 'https://www.cdc.gov/colorectal-cancer/es/screening/index.html',
    cervical: 'https://www.cdc.gov/cervical-cancer/es/screening/index.html',
    endometrial: 'https://www.cdc.gov/uterine-cancer/es/symptoms/index.html',
    lung: 'https://www.cdc.gov/lung-cancer/es/screening/index.html',
    prostate: 'https://www.cdc.gov/prostate-cancer/es/screening/index.html',
    hpv: 'https://www.cdc.gov/hpv/es/vaccines/vacuna-contra-el-vph.html'
  };

  /**
   * USPSTF cross-check for a topic. differs = true where the USPSTF advice for this age is not the
   * same as the ACS advice shown on the card (start age, how often, or when to stop).
   */
  /**
   * USPSTF 15-year rule for someone who used to smoke (USPSTF 2021: "currently smoke or have quit
   * within the past 15 years"; stop "once a person has not smoked for 15 years").
   * Returns null when not a former smoker or the field is blank, 'within' for 0-15 years, 'over' for >15.
   * ACS (lung guideline, revised Jan 29, 2024) has no years-since-quitting limit.
   */
  function quitRule(smoking, quitYears) {
    if (smoking !== 'former') return null;
    var q = num(quitYears);
    if (!(q >= 0)) return null;
    return q <= 15 ? 'within' : 'over';
  }
  function quitSpan(q, T) {
    q = num(q);
    return q < 1 ? T.yr0 : q === 1 ? T.yr1 : fmt(T.yrN, { n: q });
  }

  function usNote(key, age, smoking, py, l, quitYears) {
    if (!SRC_US[key]) return null;
    var T = TEXT[lang(l)];
    var differs = false;
    var text = T.us[key];
    if (key === 'breast') differs = !(age >= 55 && age <= 74);
    else if (key === 'cervical') differs = age >= 21 && age <= 29;
    else if (key === 'lung' && smoking === 'former') {
      var qr = quitRule(smoking, quitYears);
      var meets = age >= 50 && age <= 80 && py >= 20;
      if (!qr) { differs = true; text += T.usLungFormer; }
      else if (qr === 'within') { differs = false; text += fmt(meets ? T.usLungQuitIn : T.usLungQuitInOnly, { n: quitSpan(quitYears, T) }); }
      else { differs = true; text += fmt(meets ? T.usLungQuitOver : T.usLungQuitOverOnly, { n: quitSpan(quitYears, T) }); }
    }
    else if (key === 'prostate') differs = age < 55 || age >= 70;
    return { text: text, differs: differs, source: SRC_US[key], final: US_FINAL[key], checked: CHECKED.uspstf };
  }

  /** No-copay note when the person's age is inside the range HealthCare.gov lists. */
  function costNote(key, age, smoking, py, l, quitYears) {
    var T = TEXT[lang(l)];
    var qr = key === 'lung' ? quitRule(smoking, quitYears) : null;
    if (qr === 'over') return null; // HealthCare.gov: "have quit in the past 15 years"; the USPSTF line says why
    var ok = (key === 'breast' && age >= 40) ||
      (key === 'colorectal' && age >= 45 && age <= 75) ||
      (key === 'cervical' && age >= 21 && age <= 65) ||
      (key === 'lung' && age >= 50 && age <= 80 && py >= 20 && smoking !== 'never');
    if (!ok) return null;
    var tail = '';
    if (key === 'lung' && smoking === 'former') tail = qr === 'within' ? fmt(T.costLungQuitIn, { n: quitSpan(quitYears, T) }) : T.costLungFormer;
    return { text: T.cost + tail, source: SRC_COST[lang(l)][key], checked: CHECKED.cost };
  }

  /**
   * person = {
   *   label: 'Mom', age: 47,
   *   breasts, cervix, uterus, prostate, menopause: bool,
   *   smoking: 'never' | 'former' | 'current', packYears: number,
   *   quitYears: number or '' (optional, former smokers only: years since quitting),
   *   africanAmerican: bool, prostateFamily: 'none' | 'one' | 'multiple',
   *   familyHistory: bool (family history of cancer / known inherited condition)
   * }
   * l = 'en' (default) | 'es'. Only the wording changes; statuses and ages are the same.
   * returns { topics: [...], notes: [...], timeline: [...] }
   */
  function evaluate(person, l) {
    person = person || {};
    l = lang(l);
    var T = TEXT[l];
    var inYears = function (n) { return n === 1 ? T.in1 : fmt(T.inN, { n: n }); };
    var mk = function (key) { return { key: key, title: T.title[key], source: SRC[key], sourceEs: SRC_ES[key], revised: REVISED[key], checked: CHECKED.acs, revisedLabel: fmt(T.revised, { date: shortDate(REVISED[key], l) }), revisedDate: shortDate(REVISED[key], l) }; };
    var age = Math.floor(num(person.age));
    var topics = [];
    var notes = [];
    var timeline = []; // bands for the visual timeline: {key,label,start,end,open}

    if (!(age >= 0 && age <= 120)) {
      return { topics: [], notes: [T.ageError], timeline: [] };
    }

    // ---- Breast cancer. ACS words this for "women"; we ask about breast tissue so the
    // plan fits everyone, and keep ACS's wording in the guideline text.
    if (person.breasts) {
      timeline.push({ key: 'breast', label: 'Breast', start: 40, end: 90, open: true, segments: [{ start: 40, end: 45, soft: true, ages: '40\u201344' }, { start: 45, end: 90, ages: '45+' }] });
      var b = mk('breast');
      if (age < 40) {
        b.status = STATUS.UPCOMING; b.startsIn = 40 - age;
        b.summary = fmt(T.breastUpS, { 'in': inYears(40 - age) });
        b.detail = T.breastUpD;
      } else if (age <= 44) {
        b.status = STATUS.OPTION; b.summary = T.breastOptS; b.detail = T.breastOptD;
      } else if (age <= 54) {
        b.status = STATUS.TALK_NOW; b.summary = T.breast45S; b.detail = T.breast45D;
      } else {
        b.status = STATUS.TALK_NOW; b.summary = T.breast55S; b.detail = T.breast55D;
      }
      topics.push(b);
    }

    // ---- Colorectal cancer (everyone at average risk)
    timeline.push({ key: 'colorectal', label: 'Colorectal', start: 45, end: 85, segments: [{ start: 45, end: 76, ages: '45\u201375' }, { start: 76, end: 85, soft: true, ages: '76\u201385' }] });
    var c = mk('colorectal');
    if (age < 45) {
      c.status = STATUS.UPCOMING; c.startsIn = 45 - age;
      c.summary = fmt(T.crcUpS, { 'in': inYears(45 - age) });
      c.detail = T.crcUpD;
    } else if (age <= 75) {
      c.status = STATUS.TALK_NOW; c.summary = T.crcNowS; c.detail = T.crcNowD;
    } else if (age <= 85) {
      c.status = STATUS.OPTION; c.summary = T.crcOptS; c.detail = T.crcOptD;
    } else {
      c.status = STATUS.PAST; c.summary = T.crcPastS; c.detail = '';
    }
    topics.push(c);

    // ---- Cervical cancer
    if (person.cervix) {
      timeline.push({ key: 'cervical', label: 'Cervical', start: 25, end: 90, open: true, segments: [{ start: 25, end: 66, ages: '25\u201365' }, { start: 66, end: 90, soft: true, ages: '66+' }] });
      var cv = mk('cervical');
      if (age < 25) {
        cv.status = STATUS.UPCOMING; cv.startsIn = 25 - age;
        cv.summary = fmt(T.cxUpS, { 'in': inYears(25 - age) });
        cv.detail = T.cxUpD;
      } else if (age <= 65) {
        cv.status = STATUS.TALK_NOW; cv.summary = T.cxNowS; cv.detail = T.cxNowD;
      } else {
        cv.status = STATUS.OPTION; cv.summary = T.cxOptS; cv.detail = T.cxOptD;
      }
      topics.push(cv);
    }

    // ---- Endometrial (uterine) cancer awareness at menopause
    if (hasUterus(person) && person.menopause) {
      var e = mk('endometrial');
      e.status = STATUS.INFO; e.summary = T.endoS; e.detail = T.endoD;
      topics.push(e);
    }

    // ---- Lung cancer (people who smoke or used to smoke)
    var smoking = smokingStatus(person);
    if (smoking !== 'never') {
      var py = num(person.packYears);
      var pyKnown = py > 0;
      if (!(py >= 0)) py = 0;
      var qualifiesPY = py >= 20;
      if (qualifiesPY) timeline.push({ key: 'lung', label: 'Lung', start: 50, end: 80, segments: [{ start: 50, end: 80, ages: '50\u201380' }] });
      var lg = mk('lung');
      if (age >= 50 && age <= 80 && qualifiesPY) {
        lg.status = STATUS.TALK_NOW; lg.summary = T.lungNowS; lg.detail = T.lungNowD;
      } else if (age < 50 && qualifiesPY) {
        lg.status = STATUS.UPCOMING; lg.startsIn = 50 - age;
        lg.summary = fmt(T.lungUpS, { 'in': inYears(50 - age) });
        lg.detail = smoking === 'current' ? T.lungUpCurrent : T.lungUpFormer;
      } else if (age > 80) {
        lg.status = STATUS.PAST; lg.summary = T.lungPastS; lg.detail = T.lungPastD;
      } else {
        lg.status = STATUS.INFO;
        lg.summary = pyKnown ? fmt(T.lungInfoKnown, { py: py }) : T.lungInfoUnknown;
        lg.detail = T.lungInfoD;
      }
      if (smoking === 'current') {
        lg.extra = T.lungQuit;
        lg.extraLink = SRC.quit;
      }
      topics.push(lg);
    }

    // ---- Prostate cancer (informed decision)
    if (person.prostate) {
      var start = prostateStartAge(person);
      timeline.push({ key: 'prostate', label: 'Prostate', start: start, end: 90, open: true, segments: [{ start: start, end: 90, soft: true, ages: start + '+' }] });
      var p = mk('prostate');
      var why = start === 40 ? T.prWhy40 : start === 45 ? T.prWhy45 : T.prWhy50;
      if (age < start) {
        p.status = STATUS.UPCOMING; p.startsIn = start - age;
        p.summary = fmt(T.prUpS, { start: start, 'in': inYears(start - age) });
        p.detail = why;
      } else {
        p.status = STATUS.OPTION;
        p.summary = fmt(T.prOptS, { start: start });
        p.detail = (start === 50 ? '' : why + ' ') + T.prOptD;
      }
      topics.push(p);
    }

    // ---- HPV vaccine (ages 9 through 26)
    if (age >= 9 && age <= 26) {
      var h = mk('hpv');
      h.status = STATUS.TALK_NOW;
      h.summary = age <= 12 ? T.hpvKidS : T.hpvTeenS;
      h.detail = T.hpvD;
      topics.push(h);
    }

    // ---- Cross-check with the USPSTF, and the no-copay rule (HealthCare.gov)
    topics.forEach(function (t) {
      var n = usNote(t.key, age, smoking, num(person.packYears), l, person.quitYears);
      if (n) t.uspstf = n;
      var cst = costNote(t.key, age, smoking, num(person.packYears), l, person.quitYears);
      if (cst) t.cost = cst;
      if (t.key === 'lung') t.quitRule = quitRule(smoking, person.quitYears);
    });

    // ---- Notes (person-specific only; the general average-risk note is shown once on the page)
    if (person.familyHistory) {
      notes.push(T.fhNote + (person.breasts ? T.fhBreast : ''));
    }
    topics.sort(function (a, b2) {
      var d = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b2.status);
      if (d !== 0) return d;
      return (a.startsIn || 0) - (b2.startsIn || 0);
    });

    return { topics: topics, notes: notes, timeline: timeline };
  }

  /** Counts across the family: conversations to have now, and the soonest upcoming one. */
  function familySummary(people, l) {
    var talk = 0, upcoming = 0, soonest = null;
    (people || []).forEach(function (p) {
      evaluate(p, l).topics.forEach(function (t) {
        if (t.status === STATUS.TALK_NOW || t.status === STATUS.OPTION) talk++;
        if (t.status === STATUS.UPCOMING) {
          upcoming++;
          if (soonest === null || t.startsIn < soonest.years) soonest = { who: p.label, topic: t.title, years: t.startsIn };
        }
      });
    });
    return { talkCount: talk, upcomingCount: upcoming, soonest: soonest };
  }

  var api = {
    evaluate: evaluate, packYears: packYears, familySummary: familySummary,
    smokingStatus: smokingStatus, prostateFamily: prostateFamily, prostateStartAge: prostateStartAge, hasUterus: hasUterus,
    STATUS: STATUS, SOURCES: SRC, CHECKED: CHECKED, REVISED: REVISED, US_FINAL: US_FINAL, shortDate: shortDate, SOURCES_ES: SRC_ES, SOURCES_US: SRC_US, SOURCES_COST: SRC_COST, usNote: usNote, costNote: costNote, quitRule: quitRule, TEXT: TEXT, LANGS: LANGS
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ScreenTalkRules = api;
})(typeof window !== 'undefined' ? window : this);
