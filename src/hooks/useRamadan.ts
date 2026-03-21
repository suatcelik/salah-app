import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRamadanStatus, RamadanStatus } from '@/utils/hijriCalendar';

const KEY_WELCOME = '@salah_ramadan_welcome_';

export function useRamadan() {
  const [status, setStatus]             = useState<RamadanStatus>(() => getRamadanStatus());
  const [showWelcome, setShowWelcome]   = useState(false);
  const [checked, setChecked]           = useState(false);

  // Gece yarısında güncelle
  useEffect(() => {
    setStatus(getRamadanStatus());
    const now      = new Date();
    const midnight = new Date(now);
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 1, 0);
    const timer = setTimeout(() => setStatus(getRamadanStatus()), midnight.getTime() - now.getTime());
    return () => clearTimeout(timer);
  }, []);

  // Karşılama ekranı kontrolü
  useEffect(() => {
    if (!status.isRamadan || checked) return;
    setChecked(true);
    AsyncStorage.getItem(KEY_WELCOME + status.ramadanYear).then(val => {
      if (!val) setShowWelcome(true);
    });
  }, [status.isRamadan, status.ramadanYear, checked]);

  const dismissWelcome = async () => {
    setShowWelcome(false);
    await AsyncStorage.setItem(KEY_WELCOME + status.ramadanYear, 'true');
  };

  return { ...status, showWelcome, dismissWelcome };
}

// Sadece boolean gerektiğinde kullan
export function useIsRamadan(): boolean {
  const [is, setIs] = useState(() => getRamadanStatus().isRamadan);
  useEffect(() => {
    const now = new Date();
    const m = new Date(now);
    m.setDate(m.getDate() + 1); m.setHours(0, 0, 1, 0);
    const t = setTimeout(() => setIs(getRamadanStatus().isRamadan), m.getTime() - now.getTime());
    return () => clearTimeout(t);
  }, []);
  return is;
}
