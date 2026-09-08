import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Platform } from 'react-native';

export default function FilterBar({ filter, setFilter, customDate, setCustomDate }) {
  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {[
          { key: 'today', label: 'Hari Ini' },
          { key: 'month', label: 'Bulan Ini' },
          { key: 'year', label: 'Tahun Ini' },
          { key: 'all', label: 'Semua' },
          { key: 'custom', label: '📅 Pilih Tanggal' },
        ].map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
            onPress={() => setFilter(item.key)}
          >
            <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Input Tanggal Kalender jika filter 'custom' dipilih */}
      {filter === 'custom' && (
        <View style={styles.calendarContainer}>
          <Text style={styles.dateLabel}>Pilih Tanggal Transaksi:</Text>
          {Platform.OS === 'web' ? (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              style={{
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                fontSize: '14px',
                marginTop: '4px'
              }}
            />
          ) : (
            <TextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD (contoh: 2026-09-08)"
              value={customDate}
              onChangeText={setCustomDate}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#e0e0e0' },
  filterChipActive: { backgroundColor: '#007AFF' },
  filterText: { fontSize: 12, color: '#555', fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  calendarContainer: { marginTop: 10, padding: 10, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  dateLabel: { fontSize: 12, fontWeight: 'bold', color: '#444' },
  dateInput: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6, marginTop: 4 }
});