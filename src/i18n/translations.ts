export type Language = 'tr' | 'en' | 'ar' | 'de' | 'fr';

export interface Translations {
  langName: string;
  langNativeName: string;
  isRTL: boolean;

  onboarding: {
    welcome: string;
    subtitle: string;
    selectLanguage: string;
    selectLanguageHint: string;
    continue: string;
    selectLocation: string;
    locationHint: string;
    locationPermission: string;
    orEnterManually: string;
    cityPlaceholder: string;
    finish: string;
  };

  nav: {
    times: string;
    qibla: string;
    prayers: string;
    verse: string;
    profile: string;
  };

  prayers: {
    fajr: string;
    sunrise: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
  };

  home: {
    nextPrayer: string;
    remaining: string;
    at: string;
    today: string;
    weekly: string;
    monthly: string;
    dailyVerse: string;
    qibla: string;
    dhikr: string;
  };

  ramadan: {
    modeActive: string;
    iftar: string;
    suhoor: string;
    iftarRemaining: string;
    suhoorRemaining: string;
    fastingProgress: string;
    day: string;
    daysLeft: string;
    fastCount: string;
    missed: string;
    tarawih: string;
    approaching: string;
    approachingDays: string;
    welcomeTitle: string;
    welcomeSubtitle: string;
    welcomeBtn: string;
    welcomeNote: string;
    iftarTag: string;
    suhoorTag: string;
  };

  qibla: {
    title: string;
    direction: string;
    distance: string;
    latitude: string;
    longitude: string;
    calibrate: string;
  };

  verse: {
    title: string;
    meaning: string;
    tafsir: string;
    share: string;
    save: string;
    listen: string;
    prev: string;
    next: string;
  };

  dhikr: {
    subhanallah: string;
    alhamdulillah: string;
    allahuAkbar: string;
    morningDua: string;
    completed: string;
    notRead: string;
  };

  notifications: {
    title: string;
    allNotifications: string;
    allNotificationsSub: string;
    soundTitle: string;
    prayerTimes: string;
    ezanAtTime: string;
    reminderBefore: string;
    reminderBeforeSub: string;
    showIftarDua: string;
    showIftarDuaSub: string;
    save: string;
    ezanSound: string;
    nasheed: string;
    vibrationOnly: string;
    silent: string;
  };

  settings: {
    title: string;
    language: string;
    notifications: string;
    theme: string;
    about: string;
    changeLanguage: string;
    rateUs: string;
    remindLater: string;
    neverShow: string;
    reviewTitle: string;
    reviewSubtitle: string;
    location: string;
    changeCity: string;
    cityInputTitle: string;
    cityConfirm: string;
  };

  permission: {
    title: string;
    titleHighlight: string;
    subtitle: string;
    feature1Title: string;
    feature1Sub: string;
    feature2Title: string;
    feature2Sub: string;
    feature3Title: string;
    feature3Sub: string;
    allowBtn: string;
    skipBtn: string;
    successTitle: string;
    successHighlight: string;
    successMsg: string;
    scheduleTitle: string;
    continueBtn: string;
  };
}

