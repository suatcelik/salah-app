import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, Vibration, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useT } from '@/i18n';

// ── Renkler
const EMERALD_DARK = '#0A2A1E';
const EMERALD = '#0F3D2E';
const EMERALD_MID = '#1A6B52';
const GOLD = '#C9A84C';
const GOLD_LIGHT = '#E8C96A';
const CREAM = '#FAF6EE';
const INK = '#1A1208';
const MUTED = '#6B5C3E';
const BORDER = 'rgba(201,168,76,0.2)';

// ── Zikir tanımları
interface DhikrItem {
  key: string;
  arabic: string;
  target: number;
  color: [string, string];
  emoji: string;
}

const DHIKR_LIST: DhikrItem[] = [
  { key: 'subhanallah', arabic: 'سُبْحَانَ اللَّهِ', target: 33, color: [EMERALD, EMERALD_MID], emoji: '📿' },
  { key: 'alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', target: 33, color: ['#1A3D8C', '#2B5CD4'], emoji: '🤲' },
  { key: 'allahuAkbar', arabic: 'اللَّهُ أَكْبَرُ', target: 34, color: ['#5B1A8C', '#8B35D4'], emoji: '☪️' },
  { key: 'morningDua', arabic: 'أَذْكَارُ الصَّبَاحِ', target: 1, color: ['#8C5A1A', '#D48B35'], emoji: '🌅' },
];

// ── Sabah duaları
interface MorningDua {
  arabic: string;
  turkish: string;
  count: number;
}

const MORNING_DUAS: MorningDua[] = [
  {
    arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ',
    turkish: '"Biz de, mülk de Allah\'a ait olarak sabahladık."',
    count: 1,
  },
  {
    arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا',
    turkish: '"Allah\'ım! Seninle sabahladık, seninle akşamladık."',
    count: 1,
  },
  {
    arabic: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ',
    turkish: '"Kovulmuş şeytandan Allah\'a sığınırım."',
    count: 3,
  },
];

const KEY_PREFIX = '@salah_dhikr_';

