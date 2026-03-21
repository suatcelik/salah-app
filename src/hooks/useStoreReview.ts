import { useEffect, useRef } from 'react';
import { Linking, Platform } from 'react-native';
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Store URL'leri — göndermeden önce gerçek ID ile değiştir
const IOS_STORE_URL     = 'https://apps.apple.com/app/id000000000?action=write-review';
const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=com.salahapp.namaz';

const KEY_FIRST_OPEN = '@salah_first_open';
const KEY_REVIEWED   = '@salah_reviewed';
const KEY_DECLINED   = '@salah_review_declined';
const TRIGGER_DAYS   = 3;

// ─────────────────────────────────────────────────────────────
// 1. Hook — _layout.tsx'te bir kez çağrılır
//    3. günden itibaren native review prompt gösterir
// ─────────────────────────────────────────────────────────────
export function useStoreReview() {
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;
    checkAndRequest();
  }, []);
}

async function checkAndRequest() {
  try {
    // Daha önce review istendi veya reddedildi mi?
    const [reviewed, declined] = await Promise.all([
      AsyncStorage.getItem(KEY_REVIEWED),
      AsyncStorage.getItem(KEY_DECLINED),
    ]);
    if (reviewed || declined) return;

    // İlk açılış tarihini kaydet
    let first = await AsyncStorage.getItem(KEY_FIRST_OPEN);
    if (!first) {
      first = new Date().toISOString();
      await AsyncStorage.setItem(KEY_FIRST_OPEN, first);
    }

    // 3 gün geçti mi?
    const days = (Date.now() - new Date(first).getTime()) / 86_400_000;
    if (days < TRIGGER_DAYS) return;

    // Cihazda native review mevcut mu?
    const available = await StoreReview.isAvailableAsync();
    if (!available) return;

    // Native review dialog'u göster
    await StoreReview.requestReview();
    await AsyncStorage.setItem(KEY_REVIEWED, new Date().toISOString());

  } catch (e) {
    console.warn('[StoreReview]', e);
  }
}

// ─────────────────────────────────────────────────────────────
// 2. Manuel tetikleme — Ayarlar ekranındaki "Bizi Değerlendir"
//    butonuna basınca çağrılır
// ─────────────────────────────────────────────────────────────
export async function requestReviewManually(): Promise<boolean> {
  try {
    const available = await StoreReview.isAvailableAsync();

    if (!available) {
      // Native prompt yoksa doğrudan store'u aç
      await openStorePage();
      return false;
    }

    await StoreReview.requestReview();
    await AsyncStorage.setItem(KEY_REVIEWED, new Date().toISOString());
    return true;

  } catch {
    await openStorePage();
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// 3. Reddet — "Bir daha gösterme" butonuna basınca çağrılır
// ─────────────────────────────────────────────────────────────
export async function declineReview(): Promise<void> {
  await AsyncStorage.setItem(KEY_DECLINED, new Date().toISOString());
}

// ─────────────────────────────────────────────────────────────
// 4. Sıfırla — sadece test amaçlı
// ─────────────────────────────────────────────────────────────
export async function resetReviewState(): Promise<void> {
  await AsyncStorage.multiRemove([KEY_FIRST_OPEN, KEY_REVIEWED, KEY_DECLINED]);
}

// ─────────────────────────────────────────────────────────────
// Yardımcı — platform'a göre store sayfasını aç
// ─────────────────────────────────────────────────────────────
async function openStorePage(): Promise<void> {
  const url = Platform.OS === 'ios' ? IOS_STORE_URL : ANDROID_STORE_URL;
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) await Linking.openURL(url);
}