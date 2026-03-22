import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Magnetometer } from 'expo-sensors';
import * as Location from 'expo-location';

import { useT, useLanguage }   from '@/i18n';
import { usePrayerStore }      from '@/store/prayerStore';
import { calculateQibla }      from '@/utils/qiblaCalculator';

// ── Renkler
const EMERALD_DARK = '#0A2A1E';
const EMERALD      = '#0F3D2E';
const EMERALD_MID  = '#1A6B52';
const GOLD         = '#C9A84C';
const GOLD_LIGHT   = '#E8C96A';

// ── Pusula boyutu
const COMPASS_SIZE = 280;
const CENTER       = COMPASS_SIZE / 2;

// ── Geometrik arka plan
function GeoOverlay() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {Array.from({ length: 20 }).map((_, i) => (
        <View key={i} style={[geo.cell, {
          top:  Math.floor(i / 5) * 90 - 20,
          left: (i % 5) * 80 - 20,
        }]}>
          <View style={geo.sq} />
          <View style={[geo.sq, { transform: [{ rotate: '45deg' }] }]} />
        </View>
      ))}
    </View>
  );
}

const geo = StyleSheet.create({
  cell: { position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  sq:   { position: 'absolute', width: 44, height: 44, borderWidth: 0.6, borderColor: 'rgba(201,168,76,0.12)' },
});

// ── Pusula SVG (native View tabanlı)
function CompassDial({ compassRotation, qiblaDeg }: {
  compassRotation: Animated.Value;
  qiblaDeg: number;
}) {
  const c    = CENTER;

  // Kuzey / Güney / Doğu / Batı noktaları
  const ticks = [
    { label: 'K', angle: 0,   size: 14, color: '#fff',        bold: true  },
    { label: 'D', angle: 90,  size: 12, color: 'rgba(255,255,255,0.5)', bold: false },
    { label: 'G', angle: 180, size: 12, color: 'rgba(255,255,255,0.5)', bold: false },
    { label: 'B', angle: 270, size: 12, color: 'rgba(255,255,255,0.5)', bold: false },
  ];

  return (
    <Animated.View style={[
      styles.compassWrap,
      { transform: [{ rotate: compassRotation.interpolate({
          inputRange: [0, 360],
          outputRange: ['0deg', '360deg'],
        }) }] },
    ]}>
      {/* Dış halka */}
      <View style={styles.ringOuter} />
      <View style={styles.ringInner} />

      {/* Derece tick'leri */}
      {Array.from({ length: 36 }).map((_, i) => {
        const angle   = (i * 10) * (Math.PI / 180);
        const isMajor = i % 3 === 0;
        const r       = c - 18;
        const x       = c + r * Math.sin(angle);
        const y       = c - r * Math.cos(angle);
        return (
          <View key={i} style={{
            position: 'absolute',
            left: x - (isMajor ? 1.5 : 0.8),
            top:  y - (isMajor ? 8 : 4),
            width:  isMajor ? 3 : 1.5,
            height: isMajor ? 16 : 8,
            backgroundColor: isMajor ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)',
            borderRadius: 2,
            transform: [{ rotate: `${i * 10}deg` }],
          }} />
        );
      })}

      {/* Yön etiketleri */}
      {ticks.map(tick => {
        const rad = tick.angle * (Math.PI / 180);
        const r   = c - 46;
        const x   = c + r * Math.sin(rad);
        const y   = c - r * Math.cos(rad);
        return (
          <Text key={tick.label} style={{
            position: 'absolute',
            left: x - 10,
            top:  y - 10,
            width: 20, height: 20,
            textAlign: 'center', lineHeight: 20,
            fontSize:    tick.size,
            fontWeight:  tick.bold ? '800' : '500',
            color:       tick.color,
          }}>
            {tick.label}
          </Text>
        );
      })}

      {/* Kıble oku (altın) */}
      <View style={[styles.qiblaArrowWrap, {
        transform: [{ rotate: `${qiblaDeg}deg` }],
      }]}>
        <View style={styles.qiblaArrowHead} />
        <View style={styles.qiblaArrowBody} />
        <View style={styles.qiblaArrowTail} />
      </View>

      {/* Merkez */}
      <View style={styles.center}>
        <View style={styles.centerDot} />
        {/* Kabe sembolü */}
        <View style={styles.kaabaIcon} />
      </View>
    </Animated.View>
  );
}

