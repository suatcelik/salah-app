import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, TextInput, Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import { useLanguage, Language, LANGUAGE_META, translations } from '@/i18n';

const LANGUAGES: { code: Language; flag: string }[] = [
  { code: 'tr', flag: '🇹🇷' },
  { code: 'en', flag: '🇬🇧' },
  { code: 'ar', flag: '🇸🇦' },
  { code: 'de', flag: '🇩🇪' },
  { code: 'fr', flag: '🇫🇷' },
];

// ── Geometrik desen (tekrarlanan kareler)
function GeoPattern() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {Array.from({ length: 30 }).map((_, i) => (
        <View key={i} style={[s.geoCell, {
          top: Math.floor(i / 5) * 80 - 20,
          left: (i % 5) * 80 - 20,
        }]}>
          <View style={s.geoSquare} />
          <View style={[s.geoSquare, { transform: [{ rotate: '45deg' }] }]} />
        </View>
      ))}
    </View>
  );
}

function StepDots({ step }: { step: 1 | 2 }) {
  return (
    <View style={s.dots}>
      <View style={[s.dot, step === 1 && s.dotActive]} />
      <View style={[s.dot, step === 2 && s.dotActive]} />
    </View>
  );
}

function LangCard({ code, flag, selected, onPress }: {
  code: Language; flag: string; selected: boolean; onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const t = translations[code];

  const press = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={press} activeOpacity={0.85}
        style={[s.langCard, selected && s.langCardSelected]}
      >
        <Text style={s.langFlag}>{flag}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[s.langNative, code === 'ar' && s.arabicFont]}>
            {t.langNativeName}
          </Text>
        </View>
        {selected && (
          <View style={s.check}><Text style={s.checkMark}>✓</Text></View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function OnboardingScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { setLanguage, t, language } = useLanguage();

  const [step, setStep]           = useState<1 | 2>(1);
  const [selected, setSelected]   = useState<Language>(language);
  const [city, setCity]           = useState('');
  const [locLoading, setLocLoading] = useState(false);
  const [locGranted, setLocGranted] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const previewT = translations[selected];

  const handleSelect = async (code: Language) => {
    setSelected(code);
    await setLanguage(code);
  };

  const goStep2 = () => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -20, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setStep(2);
      slideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  };

  const getLocation = async () => {
    setLocLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') setLocGranted(true);
    setLocLoading(false);
  };

  const finish = async () => {
    await AsyncStorage.setItem('@salah_onboarded', 'true');
    if (city) await AsyncStorage.setItem('@salah_city', city);
    router.replace('/(tabs)');
  };

  const canFinish = locGranted || city.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.container}>
        <LinearGradient
          colors={['#0A2A1E', '#0F3D2E', '#1A6B52']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}
        />
        <GeoPattern />
        <View style={[s.topAccent, { marginTop: insets.top }]} />

        <Animated.View style={[
          s.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}>
          {/* Logo */}
          <View style={s.logo}>
            <Text style={s.logoAr}>صلاة</Text>
            <Text style={s.logoLatin}>SALAH</Text>
          </View>

          {step === 1 ? (
            <>
              <View style={s.hero}>
                <Text style={[s.welcome, previewT.isRTL && s.rtl]}>
                  {previewT.onboarding.welcome}
                </Text>
                <Text style={[s.subtitle, previewT.isRTL && s.rtl]}>
                  {previewT.onboarding.subtitle}
                </Text>
              </View>

              <View style={s.ornament}>
                <View style={s.ornLine} />
                <View style={s.ornDia} />
                <Text style={s.ornText}>{previewT.onboarding.selectLanguage}</Text>
                <View style={s.ornDia} />
                <View style={s.ornLine} />
              </View>

              <Text style={[s.hint, previewT.isRTL && s.rtl]}>
                {previewT.onboarding.selectLanguageHint}
              </Text>

              <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingBottom: 8 }}
              >
                {LANGUAGES.map(l => (
                  <LangCard
                    key={l.code} code={l.code} flag={l.flag}
                    selected={selected === l.code}
                    onPress={() => handleSelect(l.code)}
                  />
                ))}
              </ScrollView>

              <StepDots step={1} />

              <TouchableOpacity style={s.primaryBtn} onPress={goStep2} activeOpacity={0.88}>
                <LinearGradient
                  colors={['#C9A84C', '#E8C96A', '#C9A84C']}
                  style={s.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Text style={s.btnText}>{previewT.onboarding.continue} →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={[s.hero, { alignItems: 'center' }]}>
                <Text style={{ fontSize: 52, marginBottom: 12 }}>🕌</Text>
                <Text style={[s.welcome, { fontSize: 26, textAlign: 'center' }]}>
                  {t.onboarding.selectLocation}
                </Text>
                <Text style={[s.subtitle, { textAlign: 'center' }]}>
                  {t.onboarding.locationHint}
                </Text>
              </View>

              <View style={s.ornament}>
                <View style={s.ornLine} />
                <View style={s.ornDia} />
                <View style={s.ornDia} />
                <View style={s.ornLine} />
              </View>

              {/* Otomatik konum */}
              <TouchableOpacity
                style={[s.locBtn, locGranted && s.locBtnGranted]}
                onPress={getLocation}
                disabled={locGranted}
                activeOpacity={0.85}
              >
                <Text style={{ fontSize: 22 }}>
                  {locGranted ? '✅' : locLoading ? '⏳' : '📍'}
                </Text>
                <Text style={s.locBtnText}>
                  {locGranted ? 'Konum alındı ✓' : t.onboarding.locationPermission}
                </Text>
              </TouchableOpacity>

              {/* Veya */}
              <View style={s.orRow}>
                <View style={s.orLine} />
                <Text style={s.orText}>{t.onboarding.orEnterManually}</Text>
                <View style={s.orLine} />
              </View>

              {/* Şehir girişi */}
              <TextInput
                style={[s.cityInput, t.isRTL && s.rtl]}
                placeholder={t.onboarding.cityPlaceholder}
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={city}
                onChangeText={setCity}
                textAlign={t.isRTL ? 'right' : 'left'}
                autoCorrect={false}
              />

              <StepDots step={2} />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity style={s.backBtn} onPress={() => setStep(1)}>
                  <Text style={{ fontSize: 20, color: '#fff' }}>←</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.primaryBtn, { flex: 1 }]}
                  onPress={finish}
                  disabled={!canFinish}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={canFinish
                      ? ['#C9A84C', '#E8C96A', '#C9A84C']
                      : ['#4a4a4a', '#5a5a5a', '#4a4a4a']}
                    style={s.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  >
                    <Text style={s.btnText}>{t.onboarding.finish} ✦</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0A2A1E' },
  topAccent:    { height: 2, backgroundColor: '#C9A84C', opacity: 0.6, marginHorizontal: 60, borderRadius: 2 },
  content:      { flex: 1, paddingHorizontal: 24 },
  geoCell:      { position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  geoSquare:    { position: 'absolute', width: 40, height: 40, borderWidth: 0.6, borderColor: 'rgba(201,168,76,0.15)' },
  logo:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 28, justifyContent: 'center' },
  logoAr:       { fontFamily: Platform.OS === 'ios' ? 'Amiri-Regular' : 'serif', fontSize: 28, color: '#C9A84C' },
  logoLatin:    { fontSize: 18, fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: 4 },
  hero:         { marginBottom: 24 },
  welcome:      { fontSize: 32, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 42, letterSpacing: -0.5, marginBottom: 10 },
  subtitle:     { fontSize: 14, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 22 },
  rtl:          { textAlign: 'right', writingDirection: 'rtl' },
  ornament:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  ornLine:      { flex: 1, height: 1, backgroundColor: 'rgba(201,168,76,0.3)' },
  ornDia:       { width: 6, height: 6, backgroundColor: '#C9A84C', transform: [{ rotate: '45deg' }] },
  ornText:      { fontSize: 11, fontWeight: '700', color: '#C9A84C', letterSpacing: 1.5, textTransform: 'uppercase' },
  hint:         { fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginBottom: 14 },
  langCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', gap: 14 },
  langCardSelected: { borderColor: 'rgba(201,168,76,0.55)', backgroundColor: 'rgba(201,168,76,0.05)' },
  langFlag:     { fontSize: 26 },
  langNative:   { fontSize: 16, fontWeight: '600', color: '#fff' },
  arabicFont:   { fontFamily: Platform.OS === 'ios' ? 'Amiri-Regular' : 'serif', fontSize: 18 },
  check:        { width: 26, height: 26, borderRadius: 8, backgroundColor: '#C9A84C', alignItems: 'center', justifyContent: 'center' },
  checkMark:    { fontSize: 14, color: '#0F3D2E', fontWeight: '800' },
  dots:         { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  dot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.22)' },
  dotActive:    { width: 20, backgroundColor: '#C9A84C' },
  primaryBtn:   { borderRadius: 18, overflow: 'hidden', shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  btnGrad:      { paddingVertical: 17, alignItems: 'center', justifyContent: 'center' },
  btnText:      { fontSize: 17, fontWeight: '800', color: '#0F3D2E', letterSpacing: 0.5 },
  locBtn:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginBottom: 16 },
  locBtnGranted: { borderColor: 'rgba(201,168,76,0.45)', backgroundColor: 'rgba(201,168,76,0.08)' },
  locBtnText:   { fontSize: 15, fontWeight: '600', color: '#fff', flex: 1 },
  orRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  orLine:       { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' },
  orText:       { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  cityInput:    { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 18, paddingVertical: 16, fontSize: 15, color: '#fff', marginBottom: 24 },
  backBtn:      { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
});