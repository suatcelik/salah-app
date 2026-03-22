import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import {
  PrayerTimesData,
  ParsedPrayerTime,
  fetchPrayerTimesByCity,
  fetchPrayerTimesByCoords,
  parsePrayerTimes,
  getNextPrayer,
  getCurrentPrayer,
} from '@/services/aladhanApi';

// ── Her vakit için bildirim ayarı
export interface PrayerNotifSettings {
  ezanEnabled: boolean;
  reminderEnabled: boolean;
}

export type PrayerNotifMap = Record<
  'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha',
  PrayerNotifSettings
>;

const DEFAULT_NOTIF: PrayerNotifMap = {
  fajr:    { ezanEnabled: true,  reminderEnabled: true  },
  dhuhr:   { ezanEnabled: true,  reminderEnabled: false },
  asr:     { ezanEnabled: true,  reminderEnabled: true  },
  maghrib: { ezanEnabled: true,  reminderEnabled: true  },
  isha:    { ezanEnabled: false, reminderEnabled: false },
};

// ── Store tipi
interface PrayerStore {
  // Veri
  prayerTimes:   ParsedPrayerTime[];
  rawData:       PrayerTimesData | null;
  nextPrayer:    { prayer: ParsedPrayerTime; remaining: number } | null;
  currentPrayer: ParsedPrayerTime | null;

  // Konum
  city:      string;
  latitude:  number | null;
  longitude: number | null;

  // Durum
  loading: boolean;
  error:   string | null;
  lastFetched: Date | null;

  // Bildirim ayarları
  notifSettings: PrayerNotifMap;

  // Eylemler
  initialize:    () => Promise<void>;
  fetchByCity:   (city: string) => Promise<void>;
  fetchByDevice: () => Promise<void>;
  refreshTimes:  () => Promise<void>;
  updateNextPrayer: () => void;
  setNotifSetting: (
    prayer: keyof PrayerNotifMap,
    key: keyof PrayerNotifSettings,
    value: boolean,
  ) => void;
  loadSavedSettings: () => Promise<void>;
}

const KEYS = {
  CITY:      '@salah_city',
  LAT:       '@salah_lat',
  LNG:       '@salah_lng',
  NOTIF:     '@salah_notif_settings',
  CACHE:     '@salah_prayer_cache',
  CACHE_DT:  '@salah_cache_date',
};

