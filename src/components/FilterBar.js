import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Platform } from 'react-native';
import colors from '../theme/colors';

const dateInputWeb = (value, onChange) => ({
  type: 'date',
  value,
  onChange: (e) => onChange(e.target.value),
  style: {
    padding: '10px',
    borderRadius: '10px',
    border: `1px solid ${colors.hairline}`,
    fontSize: '14px',
    marginTop: '6px',
    color: colors.ink,
    backgroundColor: colors.bg,
    width: '100%',
  },
});

const dateInputNative = (value, onChange, placeholder) => (
  <TextInput
    className="flex-1 border border-hairline p-2.5 rounded-lg mt-1.5 text-ink"
    placeholder={placeholder}
    placeholderTextColor={colors['ink-muted']}
    value={value}
    onChangeText={onChange}
  />
);

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
              {Platform.OS === 'web' ? (
                <input {...dateInputWeb(rangeStart, setRangeStart)} />
              ) : (
                dateInputNative(rangeStart, setRangeStart, 'YYYY-MM-DD')
              )}
            </View>
            <View style={Platform.OS === 'web' ? {} : { flex: 1 }}>
              {Platform.OS === 'web' ? (
                <input {...dateInputWeb(rangeEnd, setRangeEnd)} />
              ) : (
                dateInputNative(rangeEnd, setRangeEnd, 'YYYY-MM-DD')
              )}
            </View>
          </View>
        </View>
      )}

      {filter === 'custom' && (
        <View className="mt-3 p-3 bg-surface rounded-2xl border border-hairline">
          <Text className="text-xs font-bold text-ink">Pilih Tanggal Transaksi:</Text>
          {Platform.OS === 'web' ? (
            <input {...dateInputWeb(customDate, setCustomDate)} />
          ) : (
            dateInputNative(customDate, setCustomDate, 'YYYY-MM-DD (contoh: 2026-09-08)')
          )}
        </View>
      )}
    </View>
  );
}