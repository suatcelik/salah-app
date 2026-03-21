import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Animated, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useT } from '@/i18n';

interface RamadanWelcomeProps {
  visible:    boolean;
  ramadanDay: number;
  hijriYear:  number;
  onDismiss:  () => void;
}

// ── Yıldız alanı
function StarField() {
  const stars = Array.from({ length: 40 }, (_, i) => ({
    id:      i,
    x:       Math.random() * 100,
    y:       Math.random() * 65,
    size:    Math.random() * 2 + 0.8,
    opacity: Math.random() * 0.55 + 0.25,
  }));

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {stars.map(star => (
        <View
          key={star.id}
          style={{
            position:        'absolute',
            left:            `${star.x}%`,
            top:             `${star.y}%`,
            width:            star.size,
            height:           star.size,
            borderRadius:     star.size / 2,
            backgroundColor: '#E8C96A',
            opacity:          star.opacity,
          }}
        />
      ))}
    </View>
  );
}

// ── Geometrik desen — çift style prop hatası düzeltildi
function GeoPattern() {
  return (
    <View
      style={[StyleSheet.absoluteFillObject, { opacity: 0.07 }]}
      pointerEvents="none"
    >
      {Array.from({ length: 25 }).map((_, i) => (
        <View
          key={i}
          style={[geo.cell, {
            top:  Math.floor(i / 5) * 100 - 20,
            left: (i % 5) * 80 - 20,
          }]}
        >
          <View style={geo.sq} />
          <View style={[geo.sq, { transform: [{ rotate: '45deg' }] }]} />
        </View>
      ))}
    </View>
  );
}

