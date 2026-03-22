import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Platform, Alert, Linking, Modal, KeyboardAvoidingView,
} from 'react-native';
import CityAutocompleteInput from '@/components/CityAutocompleteInput';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT, useLanguage }       from '@/i18n';
import { usePrayerStore }          from '@/store/prayerStore';
import { useIsRamadan }            from '@/hooks/useRamadan';
import { requestReviewManually, declineReview } from '@/hooks/useStoreReview';
import {
  useNotificationPermission,
  schedulePrayerNotifications,
  scheduleIftarApproachingNotification,
  scheduleSuhoorApproachingNotification,
  PrayerSchedule,
} from '@/hooks/useNotificationPermission';
import LanguageSelector from '@/components/LanguageSelector';

const EMERALD_DARK = '#0A2A1E';
const EMERALD      = '#0F3D2E';
const EMERALD_MID  = '#1A6B52';
const GOLD         = '#C9A84C';
const GOLD_LIGHT   = '#E8C96A';
const CREAM        = '#FAF6EE';
const INK          = '#1A1208';
const MUTED        = '#6B5C3E';
const BORDER       = 'rgba(201,168,76,0.18)';

const PRAYER_EMOJI: Record<string, string> = {
  fajr: '🌙', dhuhr: '☀️', asr: '🌤️', maghrib: '🌆', isha: '🌃',
};

const SOUND_OPTIONS = [
  { key: 'ezan',      labelKey: 'ezanSound',    icon: '🕌' },
  { key: 'nasheed',   labelKey: 'nasheed',       icon: '🎵' },
  { key: 'vibration', labelKey: 'vibrationOnly', icon: '📳' },
  { key: 'silent',    labelKey: 'silent',        icon: '🔕' },
] as const;

type SoundKey = typeof SOUND_OPTIONS[number]['key'];

// ── Mini toggle
function MiniToggle({ value, onValueChange, disabled }: {
  value: boolean; onValueChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: 'rgba(107,92,62,0.2)', true: EMERALD_MID }}
      thumbColor="#fff"
      ios_backgroundColor="rgba(107,92,62,0.2)"
      style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
    />
  );
}

// ── Bölüm ayracı
function Divider({ label }: { label: string }) {
  return (
    <View style={s.divider}>
      <View style={s.divLine} />
      <View style={s.divDia} />
      <Text style={s.divText}>{label}</Text>
      <View style={s.divDia} />
      <View style={s.divLine} />
    </View>
  );
}

