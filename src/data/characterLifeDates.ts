import { CHARACTERS } from './characters';

/**
 * Dates de naissance et de mort (précises ou approximatives).
 * « v. » = vers ; « trad. » = tradition hagiographique ; « approx. » = estimation historique.
 */
export const CHARACTER_LIFE_DATES: Record<string, string> = {
  // ——— Apôtres ———
  pierre: 'v. 1 – v. 64 ap. J.-C. (trad.)',
  paul: 'v. 5 – v. 67 ap. J.-C. (trad.)',
  'jean-apotre': 'v. 6 – v. 100 ap. J.-C. (trad.)',
  andré: 'v. 1er s. – v. 60 ap. J.-C. (trad.)',
  'jacques-majeur': 'v. 1er s. – 44 ap. J.-C.',
  thomas: 'v. 1er s. – v. 72 ap. J.-C. (trad.)',
  matthieu: 'v. 1er s. – v. 90 ap. J.-C. (trad.)',
  philippe: 'v. 1er s. – v. 80 ap. J.-C. (trad.)',
  barthélemy: 'v. 1er s. – v. 70 ap. J.-C. (trad.)',
  jude: 'v. 1er s. – v. 65 ap. J.-C. (trad.)',
  matthias: 'v. 1er s. – v. 80 ap. J.-C. (trad.)',

  // ——— Papes ———
  'jean-paul-ii': '1920 – 2005',
  'jean-xxiii': '1881 – 1963',
  'pie-x': '1835 – 1914',
  'gregoire-grand': '540 – 604',
  'clement-i': 'v. 35 – v. 99 ap. J.-C. (trad.)',
  'leon-xiii': '1810 – 1903',
  'benoit-xvi': '1927 – 2022',
  francois: '1936 – (en fonction)',

  // ——— Docteurs de l'Église ———
  augustin: '354 – 430',
  'thomas-aquin': '1225 – 1274',
  'jean-chrysostome': '349 – 407',
  basile: '329 – 379',
  ambroise: 'v. 340 – 397',
  jerome: 'v. 347 – 420',
  bonaventure: '1221 – 1274',
  'therese-avila': '1515 – 1582',
  'catherine-sienne': '1347 – 1380',

  // ——— Saints ———
  'francois-assise': '1181 – 1226',
  'ignace-loyola': '1491 – 1556',
  dominique: '1170 – 1221',
  'benoit-nursie': 'v. 480 – 547',
  patrick: 'v. 385 – v. 461',
  'jean-bosco': '1815 – 1888',
  'vincent-paul': '1581 – 1660',
  'jean-croix': '1542 – 1591',
  'francois-sales': '1567 – 1622',
  'padre-pio': '1887 – 1968',
  'antoine-grands': 'v. 251 – 356',
  nicolas: 'v. 270 – 343',
  charlemagne: '742 – 814',
  'louis-ix': '1214 – 1270',

  // ——— Saintes ———
  'therese-lisieux': '1873 – 1897',
  'jeanne-arc': '1412 – 1431',
  claire: '1194 – 1253',
  bernadette: '1844 – 1879',
  faustine: '1905 – 1938',
  hildegard: '1098 – 1179',
  'rose-lima': '1586 – 1617',
  monica: '331 – 387',
  rita: '1381 – 1457',
  lucie: '283 – 304',

  // ——— Martyrs ———
  etienne: 'v. 5 – 34 ap. J.-C. (trad.)',
  laurent: 'v. 225 – 258',
  sebastien: 'v. 256 – 288',
  perpetue: 'v. 181 – 203',
  polycarpe: 'v. 69 – 155',
  'maximilian-kolbe': '1894 – 1941',
  'oscar-romero': '1917 – 1980',
  georges: 'v. 280 – 303 (trad.)',

  // ——— Personnages bibliques ———
  marie: 'v. fin Ier s. av. J.-C. – v. Ier s. ap. J.-C. (trad.)',
  joseph: 'v. fin Ier s. av. J.-C. – v. Ier s. ap. J.-C. (trad.)',
  'jean-baptiste': 'v. 5 av. J.-C. – 29 ap. J.-C. (trad.)',
  moise: 'v. XIVe–XIIIe s. av. J.-C. (trad.)',
  abraham: 'v. XXIe–XIXe s. av. J.-C. (trad.)',
  david: 'v. 1040 – 970 av. J.-C.',
  salomon: 'v. 990 – 931 av. J.-C.',
  elie: 'v. IXe–VIIIe s. av. J.-C. (trad.)',
  noe: 'v. XXIVe–XXIIe s. av. J.-C. (approx.)',
  daniel: 'v. 620 – v. 530 av. J.-C. (approx.)',
  esther: 'v. Ve s. av. J.-C. (trad.)',
  ruth: 'v. XIe s. av. J.-C. (trad.)',
};

export function getCharacterLifeYears(characterId: string): string | null {
  return CHARACTER_LIFE_DATES[characterId] ?? null;
}

const missingDates = CHARACTERS.filter((c) => !CHARACTER_LIFE_DATES[c.id]);
if (missingDates.length > 0 && import.meta.env.DEV) {
  console.warn(
    '[characterLifeDates] Dates manquantes :',
    missingDates.map((c) => c.id),
  );
}
