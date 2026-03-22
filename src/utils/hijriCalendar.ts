export interface HijriDate {
  year: number;
  month: number;   // 1–12  (9 = Ramazan)
  day: number;
  monthName: string;
  monthNameAr: string;
}

export interface RamadanStatus {
  isRamadan: boolean;
  ramadanDay: number | null;
  daysUntilEnd: number | null;
  daysUntilRamadan: number | null;
  isApproaching: boolean;   // Şaban son 7 gün
  ramadanYear: number;
  hijri: HijriDate;
}

const MONTHS_TR = [
  'Muharrem','Safer','Rebiülevvel','Rebiülahir',
  'Cemaziyelevvel','Cemaziyelahir','Recep','Şaban',
  'Ramazan','Şevval','Zilkade','Zilhicce',
];
const MONTHS_AR = [
  'محرم','صفر','ربيع الأول','ربيع الآخر',
  'جمادى الأولى','جمادى الآخرة','رجب','شعبان',
  'رمضان','شوال','ذو القعدة','ذو الحجة',
];

function toJD(y: number, m: number, d: number): number {
  if (m <= 2) { y--; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) +
         Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

function isHijriLeap(hYear: number): boolean {
  return [2,5,7,10,13,16,18,21,24,26,29].includes(hYear % 30);
}

function jdToHijri(jd: number): HijriDate {
  const N1 = Math.floor(jd - 1948439.5) + 1;
  const K  = Math.floor((N1 - 1) / 10631);
  const N2 = N1 - K * 10631;
  const J  = Math.floor((N2 - 1) / 354);
  const N3 = N2 - J * 354 - Math.floor((11 * J + 3) / 30);
  const hY = 30 * K + J + 1;

  const ml = [30,29,30,29,30,29,30,29,30,29,30, isHijriLeap(hY) ? 30 : 29];
  let hMonth = 1;
  let hDay   = N3;

  for (let i = 0; i < 12; i++) {
    if (hDay <= ml[i]) { hMonth = i + 1; break; }
    hDay -= ml[i];
    if (i === 11) { hMonth = 12; hDay = Math.max(1, hDay); }
  }

  return {
    year: hY, month: hMonth, day: Math.max(1, hDay),
    monthName:   MONTHS_TR[hMonth - 1],
    monthNameAr: MONTHS_AR[hMonth - 1],
  };
}

function gregorianToHijri(date: Date = new Date()): HijriDate {
  const jd = toJD(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return jdToHijri(jd);
}

export function getRamadanStatus(date: Date = new Date()): RamadanStatus {
  const hijri     = gregorianToHijri(date);
  const isRamadan = hijri.month === 9;

  // Şaban'ın son 7 günü → yaklaşıyor
  const isApproaching = !isRamadan && hijri.month === 8 && (30 - hijri.day) <= 7;

  if (isRamadan) {
    const ramadanLen = isHijriLeap(hijri.year) ? 30 : 29;
    return {
      isRamadan: true,
      ramadanDay: hijri.day,
      daysUntilEnd: ramadanLen - hijri.day,
      daysUntilRamadan: null,
      isApproaching: false,
      ramadanYear: hijri.year,
      hijri,
    };
  }

  let daysUntil: number | null = null;
  if (hijri.month === 8) {
    daysUntil = 30 - hijri.day;
  } else if (hijri.month < 9) {
    daysUntil = Math.round((9 - hijri.month) * 29.53) - hijri.day;
  } else {
    daysUntil = Math.round((12 - hijri.month + 9) * 29.53) - hijri.day;
  }

  return {
    isRamadan: false,
    ramadanDay: null,
    daysUntilEnd: null,
    daysUntilRamadan: daysUntil,
    isApproaching,
    ramadanYear: hijri.month >= 9 ? hijri.year + 1 : hijri.year,
    hijri,
  };
}

export function formatHijriDate(hijri: HijriDate, lang: 'tr'|'ar'|'en' = 'tr'): string {
  if (lang === 'ar') {
    const ar = (n: number) => n.toString().replace(/\d/g, d =>
      String.fromCharCode(0x0660 + +d));
    return `${ar(hijri.day)} ${hijri.monthNameAr} ${ar(hijri.year)}`;
  }
  return `${hijri.day} ${hijri.monthName} ${hijri.year}`;
}