// ── Ana ekran
export default function QiblaScreen() {
  const insets   = useSafeAreaInsets();
  const t        = useT();
  const { language } = useLanguage();
  const { latitude, longitude } = usePrayerStore();

  const [heading,      setHeading]      = useState(0);
  const [qiblaResult,  setQiblaResult]  = useState<ReturnType<typeof calculateQibla> | null>(null);
  const [locStatus,    setLocStatus]    = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');
  const [magStatus,    setMagStatus]    = useState<'idle' | 'active' | 'unavailable'>('idle');
  const [accuracy,     setAccuracy]     = useState<'low' | 'medium' | 'high'>('low');

  const compassAnim = useRef(new Animated.Value(0)).current;
  const prevHeading = useRef(0);
  const subRef      = useRef<any>(null);

  // ── Koordinatlardan kıble hesapla
  useEffect(() => {
    const lat = latitude;
    const lng = longitude;
    if (lat && lng) {
      setQiblaResult(calculateQibla(lat, lng));
    } else {
      getLocation();
    }
  }, [latitude, longitude]);

  // ── Konum al
  const getLocation = async () => {
    setLocStatus('loading');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { setLocStatus('denied'); return; }

    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setQiblaResult(calculateQibla(loc.coords.latitude, loc.coords.longitude));
    setLocStatus('granted');
  };

  // ── Manyetometre başlat
  useEffect(() => {
    startMagnetometer();
    return () => stopMagnetometer();
  }, []);

  const startMagnetometer = useCallback(async () => {
    const avail = await Magnetometer.isAvailableAsync();
    if (!avail) { setMagStatus('unavailable'); return; }

    Magnetometer.setUpdateInterval(150);
    setMagStatus('active');

    subRef.current = Magnetometer.addListener(data => {
      const { x, y } = data;
      let angle = Math.atan2(y, x) * (180 / Math.PI);
      angle = (angle + 360 + 90) % 360; // iOS/Android düzeltmesi

      // Yumuşak geçiş
      let diff = angle - prevHeading.current;
      if (diff > 180)  diff -= 360;
      if (diff < -180) diff += 360;

      const smooth = prevHeading.current + diff * 0.15;
      prevHeading.current = smooth;
      setHeading(smooth);

      // Hassasiyet göstergesi
      const magnitude = Math.sqrt(x * x + y * y);
      setAccuracy(magnitude > 40 ? 'high' : magnitude > 25 ? 'medium' : 'low');

      // Pusula dönüşü — compass, pusula açısının negatifi
      Animated.timing(compassAnim, {
        toValue: -smooth,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const stopMagnetometer = () => {
    subRef.current?.remove();
    subRef.current = null;
  };

  // Kıble açısı (cihaz orientasyonuna göre düzeltilmiş)
  const qiblaDeg = qiblaResult ? ((qiblaResult.degrees - heading + 360) % 360) : 0;

  // Kıbleye ne kadar yakın?
  const isAligned = Math.abs(qiblaDeg) < 5 || Math.abs(qiblaDeg - 360) < 5;

  const CARDINAL_LABELS: Record<string, string> = {
    tr: { K:'K', KD:'KD', D:'D', GD:'GD', G:'G', GB:'GB', B:'B', KB:'KB' },
    en: { K:'N', KD:'NE', D:'E', GD:'SE', G:'S', GB:'SW', B:'W', KB:'NW' },
    ar: { K:'ش', KD:'شق', D:'ق', GD:'جق', G:'ج', GB:'جغ', B:'غ', KB:'شغ' },
    de: { K:'N', KD:'NO', D:'O', GD:'SO', G:'S', GB:'SW', B:'W', KB:'NW' },
    fr: { K:'N', KD:'NE', D:'E', GD:'SE', G:'S', GB:'SO', B:'O', KB:'NO' },
  }[language] ?? { K:'K', KD:'KD', D:'D', GD:'GD', G:'G', GB:'GB', B:'B', KB:'KB' };

  const cardinalLabel = qiblaResult
    ? (CARDINAL_LABELS[qiblaResult.cardinalDir] ?? qiblaResult.cardinalDir)
    : '--';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Gece gökyüzü gradyanı */}
      <LinearGradient
        colors={[EMERALD_DARK, EMERALD, EMERALD_MID]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}
      />
      <GeoOverlay />

      {/* Status bar alanı */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t.qibla.title}</Text>
          <Text style={styles.headerSub}>
            {magStatus === 'active'
              ? accuracy === 'high' ? '✅ Yüksek hassasiyet'
              : accuracy === 'medium' ? '🟡 Orta hassasiyet'
              : '🔴 Düşük hassasiyet — Kalibre et'
              : magStatus === 'unavailable'
              ? '⚠️ Manyetometre mevcut değil'
              : '⏳ Sensör başlatılıyor...'}
          </Text>
        </View>
        {magStatus === 'active' && (
          <TouchableOpacity style={styles.calibrateBtn} onPress={startMagnetometer}>
            <Text style={styles.calibrateTxt}>{t.qibla.calibrate}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pusula alanı */}
      <View style={styles.compassArea}>

        {/* Dış parlama */}
        <View style={[styles.outerGlow, isAligned && styles.outerGlowActive]} />

        {/* Pusula */}
        <CompassDial compassRotation={compassAnim} qiblaDeg={qiblaDeg} />

        {/* Kıble hizalama göstergesi */}
        {isAligned && (
          <View style={styles.alignedBadge}>
            <Text style={styles.alignedTxt}>✦ Kıble Yönündesiniz</Text>
          </View>
        )}
      </View>

      {/* Bilgi kartları */}
      <View style={styles.infoRow}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>{t.qibla.direction}</Text>
          <Text style={styles.infoValue}>
            {qiblaResult ? `${Math.round(qiblaResult.degrees)}°` : '--'}
          </Text>
          <Text style={styles.infoSub}>{cardinalLabel}</Text>
        </View>

        <View style={[styles.infoCard, styles.infoCardGold]}>
          <Text style={[styles.infoLabel, { color: GOLD }]}>{t.qibla.distance}</Text>
          <Text style={[styles.infoValue, { color: GOLD_LIGHT }]}>
            {qiblaResult ? `${Math.round(qiblaResult.distanceKm).toLocaleString()}` : '--'}
          </Text>
          <Text style={[styles.infoSub, { color: 'rgba(201,168,76,0.6)' }]}>km</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>{t.qibla.latitude}</Text>
          <Text style={styles.infoValue}>
            {latitude ? `${latitude.toFixed(2)}°` : '--'}
          </Text>
          <Text style={styles.infoSub}>
            {longitude ? `${longitude.toFixed(2)}°` : t.qibla.longitude}
          </Text>
        </View>
      </View>

      {/* Konum izni gerekli */}
      {locStatus === 'denied' && (
        <TouchableOpacity style={styles.locWarn} onPress={getLocation}>
          <Text style={styles.locWarnTxt}>
            📍 Kıble hesabı için konum izni gerekli. Dokunun →
          </Text>
        </TouchableOpacity>
      )}

      {/* Sensör mevcut değil — manuel açı */}
      {magStatus === 'unavailable' && qiblaResult && (
        <View style={styles.manualCard}>
          <Text style={styles.manualTitle}>Manuel Yön</Text>
          <Text style={styles.manualDeg}>{Math.round(qiblaResult.degrees)}°</Text>
          <Text style={styles.manualSub}>
            Kuzeyden {cardinalLabel} yönünde, saat yönünde
          </Text>
        </View>
      )}

      {/* Kalibrasyon ipucu */}
      {accuracy === 'low' && magStatus === 'active' && (
        <View style={styles.calibHint}>
          <Text style={styles.calibHintTxt}>
            📱 Cihazınızı 8 şeklinde hareket ettirerek kalibre edin
          </Text>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },

  // Header
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingTop: 8, paddingBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 3 },
  calibrateBtn:{ backgroundColor: 'rgba(201,168,76,0.15)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' },
  calibrateTxt:{ fontSize: 12, fontWeight: '700', color: GOLD_LIGHT },

  // Pusula
  compassArea: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  outerGlow:   { position: 'absolute', width: COMPASS_SIZE + 60, height: COMPASS_SIZE + 60, borderRadius: (COMPASS_SIZE + 60) / 2, backgroundColor: 'rgba(201,168,76,0.04)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.08)' },
  outerGlowActive: { backgroundColor: 'rgba(201,168,76,0.1)', borderColor: 'rgba(201,168,76,0.3)' },

  compassWrap: { width: COMPASS_SIZE, height: COMPASS_SIZE, position: 'relative' },
  ringOuter:   { position: 'absolute', inset: 0, borderRadius: CENTER, borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.35)' },
  ringInner:   { position: 'absolute', inset: 20, borderRadius: CENTER - 20, borderWidth: 0.8, borderColor: 'rgba(201,168,76,0.15)' },

  // Kıble oku
  qiblaArrowWrap: { position: 'absolute', left: CENTER - 3, top: 0, height: COMPASS_SIZE, width: 6, alignItems: 'center' },
  qiblaArrowHead: { width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 20, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: GOLD, marginBottom: 2 },
  qiblaArrowBody: { flex: 1, width: 3, backgroundColor: GOLD, opacity: 0.6 },
  qiblaArrowTail: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 14, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: 'rgba(201,168,76,0.3)', marginTop: 2 },

  // Merkez
  center:    { position: 'absolute', left: CENTER - 18, top: CENTER - 18, width: 36, height: 36, borderRadius: 18, backgroundColor: EMERALD, borderWidth: 1.5, borderColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  centerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: GOLD },
  kaabaIcon: { position: 'absolute', width: 10, height: 10, borderWidth: 1.5, borderColor: GOLD, backgroundColor: 'transparent' },

  // Hizalanma
  alignedBadge: { position: 'absolute', bottom: -30, backgroundColor: 'rgba(201,168,76,0.2)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(201,168,76,0.4)' },
  alignedTxt:   { fontSize: 12, fontWeight: '700', color: GOLD_LIGHT, letterSpacing: 0.5 },

  // Bilgi kartları
  infoRow:     { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  infoCard:    { flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
  infoCardGold:{ borderColor: 'rgba(201,168,76,0.3)', backgroundColor: 'rgba(201,168,76,0.08)' },
  infoLabel:   { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  infoValue:   { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -1, lineHeight: 26 },
  infoSub:     { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 },

  // Konum uyarısı
  locWarn:    { marginHorizontal: 16, marginBottom: 12, backgroundColor: 'rgba(201,168,76,0.1)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)' },
  locWarnTxt: { fontSize: 13, color: GOLD_LIGHT, fontWeight: '600', textAlign: 'center' },

  // Manuel kart
  manualCard:  { marginHorizontal: 16, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  manualTitle: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  manualDeg:   { fontSize: 48, fontWeight: '800', color: '#fff', letterSpacing: -2 },
  manualSub:   { fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 4 },

  // Kalibrasyon ipucu
  calibHint:    { marginHorizontal: 16, marginBottom: 12, backgroundColor: 'rgba(224,82,82,0.08)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(224,82,82,0.2)' },
  calibHintTxt: { fontSize: 12, color: 'rgba(255,180,180,0.8)', textAlign: 'center' },
});