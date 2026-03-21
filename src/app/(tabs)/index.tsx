import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { usePrayerStore } from '@/store/prayerStore';
import { useRamadan } from '@/hooks/useRamadan';
import { useLanguage, useT } from '@/i18n';
import { formatCountdown } from '@/services/aladhanApi';
import { formatHijriDate } from '@/utils/hijriCalendar';
import RamadanWelcomeScreen from '@/components/RamadanWelcomeScreen';
import RamadanApproachingBanner from '@/components/RamadanApproachingBanner';

const PRAYER_EMOJI: Record<string, string> = {
  fajr: '🌙', sunrise: '🌅', dhuhr: '☀️', asr: '🌤️', maghrib: '🌆', isha: '🌃',
};
const EMERALD_DARK = '#0A2A1E', EMERALD = '#0F3D2E', EMERALD_MID = '#1A6B52';
const GOLD = '#C9A84C', GOLD_LIGHT = '#E8C96A', CREAM = '#FAF6EE';
const INK = '#1A1208', MUTED = '#6B5C3E';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const t = useT();
  const { language } = useLanguage();

  const { prayerTimes, nextPrayer, currentPrayer, rawData,
    loading, error, fetchByDevice, fetchByCity, refreshTimes, updateNextPrayer } = usePrayerStore();

  const { isRamadan, isApproaching, daysUntilRamadan,
    ramadanDay, daysUntilEnd, ramadanYear, hijri,
    showWelcome, dismissWelcome } = useRamadan();

  const [countdown, setCountdown] = useState({ h: '00', m: '00', s: '00' });
  const [iftarMs, setIftarMs] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Önce İstanbul ile hızlı başlat, paralelde GPS de dene
    fetchByCity('Istanbul');
    fetchByDevice();
  }, []);

  useEffect(() => {
    if (!prayerTimes.length) return;
    const tick = () => {
      updateNextPrayer();
      if (nextPrayer) setCountdown(formatCountdown(nextPrayer.remaining));
      if (isRamadan) {
        const maghrib = prayerTimes.find(p => p.key === 'maghrib');
        if (maghrib) setIftarMs(Math.max(0, maghrib.time.getTime() - Date.now()));
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [prayerTimes, isRamadan, nextPrayer]);

  useEffect(() => {
    const now = new Date();
    const mid = new Date(now);
    mid.setDate(mid.getDate() + 1); mid.setHours(0, 0, 5, 0);
    const id = setTimeout(() => refreshTimes(), mid.getTime() - now.getTime());
    return () => clearTimeout(id);
  }, []);

  const onRefresh = async () => { setRefreshing(true); await refreshTimes(); setRefreshing(false); };

  const headerColors = isRamadan
    ? ['#050B14', '#0D1B2A', '#1B1030'] as [string, string, string]
    : [EMERALD_DARK, EMERALD, EMERALD_MID] as [string, string, string];

  const hijriStr = rawData
    ? `${rawData.date.hijri.day} ${rawData.date.hijri.month.ar} ${rawData.date.hijri.year}`
    : formatHijriDate(hijri, language === 'ar' ? 'ar' : 'tr');

  const maghrib = prayerTimes.find(p => p.key === 'maghrib');
  const fajr = prayerTimes.find(p => p.key === 'fajr');
  const isha = prayerTimes.find(p => p.key === 'isha');
  const now = Date.now();
  const fastProgress = (fajr && maghrib)
    ? Math.min(100, Math.max(0, ((now - fajr.time.getTime()) / (maghrib.time.getTime() - fajr.time.getTime())) * 100))
    : 0;
  const iftarCd = formatCountdown(iftarMs);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>

      {isRamadan && (
        <RamadanWelcomeScreen
          visible={showWelcome}
          ramadanDay={ramadanDay ?? 1}
          hijriYear={ramadanYear}
          onDismiss={dismissWelcome}
        />
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} colors={[GOLD]} />}
      >
        {/* ── Header ── */}
        <LinearGradient colors={headerColors} style={s.header} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}>

          <View style={s.headerTop}>
            <View>
              <Text style={s.logo}>
                <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Amiri-Regular' : 'serif' }}>صلاة </Text>
                <Text style={s.logoLatin}>Salah</Text>
              </Text>
              {isRamadan && (
                <View style={s.ramBadge}>
                  <Text style={s.ramBadgeTxt}>🌙 {t.ramadan.modeActive}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={s.settBtn}>
              <Text style={{ fontSize: 18 }}>⚙️</Text>
            </TouchableOpacity>
          </View>

          <View style={s.hijriRow}>
            <Text style={s.hijriTxt}>{hijriStr}</Text>
            <View style={s.cityRow}>
              <View style={s.cityDot} />
              <Text style={s.cityTxt}>
                {rawData?.meta?.timezone?.split('/')?.[1] ?? usePrayerStore.getState().city}
              </Text>
            </View>
          </View>

          {/* Ramazan modu: İftar geri sayım */}
          {isRamadan ? (
            <View style={s.nextCard}>
              <Text style={s.nextLbl}>🍽️ {t.ramadan.iftarRemaining}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <Text style={s.countdown}>{iftarCd.h}:{iftarCd.m}:{iftarCd.s}</Text>
              </View>
              <Text style={s.cdSub}>
                {t.ramadan.iftar}: {maghrib?.timeStr ?? '--:--'} · {t.ramadan.suhoor}: {fajr?.timeStr ?? '--:--'}
              </Text>
              <View style={{ marginTop: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>🌅 {fajr?.timeStr}</Text>
                  <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>🌙 {maghrib?.timeStr}</Text>
                </View>
                <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                  <View style={{ width: `${fastProgress}%` as any, height: '100%', backgroundColor: GOLD, borderRadius: 3 }} />
                </View>
              </View>
            </View>
          ) : (
            /* Normal mod: Sıradaki namaz */
            <View style={s.nextCard}>
              {!loading && nextPrayer ? (
                <>
                  <Text style={s.nextLbl}>⏳ {t.home.nextPrayer}</Text>
                  <Text style={s.nextName}>
                    {t.prayers[nextPrayer.prayer.key as keyof typeof t.prayers] ?? nextPrayer.prayer.key}
                  </Text>
                  <Text style={s.nextAr}>{nextPrayer.prayer.arabicName}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                    <Text style={s.countdown}>{countdown.h}:{countdown.m}:{countdown.s}</Text>
                    <Text style={s.cdSub}>{t.home.remaining} · {nextPrayer.prayer.timeStr}{t.home.at}</Text>
                  </View>
                  <TouchableOpacity style={s.alarmBig}><Text style={{ fontSize: 20 }}>🔔</Text></TouchableOpacity>
                </>
              ) : (
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                  {loading ? 'Vakitler yükleniyor...' : 'Konum izni verin veya pull-to-refresh yapın'}
                </Text>
              )}
            </View>
          )}
        </LinearGradient>

        {/* Ramazan yaklaşıyor banner */}
        {isApproaching && daysUntilRamadan !== null && (
          <RamadanApproachingBanner daysLeft={daysUntilRamadan} />
        )}

        {/* ── Namaz vakitleri ── */}
        <View style={s.prayersSec}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
            {[t.home.today, t.home.weekly, t.home.monthly].map((lbl, i) => (
              <TouchableOpacity key={i} style={[s.tab, i === 0 && s.tabActive]}>
                <Text style={[s.tabTxt, i === 0 && s.tabTxtActive]}>{lbl}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {error && (
            <View style={s.errorBox}>
              <Text style={s.errorTxt}>⚠️ {error}</Text>
              <TouchableOpacity onPress={refreshTimes}>
                <Text style={s.retryTxt}>Tekrar dene</Text>
              </TouchableOpacity>
            </View>
          )}

          {loading && !prayerTimes.length && (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: MUTED }}>Vakitler yükleniyor...</Text>
            </View>
          )}

          {prayerTimes.map(prayer => {
            const isActive = currentPrayer?.key === prayer.key;
            const isFajr = prayer.key === 'fajr';
            const isMaghrib = prayer.key === 'maghrib';
            const isSpecial = isRamadan && (isFajr || isMaghrib);

            return (
              <View key={prayer.key} style={[s.pRow, isActive && s.pRowActive, isSpecial && !isActive && s.pRowSpecial]}>
                {isSpecial && !isActive && (
                  <View style={[s.specBar, isFajr ? s.specBarSuhoor : s.specBarIftar]} />
                )}
                <View style={[s.pIcon, isActive && s.pIconActive]}>
                  <Text style={{ fontSize: 20 }}>{PRAYER_EMOJI[prayer.key]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Text style={[s.pName, isActive && s.white]}>
                      {t.prayers[prayer.key as keyof typeof t.prayers] ?? prayer.key}
                    </Text>
                    {isRamadan && isFajr && (
                      <View style={s.tagS}><Text style={s.tagSTxt}>{t.ramadan.suhoorTag}</Text></View>
                    )}
                    {isRamadan && isMaghrib && (
                      <View style={s.tagI}><Text style={s.tagITxt}>{t.ramadan.iftarTag}</Text></View>
                    )}
                  </View>
                  <Text style={[s.pAr, isActive && { color: 'rgba(255,255,255,0.55)' }]}>{prayer.arabicName}</Text>
                </View>
                <Text style={[s.pTime, isActive && { color: GOLD_LIGHT }]}>{prayer.timeStr}</Text>
                <TouchableOpacity style={[s.alarmS, isActive && { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                  <Text style={{ fontSize: 13 }}>🔔</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Teravih kartı */}
          {isRamadan && (
            <View style={s.terawih}>
              <View style={s.terawihIcon}><Text style={{ fontSize: 22 }}>🤲</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.terawihLbl}>Bu Gece</Text>
                <Text style={s.terawihName}>{t.ramadan.tarawih}</Text>
                <Text style={s.terawihTime}>Yatsı sonrası · {isha?.timeStr ?? '--:--'} civarı</Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(123,79,190,0.7)' }}>20 Rekât</Text>
            </View>
          )}
        </View>

        {/* ── Kıble mini kart ── */}
        <Divider label={t.home.qibla} />
        <TouchableOpacity style={s.qiblaCard} onPress={() => router.push('/(tabs)/qibla')} activeOpacity={0.85}>
          <View style={s.qiblaIcon}><Text style={{ fontSize: 26 }}>🧭</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.qiblaTitle}>{t.qibla.title}</Text>
            <Text style={s.qiblaSub}>136° · {t.qibla.direction}: GD</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: EMERALD_MID }}>136°</Text>
        </TouchableOpacity>

        {/* ── Günlük ayet ── */}
        <Divider label={t.home.dailyVerse} />
        <TouchableOpacity style={s.verseWrap} onPress={() => router.push('/(tabs)/verse')} activeOpacity={0.88}>
          <LinearGradient colors={[EMERALD_DARK, '#1A3D2B']} style={s.verseCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={s.verseBadge}><Text style={s.verseBadgeTxt}>✨ {t.verse.title}</Text></View>
            <Text style={s.verseAr}>إِنَّ اللَّهَ مَعَ الصَّابِرِينَ</Text>
            <Text style={s.verseMeal}>"Şüphesiz Allah, sabredenlerle beraberdir."</Text>
            <Text style={s.verseSource}>Bakara Suresi · 2:153</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Dua & Zikir ── */}
        <Divider label={t.home.dhikr} />
        <TouchableOpacity onPress={() => router.push('/(tabs)/prayers')} activeOpacity={0.88}>
          <View style={s.dhikrGrid}>
            {[
              { lbl: t.dhikr.subhanallah, done: 33, total: 33 },
              { lbl: t.dhikr.alhamdulillah, done: 21, total: 33 },
              { lbl: t.dhikr.allahuAkbar, done: 0, total: 33 },
              { lbl: t.dhikr.morningDua, done: 0, total: 1 },
            ].map((item, i) => (
              <View key={i} style={s.dhikrCard}>
                <Text style={{ fontSize: 22, marginBottom: 6 }}>📿</Text>
                <Text style={s.dhikrLbl}>{item.lbl}</Text>
                <Text style={s.dhikrCnt}>
                  {item.done > 0 ? `${item.done}/${item.total}` : t.dhikr.notRead}
                </Text>
                <View style={s.dhikrBar}>
                  <View style={[s.dhikrFill, { width: `${(item.done / item.total) * 100}%` as any }]} />
                </View>
              </View>
            ))}
          </View>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <View style={s.div}>
      <View style={s.divLine} /><View style={s.divDia} />
      <Text style={s.divTxt}>{label}</Text>
      <View style={s.divDia} /><View style={s.divLine} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  header: { paddingHorizontal: 22, paddingBottom: 32, overflow: 'hidden' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginBottom: 12 },
  logo: { fontSize: 22, color: '#fff' },
  logoLatin: { fontSize: 16, fontWeight: '800', letterSpacing: 3, color: 'rgba(255,255,255,0.9)' },
  ramBadge: { flexDirection: 'row', backgroundColor: 'rgba(123,79,190,0.3)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)', marginTop: 3 },
  ramBadgeTxt: { fontSize: 10, fontWeight: '700', color: GOLD_LIGHT },
  settBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  hijriRow: { marginBottom: 16, alignItems: 'center' },
  hijriTxt: { fontFamily: Platform.OS === 'ios' ? 'Amiri-Regular' : 'serif', fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  cityDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: GOLD },
  cityTxt: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  nextCard: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 24, padding: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  nextLbl: { fontSize: 10, fontWeight: '700', color: GOLD_LIGHT, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  nextName: { fontFamily: Platform.OS === 'ios' ? 'Amiri-Regular' : 'serif', fontSize: 34, color: '#fff', lineHeight: 38, marginBottom: 2 },
  nextAr: { fontFamily: Platform.OS === 'ios' ? 'Amiri-Regular' : 'serif', fontSize: 18, color: 'rgba(255,255,255,0.4)', marginBottom: 14 },
  countdown: { fontSize: 42, fontWeight: '800', color: '#fff', letterSpacing: -2, lineHeight: 46 },
  cdSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  alarmBig: { position: 'absolute', right: 20, bottom: 20, width: 44, height: 44, borderRadius: 14, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', shadowColor: GOLD, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  prayersSec: { backgroundColor: CREAM, marginTop: -20, borderRadius: 24, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(26,107,82,0.08)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)' },
  tabActive: { backgroundColor: EMERALD, borderColor: EMERALD },
  tabTxt: { fontSize: 12, fontWeight: '600', color: MUTED },
  tabTxtActive: { color: '#fff' },
  pRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, marginBottom: 8, backgroundColor: 'rgba(26,107,82,0.05)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.08)', gap: 12, overflow: 'hidden' },
  pRowActive: { backgroundColor: EMERALD, borderColor: EMERALD_MID },
  pRowSpecial: { borderColor: 'rgba(201,168,76,0.3)', backgroundColor: 'rgba(201,168,76,0.05)' },
  specBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  specBarSuhoor: { backgroundColor: 'rgba(100,140,220,0.7)' },
  specBarIftar: { backgroundColor: GOLD },
  pIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(26,107,82,0.1)', alignItems: 'center', justifyContent: 'center' },
  pIconActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  pName: { fontSize: 14, fontWeight: '700', color: INK },
  pAr: { fontFamily: Platform.OS === 'ios' ? 'Amiri-Regular' : 'serif', fontSize: 12, color: MUTED },
  pTime: { fontSize: 16, fontWeight: '800', color: EMERALD_MID },
  alarmS: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(26,107,82,0.1)', alignItems: 'center', justifyContent: 'center' },
  white: { color: '#fff' },
  tagS: { backgroundColor: 'rgba(100,140,220,0.15)', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 },
  tagSTxt: { fontSize: 9, fontWeight: '800', color: 'rgba(130,160,220,0.9)' },
  tagI: { backgroundColor: 'rgba(201,168,76,0.15)', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 },
  tagITxt: { fontSize: 9, fontWeight: '800', color: GOLD },
  terawih: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(29,18,50,0.08)', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(123,79,190,0.2)', marginTop: 8 },
  terawihIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(123,79,190,0.1)', borderWidth: 1, borderColor: 'rgba(123,79,190,0.25)', alignItems: 'center', justifyContent: 'center' },
  terawihLbl: { fontSize: 10, fontWeight: '700', color: 'rgba(123,79,190,0.7)', letterSpacing: 1, textTransform: 'uppercase' },
  terawihName: { fontSize: 14, fontWeight: '700', color: INK },
  terawihTime: { fontSize: 11, color: MUTED },
  div: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginVertical: 16 },
  divLine: { flex: 1, height: 1, backgroundColor: 'rgba(201,168,76,0.2)' },
  divDia: { width: 5, height: 5, backgroundColor: GOLD, transform: [{ rotate: '45deg' }] },
  divTxt: { fontSize: 10, fontWeight: '700', color: GOLD, letterSpacing: 2, textTransform: 'uppercase' },
  qiblaCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  qiblaIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(26,107,82,0.08)', alignItems: 'center', justifyContent: 'center' },
  qiblaTitle: { fontSize: 14, fontWeight: '700', color: INK },
  qiblaSub: { fontSize: 11, color: MUTED, marginTop: 1 },
  verseWrap: { marginHorizontal: 16, borderRadius: 22, overflow: 'hidden' },
  verseCard: { padding: 22 },
  verseBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(201,168,76,0.15)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 14, alignSelf: 'flex-start' },
  verseBadgeTxt: { fontSize: 11, fontWeight: '700', color: GOLD_LIGHT },
  verseAr: { fontFamily: Platform.OS === 'ios' ? 'Amiri-Regular' : 'serif', fontSize: 19, color: '#fff', lineHeight: 34, textAlign: 'right', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.2)', paddingBottom: 12 },
  verseMeal: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontStyle: 'italic', lineHeight: 20, marginBottom: 8 },
  verseSource: { fontSize: 11, fontWeight: '700', color: GOLD },
  dhikrGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginHorizontal: 16 },
  dhikrCard: { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)' },
  dhikrLbl: { fontSize: 12, fontWeight: '700', color: INK, marginBottom: 2 },
  dhikrCnt: { fontSize: 11, color: MUTED },
  dhikrBar: { height: 3, backgroundColor: 'rgba(26,107,82,0.1)', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  dhikrFill: { height: '100%', backgroundColor: EMERALD_MID, borderRadius: 2 },
  errorBox: { margin: 12, padding: 14, backgroundColor: 'rgba(224,82,82,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(224,82,82,0.2)', alignItems: 'center' },
  errorTxt: { fontSize: 13, color: '#E05252', marginBottom: 6 },
  retryTxt: { fontSize: 12, fontWeight: '700', color: EMERALD_MID },
});
