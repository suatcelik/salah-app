import { Tabs } from 'expo-router';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { useLanguage } from '@/i18n';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={s.tabItem}>
      <View style={[s.iconWrap, focused && s.iconActive]}>
        <Text style={s.emoji}>{emoji}</Text>
      </View>
      <Text style={[s.label, focused && s.labelActive]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useLanguage();

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarShowLabel: false, tabBarStyle: s.tabBar }}>
      <Tabs.Screen name="index"   options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🕌" label={t.nav.times}   focused={focused} /> }} />
      <Tabs.Screen name="qibla"   options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🧭" label={t.nav.qibla}   focused={focused} /> }} />
      <Tabs.Screen name="prayers" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📖" label={t.nav.prayers} focused={focused} /> }} />
      <Tabs.Screen name="verse"   options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="⭐" label={t.nav.verse}   focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label={t.nav.profile} focused={focused} /> }} />
    </Tabs>
  );
}

const s = StyleSheet.create({
  tabBar:      { backgroundColor: 'rgba(250,246,238,0.97)', borderTopWidth: 1, borderTopColor: 'rgba(201,168,76,0.2)', height: Platform.OS === 'ios' ? 84 : 68, paddingBottom: Platform.OS === 'ios' ? 20 : 8, paddingTop: 8 },
  tabItem:     { alignItems: 'center', gap: 3 },
  iconWrap:    { width: 44, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconActive:  { backgroundColor: '#0F3D2E' },
  emoji:       { fontSize: 20 },
  label:       { fontSize: 10, fontWeight: '600', color: '#6B5C3E', letterSpacing: 0.3 },
  labelActive: { color: '#0F3D2E' },
});