export const translations: Record<Language, Translations> = {
  tr: {
    langName: 'Türkçe', langNativeName: 'Türkçe', isRTL: false,
    onboarding: {
      welcome: 'Salah\'a\nHoş Geldiniz',
      subtitle: 'Günlük ibadetleriniz için\nruhani yol arkadaşınız',
      selectLanguage: 'Dil Seçin',
      selectLanguageHint: 'Uygulamayı hangi dilde kullanmak istersiniz?',
      continue: 'Devam Et',
      selectLocation: 'Konumunuzu Belirleyin',
      locationHint: 'Doğru namaz vakitleri için konumunuza ihtiyacımız var',
      locationPermission: 'Konumu Otomatik Al',
      orEnterManually: 'veya şehir girin',
      cityPlaceholder: 'Şehir adı...',
      finish: 'Başla',
    },
    nav: { times: 'Vakitler', qibla: 'Kıble', prayers: 'Dualar', verse: 'Ayet', profile: 'Profil' },
    prayers: { fajr: 'İmsak', sunrise: 'Güneş', dhuhr: 'Öğle', asr: 'İkindi', maghrib: 'Akşam', isha: 'Yatsı' },
    home: {
      nextPrayer: 'Sıradaki Namaz', remaining: 'kaldı', at: "'de",
      today: 'Bugün', weekly: 'Haftalık', monthly: 'Aylık',
      dailyVerse: 'Günün Ayeti', qibla: 'Kıble', dhikr: 'Dua & Zikir',
    },
    ramadan: {
      modeActive: 'Ramazan 1446',
      iftar: 'İftar', suhoor: 'Sahur',
      iftarRemaining: 'İftara Kalan', suhoorRemaining: 'Sahura Kalan',
      fastingProgress: 'Oruç İlerlemesi',
      day: 'Gün', daysLeft: 'Kaldı', fastCount: 'Oruç', missed: 'Kaza',
      tarawih: 'Teravih Namazı',
      approaching: 'Ramazan Yaklaşıyor!',
      approachingDays: 'gün kaldı',
      welcomeTitle: 'Hayırlı Ramazanlar!',
      welcomeSubtitle: 'Mübarek Ramazan ayına girdiniz.\nSalah bu ay size özel özelliklerle eşlik edecek.',
      welcomeBtn: 'Ramazan Modunu Başlat',
      welcomeNote: 'Ramazan boyunca otomatik aktif kalır · Ayar gerekmez',
      iftarTag: 'İFTAR', suhoorTag: 'SAHUR',
    },
    qibla: { title: 'Kıble Yönü', direction: 'Yön', distance: "Kabe'ye mesafe", latitude: 'Enlem', longitude: 'Boylam', calibrate: 'Kalibre Et' },
    verse: { title: 'Günlük Ayet', meaning: 'Türkçe Meali', tafsir: 'Kısa Tefsir', share: 'Paylaş', save: 'Kaydet', listen: 'Dinle', prev: 'Önceki', next: 'Sonraki' },
    dhikr: { subhanallah: 'Sübhanallah', alhamdulillah: 'Elhamdülillah', allahuAkbar: 'Allahu Ekber', morningDua: 'Sabah Duası', completed: 'tamamlandı', notRead: 'Okunmadı' },
    notifications: {
      title: 'Bildirim Ayarları', allNotifications: 'Tüm Bildirimler',
      allNotificationsSub: 'Tüm ezan & hatırlatıcıları yönet',
      soundTitle: 'Ezan Sesi Seçimi', prayerTimes: 'Vakit Bildirimleri',
      ezanAtTime: 'Vakit Ezanı', reminderBefore: '15 Dk Önce Hatırlatıcı',
      reminderBeforeSub: 'Sessiz bildirim gönderilir',
      showIftarDua: 'İftar Duası Göster', showIftarDuaSub: 'Bildirimde dua metnini göster',
      save: 'Ayarları Kaydet',
      ezanSound: 'Ezan-ı Şerif', nasheed: 'Neşid', vibrationOnly: 'Sadece Titreşim', silent: 'Sessiz',
    },
    settings: {
      title: 'Ayarlar', language: 'Dil', notifications: 'Bildirimler',
      theme: 'Tema', about: 'Hakkında', changeLanguage: 'Dili Değiştir',
      rateUs: 'App Store\'da Değerlendir', remindLater: 'Daha sonra hatırlat',
      neverShow: 'Bir daha gösterme', reviewTitle: 'Nasıl Beğendiniz?',
      reviewSubtitle: 'Deneyiminizi paylaşır mısınız?',
      location: 'Konum', changeCity: 'Şehri Değiştir',
      cityInputTitle: 'Şehir Seç', cityConfirm: 'Onayla',
    },
    permission: {
      title: 'Ezan', titleHighlight: 'Bildirimlerine\nİzin Ver',
      subtitle: 'Namaz vakitlerini asla kaçırma.\nİstediğin zaman kapatabilirsin.',
      feature1Title: 'Vakit Ezanı', feature1Sub: 'Her namaz vaktinde ezan sesi çalar',
      feature2Title: '15 Dk Önce Hatırlatıcı', feature2Sub: 'Vakit girmeden sessiz uyarı alırsın',
      feature3Title: 'İstediğin Vakti Seç', feature3Sub: 'Her vakit için ayrı ayar yapabilirsin',
      allowBtn: 'Bildirimlere İzin Ver', skipBtn: 'Şimdi değil',
      successTitle: 'Bildirimler', successHighlight: 'Aktif!',
      successMsg: 'Artık ezan vakitlerini ve hatırlatıcıları alacaksınız.\nAyarlardan istediğiniz zaman değiştirebilirsiniz.',
      scheduleTitle: 'Bugünkü Bildirim Planı', continueBtn: 'Uygulamaya Git',
    },
  },

  en: {
    langName: 'English', langNativeName: 'English', isRTL: false,
    onboarding: {
      welcome: 'Welcome\nto Salah',
      subtitle: 'Your spiritual companion\nfor daily worship',
      selectLanguage: 'Choose Language',
      selectLanguageHint: 'Which language would you like to use?',
      continue: 'Continue',
      selectLocation: 'Set Your Location',
      locationHint: 'We need your location for accurate prayer times',
      locationPermission: 'Use My Location',
      orEnterManually: 'or enter city manually',
      cityPlaceholder: 'City name...',
      finish: 'Get Started',
    },
    nav: { times: 'Times', qibla: 'Qibla', prayers: 'Prayers', verse: 'Verse', profile: 'Profile' },
    prayers: { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
    home: {
      nextPrayer: 'Next Prayer', remaining: 'remaining', at: 'at',
      today: 'Today', weekly: 'Weekly', monthly: 'Monthly',
      dailyVerse: 'Daily Verse', qibla: 'Qibla', dhikr: 'Dhikr & Dua',
    },
    ramadan: {
      modeActive: 'Ramadan 1446',
      iftar: 'Iftar', suhoor: 'Suhoor',
      iftarRemaining: 'Until Iftar', suhoorRemaining: 'Until Suhoor',
      fastingProgress: 'Fasting Progress',
      day: 'Day', daysLeft: 'Left', fastCount: 'Fasts', missed: 'Missed',
      tarawih: 'Tarawih Prayer',
      approaching: 'Ramadan is Coming!',
      approachingDays: 'days left',
      welcomeTitle: 'Ramadan Mubarak!',
      welcomeSubtitle: 'The blessed month of Ramadan has begun.\nSalah will accompany you with special features.',
      welcomeBtn: 'Start Ramadan Mode',
      welcomeNote: 'Automatically active throughout Ramadan · No setup needed',
      iftarTag: 'IFTAR', suhoorTag: 'SUHOOR',
    },
    qibla: { title: 'Qibla Direction', direction: 'Direction', distance: 'Distance to Kaaba', latitude: 'Latitude', longitude: 'Longitude', calibrate: 'Calibrate' },
    verse: { title: 'Daily Verse', meaning: 'Translation', tafsir: 'Brief Commentary', share: 'Share', save: 'Save', listen: 'Listen', prev: 'Previous', next: 'Next' },
    dhikr: { subhanallah: 'Subhanallah', alhamdulillah: 'Alhamdulillah', allahuAkbar: 'Allahu Akbar', morningDua: 'Morning Dua', completed: 'completed', notRead: 'Not read' },
    notifications: {
      title: 'Notification Settings', allNotifications: 'All Notifications',
      allNotificationsSub: 'Manage all adhan & reminders',
      soundTitle: 'Adhan Sound', prayerTimes: 'Prayer Notifications',
      ezanAtTime: 'Prayer Adhan', reminderBefore: '15 Min Early Reminder',
      reminderBeforeSub: 'Silent notification sent',
      showIftarDua: 'Show Iftar Dua', showIftarDuaSub: 'Display dua text in notification',
      save: 'Save Settings',
      ezanSound: 'Adhan', nasheed: 'Nasheed', vibrationOnly: 'Vibration Only', silent: 'Silent',
    },
    settings: {
      title: 'Settings', language: 'Language', notifications: 'Notifications',
      theme: 'Theme', about: 'About', changeLanguage: 'Change Language',
      rateUs: 'Rate on App Store', remindLater: 'Remind me later',
      neverShow: 'Never show again', reviewTitle: 'Enjoying Salah?',
      reviewSubtitle: 'Would you like to share your experience?',
      location: 'Location', changeCity: 'Change City',
      cityInputTitle: 'Select City', cityConfirm: 'Confirm',
    },
    permission: {
      title: 'Allow', titleHighlight: 'Adhan\nNotifications',
      subtitle: 'Never miss a prayer time.\nYou can turn this off anytime.',
      feature1Title: 'Prayer Adhan', feature1Sub: 'Adhan plays at every prayer time',
      feature2Title: '15 Min Early Reminder', feature2Sub: 'Silent reminder before prayer',
      feature3Title: 'Choose Your Prayers', feature3Sub: 'Separate settings per prayer',
      allowBtn: 'Allow Notifications', skipBtn: 'Not now',
      successTitle: 'Notifications', successHighlight: 'Active!',
      successMsg: 'You will now receive adhan and reminders.\nYou can change this anytime in settings.',
      scheduleTitle: "Today's Notification Schedule", continueBtn: 'Go to App',
    },
  },

  ar: {
    langName: 'العربية', langNativeName: 'العربية', isRTL: true,
    onboarding: {
      welcome: 'أهلاً بك\nفي صلاة',
      subtitle: 'رفيقك الروحي\nفي عباداتك اليومية',
      selectLanguage: 'اختر اللغة',
      selectLanguageHint: 'أي لغة تفضل استخدام التطبيق بها؟',
      continue: 'متابعة',
      selectLocation: 'حدد موقعك',
      locationHint: 'نحتاج موقعك لتحديد أوقات الصلاة بدقة',
      locationPermission: 'تحديد موقعي تلقائياً',
      orEnterManually: 'أو أدخل المدينة يدوياً',
      cityPlaceholder: 'اسم المدينة...',
      finish: 'ابدأ',
    },
    nav: { times: 'الأوقات', qibla: 'القبلة', prayers: 'الأدعية', verse: 'الآية', profile: 'الملف' },
    prayers: { fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' },
    home: {
      nextPrayer: 'الصلاة القادمة', remaining: 'متبقٍ', at: 'في',
      today: 'اليوم', weekly: 'أسبوعياً', monthly: 'شهرياً',
      dailyVerse: 'آية اليوم', qibla: 'القبلة', dhikr: 'الذكر والدعاء',
    },
    ramadan: {
      modeActive: 'رمضان ١٤٤٦',
      iftar: 'الإفطار', suhoor: 'السحور',
      iftarRemaining: 'حتى الإفطار', suhoorRemaining: 'حتى السحور',
      fastingProgress: 'تقدم الصيام',
      day: 'يوم', daysLeft: 'متبقٍ', fastCount: 'صيام', missed: 'قضاء',
      tarawih: 'صلاة التراويح',
      approaching: 'رمضان يقترب!',
      approachingDays: 'أيام متبقية',
      welcomeTitle: 'رمضان كريم!',
      welcomeSubtitle: 'مبارك عليكم شهر رمضان.\nصلاة ستكون معكم بميزات خاصة.',
      welcomeBtn: 'ابدأ وضع رمضان',
      welcomeNote: 'يعمل تلقائياً طوال رمضان · لا يحتاج إعداد',
      iftarTag: 'إفطار', suhoorTag: 'سحور',
    },
    qibla: { title: 'اتجاه القبلة', direction: 'الاتجاه', distance: 'المسافة إلى الكعبة', latitude: 'خط العرض', longitude: 'خط الطول', calibrate: 'معايرة' },
    verse: { title: 'آية اليوم', meaning: 'الترجمة', tafsir: 'تفسير مختصر', share: 'مشاركة', save: 'حفظ', listen: 'استماع', prev: 'السابق', next: 'التالي' },
    dhikr: { subhanallah: 'سبحان الله', alhamdulillah: 'الحمد لله', allahuAkbar: 'الله أكبر', morningDua: 'دعاء الصباح', completed: 'مكتمل', notRead: 'لم يُقرأ' },
    notifications: {
      title: 'إعدادات الإشعارات', allNotifications: 'جميع الإشعارات',
      allNotificationsSub: 'إدارة الأذان والتذكيرات',
      soundTitle: 'صوت الأذان', prayerTimes: 'إشعارات الصلاة',
      ezanAtTime: 'أذان الوقت', reminderBefore: 'تذكير قبل ١٥ دقيقة',
      reminderBeforeSub: 'إشعار صامت',
      showIftarDua: 'عرض دعاء الإفطار', showIftarDuaSub: 'عرض نص الدعاء في الإشعار',
      save: 'حفظ الإعدادات',
      ezanSound: 'الأذان الشريف', nasheed: 'نشيد', vibrationOnly: 'اهتزاز فقط', silent: 'صامت',
    },
    settings: {
      title: 'الإعدادات', language: 'اللغة', notifications: 'الإشعارات',
      theme: 'المظهر', about: 'حول التطبيق', changeLanguage: 'تغيير اللغة',
      rateUs: 'قيّم التطبيق', remindLater: 'ذكّرني لاحقاً',
      neverShow: 'لا تظهر مجدداً', reviewTitle: 'كيف تجد التطبيق؟',
      reviewSubtitle: 'شاركنا تجربتك',
      location: 'الموقع', changeCity: 'تغيير المدينة',
      cityInputTitle: 'اختر مدينة', cityConfirm: 'تأكيد',
    },
    permission: {
      title: 'إذن', titleHighlight: 'إشعارات\nالأذان',
      subtitle: 'لا تفوّت وقت الصلاة.\nيمكنك إيقافه في أي وقت.',
      feature1Title: 'أذان الوقت', feature1Sub: 'يُرفع الأذان عند كل صلاة',
      feature2Title: 'تذكير قبل ١٥ دقيقة', feature2Sub: 'تنبيه صامت قبل الصلاة',
      feature3Title: 'اختر صلواتك', feature3Sub: 'إعدادات منفصلة لكل صلاة',
      allowBtn: 'السماح بالإشعارات', skipBtn: 'ليس الآن',
      successTitle: 'الإشعارات', successHighlight: 'مفعّلة!',
      successMsg: 'ستتلقى الأذان والتذكيرات.\nيمكنك التغيير من الإعدادات.',
      scheduleTitle: 'جدول إشعارات اليوم', continueBtn: 'الذهاب إلى التطبيق',
    },
  },

  de: {
    langName: 'Deutsch', langNativeName: 'Deutsch', isRTL: false,
    onboarding: {
      welcome: 'Willkommen\nbei Salah',
      subtitle: 'Ihr spiritueller Begleiter\nfür tägliche Gebete',
      selectLanguage: 'Sprache wählen',
      selectLanguageHint: 'In welcher Sprache möchten Sie die App nutzen?',
      continue: 'Weiter',
      selectLocation: 'Standort festlegen',
      locationHint: 'Wir benötigen Ihren Standort für genaue Gebetszeiten',
      locationPermission: 'Standort automatisch ermitteln',
      orEnterManually: 'oder Stadt manuell eingeben',
      cityPlaceholder: 'Stadtname...',
      finish: 'Loslegen',
    },
    nav: { times: 'Zeiten', qibla: 'Qibla', prayers: 'Gebete', verse: 'Vers', profile: 'Profil' },
    prayers: { fajr: 'Fadschr', sunrise: 'Sonnenaufgang', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Ischa' },
    home: {
      nextPrayer: 'Nächstes Gebet', remaining: 'verbleibend', at: 'um',
      today: 'Heute', weekly: 'Wöchentlich', monthly: 'Monatlich',
      dailyVerse: 'Tagesvers', qibla: 'Qibla', dhikr: 'Dhikr & Dua',
    },
    ramadan: {
      modeActive: 'Ramadan 1446',
      iftar: 'Iftar', suhoor: 'Suhur',
      iftarRemaining: 'Bis Iftar', suhoorRemaining: 'Bis Suhur',
      fastingProgress: 'Fastenfortschritt',
      day: 'Tag', daysLeft: 'Verbleibend', fastCount: 'Fasten', missed: 'Nachgeholt',
      tarawih: 'Tarawih-Gebet',
      approaching: 'Ramadan naht!',
      approachingDays: 'Tage verbleibend',
      welcomeTitle: 'Ramadan Mubarak!',
      welcomeSubtitle: 'Der gesegnete Monat Ramadan hat begonnen.\nSalah begleitet Sie mit besonderen Funktionen.',
      welcomeBtn: 'Ramadan-Modus starten',
      welcomeNote: 'Automatisch aktiv während Ramadan · Keine Einrichtung nötig',
      iftarTag: 'IFTAR', suhoorTag: 'SUHUR',
    },
    qibla: { title: 'Qibla-Richtung', direction: 'Richtung', distance: 'Entfernung zur Kaaba', latitude: 'Breitengrad', longitude: 'Längengrad', calibrate: 'Kalibrieren' },
    verse: { title: 'Tagesvers', meaning: 'Übersetzung', tafsir: 'Kurzer Kommentar', share: 'Teilen', save: 'Speichern', listen: 'Anhören', prev: 'Zurück', next: 'Weiter' },
    dhikr: { subhanallah: 'Subhanallah', alhamdulillah: 'Alhamdulillah', allahuAkbar: 'Allahu Akbar', morningDua: 'Morgendua', completed: 'abgeschlossen', notRead: 'Nicht gelesen' },
    notifications: {
      title: 'Benachrichtigungen', allNotifications: 'Alle Benachrichtigungen',
      allNotificationsSub: 'Gebetszeiten & Erinnerungen verwalten',
      soundTitle: 'Gebetsruf-Ton', prayerTimes: 'Gebetsbenachrichtigungen',
      ezanAtTime: 'Gebetsruf', reminderBefore: 'Erinnerung 15 Min vorher',
      reminderBeforeSub: 'Stille Benachrichtigung',
      showIftarDua: 'Iftar-Dua anzeigen', showIftarDuaSub: 'Dua-Text in Benachrichtigung',
      save: 'Einstellungen speichern',
      ezanSound: 'Gebetsruf', nasheed: 'Naschid', vibrationOnly: 'Nur Vibration', silent: 'Lautlos',
    },
    settings: {
      title: 'Einstellungen', language: 'Sprache', notifications: 'Benachrichtigungen',
      theme: 'Design', about: 'Über die App', changeLanguage: 'Sprache ändern',
      rateUs: 'Im App Store bewerten', remindLater: 'Später erinnern',
      neverShow: 'Nie wieder anzeigen', reviewTitle: 'Wie gefällt Ihnen Salah?',
      reviewSubtitle: 'Teilen Sie Ihre Erfahrung',
      location: 'Standort', changeCity: 'Stadt ändern',
      cityInputTitle: 'Stadt wählen', cityConfirm: 'Bestätigen',
    },
    permission: {
      title: 'Erlauben Sie', titleHighlight: 'Gebets-\nBenachrichtigungen',
      subtitle: 'Verpassen Sie keine Gebetszeit mehr.\nSie können dies jederzeit deaktivieren.',
      feature1Title: 'Gebetsruf', feature1Sub: 'Gebetsruf bei jeder Gebetszeit',
      feature2Title: '15 Min Frühwarnung', feature2Sub: 'Stille Erinnerung vor dem Gebet',
      feature3Title: 'Gebete auswählen', feature3Sub: 'Separate Einstellungen pro Gebet',
      allowBtn: 'Benachrichtigungen erlauben', skipBtn: 'Nicht jetzt',
      successTitle: 'Benachrichtigungen', successHighlight: 'Aktiv!',
      successMsg: 'Sie erhalten jetzt Gebetsrufe und Erinnerungen.\nÄnderbar in den Einstellungen.',
      scheduleTitle: 'Heutiger Benachrichtigungsplan', continueBtn: 'Zur App',
    },
  },

  fr: {
    langName: 'Français', langNativeName: 'Français', isRTL: false,
    onboarding: {
      welcome: 'Bienvenue\nsur Salah',
      subtitle: 'Votre compagnon spirituel\npour la prière quotidienne',
      selectLanguage: 'Choisir la langue',
      selectLanguageHint: "Dans quelle langue souhaitez-vous utiliser l'application ?",
      continue: 'Continuer',
      selectLocation: 'Définir votre position',
      locationHint: 'Nous avons besoin de votre position pour les horaires de prière',
      locationPermission: 'Utiliser ma position',
      orEnterManually: 'ou entrer une ville manuellement',
      cityPlaceholder: 'Nom de la ville...',
      finish: 'Commencer',
    },
    nav: { times: 'Horaires', qibla: 'Qibla', prayers: 'Prières', verse: 'Verset', profile: 'Profil' },
    prayers: { fajr: 'Fajr', sunrise: 'Lever', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
    home: {
      nextPrayer: 'Prochaine prière', remaining: 'restant', at: 'à',
      today: "Aujourd'hui", weekly: 'Hebdomadaire', monthly: 'Mensuel',
      dailyVerse: 'Verset du jour', qibla: 'Qibla', dhikr: 'Dhikr & Dua',
    },
    ramadan: {
      modeActive: 'Ramadan 1446',
      iftar: 'Iftar', suhoor: 'Suhour',
      iftarRemaining: "Jusqu'à l'Iftar", suhoorRemaining: "Jusqu'au Suhour",
      fastingProgress: 'Progression du jeûne',
      day: 'Jour', daysLeft: 'Restant', fastCount: 'Jeûnes', missed: 'Rattrapé',
      tarawih: 'Prière Tarawih',
      approaching: 'Le Ramadan approche!',
      approachingDays: 'jours restants',
      welcomeTitle: 'Ramadan Mubarak!',
      welcomeSubtitle: 'Le béni mois de Ramadan a commencé.\nSalah vous accompagnera avec des fonctions spéciales.',
      welcomeBtn: 'Démarrer le mode Ramadan',
      welcomeNote: 'Actif automatiquement pendant le Ramadan · Aucune configuration',
      iftarTag: 'IFTAR', suhoorTag: 'SUHOUR',
    },
    qibla: { title: 'Direction de la Qibla', direction: 'Direction', distance: 'Distance vers la Kaaba', latitude: 'Latitude', longitude: 'Longitude', calibrate: 'Calibrer' },
    verse: { title: 'Verset du jour', meaning: 'Traduction', tafsir: 'Commentaire bref', share: 'Partager', save: 'Enregistrer', listen: 'Écouter', prev: 'Précédent', next: 'Suivant' },
    dhikr: { subhanallah: 'Subhanallah', alhamdulillah: 'Alhamdulillah', allahuAkbar: 'Allahu Akbar', morningDua: 'Dua du matin', completed: 'complété', notRead: 'Non lu' },
    notifications: {
      title: 'Paramètres de notification', allNotifications: 'Toutes les notifications',
      allNotificationsSub: 'Gérer appels à la prière et rappels',
      soundTitle: "Son de l'appel", prayerTimes: 'Notifications de prière',
      ezanAtTime: 'Appel à la prière', reminderBefore: 'Rappel 15 min avant',
      reminderBeforeSub: 'Notification silencieuse',
      showIftarDua: "Afficher la Dua d'Iftar", showIftarDuaSub: 'Texte de dua dans la notification',
      save: 'Enregistrer les paramètres',
      ezanSound: 'Appel à la prière', nasheed: 'Nashid', vibrationOnly: 'Vibration seulement', silent: 'Silencieux',
    },
    settings: {
      title: 'Paramètres', language: 'Langue', notifications: 'Notifications',
      theme: 'Thème', about: 'À propos', changeLanguage: 'Changer de langue',
      rateUs: "Évaluer sur l'App Store", remindLater: 'Me rappeler plus tard',
      neverShow: 'Ne plus afficher', reviewTitle: 'Vous aimez Salah?',
      reviewSubtitle: 'Partagez votre expérience',
      location: 'Localisation', changeCity: 'Changer de ville',
      cityInputTitle: 'Choisir une ville', cityConfirm: 'Confirmer',
    },
    permission: {
      title: 'Autoriser les', titleHighlight: 'notifications\nde prière',
      subtitle: "Ne manquez plus aucune prière.\nVous pouvez désactiver à tout moment.",
      feature1Title: 'Appel à la prière', feature1Sub: "L'appel sonne à chaque prière",
      feature2Title: 'Rappel 15 min avant', feature2Sub: 'Rappel silencieux avant la prière',
      feature3Title: 'Choisissez vos prières', feature3Sub: 'Paramètres séparés par prière',
      allowBtn: 'Autoriser les notifications', skipBtn: 'Pas maintenant',
      successTitle: 'Notifications', successHighlight: 'Actives!',
      successMsg: 'Vous recevrez les appels à la prière et rappels.\nModifiable dans les paramètres.',
      scheduleTitle: "Planning de notifications d'aujourd'hui", continueBtn: "Aller à l'app",
    },
  },
};

export const LANGUAGE_META: Record<Language, { flag: string }> = {
  tr: { flag: '🇹🇷' },
  en: { flag: '🇬🇧' },
  ar: { flag: '🇸🇦' },
  de: { flag: '🇩🇪' },
  fr: { flag: '🇫🇷' },
};