// ── Tesbih sayacı bileşeni
function DhikrCounter({
  item, count, onTap, onReset, isCompleted,
}: {
  item: DhikrItem; count: number; onTap: () => void;
  onReset: () => void; isCompleted: boolean;
}) {
  const t = useT();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progress = Math.min(count / item.target, 1);

  const handleTap = () => {
    if (isCompleted) return;
    // Dokunma animasyonu
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    // Titreşim
    Vibration.vibrate(Platform.OS === 'ios' ? 10 : 20);
    onTap();
  };

  return (
    <View style={dc.wrap}>
      <TouchableOpacity onPress={handleTap} onLongPress={onReset} activeOpacity={0.8} delayLongPress={600}>
        <Animated.View style={[dc.btn, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={isCompleted ? ['#2E7D32', '#43A047'] : item.color}
            style={dc.btnGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            {/* Progress ring */}
            <View style={dc.progressRing}>
              <View style={[dc.progressFill, {
                borderRightColor: isCompleted ? '#81C784' : GOLD,
                transform: [{ rotate: `${progress * 360}deg` }],
              }]} />
            </View>

            <Text style={dc.emoji}>{item.emoji}</Text>
            <Text style={dc.arabic}>{item.arabic}</Text>
            <Text style={dc.count}>{count}</Text>
            <Text style={dc.target}>/ {item.target}</Text>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {/* İlerleme çubuğu */}
      <View style={dc.bar}>
        <View style={[dc.barFill, {
          width: `${progress * 100}%` as any,
          backgroundColor: isCompleted ? '#43A047' : GOLD,
        }]} />
      </View>

      <Text style={dc.label}>
        {t.dhikr[item.key as keyof typeof t.dhikr] ?? item.key}
      </Text>

      {isCompleted && (
        <Text style={dc.completedTxt}>✓ {t.dhikr.completed}</Text>
      )}
    </View>
  );
}

const dc = StyleSheet.create({
  wrap: { alignItems: 'center', width: '48%' },
  btn: { borderRadius: 24, overflow: 'hidden', width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 },
  btnGrad: { padding: 20, alignItems: 'center', minHeight: 150, justifyContent: 'center', position: 'relative' },
  progressRing: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  progressFill: { position: 'absolute', width: '100%', height: '100%', borderRightWidth: 2, borderRightColor: GOLD, borderRadius: 16 },
  emoji: { fontSize: 28, marginBottom: 6 },
  arabic: { fontFamily: Platform.OS === 'ios' ? 'Amiri-Regular' : 'serif', fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 10, textAlign: 'center' },
  count: { fontSize: 40, fontWeight: '800', color: '#fff', letterSpacing: -2, lineHeight: 44 },
  target: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  bar: { height: 3, width: '100%', backgroundColor: 'rgba(26,107,82,0.15)', borderRadius: 2, marginTop: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2 },
  label: { fontSize: 12, fontWeight: '700', color: INK, marginTop: 6, textAlign: 'center' },
  completedTxt: { fontSize: 11, color: '#2E7D32', fontWeight: '700', marginTop: 2 },
});

// ── Sabah duası bileşeni
function MorningDuaCard({ dua, index, isRead, onToggle }: {
  dua: MorningDua; index: number; isRead: boolean; onToggle: () => void;
}) {
  return (
    <TouchableOpacity style={[md.card, isRead && md.cardRead]} onPress={onToggle} activeOpacity={0.85}>
      <View style={md.header}>
        <View style={[md.indexBadge, isRead && md.indexBadgeRead]}>
          <Text style={[md.indexTxt, isRead && { color: '#fff' }]}>{index + 1}</Text>
        </View>
        {dua.count > 1 && (
          <View style={md.countPill}>
            <Text style={md.countTxt}>{dua.count}x</Text>
          </View>
        )}
        {isRead && (
          <View style={md.readBadge}>
            <Text style={md.readTxt}>✓ Okundu</Text>
          </View>
        )}
      </View>

      <Text style={md.arabic}>{dua.arabic}</Text>
      <View style={md.sep} />
      <Text style={md.turkish}>{dua.turkish}</Text>
    </TouchableOpacity>
  );
}

const md = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: BORDER, marginBottom: 10 },
  cardRead: { backgroundColor: 'rgba(26,107,82,0.04)', borderColor: 'rgba(26,107,82,0.2)' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  indexBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(26,107,82,0.1)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)', alignItems: 'center', justifyContent: 'center' },
  indexBadgeRead: { backgroundColor: EMERALD_MID, borderColor: EMERALD_MID },
  indexTxt: { fontSize: 12, fontWeight: '800', color: EMERALD_MID },
  countPill: { backgroundColor: 'rgba(201,168,76,0.12)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)' },
  countTxt: { fontSize: 11, fontWeight: '700', color: GOLD },
  readBadge: { marginLeft: 'auto' as any, backgroundColor: 'rgba(46,125,50,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  readTxt: { fontSize: 11, fontWeight: '700', color: '#2E7D32' },
  arabic: { fontFamily: Platform.OS === 'ios' ? 'Amiri-Regular' : 'serif', fontSize: 18, color: INK, lineHeight: 32, textAlign: 'right', direction: 'rtl', marginBottom: 12 },
  sep: { height: 1, backgroundColor: BORDER, marginBottom: 10 },
  turkish: { fontSize: 13, color: MUTED, lineHeight: 20, fontStyle: 'italic' },
});

// ── Ana ekran
export default function PrayersScreen() {
  const insets = useSafeAreaInsets();
  const t = useT();

  const [tab, setTab] = useState<'dhikr' | 'morning'>('dhikr');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [readDuas, setReadDuas] = useState<number[]>([]);

  // Kayıtlı sayaçları yükle
  useEffect(() => { loadCounts(); }, []);

  async function loadCounts() {
    const today = new Date().toDateString();
    const entries = await Promise.all(
      DHIKR_LIST.map(async item => {
        const raw = await AsyncStorage.getItem(KEY_PREFIX + item.key);
        if (!raw) return [item.key, 0];
        const { count, date } = JSON.parse(raw);
        return [item.key, date === today ? count : 0];
      })
    );
    setCounts(Object.fromEntries(entries));

    const readRaw = await AsyncStorage.getItem('@salah_morning_read');
    if (readRaw) {
      const { read, date } = JSON.parse(readRaw);
      setReadDuas(date === today ? read : []);
    }
  }

  const handleTap = useCallback(async (key: string, target: number) => {
    const prev = counts[key] ?? 0;
    if (prev >= target) return;
    const next = prev + 1;
    const newCounts = { ...counts, [key]: next };
    setCounts(newCounts);
    await AsyncStorage.setItem(KEY_PREFIX + key, JSON.stringify({
      count: next,
      date: new Date().toDateString(),
    }));
  }, [counts]);

  const handleReset = useCallback(async (key: string) => {
    const newCounts = { ...counts, [key]: 0 };
    setCounts(newCounts);
    await AsyncStorage.setItem(KEY_PREFIX + key, JSON.stringify({
      count: 0,
      date: new Date().toDateString(),
    }));
  }, [counts]);

  const handleResetAll = async () => {
    const zeroed = Object.fromEntries(DHIKR_LIST.map(i => [i.key, 0]));
    setCounts(zeroed);
    await Promise.all(DHIKR_LIST.map(item =>
      AsyncStorage.setItem(KEY_PREFIX + item.key, JSON.stringify({ count: 0, date: new Date().toDateString() }))
    ));
  };

  const toggleDua = async (index: number) => {
    const newRead = readDuas.includes(index)
      ? readDuas.filter(i => i !== index)
      : [...readDuas, index];
    setReadDuas(newRead);
    await AsyncStorage.setItem('@salah_morning_read', JSON.stringify({
      read: newRead,
      date: new Date().toDateString(),
    }));
  };

  const totalCompleted = DHIKR_LIST.filter(i => (counts[i.key] ?? 0) >= i.target).length;
  const allDhikrDone = totalCompleted === DHIKR_LIST.length;
  const allMorningRead = readDuas.length === MORNING_DUAS.length;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>

      {/* ── Header */}
      <LinearGradient colors={[EMERALD_DARK, EMERALD, EMERALD_MID]} style={s.header} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.headerTitle}>{t.nav.prayers}</Text>
            <Text style={s.headerSub}>Dua & Zikir</Text>
          </View>
          {/* Genel ilerleme */}
          <View style={s.progressBadge}>
            <Text style={s.progressTxt}>{totalCompleted}/{DHIKR_LIST.length}</Text>
          </View>
        </View>

        {/* Tab seçici */}
        <View style={s.tabRow}>
          <TouchableOpacity
            style={[s.tab, tab === 'dhikr' && s.tabActive]}
            onPress={() => setTab('dhikr')}
          >
            <Text style={[s.tabTxt, tab === 'dhikr' && s.tabTxtActive]}>📿 Zikir</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tab, tab === 'morning' && s.tabActive]}
            onPress={() => setTab('morning')}
          >
            <Text style={[s.tabTxt, tab === 'morning' && s.tabTxtActive]}>🌅 Sabah Duaları</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {tab === 'dhikr' ? (
          <>
            {/* Tamamlanma banner */}
            {allDhikrDone && (
              <View style={s.doneBanner}>
                <Text style={s.doneTxt}>✨ Tüm zikirler tamamlandı! Hayırlı olsun.</Text>
              </View>
            )}

            {/* Sıfırla butonu */}
            <View style={s.resetRow}>
              <Text style={s.resetHint}>Uzun basarak tek zikri sıfırla</Text>
              <TouchableOpacity onPress={handleResetAll} style={s.resetAllBtn}>
                <Text style={s.resetAllTxt}>Tümünü Sıfırla</Text>
              </TouchableOpacity>
            </View>

            {/* Zikir grid */}
            <View style={s.dhikrGrid}>
              {DHIKR_LIST.map(item => (
                <DhikrCounter
                  key={item.key}
                  item={item}
                  count={counts[item.key] ?? 0}
                  onTap={() => handleTap(item.key, item.target)}
                  onReset={() => handleReset(item.key)}
                  isCompleted={(counts[item.key] ?? 0) >= item.target}
                />
              ))}
            </View>

            {/* İstatistik */}
            <View style={s.statsCard}>
              <Text style={s.statsTitle}>📊 Bugünkü İlerleme</Text>
              <View style={s.statsRow}>
                {DHIKR_LIST.map(item => {
                  const cnt = counts[item.key] ?? 0;
                  const done = cnt >= item.target;
                  return (
                    <View key={item.key} style={s.statItem}>
                      <Text style={s.statEmoji}>{item.emoji}</Text>
                      <Text style={[s.statCount, done && { color: EMERALD_MID }]}>
                        {cnt}/{item.target}
                      </Text>
                      <View style={s.statBar}>
                        <View style={[s.statFill, { width: `${Math.min(cnt / item.target, 1) * 100}%` as any, backgroundColor: done ? EMERALD_MID : GOLD }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Sabah duaları header */}
            <View style={s.morningHeader}>
              <Text style={s.morningTitle}>🌅 Sabah Duaları</Text>
              <Text style={s.morningSub}>
                {allMorningRead ? '✅ Tamamlandı' : `${readDuas.length}/${MORNING_DUAS.length} okundu`}
              </Text>
            </View>

            <View style={{ paddingHorizontal: 16 }}>
              {MORNING_DUAS.map((dua, i) => (
                <MorningDuaCard
                  key={i}
                  dua={dua}
                  index={i}
                  isRead={readDuas.includes(i)}
                  onToggle={() => toggleDua(i)}
                />
              ))}
            </View>

            {allMorningRead && (
              <View style={s.doneBanner}>
                <Text style={s.doneTxt}>✨ Sabah duaları tamamlandı! Hayırlı günler.</Text>
              </View>
            )}
          </>
        )}

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },

  // Header
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 3 },
  progressBadge: { backgroundColor: 'rgba(201,168,76,0.2)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(201,168,76,0.35)' },
  progressTxt: { fontSize: 14, fontWeight: '800', color: GOLD_LIGHT },

  // Tab
  tabRow: { flexDirection: 'row', gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  tabActive: { backgroundColor: 'rgba(201,168,76,0.2)', borderColor: 'rgba(201,168,76,0.4)' },
  tabTxt: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  tabTxtActive: { color: GOLD_LIGHT },

  // Tamamlandı
  doneBanner: { marginHorizontal: 16, marginTop: 12, backgroundColor: 'rgba(46,125,50,0.1)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(46,125,50,0.25)', alignItems: 'center' },
  doneTxt: { fontSize: 13, fontWeight: '700', color: '#2E7D32', textAlign: 'center' },

  // Sıfırla
  resetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginTop: 12, marginBottom: 4 },
  resetHint: { fontSize: 11, color: MUTED, fontStyle: 'italic' },
  resetAllBtn: { backgroundColor: 'rgba(224,82,82,0.08)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(224,82,82,0.2)' },
  resetAllTxt: { fontSize: 12, fontWeight: '600', color: '#E05252' },

  // Zikir grid
  dhikrGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 16, justifyContent: 'space-between' },

  // İstatistik kartı
  statsCard: { marginHorizontal: 16, marginTop: 4, backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: BORDER },
  statsTitle: { fontSize: 13, fontWeight: '700', color: INK, marginBottom: 14 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center', flex: 1 },
  statEmoji: { fontSize: 18, marginBottom: 4 },
  statCount: { fontSize: 12, fontWeight: '700', color: MUTED, marginBottom: 4 },
  statBar: { width: '80%', height: 3, backgroundColor: 'rgba(26,107,82,0.1)', borderRadius: 2, overflow: 'hidden' },
  statFill: { height: '100%', borderRadius: 2 },

  // Sabah
  morningHeader: { padding: 16, paddingBottom: 8 },
  morningTitle: { fontSize: 16, fontWeight: '800', color: INK, letterSpacing: -0.3 },
  morningSub: { fontSize: 12, color: MUTED, marginTop: 3 },
});
