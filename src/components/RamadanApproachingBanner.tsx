import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useT } from '@/i18n';

interface RamadanApproachingBannerProps {
  daysLeft:   number;
  onDismiss?: () => void;
}

export default function RamadanApproachingBanner({
  daysLeft, onDismiss,
}: RamadanApproachingBannerProps) {
  const t = useT();

  const slideAnim = useRef(new Animated.Value(-80)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -80, duration: 240, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 0,   duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss?.());
  };

  return (
    <Animated.View
      style={[
        s.container,
        { transform: [{ translateY: slideAnim }], opacity: fadeAnim },
      ]}
    >
      <LinearGradient
        colors={['#0D1B2A', '#1B1030']}
        style={s.grad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {/* Sol parlama */}
        <View style={s.leftGlow} />

        {/* İkon */}
        <View style={s.iconWrap}>
          <View style={s.iconGlow} />
          <Text style={s.icon}>🌙</Text>
        </View>

        {/* Metin */}
        <View style={s.textWrap}>
          <Text style={s.title}>{t.ramadan.approaching}</Text>
          <Text style={s.sub}>{daysLeft} {t.ramadan.approachingDays}</Text>
        </View>

        {/* Gün pill */}
        <View style={s.daysPill}>
          <Text style={s.daysNum}>{daysLeft}</Text>
          <Text style={s.daysLbl}>{t.ramadan.day.toLowerCase()}</Text>
        </View>

        {/* Kapat */}
        {onDismiss && (
          <TouchableOpacity
            onPress={dismiss}
            style={s.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={s.closeTxt}>✕</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.28)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  grad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 10,
    position: 'relative',
    overflow: 'hidden',
  },

  leftGlow: {
    position: 'absolute',
    left: -20, top: -20,
    width: 80, height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(201,168,76,0.08)',
  },

  iconWrap: {
    width: 40, height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(201,168,76,0.12)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative', flexShrink: 0,
  },
  iconGlow: {
    position: 'absolute',
    top: -8, bottom: -8, left: -8, right: -8,
    borderRadius: 24,
    backgroundColor: 'rgba(201,168,76,0.07)',
  },
  icon: { fontSize: 20 },

  textWrap: { flex: 1 },
  title:    { fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: -0.2, marginBottom: 1 },
  sub:      { fontSize: 11, color: 'rgba(255,255,255,0.42)' },

  daysPill: {
    backgroundColor: 'rgba(201,168,76,0.14)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.32)',
    borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
    alignItems: 'center', flexShrink: 0,
  },
  daysNum: { fontSize: 19, fontWeight: '800', color: '#E8C96A', lineHeight: 22 },
  daysLbl: { fontSize: 9,  fontWeight: '600', color: 'rgba(201,168,76,0.65)', letterSpacing: 0.5 },

  closeBtn: {
    width: 24, height: 24,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  closeTxt: { fontSize: 11, color: 'rgba(255,255,255,0.38)' },
});