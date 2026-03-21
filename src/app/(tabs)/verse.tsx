import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Share, Platform, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useT, useLanguage } from '@/i18n';

// ── Renkler
const EMERALD_DARK = '#0A2A1E';
const EMERALD      = '#0F3D2E';
const EMERALD_MID  = '#1A6B52';
const GOLD         = '#C9A84C';
const GOLD_LIGHT   = '#E8C96A';
const CREAM        = '#FAF6EE';
const INK          = '#1A1208';
const MUTED        = '#6B5C3E';
const BORDER       = 'rgba(201,168,76,0.2)';

// ── Statik ayet havuzu (API yokken fallback)
//    Gerçek uygulamada Quran.com API veya Al-Quran.cloud kullanılır
interface Verse {
  id:      number;
  arabic:  string;
  turkish: string;
  english: string;
  german:  string;
  french:  string;
  arabic_ref: string; // "البقرة"
  surah:   string;    // "Bakara"
  surah_en: string;   // "Al-Baqarah"
  ayah:    number;
  surah_no: number;
}

const VERSES: Verse[] = [
  {
    id: 1,
    arabic:   'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
    turkish:  '"Şüphesiz Allah, sabredenlerle beraberdir."',
    english:  '"Indeed, Allah is with the patient."',
    german:   '"Wahrlich, Allah ist mit den Geduldigen."',
    french:   '"En vérité, Allah est avec les patients."',
    arabic_ref: 'البقرة',
    surah:    'Bakara', surah_en: 'Al-Baqarah', ayah: 153, surah_no: 2,
  },
  {
    id: 2,
    arabic:   'وَبَشِّرِ الصَّابِرِينَ',
    turkish:  '"Sabredenleri müjdele."',
    english:  '"And give good tidings to the patient."',
    german:   '"Und gib den Geduldigen frohe Botschaft."',
    french:   '"Et annonce la bonne nouvelle aux patients."',
    arabic_ref: 'البقرة',
    surah:    'Bakara', surah_en: 'Al-Baqarah', ayah: 155, surah_no: 2,
  },
  {
    id: 3,
    arabic:   'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    turkish:  '"Şüphesiz her güçlükle birlikte bir kolaylık vardır. Gerçekten, her güçlükle birlikte bir kolaylık vardır."',
    english:  '"For indeed, with hardship will be ease. Indeed, with hardship will be ease."',
    german:   '"Wahrlich, mit der Schwierigkeit kommt Erleichterung. Wahrlich, mit der Schwierigkeit kommt Erleichterung."',
    french:   '"Car avec la difficulté vient la facilité. Avec la difficulté vient la facilité."',
    arabic_ref: 'الشرح',
    surah:    'İnşirah', surah_en: 'Ash-Sharh', ayah: 5, surah_no: 94,
  },
  {
    id: 4,
    arabic:   'وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ ۚ عَلَيْهِ تَوَكَّلْتُ وَإِلَيْهِ أُنِيبُ',
    turkish:  '"Başarım ancak Allah\'ın yardımıyla olur. Yalnızca O\'na güvendim ve yalnızca O\'na dönerim."',
    english:  '"My success is not but through Allah. Upon Him I have relied, and to Him I return."',
    german:   '"Mein Erfolg kommt nur durch Allah. Auf Ihn vertraue ich, und zu Ihm kehre ich zurück."',
    french:   '"Mon succès ne vient que d\'Allah. C\'est en Lui que je me confie, et c\'est vers Lui que je reviens."',
    arabic_ref: 'هود',
    surah:    'Hud', surah_en: 'Hud', ayah: 88, surah_no: 11,
  },
  {
    id: 5,
    arabic:   'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    turkish:  '"Rabbimiz! Bize dünyada iyilik ver, ahirette de iyilik ver ve bizi ateş azabından koru."',
    english:  '"Our Lord, give us in this world that which is good and in the Hereafter that which is good, and protect us from the punishment of the Fire."',
    german:   '"Unser Herr, gib uns in dieser Welt das Gute und im Jenseits das Gute, und bewahre uns vor der Strafe des Feuers."',
    french:   '"Notre Seigneur, accorde-nous dans cette vie ce qui est bien, et dans l\'au-delà ce qui est bien, et préserve-nous du châtiment du Feu."',
    arabic_ref: 'البقرة',
    surah:    'Bakara', surah_en: 'Al-Baqarah', ayah: 201, surah_no: 2,
  },
  {
    id: 6,
    arabic:   'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ',
    turkish:  '"Kullarım sana beni sorarlarsa, şüphesiz ben yakınım."',
    english:  '"And when My servants ask you about Me - indeed I am near."',
    german:   '"Und wenn Meine Diener dich nach Mir fragen - fürwahr, Ich bin nah."',
    french:   '"Et quand Mes serviteurs t\'interrogent sur Moi, dis-leur que Je suis proche."',
    arabic_ref: 'البقرة',
    surah:    'Bakara', surah_en: 'Al-Baqarah', ayah: 186, surah_no: 2,
  },
  {
    id: 7,
    arabic:   'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
    turkish:  '"Allah, O\'ndan başka ilah olmayandır; daima diridir, her şeyi ayakta tutandır."',
    english:  '"Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence."',
    german:   '"Allah - es gibt keine Gottheit außer Ihm, dem Ewig Lebenden, dem Selbstbestehenden."',
    french:   '"Allah! Pas de divinité à part Lui, le Vivant, Celui qui subsiste par Lui-même."',
    arabic_ref: 'البقرة',
    surah:    'Bakara', surah_en: 'Al-Baqarah', ayah: 255, surah_no: 2,
  },
];

