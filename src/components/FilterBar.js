import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Platform } from 'react-native';
import colors from '../theme/colors';

export default function FilterBar({ filter, setFilter, customDate, setCustomDate }) {
  return (
    <View className="mb-4">
      <View className="flex-row flex-wrap gap-2">
        {[
          { key: 'today', label: 'Hari Ini' },
          { key: 'month', label: 'Bulan Ini' },
          { key: 'year', label: 'Tahun Ini' },
          { key: 'all', label: 'Semua' },
          { key: 'custom', label: 'Pilih Tanggal' },
        ].map((item) => (
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

      {/* Input Tanggal Kalender jika filter 'custom' dipilih */}
      {filter === 'custom' && (
        <View className="mt-3 p-3 bg-surface rounded-2xl border border-hairline">
          <Text className="text-xs font-bold text-ink">Pilih Tanggal Transaksi:</Text>
          {Platform.OS === 'web' ? (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              style={{
                padding: '10px',
                borderRadius: '10px',
                border: `1px solid ${colors.hairline}`,
                fontSize: '14px',
                marginTop: '6px',
                color: colors.ink,
                backgroundColor: colors.bg,
              }}
            />
          ) : (
            <TextInput
              className="border border-hairline p-2.5 rounded-lg mt-1.5 text-ink"
              placeholder="YYYY-MM-DD (contoh: 2026-09-08)"
              placeholderTextColor={colors['ink-muted']}
              value={customDate}
              onChangeText={setCustomDate}
            />
          )}
        </View>
      )}
    </View>
  );
}