export const usePrayerStore = create<PrayerStore>((set, get) => ({
  prayerTimes:   [],
  rawData:       null,
  nextPrayer:    null,
  currentPrayer: null,
  city:          'Istanbul',
  latitude:      null,
  longitude:     null,
  loading:       false,
  error:         null,
  lastFetched:   null,
  notifSettings: DEFAULT_NOTIF,

  // ── Kaydedilen konuma göre başlat (onboarding'den sonra)
  initialize: async () => {
    const [savedCity, savedLat] = await Promise.all([
      AsyncStorage.getItem(KEYS.CITY),
      AsyncStorage.getItem(KEYS.LAT),
    ]);

    if (savedLat) {
      // GPS konum kaydedilmişse cihaz konumuyla çek
      await get().fetchByDevice();
    } else if (savedCity) {
      // Şehir adı kaydedilmişse şehirle çek
      await get().fetchByCity(savedCity);
    } else {
      // Hiçbir şey yoksa varsayılan
      await get().fetchByCity('Istanbul');
    }
  },

  // ── Şehre göre çek
  fetchByCity: async (city: string) => {
    set({ loading: true, error: null });
    try {
      // Bugün için önbellekte veri var mı?
      const cached = await getCachedForToday();
      if (cached) {
        const parsed = parsePrayerTimes(cached);
        set({
          prayerTimes: parsed, rawData: cached, city,
          loading: false, lastFetched: new Date(),
        });
        get().updateNextPrayer();
        return;
      }

      const data   = await fetchPrayerTimesByCity(city);
      const parsed = parsePrayerTimes(data);

      await saveCache(data);
      await AsyncStorage.setItem(KEYS.CITY, city);

      set({
        prayerTimes: parsed, rawData: data, city,
        loading: false, lastFetched: new Date(), error: null,
      });
      get().updateNextPrayer();
    } catch (e: any) {
      set({ loading: false, error: e.message ?? 'Vakitler alınamadı' });
    }
  },

  // ── Cihaz konumuna göre çek
  fetchByDevice: async () => {
    set({ loading: true, error: null });
    try {
      // Kayıtlı koordinat var mı?
      const [savedLat, savedLng] = await Promise.all([
        AsyncStorage.getItem(KEYS.LAT),
        AsyncStorage.getItem(KEYS.LNG),
      ]);

      let lat = savedLat ? parseFloat(savedLat) : null;
      let lng = savedLng ? parseFloat(savedLng) : null;

      if (!lat || !lng) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') throw new Error('Konum izni verilmedi');

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;

        await AsyncStorage.setItem(KEYS.LAT, String(lat));
        await AsyncStorage.setItem(KEYS.LNG, String(lng));
      }

      // Önbellekte bugün için veri var mı?
      const cached = await getCachedForToday();
      if (cached) {
        const parsed = parsePrayerTimes(cached);
        set({ prayerTimes: parsed, rawData: cached, latitude: lat, longitude: lng, loading: false, lastFetched: new Date() });
        get().updateNextPrayer();
        return;
      }

      const data   = await fetchPrayerTimesByCoords(lat, lng);
      const parsed = parsePrayerTimes(data);

      await saveCache(data);

      set({
        prayerTimes: parsed, rawData: data,
        latitude: lat, longitude: lng,
        loading: false, lastFetched: new Date(), error: null,
      });
      get().updateNextPrayer();
    } catch (e: any) {
      // Konuma erişilemezse şehir adına dön
      const savedCity = await AsyncStorage.getItem(KEYS.CITY);
      if (savedCity) {
        await get().fetchByCity(savedCity);
      } else {
        set({ loading: false, error: e.message ?? 'Konum alınamadı' });
      }
    }
  },

  // ── Yenile (gün değişimi veya manuel)
  refreshTimes: async () => {
    const { latitude, longitude, city } = get();
    if (latitude && longitude) {
      await get().fetchByDevice();
    } else {
      await get().fetchByCity(city);
    }
  },

  // ── Sıradaki namazı güncelle (her saniye çağrılır)
  updateNextPrayer: () => {
    const state = get();
    if (!state.prayerTimes.length) return;
    const nextPrayer    = getNextPrayer(state.prayerTimes);
    const currentPrayer = getCurrentPrayer(state.prayerTimes);
    // Namaz kimliği değişmediyse gereksiz re-render tetikleme
    if (
      state.nextPrayer?.prayer.key === nextPrayer?.prayer.key &&
      state.currentPrayer?.key     === currentPrayer?.key
    ) return;
    set({ nextPrayer, currentPrayer });
  },

  // ── Bildirim ayarı güncelle
  setNotifSetting: (prayer, key, value) => {
    const prev = get().notifSettings;
    const next = {
      ...prev,
      [prayer]: { ...prev[prayer], [key]: value },
    };
    set({ notifSettings: next });
    AsyncStorage.setItem(KEYS.NOTIF, JSON.stringify(next));
  },

  // ── Kayıtlı ayarları yükle
  loadSavedSettings: async () => {
    const raw = await AsyncStorage.getItem(KEYS.NOTIF);
    if (raw) {
      try { set({ notifSettings: JSON.parse(raw) }); } catch {}
    }
  },
}));

// ── Önbellek yardımcıları
async function getCachedForToday(): Promise<PrayerTimesData | null> {
  try {
    const [cached, dateStr] = await Promise.all([
      AsyncStorage.getItem(KEYS.CACHE),
      AsyncStorage.getItem(KEYS.CACHE_DT),
    ]);
    if (!cached || !dateStr) return null;

    const cacheDate = new Date(dateStr);
    const today     = new Date();
    const sameDay   =
      cacheDate.getFullYear() === today.getFullYear() &&
      cacheDate.getMonth()    === today.getMonth()    &&
      cacheDate.getDate()     === today.getDate();

    return sameDay ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

async function saveCache(data: PrayerTimesData): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(KEYS.CACHE,    JSON.stringify(data)),
    AsyncStorage.setItem(KEYS.CACHE_DT, new Date().toISOString()),
  ]);
}