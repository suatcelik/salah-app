import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage, Language, translations } from '@/i18n';

const LANGUAGES: { code: Language; flag: string }[] = [
  { code: 'tr', flag: '🇹🇷' },
  { code: 'en', flag: '🇬🇧' },
  { code: 'ar', flag: '🇸🇦' },
  { code: 'de', flag: '🇩🇪' },
  { code: 'fr', flag: '🇫🇷' },
];

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export default function LanguageSelector({ visible, onClose }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useLanguage();

  const handleSelect = async (code: Language) => {
    await setLanguage(code);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <TouchableOpacity style={s.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={s.sheet}>
          {/* Handle */}
          <View style={s.handle} />

          {/* Başlık */}
          <View style={s.header}>
            <Text style={s.title}>{t.settings.changeLanguage}</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Text style={s.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Dil listesi */}
          <View style={s.list}>
            {LANGUAGES.map(lang => {
              const isSelected = language === lang.code;
              const langT      = translations[lang.code];

              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[s.option, isSelected && s.optionSelected]}
                  onPress={() => handleSelect(lang.code)}
                  activeOpacity={0.8}
                >
                  {/* Seçili arka plan gradyanı */}
                  {isSelected && (
                    <LinearGradient
                      colors={['rgba(201,168,76,0.15)', 'rgba(201,168,76,0.04)']}
                      style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
                    />
                  )}

                  {/* Bayrak */}
                  <Text style={s.flag}>{lang.flag}</Text>

                  {/* İsim */}
                  <Text style={[
                    s.name,
                    lang.code === 'ar' && s.arabicFont,
                    isSelected && s.nameSelected,
                  ]}>
                    {langT.langNativeName}
                  </Text>

                  {/* Seçili nokta */}
                  {isSelected && <View style={s.dot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,42,30,0.6)' },

  sheet: {
    backgroundColor: '#FAF6EE',
    borderTopLeftRadius:  28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(201,168,76,0.2)',
  },

  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(107,92,62,0.25)',
    alignSelf: 'center', marginBottom: 20,
  },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 16,
  },
  title:    { fontSize: 18, fontWeight: '700', color: '#1A1208', letterSpacing: -0.3 },
  closeBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(26,107,82,0.08)', alignItems: 'center', justifyContent: 'center' },
  closeTxt: { fontSize: 13, fontWeight: '600', color: '#6B5C3E' },

  list: { gap: 10 },

  option: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 16,
    backgroundColor: 'rgba(26,107,82,0.05)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)',
    overflow: 'hidden',
  },
  optionSelected: { borderColor: 'rgba(201,168,76,0.5)' },

  flag: { fontSize: 26 },

  name: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1A1208' },
  // Arapça için Amiri-Regular — AmiriQuran değil (projede yüklü olan font)
  arabicFont:   { fontFamily: Platform.OS === 'ios' ? 'Amiri-Regular' : 'serif', fontSize: 18, textAlign: 'right' },
  nameSelected: { color: '#0F3D2E' },

  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C9A84C' },
});