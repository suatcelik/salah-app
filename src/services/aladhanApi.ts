/**
 * Aladhan API Servisi
 * https://aladhan.com/prayer-times-api
 * Ücretsiz, kayıt gerektirmez, rate limit yok
 */

export interface RawPrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
}

export interface PrayerTimesData {
  timings: RawPrayerTimes;
  date: {
    readable: string;           // "21 Mar 2026"
    timestamp: string;
    hijri: {
      date: string;             // "21-09-1446"
      day: string;
      month: { number: number; en: string; ar: string };
      year: string;
    };
    gregorian: {
      date: string;
      day: string;
      month: { number: number; en: string };
      year: string;
    };
  };
  meta: {
    latitude: number;
    longitude: number;
    timezone: string;
    method: { id: number; name: string };
  };
}

export interface ParsedPrayerTime {
  key: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  arabicName: string;
  time: Date;           // Bugünkü gerçek Date nesnesi
  timeStr: string;      // "05:18"
}

// Diyanet metodu (Türkiye) = 13
// Mısır Genel Otoritesi = 5
// Müslüman Dünya Birliği = 3
const METHOD_TURKEY = 13;
const BASE_URL = 'https://api.aladhan.com/v1';

// ── Şehre göre vakitleri getir
export async function fetchPrayerTimesByCity(
  city: string,
  country: string = 'Turkey',
  method: number = METHOD_TURKEY,
  date?: Date,
): Promise<PrayerTimesData> {
  const d = date ?? new Date();
  const dateStr = formatDateForApi(d);

  const url = `${BASE_URL}/timingsByCity/${dateStr}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`;

  const res = await fetchWithTimeout(url, 10_000);
  if (!res.ok) throw new Error(`Aladhan API hatası: ${res.status}`);

  const json = await res.json();
  if (json.code !== 200) throw new Error(json.status ?? 'API hatası');
  if (!json.data?.timings) throw new Error('API geçersiz veri döndürdü');

  return json.data as PrayerTimesData;
}

// ── Koordinata göre vakitleri getir
export async function fetchPrayerTimesByCoords(
  latitude: number,
  longitude: number,
  method: number = METHOD_TURKEY,
  date?: Date,
): Promise<PrayerTimesData> {
  const d = date ?? new Date();
  const dateStr = formatDateForApi(d);

  const url = `${BASE_URL}/timings/${dateStr}?latitude=${latitude}&longitude=${longitude}&method=${method}`;

  const res = await fetchWithTimeout(url, 10_000);
  if (!res.ok) throw new Error(`Aladhan API hatası: ${res.status}`);

  const json = await res.json();
  if (json.code !== 200) throw new Error(json.status ?? 'API hatası');
  if (!json.data?.timings) throw new Error('API geçersiz veri döndürdü');

  return json.data as PrayerTimesData;
}

// ── Ham veriyi kullanışlı formata dönüştür
export function parsePrayerTimes(data: PrayerTimesData): ParsedPrayerTime[] {
  const today = new Date();

  const parse = (
    timeStr: string,
    key: ParsedPrayerTime['key'],
    arabicName: string,
  ): ParsedPrayerTime => {
    // "05:18 (EET)" → "05:18"
    const clean = timeStr.split(' ')[0];
    const [h, m] = clean.split(':').map(Number);
    const time = new Date(today);
    time.setHours(h, m, 0, 0);
    return { key, arabicName, time, timeStr: clean };
  };

  return [
    parse(data.timings.Fajr, 'fajr', 'الفجر'),
    parse(data.timings.Sunrise, 'sunrise', 'الشروق'),
    parse(data.timings.Dhuhr, 'dhuhr', 'الظهر'),
    parse(data.timings.Asr, 'asr', 'العصر'),
    parse(data.timings.Maghrib, 'maghrib', 'المغرب'),
    parse(data.timings.Isha, 'isha', 'العشاء'),
  ];
}

// ── Sıradaki namazı bul
export function getNextPrayer(
  prayers: ParsedPrayerTime[],
): { prayer: ParsedPrayerTime; remaining: number } | null {
  const now = new Date();
  // Güneş (sunrise) hariç tut — namaz vakti değil
  const valid = prayers.filter(p => p.key !== 'sunrise');
  const next = valid.find(p => p.time > now);

  if (!next) return null;

  return {
    prayer: next,
    remaining: next.time.getTime() - now.getTime(), // ms
  };
}

// ── Aktif namazı bul (şu an hangi vakitteyiz)
export function getCurrentPrayer(
  prayers: ParsedPrayerTime[],
): ParsedPrayerTime | null {
  const now = new Date();
  const valid = prayers.filter(p => p.key !== 'sunrise');
  let cur: ParsedPrayerTime | null = null;

  for (const p of valid) {
    if (p.time <= now) cur = p;
    else break;
  }
  return cur;
}

// ── ms → "SS:DD:SS" formatı
export function formatCountdown(ms: number): { h: string; m: string; s: string } {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return {
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0'),
  };
}

// ── Yardımcılar
function formatDateForApi(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}