// ── Vakit satırı
function PrayerNotifRow({
  prayerKey, label, arabicName, timeStr,
  ezanEnabled, reminderEnabled, masterEnabled,
  onEzanToggle, onReminderToggle,
  isSpecial, specialTag,
}: {
  prayerKey: string; label: string; arabicName: string; timeStr?: string;
  ezanEnabled: boolean; reminderEnabled: boolean; masterEnabled: boolean;
  onEzanToggle: (v: boolean) => void; onReminderToggle: (v: boolean) => void;
  isSpecial?: boolean; specialTag?: string;
}) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const isOn = ezanEnabled || reminderEnabled;

  return (
    <View style={[s.prayerCard, isSpecial && s.prayerCardSpecial, !masterEnabled && s.cardDisabled]}>
      {isSpecial && <View style={s.specialBar} />}

      <TouchableOpacity style={s.prayerMain} onPress={() => setExpanded(v => !v)} activeOpacity={0.7}>
        <View style={[s.prayerIconWrap, isSpecial && s.prayerIconSpecial]}>
          <Text style={{ fontSize: 20 }}>{PRAYER_EMOJI[prayerKey] ?? '🕌'}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={s.prayerName}>{label}</Text>
            {isSpecial && specialTag && (
              <View style={s.specialTag}>
                <Text style={s.specialTagTxt}>{specialTag}</Text>
              </View>
            )}
          </View>
          <Text style={s.prayerArabic}>{arabicName}{timeStr ? ` · ${timeStr}` : ''}</Text>

          {/* Kapalıyken özet chip'ler */}
          {!expanded && (
            <View style={{ flexDirection: 'row', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
              {ezanEnabled && (
                <View style={s.chipEzan}>
                  <Text style={s.chipEzanTxt}>🔔 {t.notifications.ezanAtTime}</Text>
                </View>
              )}
              {reminderEnabled && (
                <View style={s.chipReminder}>
                  <Text style={s.chipReminderTxt}>⏰ 15dk</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MiniToggle
            value={isOn}
            onValueChange={v => { onEzanToggle(v); if (!v) onReminderToggle(false); }}
            disabled={!masterEnabled}
          />
          <Text style={[s.chevron, expanded && s.chevronOpen]}>⌄</Text>
        </View>
      </TouchableOpacity>

      {/* Genişletilmiş seçenekler */}
      {expanded && (
        <View style={s.prayerOpts}>
          {/* Ezan */}
          <View style={s.optRow}>
            <View style={[s.optIcon, { backgroundColor: 'rgba(26,107,82,0.1)' }]}>
              <Text style={{ fontSize: 16 }}>🔔</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.optLabel}>{t.notifications.ezanAtTime}</Text>
              <Text style={s.optSub}>
                {timeStr ? `${timeStr}'de ezan sesi çalar` : 'Vakitte ezan sesi çalar'}
              </Text>
            </View>
            <MiniToggle value={ezanEnabled} onValueChange={onEzanToggle} disabled={!masterEnabled} />
          </View>

          {/* 15 dk hatırlatıcı */}
          <View style={[s.optRow, s.optRowGold]}>
            <View style={[s.optIcon, { backgroundColor: 'rgba(201,168,76,0.12)' }]}>
              <Text style={{ fontSize: 16 }}>⏰</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.optLabel}>{t.notifications.reminderBefore}</Text>
              <Text style={s.optSub}>{t.notifications.reminderBeforeSub}</Text>
            </View>
            <MiniToggle value={reminderEnabled} onValueChange={onReminderToggle} disabled={!masterEnabled} />
          </View>
        </View>
      )}
    </View>
  );
}

// ── Şehir seçici modal (serbest metin girişi — tüm dünya şehirleri)
function CitySelectorModal({ visible, currentCity, onSelect, onClose }: {
  visible: boolean;
  currentCity: string;
  onSelect: (city: string) => void;
  onClose: () => void;
}) {
  const t = useT();
  const { isRTL } = useLanguage();
  const [input, setInput] = useState(currentCity);

  // Modal açıldığında mevcut şehri yükle
  React.useEffect(() => {
    if (visible) setInput(currentCity);
  }, [visible, currentCity]);

  const confirm = () => {
    const trimmed = input.trim();
    if (trimmed.length > 0) { onSelect(trimmed); onClose(); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={cs.overlay}>
          <View style={cs.sheet}>
            <View style={cs.handle} />
            <Text style={cs.title}>{t.settings.cityInputTitle}</Text>
            <Text style={cs.hint}>{t.onboarding.locationHint}</Text>
            <CityAutocompleteInput
              value={input}
              onChangeText={setInput}
              onSelect={(cityName) => { onSelect(cityName); onClose(); }}
              onSubmitEditing={confirm}
              placeholder={t.onboarding.cityPlaceholder}
              placeholderTextColor="rgba(107,92,62,0.4)"
              textAlign={isRTL ? 'right' : 'left'}
              inputStyle={[cs.input, isRTL && cs.inputRTL]}
              containerStyle={{ marginBottom: 16 }}
            />
            <View style={cs.btnRow}>
              <TouchableOpacity style={cs.cancelBtn} onPress={onClose}>
                <Text style={cs.cancelTxt}>✕</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[cs.confirmBtn, input.trim().length === 0 && cs.confirmBtnDisabled]}
                onPress={confirm}
                disabled={input.trim().length === 0}
              >
                <Text style={cs.confirmTxt}>📍 {t.settings.cityConfirm}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const cs = StyleSheet.create({
  overlay:           { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:             { backgroundColor: '#FAF6EE', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 34, paddingTop: 4 },
  handle:            { width: 40, height: 4, backgroundColor: 'rgba(107,92,62,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title:             { fontSize: 17, fontWeight: '800', color: '#1A1208', textAlign: 'center', marginBottom: 6 },
  hint:              { fontSize: 12, color: '#6B5C3E', textAlign: 'center', marginBottom: 18 },
  input:             { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.3)', paddingHorizontal: 18, paddingVertical: 14, fontSize: 16, color: '#1A1208' },
  inputRTL:          { textAlign: 'right' },
  btnRow:            { flexDirection: 'row', gap: 10 },
  cancelBtn:         { flex: 1, paddingVertical: 14, backgroundColor: 'rgba(107,92,62,0.1)', borderRadius: 14, alignItems: 'center' },
  cancelTxt:         { fontSize: 14, fontWeight: '700', color: '#6B5C3E' },
  confirmBtn:        { flex: 2, paddingVertical: 14, backgroundColor: '#0F3D2E', borderRadius: 14, alignItems: 'center' },
  confirmBtnDisabled:{ opacity: 0.4 },
  confirmTxt:        { fontSize: 14, fontWeight: '800', color: '#E8C96A' },
});

// ── Ana ekran
export default function ProfileScreen() {
  const insets   = useSafeAreaInsets();
  const t        = useT();
  const { language } = useLanguage();
  const isRamadan = useIsRamadan();

  const { notifSettings, setNotifSetting, prayerTimes, city, changeCity } = usePrayerStore();
  const { status: permStatus, requestPermission } = useNotificationPermission();

  const [showCitySelector,     setShowCitySelector]     = useState(false);
  const [masterEnabled,        setMasterEnabled]        = useState(true);
  const [selectedSound,        setSelectedSound]        = useState<SoundKey>('ezan');
  const [showLangSelector,     setShowLangSelector]     = useState(false);
  const [iftarEzanEnabled,     setIftarEzanEnabled]     = useState(true);
  const [iftarReminderEnabled, setIftarReminderEnabled] = useState(true);
  const [iftarDuaEnabled,      setIftarDuaEnabled]      = useState(true);
  const [suhoorAlarmEnabled,   setSuhoorAlarmEnabled]   = useState(true);
  const [suhoorReminderEnabled,setSuhoorReminderEnabled]= useState(true);
  const [terawihEnabled,       setTerawihEnabled]       = useState(true);

  // İzin reddedilmişse uyar
  const handleMasterToggle = async (v: boolean) => {
    if (v && permStatus !== 'granted') {
      const result = await requestPermission();
      if (result !== 'granted') {
        Alert.alert(
          'Bildirim İzni',
          'Bildirimleri açmak için uygulama ayarlarına gidin.',
          [
            { text: 'İptal', style: 'cancel' },
            { text: 'Ayarları Aç', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
    }
    setMasterEnabled(v);
  };

  // Bildirim planlamasını yenile
  const reschedule = useCallback(async () => {
    if (!masterEnabled || permStatus !== 'granted' || !prayerTimes.length) return;

    const schedules: PrayerSchedule[] = prayerTimes
      .filter(p => p.key !== 'sunrise')
      .map(p => {
        const key      = p.key as keyof typeof notifSettings;
        const settings = notifSettings[key] ?? { ezanEnabled: true, reminderEnabled: false };
        return {
          key:            p.key,
          name:           p.key,
          arabicName:     p.arabicName,
          time:           p.time,
          enableEzan:     settings.ezanEnabled,
          enableReminder: settings.reminderEnabled,
          isIftar:        isRamadan && p.key === 'maghrib',
          isSuhoor:       isRamadan && p.key === 'fajr',
        };
      });

    await schedulePrayerNotifications(schedules, language);

    if (isRamadan) {
      const maghrib = prayerTimes.find(p => p.key === 'maghrib');
      const fajr    = prayerTimes.find(p => p.key === 'fajr');
      if (maghrib && iftarReminderEnabled) {
        await scheduleIftarApproachingNotification(maghrib.time, language);
      }
      if (fajr && suhoorReminderEnabled) {
        await scheduleSuhoorApproachingNotification(fajr.time, language);
      }
    }
  }, [masterEnabled, permStatus, prayerTimes, notifSettings, isRamadan, language,
      iftarReminderEnabled, suhoorReminderEnabled]);

  useEffect(() => { reschedule(); }, [reschedule]);

  const maghrib = prayerTimes.find(p => p.key === 'maghrib');
  const fajr    = prayerTimes.find(p => p.key === 'fajr');
  const isha    = prayerTimes.find(p => p.key === 'isha');

  const PRAYER_ROWS = [
    { key: 'fajr',    ar: 'الفجر',  label: t.prayers.fajr },
    { key: 'dhuhr',   ar: 'الظهر',  label: t.prayers.dhuhr },
    { key: 'asr',     ar: 'العصر',  label: t.prayers.asr },
    { key: 'maghrib', ar: 'المغرب', label: t.prayers.maghrib },
    { key: 'isha',    ar: 'العشاء', label: t.prayers.isha },
  ];

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>

      <LanguageSelector visible={showLangSelector} onClose={() => setShowLangSelector(false)} />
      <CitySelectorModal
        visible={showCitySelector}
        currentCity={city}
        onSelect={changeCity}
        onClose={() => setShowCitySelector(false)}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── Header */}
        <LinearGradient colors={[EMERALD_DARK, EMERALD, EMERALD_MID]} style={s.header} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}>
          <View style={s.headerTop}>
            <View>
              <Text style={s.headerTitle}>{t.notifications.title}</Text>
              <Text style={s.headerSub}>
                {permStatus === 'granted' ? '✅ İzin verildi' : permStatus === 'denied' ? '❌ İzin reddedildi' : '⏳ Bekleniyor'}
              </Text>
            </View>
            <TouchableOpacity style={s.langBtn} onPress={() => setShowLangSelector(true)}>
              <Text style={{ fontSize: 18 }}>🌐</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ── İzin reddedildi uyarısı */}
        {permStatus === 'denied' && (
          <TouchableOpacity style={s.permWarn} onPress={() => Linking.openSettings()} activeOpacity={0.85}>
            <Text style={s.permWarnTxt}>⚠️ Bildirim izni reddedildi. Etkinleştirmek için ayarlara gidin →</Text>
          </TouchableOpacity>
        )}

        {/* ── Master toggle */}
        <View style={s.masterCard}>
          <View style={s.masterIcon}><Text style={{ fontSize: 24 }}>🔔</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.masterTitle}>{t.notifications.allNotifications}</Text>
            <Text style={s.masterSub}>{t.notifications.allNotificationsSub}</Text>
          </View>
          <Switch
            value={masterEnabled}
            onValueChange={handleMasterToggle}
            trackColor={{ false: 'rgba(107,92,62,0.2)', true: EMERALD_MID }}
            thumbColor="#fff"
            ios_backgroundColor="rgba(107,92,62,0.2)"
          />
        </View>

        {/* ── Ezan sesi */}
        <Divider label={t.notifications.soundTitle} />
        <View style={s.soundCard}>
          {SOUND_OPTIONS.map(opt => {
            const isSelected = selectedSound === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[s.soundOpt, isSelected && s.soundOptSel]}
                onPress={() => setSelectedSound(opt.key)}
                activeOpacity={0.8}
                disabled={!masterEnabled}
              >
                {isSelected && (
                  <LinearGradient
                    colors={['rgba(201,168,76,0.12)', 'rgba(201,168,76,0.04)']}
                    style={StyleSheet.absoluteFillObject}
                    borderRadius={14}
                  />
                )}
                <View style={s.soundRadio}>
                  {isSelected && <View style={s.soundRadioDot} />}
                </View>
                <Text style={{ fontSize: 18 }}>{opt.icon}</Text>
                <Text style={[s.soundLabel, isSelected && { color: EMERALD }]}>
                  {t.notifications[opt.labelKey as keyof typeof t.notifications]}
                </Text>
                {isSelected && (
                  <View style={s.playBtn}><Text style={{ fontSize: 11, color: EMERALD }}>▶</Text></View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Vakit bildirimleri */}
        <Divider label={t.notifications.prayerTimes} />

        {PRAYER_ROWS.map(row => {
          const key      = row.key as keyof typeof notifSettings;
          const settings = notifSettings[key] ?? { ezanEnabled: true, reminderEnabled: false };
          const pTime    = prayerTimes.find(p => p.key === row.key);
          const isIftar  = isRamadan && row.key === 'maghrib';
          const isSuhoor = isRamadan && row.key === 'fajr';

          return (
            <PrayerNotifRow
              key={row.key}
              prayerKey={row.key}
              label={row.label}
              arabicName={row.ar}
              timeStr={pTime?.timeStr}
              ezanEnabled={settings.ezanEnabled}
              reminderEnabled={settings.reminderEnabled}
              masterEnabled={masterEnabled}
              onEzanToggle={v => setNotifSetting(key, 'ezanEnabled', v)}
              onReminderToggle={v => setNotifSetting(key, 'reminderEnabled', v)}
              isSpecial={isIftar || isSuhoor}
              specialTag={isIftar ? t.ramadan.iftarTag : isSuhoor ? t.ramadan.suhoorTag : undefined}
            />
          );
        })}

        {/* ── Ramazan özel */}
        {isRamadan && (
          <>
            <Divider label="🌙 Ramazan Bildirimleri" />

            {/* İftar */}
            <View style={[s.ramCard, !masterEnabled && s.cardDisabled]}>
              <View style={s.ramRow}>
                <View style={[s.ramIcon, { backgroundColor: 'rgba(201,168,76,0.12)' }]}>
                  <Text style={{ fontSize: 22 }}>🌙</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.ramTitle}>{t.ramadan.iftar} Vakti Ezanı</Text>
                  <Text style={s.ramSub}>{maghrib?.timeStr ?? '--:--'}'de ezan sesi çalar</Text>
                </View>
                <MiniToggle value={iftarEzanEnabled} onValueChange={setIftarEzanEnabled} disabled={!masterEnabled} />
              </View>

              <View style={[s.ramRow, s.ramRowBorder]}>
                <View style={[s.ramIcon, { backgroundColor: 'rgba(201,168,76,0.08)' }]}>
                  <Text style={{ fontSize: 18 }}>⏰</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.ramTitle}>30 Dk Önce Hatırlatıcı</Text>
                  <Text style={s.ramSub}>
                    {maghrib
                      ? `${new Date(maghrib.time.getTime() - 30 * 60 * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}'de bildirim`
                      : 'İftar öncesi hatırlatıcı'}
                  </Text>
                </View>
                <MiniToggle value={iftarReminderEnabled} onValueChange={setIftarReminderEnabled} disabled={!masterEnabled} />
              </View>

              <View style={s.ramRow}>
                <View style={[s.ramIcon, { backgroundColor: 'rgba(123,79,190,0.1)' }]}>
                  <Text style={{ fontSize: 18 }}>🤲</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.ramTitle}>{t.notifications.showIftarDua}</Text>
                  <Text style={s.ramSub}>{t.notifications.showIftarDuaSub}</Text>
                </View>
                <MiniToggle value={iftarDuaEnabled} onValueChange={setIftarDuaEnabled} disabled={!masterEnabled} />
              </View>
            </View>

            {/* Sahur */}
            <View style={[s.ramCard, s.ramCardSuhoor, !masterEnabled && s.cardDisabled]}>
              <View style={s.ramRow}>
                <View style={[s.ramIcon, { backgroundColor: 'rgba(100,140,220,0.15)' }]}>
                  <Text style={{ fontSize: 22 }}>🌅</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.ramTitle}>{t.ramadan.suhoor} İmsak Alarmı</Text>
                  <Text style={s.ramSub}>{fajr?.timeStr ?? '--:--'}'de ezan sesi çalar</Text>
                </View>
                <MiniToggle value={suhoorAlarmEnabled} onValueChange={setSuhoorAlarmEnabled} disabled={!masterEnabled} />
              </View>

              <View style={[s.ramRow, s.ramRowBorder]}>
                <View style={[s.ramIcon, { backgroundColor: 'rgba(100,140,220,0.08)' }]}>
                  <Text style={{ fontSize: 18 }}>⏰</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.ramTitle}>30 Dk Önce Uyan</Text>
                  <Text style={s.ramSub}>
                    {fajr
                      ? `${new Date(fajr.time.getTime() - 30 * 60 * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}'de titreşimli alarm`
                      : 'Sahur öncesi uyandırıcı'}
                  </Text>
                </View>
                <MiniToggle value={suhoorReminderEnabled} onValueChange={setSuhoorReminderEnabled} disabled={!masterEnabled} />
              </View>
            </View>

            {/* Teravih */}
            <View style={[s.ramCard, s.ramCardTeravih, !masterEnabled && s.cardDisabled]}>
              <View style={s.ramRow}>
                <View style={[s.ramIcon, { backgroundColor: 'rgba(123,79,190,0.15)' }]}>
                  <Text style={{ fontSize: 22 }}>🤲</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.ramTitle}>Teravih Hatırlatıcısı</Text>
                  <Text style={s.ramSub}>Yatsı sonrası · {isha?.timeStr ?? '--:--'} civarı</Text>
                </View>
                <MiniToggle value={terawihEnabled} onValueChange={setTerawihEnabled} disabled={!masterEnabled} />
              </View>
            </View>
          </>
        )}

        {/* ── Şehir */}
        <Divider label={t.settings.location} />
        <TouchableOpacity style={s.settRow} onPress={() => setShowCitySelector(true)} activeOpacity={0.85}>
          <View style={[s.settIcon, { backgroundColor: 'rgba(26,107,82,0.1)' }]}>
            <Text style={{ fontSize: 20 }}>📍</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.settLabel}>{t.settings.changeCity}</Text>
            <Text style={s.settSub}>{city}</Text>
          </View>
          <Text style={s.settArrow}>›</Text>
        </TouchableOpacity>

        {/* ── Dil */}
        <Divider label={t.settings.language} />
        <TouchableOpacity style={s.settRow} onPress={() => setShowLangSelector(true)} activeOpacity={0.85}>
          <View style={[s.settIcon, { backgroundColor: 'rgba(26,107,82,0.1)' }]}>
            <Text style={{ fontSize: 20 }}>🌐</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.settLabel}>{t.settings.changeLanguage}</Text>
            <Text style={s.settSub}>{t.langNativeName}</Text>
          </View>
          <Text style={s.settArrow}>›</Text>
        </TouchableOpacity>

        {/* ── Hakkında */}
        <Divider label={t.settings.about} />

        <TouchableOpacity style={s.settRow} onPress={requestReviewManually} activeOpacity={0.85}>
          <View style={[s.settIcon, { backgroundColor: 'rgba(201,168,76,0.12)' }]}>
            <Text style={{ fontSize: 20 }}>⭐</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.settLabel}>{t.settings.rateUs}</Text>
            <Text style={s.settSub}>{Platform.OS === 'ios' ? 'App Store' : 'Google Play'}</Text>
          </View>
          <Text style={s.settArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.settRow} onPress={declineReview} activeOpacity={0.85}>
          <View style={[s.settIcon, { backgroundColor: 'rgba(26,107,82,0.06)' }]}>
            <Text style={{ fontSize: 20 }}>ℹ️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.settLabel}>{t.settings.about}</Text>
            <Text style={s.settSub}>Salah v1.0.0</Text>
          </View>
          <Text style={s.settArrow}>›</Text>
        </TouchableOpacity>

        {/* ── Kaydet */}
        <TouchableOpacity style={s.saveBtn} onPress={reschedule} activeOpacity={0.88}>
          <LinearGradient
            colors={[GOLD, GOLD_LIGHT, GOLD]}
            style={s.saveBtnGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={s.saveBtnTxt}>{t.notifications.save} ✦</Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: CREAM },

  // Header
  header:        { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 36, overflow: 'hidden' },
  headerTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle:   { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub:     { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 3 },
  langBtn:       { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

  // İzin uyarısı
  permWarn:      { marginHorizontal: 16, marginTop: 10, backgroundColor: 'rgba(224,82,82,0.1)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(224,82,82,0.25)' },
  permWarnTxt:   { fontSize: 13, color: '#E05252', fontWeight: '600' },

  // Master
  masterCard:    { marginHorizontal: 16, marginTop: -18, backgroundColor: '#fff', borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: BORDER, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, zIndex: 5 },
  masterIcon:    { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(26,107,82,0.08)', alignItems: 'center', justifyContent: 'center' },
  masterTitle:   { fontSize: 16, fontWeight: '700', color: INK },
  masterSub:     { fontSize: 12, color: MUTED, marginTop: 2 },

  // Divider
  divider:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginVertical: 14 },
  divLine:       { flex: 1, height: 1, backgroundColor: 'rgba(201,168,76,0.2)' },
  divDia:        { width: 5, height: 5, backgroundColor: GOLD, transform: [{ rotate: '45deg' }] },
  divText:       { fontSize: 10, fontWeight: '700', color: GOLD, letterSpacing: 2, textTransform: 'uppercase' },

  // Ses seçici
  soundCard:     { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: BORDER, gap: 8 },
  soundOpt:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)', overflow: 'hidden' },
  soundOptSel:   { borderColor: 'rgba(201,168,76,0.45)' },
  soundRadio:    { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: 'rgba(107,92,62,0.3)', alignItems: 'center', justifyContent: 'center' },
  soundRadioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: EMERALD },
  soundLabel:    { flex: 1, fontSize: 14, fontWeight: '600', color: INK },
  playBtn:       { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(201,168,76,0.12)', alignItems: 'center', justifyContent: 'center' },

  // Vakit kartı
  prayerCard:       { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  prayerCardSpecial:{ borderColor: 'rgba(201,168,76,0.3)', backgroundColor: 'rgba(201,168,76,0.02)' },
  cardDisabled:     { opacity: 0.45 },
  specialBar:       { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: GOLD, zIndex: 1 },
  prayerMain:       { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  prayerIconWrap:   { width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(26,107,82,0.08)', alignItems: 'center', justifyContent: 'center' },
  prayerIconSpecial:{ backgroundColor: 'rgba(201,168,76,0.1)' },
  prayerName:       { fontSize: 14, fontWeight: '700', color: INK },
  prayerArabic:     { fontFamily: Platform.OS === 'ios' ? 'Amiri-Regular' : 'serif', fontSize: 12, color: MUTED, marginTop: 1 },
  specialTag:       { backgroundColor: 'rgba(201,168,76,0.15)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  specialTagTxt:    { fontSize: 9, fontWeight: '800', color: GOLD },
  chipEzan:         { backgroundColor: 'rgba(26,107,82,0.1)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  chipEzanTxt:      { fontSize: 10, fontWeight: '600', color: EMERALD_MID },
  chipReminder:     { backgroundColor: 'rgba(201,168,76,0.1)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  chipReminderTxt:  { fontSize: 10, fontWeight: '600', color: '#8B6914' },
  chevron:          { fontSize: 16, color: 'rgba(107,92,62,0.4)', marginLeft: 2 },
  chevronOpen:      { transform: [{ rotate: '180deg' }] },
  prayerOpts:       { borderTopWidth: 1, borderTopColor: 'rgba(201,168,76,0.1)', padding: 14, backgroundColor: 'rgba(26,107,82,0.02)', gap: 10 },
  optRow:           { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optRowGold:       { backgroundColor: 'rgba(201,168,76,0.04)', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: 'rgba(201,168,76,0.12)' },
  optIcon:          { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  optLabel:         { fontSize: 13, fontWeight: '600', color: INK },
  optSub:           { fontSize: 11, color: MUTED, marginTop: 1 },

  // Ramazan kartları
  ramCard:       { marginHorizontal: 16, marginBottom: 10, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)', overflow: 'hidden' },
  ramCardSuhoor: { borderColor: 'rgba(100,140,220,0.25)' },
  ramCardTeravih:{ borderColor: 'rgba(123,79,190,0.25)' },
  ramRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  ramRowBorder:  { borderTopWidth: 1, borderTopColor: 'rgba(201,168,76,0.1)' },
  ramIcon:       { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  ramTitle:      { fontSize: 14, fontWeight: '700', color: INK },
  ramSub:        { fontSize: 11, color: MUTED, marginTop: 1 },

  // Ayar satırları
  settRow:   { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, marginBottom: 8, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: BORDER },
  settIcon:  { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settLabel: { fontSize: 15, fontWeight: '600', color: INK },
  settSub:   { fontSize: 12, color: MUTED, marginTop: 1 },
  settArrow: { fontSize: 22, color: MUTED, fontWeight: '300' },

  // Kaydet
  saveBtn:     { marginHorizontal: 16, marginTop: 8, borderRadius: 18, overflow: 'hidden', shadowColor: GOLD, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  saveBtnGrad: { paddingVertical: 17, alignItems: 'center' },
  saveBtnTxt:  { fontSize: 16, fontWeight: '800', color: EMERALD, letterSpacing: 0.3 },
});