import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { translations, Language } from '@/i18n/translations';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

const KEY_ASKED = '@salah_notif_asked';

// ─────────────────────────────────────────────────────────────
// 1. Bildirim handler — root _layout.tsx'te bir kez çağrılır
// ─────────────────────────────────────────────────────────────
export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async (n) => {
      const isEzan = n.request.content.data?.type === 'ezan';
      return {
        shouldShowAlert: true,
        shouldPlaySound: isEzan,
        shouldSetBadge:  false,
        shouldShowBanner: true,
        shouldShowList:   true,
        priority: isEzan
          ? Notifications.AndroidNotificationPriority.MAX
          : Notifications.AndroidNotificationPriority.DEFAULT,
      };
    },
  });
}

// ─────────────────────────────────────────────────────────────
// 2. Android bildirim kanalları — izin verildikten sonra çağrılır
// ─────────────────────────────────────────────────────────────
export async function createNotificationChannels() {
  if (Platform.OS !== 'android') return;

  // Kanal isimleri sabit Türkçe — Android sistem ayarlarında görünür,
  // dil değişse bile kanal adı değişmez (Android kısıtı).
  await Notifications.setNotificationChannelAsync('ezan', {
    name:                'Ezan Bildirimleri',
    description:         'Namaz vakti girdiğinde ezan sesi çalar',
    importance:          Notifications.AndroidImportance.MAX,
    sound:               'ezan.wav',
    vibrationPattern:    [0, 250, 250, 250],
    lightColor:          '#C9A84C',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd:           false,
    enableVibrate:       true,
  });

  await Notifications.setNotificationChannelAsync('reminder', {
    name:                'Vakit Hatırlatıcıları',
    description:         'Namaz vaktinden 15 dakika önce sessiz hatırlatıcı',
    importance:          Notifications.AndroidImportance.DEFAULT,
    sound:               'reminder.wav',
    vibrationPattern:    [0, 150],
    lightColor:          '#E8C96A',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd:           false,
    enableVibrate:       true,
  });
}

// ─────────────────────────────────────────────────────────────
// 3. İzin hook — uygulama ilk açılışında otomatik ister
// ─────────────────────────────────────────────────────────────
export function useNotificationPermission() {
  const [status,  setStatus]  = useState<PermissionStatus>('undetermined');
  const [loading, setLoading] = useState(true);

  useEffect(() => { init(); }, []);

  async function init() {
    try {
      const { status: cur } = await Notifications.getPermissionsAsync();

      if (cur === 'granted') {
        setStatus('granted');
        await createNotificationChannels();
        setLoading(false);
        return;
      }

      // Daha önce sorduk mu?
      const asked = await AsyncStorage.getItem(KEY_ASKED);
      if (!asked) {
        await request();
      } else {
        setStatus(cur === 'denied' ? 'denied' : 'undetermined');
      }
    } catch (e) {
      console.warn('[Notifications] init error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function request(): Promise<PermissionStatus> {
    await AsyncStorage.setItem(KEY_ASKED, 'true');

    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: true,
      },
    });

    const mapped: PermissionStatus =
      status === 'granted' ? 'granted' :
      status === 'denied'  ? 'denied'  : 'undetermined';

    setStatus(mapped);
    if (mapped === 'granted') await createNotificationChannels();
    return mapped;
  }

  return { status, loading, requestPermission: request };
}

// ─────────────────────────────────────────────────────────────
// 4. Bildirim planlama — tam lokalize
//    language parametresi ile kullanıcının dili alınır,
//    tüm title/body string'leri translations'dan gelir.
// ─────────────────────────────────────────────────────────────
export interface PrayerSchedule {
  key:          string;   // 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'
  name:         string;   // Lokalize isim (örn. "İkindi")
  arabicName:   string;   // Arapça isim (örn. "العصر")
  time:         Date;
  enableEzan:       boolean;
  enableReminder:   boolean;
  // Ramazan özel
  isIftar?:     boolean;  // Akşam vakti + Ramazan ise true
  isSuhoor?:    boolean;  // İmsak vakti + Ramazan ise true
}

