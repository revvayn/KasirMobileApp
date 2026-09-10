import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateField, { dateToStr } from './DateField';

const PRESETS = {
  today: () => {
    const now = new Date();
    return [dateToStr(now), dateToStr(now)];
  },
  yesterday: () => {
    const now = new Date();
    const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    return [dateToStr(y), dateToStr(y)];
  },
  last7: () => {
    const now = new Date();
    const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    return [dateToStr(s), dateToStr(now)];
  },
  last30: () => {
    const now = new Date();
    const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    return [dateToStr(s), dateToStr(now)];
  },
};

export default function FilterBar({
  filter,
  setFilter,
  customDate,
  setCustomDate,
  rangeStart,
  setRangeStart,
  rangeEnd,
  setRangeEnd,
}) {
  const filters = [
    { key: 'today', label: 'Hari Ini' },
    { key: 'month', label: 'Bulan Ini' },
    { key: 'year', label: 'Tahun Ini' },
    { key: 'range', label: 'Rentang' },
    { key: 'all', label: 'Semua' },
    { key: 'custom', label: 'Pilih Tanggal' },
  ];

  const applyPreset = (key) => {
    const [start, end] = PRESETS[key]();
    if (filter === 'custom') {
      setCustomDate(end);
    } else {
      setRangeStart(start);
      setRangeEnd(end);
    }
  };

  const presetChips = [
    { key: 'today', label: 'Hari Ini' },
    { key: 'yesterday', label: 'Kemarin' },
    { key: 'last7', label: '7 Hari Terakhir' },
    { key: 'last30', label: '30 Hari Terakhir' },
  ];

  return (
    <View className="mb-4">
      <View className="flex-row flex-wrap gap-2">
        {filters.map((item) => (
          <TouchableOpacity
            key={item.key}
            className={`px-3 py-1.5 rounded-full border ${
              filter === item.key ? 'bg-primary border-primary' : 'bg-surface border-hairline'
            }`}
            onPress={() => setFilter(item.key)}
            activeOpacity={0.8}
          >
            <Text className={`text-xs font-bold ${filter === item.key ? 'text-white' : 'text-ink-muted'}`}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filter === 'range' && (
        <View className="mt-3 p-3 bg-surface rounded-2xl border border-hairline">
          <Text className="text-xs font-bold text-ink mb-1">Rentang Tanggal (dari — sampai):</Text>
          <View className={Platform.OS === 'web' ? 'gap-2' : 'flex-row gap-3'}>
            <View style={Platform.OS === 'web' ? {} : { flex: 1 }}>
              <DateField value={rangeStart} onChange={setRangeStart} placeholder="Dari" />
            </View>
            <View style={Platform.OS === 'web' ? {} : { flex: 1 }}>
              <DateField value={rangeEnd} onChange={setRangeEnd} placeholder="Sampai" />
            </View>
          </View>
          <View className="flex-row flex-wrap gap-2 mt-3">
            {presetChips.map((p) => (
              <TouchableOpacity
                key={p.key}
                className="px-2.5 py-1.5 rounded-xl bg-accent-soft"
                onPress={() => applyPreset(p.key)}
                activeOpacity={0.8}
              >
                <Text className="text-accent font-bold text-[11px]">{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {filter === 'custom' && (
        <View className="mt-3 p-3 bg-surface rounded-2xl border border-hairline">
          <Text className="text-xs font-bold text-ink mb-1.5">Pilih Tanggal Transaksi:</Text>
          <DateField value={customDate} onChange={setCustomDate} placeholder="Pilih Tanggal" />
          <View className="flex-row flex-wrap gap-2 mt-3">
            {presetChips.slice(0, 2).map((p) => (
              <TouchableOpacity
                key={p.key}
                className="px-2.5 py-1.5 rounded-xl bg-accent-soft"
                onPress={() => applyPreset(p.key)}
                activeOpacity={0.8}
              >
                <Text className="text-accent font-bold text-[11px]">{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}