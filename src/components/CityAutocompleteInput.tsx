import React, { useState, useEffect, useRef } from 'react';
import {
  View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useLanguage } from '@/i18n';

type Suggestion = {
  id: string;
  cityName: string;
  country: string;
};

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (cityName: string) => void;
  onSubmitEditing?: () => void;
  placeholder?: string;
  placeholderTextColor?: string;
  textAlign?: 'left' | 'right';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  inputStyle?: any;
  containerStyle?: any;
  theme?: 'light' | 'dark';
};

export default function CityAutocompleteInput({
  value,
  onChangeText,
  onSelect,
  onSubmitEditing,
  placeholder,
  placeholderTextColor,
  textAlign = 'left',
  autoCapitalize = 'words',
  inputStyle,
  containerStyle,
  theme = 'light',
}: Props) {
  const { language } = useLanguage();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSearch = useRef(false);

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url =
          `https://nominatim.openstreetmap.org/search` +
          `?q=${encodeURIComponent(value)}&format=json&limit=8&addressdetails=1&featuretype=settlement`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'SalahApp/1.0',
            'Accept-Language': language,
          },
        });
        const data: any[] = await res.json();

        const seen = new Set<string>();
        const items: Suggestion[] = [];

        for (const item of data) {
          const addr = item.address ?? {};
          const cityName =
            addr.city ?? addr.town ?? addr.municipality ?? addr.county ?? addr.village ?? '';
          const country = addr.country ?? '';

          if (!cityName) continue;
          const key = `${cityName}|${country}`;
          if (seen.has(key)) continue;
          seen.add(key);

          items.push({ id: item.place_id?.toString() ?? key, cityName, country });
          if (items.length >= 5) break;
        }

        setSuggestions(items);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value]);

  const handleSelect = (suggestion: Suggestion) => {
    skipNextSearch.current = true;
    setSuggestions([]);
    onChangeText(suggestion.cityName);
    onSelect(suggestion.cityName);
  };

  const isDark = theme === 'dark';

  return (
    <View style={containerStyle}>
      <TextInput
        style={inputStyle}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        autoCorrect={false}
        autoCapitalize={autoCapitalize}
        textAlign={textAlign}
        returnKeyType="done"
        onSubmitEditing={onSubmitEditing}
      />
      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#C9A84C" />
        </View>
      )}
      {suggestions.length > 0 && (
        <View style={[styles.suggestionsContainer, isDark && styles.suggestionsContainerDark]}>
          {suggestions.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.suggestionItem,
                index < suggestions.length - 1 &&
                  (isDark ? styles.suggestionBorderDark : styles.suggestionBorder),
              ]}
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.cityName, isDark && styles.cityNameDark]}>{item.cityName}</Text>
              {item.country ? (
                <Text style={[styles.countryName, isDark && styles.countryNameDark]}>
                  {item.country}
                </Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingRow: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(201,168,76,0.3)',
    marginTop: 4,
    overflow: 'hidden',
  },
  suggestionsContainerDark: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  suggestionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,168,76,0.15)',
  },
  suggestionBorderDark: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  cityName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1208',
    flex: 1,
  },
  cityNameDark: {
    color: '#fff',
  },
  countryName: {
    fontSize: 12,
    color: '#6B5C3E',
    marginLeft: 8,
  },
  countryNameDark: {
    color: 'rgba(255,255,255,0.5)',
  },
});