export async function schedulePrayerNotifications(
  prayers:  PrayerSchedule[],
  language: Language = 'tr',
) {
  // Mevcut tüm planlanmış bildirimleri temizle
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();
  const t   = translations[language];

  for (const p of prayers) {

    // ── Ezan bildirimi (vakitte)
    if (p.enableEzan && p.time > now) {

      // Ramazan özel başlık
      let title: string;
      let body:  string;

      if (p.isIftar) {
        // İftar vakti — özel mesaj
        title = `🌙 ${t.ramadan.iftar}`;
        body  = `${p.name} · ${fmtTime(p.time, language)}`;
      } else if (p.isSuhoor) {
        // Sahur/imsak vakti — özel mesaj
        title = `🌅 ${t.ramadan.suhoor}`;
        body  = `${p.name} · ${fmtTime(p.time, language)}`;
      } else {
        // Normal vakit
        title = buildEzanTitle(p.name, language);
        body  = `${p.arabicName} · ${fmtTime(p.time, language)}`;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'ezan.wav',
          data:  { type: 'ezan', prayer: p.key },
          ...(Platform.OS === 'android' && { channelId: 'ezan' }),
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: p.time },
      });
    }

    // ── 15 dk önce hatırlatıcı
    if (p.enableReminder) {
      const reminderTime = new Date(p.time.getTime() - 15 * 60 * 1000);

      if (reminderTime > now) {
        const title = buildReminderTitle(p.name, language);
        const body  = buildReminderBody(p.name, p.time, language);

        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: 'reminder.wav',
            data:  { type: 'reminder', prayer: p.key },
            ...(Platform.OS === 'android' && { channelId: 'reminder' }),
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderTime },
        });
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 5. Ramazan özel bildirimler
//    İftar'a 30 dk kala ayrı bir bildirim gönder
// ─────────────────────────────────────────────────────────────
export async function scheduleIftarApproachingNotification(
  iftarTime: Date,
  language:  Language = 'tr',
) {
  const t             = translations[language];
  const thirtyMinBefore = new Date(iftarTime.getTime() - 30 * 60 * 1000);
  const now           = new Date();

  if (thirtyMinBefore <= now) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🍽️ ${t.ramadan.iftarRemaining}`,
      body:  `${t.ramadan.iftar}: ${fmtTime(iftarTime, language)}`,
      sound: 'reminder.wav',
      data:  { type: 'iftar_approaching' },
      ...(Platform.OS === 'android' && { channelId: 'reminder' }),
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: thirtyMinBefore },
  });
}

export async function scheduleSuhoorApproachingNotification(
  suhoorTime: Date,
  language:   Language = 'tr',
) {
  const t              = translations[language];
  const thirtyMinBefore = new Date(suhoorTime.getTime() - 30 * 60 * 1000);
  const now            = new Date();

  if (thirtyMinBefore <= now) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🌅 ${t.ramadan.suhoorRemaining}`,
      body:  `${t.ramadan.suhoor}: ${fmtTime(suhoorTime, language)}`,
      sound: 'reminder.wav',
      data:  { type: 'suhoor_approaching' },
      ...(Platform.OS === 'android' && { channelId: 'reminder' }),
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: thirtyMinBefore },
  });
}


// ─────────────────────────────────────────────────────────────
// Yardımcı — dile göre bildirim string'leri
// ─────────────────────────────────────────────────────────────

function buildEzanTitle(prayerName: string, lang: Language): string {
  const titles: Record<Language, string> = {
    tr: `🔔 ${prayerName} Vakti Girdi`,
    en: `🔔 ${prayerName} Prayer Time`,
    ar: `🔔 حان وقت ${prayerName}`,
    de: `🔔 ${prayerName} Gebetszeit`,
    fr: `🔔 Heure de la prière ${prayerName}`,
  };
  return titles[lang] ?? titles.tr;
}

function buildReminderTitle(prayerName: string, lang: Language): string {
  const titles: Record<Language, string> = {
    tr: `⏰ ${prayerName} Vakti Yaklaşıyor`,
    en: `⏰ ${prayerName} Prayer Approaching`,
    ar: `⏰ ${prayerName} يقترب وقتها`,
    de: `⏰ ${prayerName} Gebetszeit naht`,
    fr: `⏰ Prière ${prayerName} approche`,
  };
  return titles[lang] ?? titles.tr;
}

function buildReminderBody(
  prayerName: string,
  time:       Date,
  lang:       Language,
): string {
  const timeStr = fmtTime(time, lang);
  const bodies: Record<Language, string> = {
    tr: `${prayerName} namazına 15 dakika kaldı · ${timeStr}`,
    en: `${prayerName} prayer in 15 minutes · ${timeStr}`,
    ar: `${prayerName} بعد 15 دقيقة · ${timeStr}`,
    de: `${prayerName} Gebet in 15 Minuten · ${timeStr}`,
    fr: `Prière ${prayerName} dans 15 minutes · ${timeStr}`,
  };
  return bodies[lang] ?? bodies.tr;
}

function fmtTime(date: Date, lang: Language): string {
  // Arapça için farklı locale kullan
  const locale = lang === 'ar' ? 'ar-SA' : lang === 'de' ? 'de-DE' : lang === 'fr' ? 'fr-FR' : 'tr-TR';
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}