const KEY_SAVED  = '@salah_saved_verses';
const KEY_TODAY  = '@salah_today_verse_date';
const KEY_IDX    = '@salah_today_verse_idx';

// ── Günün ayetini seç (gün bazlı, değişmez)
async function getTodayVerse(): Promise<Verse> {
  const today = new Date().toDateString();
  const [savedDate, savedIdx] = await Promise.all([
    AsyncStorage.getItem(KEY_TODAY),
    AsyncStorage.getItem(KEY_IDX),
  ]);
  if (savedDate === today && savedIdx !== null) {
    return VERSES[parseInt(savedIdx) % VERSES.length];
  }
  const idx = Math.floor(Date.now() / 86400000) % VERSES.length;
  await Promise.all([
    AsyncStorage.setItem(KEY_TODAY, today),
    AsyncStorage.setItem(KEY_IDX, String(idx)),
  ]);
  return VERSES[idx];
}

export default function VerseScreen() {
  const insets = useSafeAreaInsets();
  const t      = useT();
  const { language } = useLanguage();

  const [verse,      setVerse]      = useState<Verse | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [saved,      setSaved]      = useState<number[]>([]);
  const [isSaved,    setIsSaved]    = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => { loadInitial(); }, []);

  async function loadInitial() {
    const [today, savedRaw] = await Promise.all([
      getTodayVerse(),
      AsyncStorage.getItem(KEY_SAVED),
    ]);
    const savedIds: number[] = savedRaw ? JSON.parse(savedRaw) : [];
    const idx = VERSES.findIndex(v => v.id === today.id);
    setVerse(today);
    setCurrentIdx(idx >= 0 ? idx : 0);
    setSaved(savedIds);
    setIsSaved(savedIds.includes(today.id));
  }

  function getTranslation(v: Verse): string {
    switch (language) {
      case 'en': return v.english;
      case 'de': return v.german;
      case 'fr': return v.french;
      default:   return v.turkish;
    }
  }

  function getSurahName(v: Verse): string {
    return language === 'en' || language === 'de' || language === 'fr'
      ? v.surah_en : v.surah;
  }

  function getMeaningLabel(): string {
    switch (language) {
      case 'en': return 'Translation';
      case 'de': return 'Übersetzung';
      case 'fr': return 'Traduction';
      case 'ar': return 'الترجمة';
      default:   return 'Türkçe Meali';
    }
  }

  // Animasyonlu geçiş
  function animateTo(idx: number) {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      const next = VERSES[idx];
      setVerse(next);
      setCurrentIdx(idx);
      setIsSaved(saved.includes(next.id));
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  }

  function goPrev() {
    const idx = (currentIdx - 1 + VERSES.length) % VERSES.length;
    animateTo(idx);
  }

  function goNext() {
    const idx = (currentIdx + 1) % VERSES.length;
    animateTo(idx);
  }

  async function toggleSave() {
    if (!verse) return;
    const newSaved = isSaved
      ? saved.filter(id => id !== verse.id)
      : [...saved, verse.id];
    setSaved(newSaved);
    setIsSaved(!isSaved);
    await AsyncStorage.setItem(KEY_SAVED, JSON.stringify(newSaved));
  }

  async function handleShare() {
    if (!verse) return;
    const text = `${verse.arabic}\n\n${getTranslation(verse)}\n\n— ${getSurahName(verse)} ${verse.surah_no}:${verse.ayah}`;
    await Share.share({ message: text });
  }

  if (!verse) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.loading}>
          <Text style={s.loadingTxt}>Ayet yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>

      {/* ── Header */}
      <LinearGradient colors={[EMERALD_DARK, EMERALD]} style={s.header} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.headerTitle}>{t.verse.title}</Text>
            <Text style={s.headerSub}>{new Date().toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          </View>
          {/* Sayfa göstergesi */}
          <View style={s.pageIndicator}>
            <Text style={s.pageText}>{currentIdx + 1} / {VERSES.length}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── Ayet kartı */}
        <Animated.View style={[s.verseCardWrap, { opacity: fadeAnim }]}>
          <LinearGradient colors={[EMERALD_DARK, '#1A3D2B']} style={s.verseCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>

            {/* Geometrik desen */}
            <View style={s.cardGeo} pointerEvents="none">
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={i} style={[s.geoDot, { top: (i % 3) * 80 - 10, left: Math.floor(i / 3) * 160 - 10 }]} />
              ))}
            </View>

            {/* Badge */}
            <View style={s.badge}>
              <Text style={s.badgeTxt}>✨ {t.verse.title}</Text>
            </View>

            {/* Sure bilgisi */}
            <View style={s.surahRow}>
              <View style={s.surahCircle}>
                <Text style={s.surahNo}>{verse.surah_no}</Text>
              </View>
              <View>
                <Text style={s.surahName}>{getSurahName(verse)}</Text>
                <Text style={s.surahAr}>{verse.arabic_ref} · {verse.ayah}. ayet</Text>
              </View>
            </View>

            {/* Arapça metin */}
            <Text style={s.arabicText}>{verse.arabic}</Text>

            {/* Ayırıcı */}
            <View style={s.separator} />

            {/* Meal */}
            <Text style={s.mealLabel}>{getMeaningLabel()}</Text>
            <Text style={s.mealText}>{getTranslation(verse)}</Text>

            {/* Kaynak */}
            <Text style={s.source}>{getSurahName(verse)} · {verse.surah_no}:{verse.ayah}</Text>
          </LinearGradient>
        </Animated.View>

        {/* ── Aksiyon butonları */}
        <View style={s.actions}>
          <TouchableOpacity style={s.actionBtn} onPress={handleShare} activeOpacity={0.8}>
            <Text style={s.actionIcon}>📤</Text>
            <Text style={s.actionTxt}>{t.verse.share}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.actionBtn, isSaved && s.actionBtnActive]} onPress={toggleSave} activeOpacity={0.8}>
            <Text style={s.actionIcon}>{isSaved ? '🔖' : '📌'}</Text>
            <Text style={[s.actionTxt, isSaved && { color: EMERALD }]}>{t.verse.save}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.actionBtn} activeOpacity={0.8}>
            <Text style={s.actionIcon}>🔊</Text>
            <Text style={s.actionTxt}>{t.verse.listen}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Gezinme butonları */}
        <View style={s.navRow}>
          <TouchableOpacity style={s.navBtn} onPress={goPrev} activeOpacity={0.85}>
            <LinearGradient colors={[EMERALD, EMERALD_MID]} style={s.navBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.navBtnTxt}>← {t.verse.prev}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={s.navBtn} onPress={goNext} activeOpacity={0.85}>
            <LinearGradient colors={[EMERALD_MID, EMERALD]} style={s.navBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.navBtnTxt}>{t.verse.next} →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Nokta göstergesi */}
        <View style={s.dots}>
          {VERSES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => animateTo(i)}>
              <View style={[s.dot, i === currentIdx && s.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Kaydedilen ayet sayısı */}
        {saved.length > 0 && (
          <View style={s.savedInfo}>
            <Text style={s.savedInfoTxt}>🔖 {saved.length} ayet kaydedildi</Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: CREAM },
  loading:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingTxt:   { fontSize: 14, color: MUTED },

  // Header
  header:       { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 28 },
  headerTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle:  { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub:    { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 3 },
  pageIndicator:{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  pageText:     { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },

  // Ayet kartı
  verseCardWrap:{ marginHorizontal: 16, marginTop: -14, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8 },
  verseCard:    { padding: 24, position: 'relative', overflow: 'hidden' },
  cardGeo:      { position: 'absolute', inset: 0, opacity: 0.05 },
  geoDot:       { position: 'absolute', width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderColor: '#C9A84C' },

  badge:        { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: 'rgba(201,168,76,0.15)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)', marginBottom: 16 },
  badgeTxt:     { fontSize: 11, fontWeight: '700', color: GOLD_LIGHT },

  surahRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  surahCircle:  { width: 40, height: 40, borderRadius: 20, backgroundColor: EMERALD, borderWidth: 1.5, borderColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  surahNo:      { fontSize: 14, fontWeight: '800', color: GOLD_LIGHT },
  surahName:    { fontSize: 14, fontWeight: '700', color: '#fff' },
  surahAr:      { fontFamily: Platform.OS === 'ios' ? 'Amiri-Regular' : 'serif', fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 1 },

  arabicText:   { fontFamily: Platform.OS === 'ios' ? 'Amiri-Regular' : 'serif', fontSize: 22, color: '#fff', lineHeight: 40, textAlign: 'right', direction: 'rtl', marginBottom: 20 },
  separator:    { height: 1, backgroundColor: 'rgba(201,168,76,0.2)', marginBottom: 16 },
  mealLabel:    { fontSize: 10, fontWeight: '700', color: GOLD, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },
  mealText:     { fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 24, fontStyle: 'italic', marginBottom: 14 },
  source:       { fontSize: 11, fontWeight: '700', color: GOLD, letterSpacing: 0.5 },

  // Aksiyonlar
  actions:      { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 14 },
  actionBtn:    { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: BORDER },
  actionBtnActive: { backgroundColor: 'rgba(26,107,82,0.08)', borderColor: 'rgba(26,107,82,0.25)' },
  actionIcon:   { fontSize: 20 },
  actionTxt:    { fontSize: 11, fontWeight: '600', color: MUTED },

  // Gezinme
  navRow:       { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 12 },
  navBtn:       { flex: 1, borderRadius: 16, overflow: 'hidden' },
  navBtnGrad:   { paddingVertical: 14, alignItems: 'center' },
  navBtnTxt:    { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },

  // Nokta göstergesi
  dots:         { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 16 },
  dot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(26,107,82,0.2)' },
  dotActive:    { width: 18, backgroundColor: EMERALD_MID },

  savedInfo:    { marginHorizontal: 16, marginTop: 12, backgroundColor: 'rgba(26,107,82,0.06)', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)' },
  savedInfoTxt: { fontSize: 12, color: MUTED, fontWeight: '600' },
});