const geo = StyleSheet.create({
  cell: { position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  sq:   { position: 'absolute', width: 44, height: 44, borderWidth: 0.7, borderColor: 'rgba(201,168,76,0.8)' },
});

export default function RamadanWelcomeScreen({
  visible, ramadanDay, hijriYear, onDismiss,
}: RamadanWelcomeProps) {
  const insets = useSafeAreaInsets();
  const t      = useT();

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const moonAnim  = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    if (!visible) return;

    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(moonAnim, { toValue: 1.06, duration: 2600, useNativeDriver: true }),
        Animated.timing(moonAnim, { toValue: 1,    duration: 2600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible]);

  const toArabic = (n: number) =>
    n.toString().replace(/\d/g, d => String.fromCharCode(0x0660 + +d));

  const features = [
    { icon: '⏰', text: `${t.ramadan.iftarRemaining} & ${t.ramadan.suhoorRemaining}` },
    { icon: '🔔', text: `${t.notifications.ezanAtTime} & ${t.notifications.reminderBefore}` },
    { icon: '🤲', text: t.ramadan.tarawih },
    { icon: '📅', text: `${t.ramadan.day} ${ramadanDay} / 30` },
  ];

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[s.container, { opacity: fadeAnim }]}>

        <LinearGradient
          colors={['#050D18', '#0D1B2A', '#111830', '#0A1220']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
        />
        <StarField />
        <GeoPattern />

        <Animated.View
          style={[
            s.content,
            {
              transform:     [{ scale: scaleAnim }],
              paddingTop:    insets.top + 32,
              paddingBottom: insets.bottom + 28,
            },
          ]}
        >
          {/* ── Ay illüstrasyonu */}
          <Animated.View style={[s.moonWrap, { transform: [{ scale: moonAnim }] }]}>
            <View style={s.ring1} />
            <View style={s.ring2} />
            <View style={s.ring3} />
            <View style={s.moonCircle}>
              <Text style={s.moonEmoji}>🌙</Text>
            </View>
            <Text style={[s.starSm, { top: 4,  right: 8  }]}>✦</Text>
            <Text style={[s.starSm, { bottom: 8, left: 4, fontSize: 10 }]}>✦</Text>
            <Text style={[s.starSm, { top: 18, left: -10, fontSize: 8  }]}>✦</Text>
          </Animated.View>

          {/* ── Selamlama */}
          <Animated.View
            style={{
              transform: [{ translateY: slideAnim }],
              opacity:    fadeAnim,
              alignItems: 'center',
            }}
          >
            <Text style={s.arabicGreeting}>رَمَضَان كَرِيم</Text>
            <Text style={s.latinGreeting}>Ramadan Kareem</Text>
          </Animated.View>

          {/* ── Süsleme */}
          <View style={s.ornament}>
            <View style={s.ornLine} />
            <View style={s.ornDia} />
            <View style={s.ornLine} />
          </View>

          {/* ── Hicri tarih chip */}
          <View style={s.hijriChip}>
            <Text style={s.hijriChipTxt}>
              🌙 {toArabic(hijriYear)} Ramazan — {ramadanDay}. {t.ramadan.day}
            </Text>
          </View>

          {/* ── Başlık & alt başlık */}
          <Animated.View
            style={[
              s.msgWrap,
              { transform: [{ translateY: slideAnim }], opacity: fadeAnim },
            ]}
          >
            <Text style={s.welcomeTitle}>{t.ramadan.welcomeTitle} 🤲</Text>
            <Text style={s.welcomeSub}>{t.ramadan.welcomeSubtitle}</Text>
          </Animated.View>

          {/* ── Özellik listesi */}
          <View style={s.featureList}>
            {features.map((f, i) => (
              <View key={i} style={s.featureRow}>
                <View style={s.featureIconWrap}>
                  <Text style={s.featureIcon}>{f.icon}</Text>
                </View>
                <Text style={s.featureTxt}>{f.text}</Text>
                <Text style={s.featureCheck}>✓</Text>
              </View>
            ))}
          </View>

          {/* ── CTA */}
          <TouchableOpacity onPress={onDismiss} activeOpacity={0.88} style={s.ctaWrap}>
            <LinearGradient
              colors={['#C9A84C', '#E8C96A', '#C9A84C']}
              style={s.ctaBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={s.ctaTxt}>{t.ramadan.welcomeBtn} ✦</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={s.footerNote}>{t.ramadan.welcomeNote}</Text>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Ay
  moonWrap:   { width: 130, height: 130, alignItems: 'center', justifyContent: 'center', marginBottom: 22, position: 'relative' },
  ring1:      { position: 'absolute', width: 154, height: 154, borderRadius: 77,  borderWidth: 1, borderColor: 'rgba(201,168,76,0.14)' },
  ring2:      { position: 'absolute', width: 182, height: 182, borderRadius: 91,  borderWidth: 1, borderColor: 'rgba(201,168,76,0.08)' },
  ring3:      { position: 'absolute', width: 210, height: 210, borderRadius: 105, borderWidth: 1, borderColor: 'rgba(201,168,76,0.04)' },
  moonCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.38)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 22, elevation: 10,
  },
  moonEmoji: { fontSize: 54 },
  starSm:    { position: 'absolute', fontSize: 12, color: '#E8C96A', opacity: 0.8 },

  // Metin
  arabicGreeting: {
    fontFamily: Platform.OS === 'ios' ? 'Amiri-Regular' : 'serif',
    fontSize: 30, color: '#C9A84C',
    textAlign: 'center', letterSpacing: 2, marginBottom: 4,
  },
  latinGreeting: {
    fontSize: 14, color: 'rgba(255,255,255,0.38)',
    textAlign: 'center', letterSpacing: 3,
    textTransform: 'uppercase', marginBottom: 14,
  },

  // Süsleme
  ornament: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '75%', marginBottom: 14 },
  ornLine:  { flex: 1, height: 1, backgroundColor: 'rgba(201,168,76,0.28)' },
  ornDia:   { width: 6, height: 6, backgroundColor: '#C9A84C', transform: [{ rotate: '45deg' }] },

  // Chip
  hijriChip:    { backgroundColor: 'rgba(201,168,76,0.1)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 14, marginBottom: 14 },
  hijriChipTxt: { fontSize: 12, fontWeight: '700', color: '#E8C96A', letterSpacing: 0.5 },

  // Başlık
  msgWrap:      { alignItems: 'center', marginBottom: 16 },
  welcomeTitle: { fontSize: 21, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 8, letterSpacing: -0.3 },
  welcomeSub:   { fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 20 },

  // Özellikler
  featureList:     { width: '100%', gap: 8, marginBottom: 24 },
  featureRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 13, padding: 11, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  featureIconWrap: { width: 32, height: 32, borderRadius: 9, backgroundColor: 'rgba(201,168,76,0.12)', alignItems: 'center', justifyContent: 'center' },
  featureIcon:     { fontSize: 17 },
  featureTxt:      { flex: 1, fontSize: 12, fontWeight: '500', color: '#fff' },
  featureCheck:    { fontSize: 13, color: '#C9A84C', fontWeight: '700' },

  // CTA
  ctaWrap:    { width: '100%', borderRadius: 18, overflow: 'hidden', shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.38, shadowRadius: 16, elevation: 8, marginBottom: 10 },
  ctaBtn:     { paddingVertical: 16, alignItems: 'center' },
  ctaTxt:     { fontSize: 16, fontWeight: '800', color: '#0F3D2E', letterSpacing: 0.3 },
  footerNote: { fontSize: 11, color: 'rgba(255,255,255,0.26)', textAlign: 'center', letterSpacing: 0.3 },
});