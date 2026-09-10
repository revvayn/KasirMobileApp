import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import colors from '../theme/colors';

const pad = (n) => String(n).padStart(2, '0');

// Konversi Date <-> string YYYY-MM-DD (lokal, hindari beda zona/UTC ISO).
export const dateToStr = (dt) =>
  `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;

export const strToDate = (s) => {
  if (!s) return new Date();
  const [y, m, d] = String(s).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

// Field tanggal lintas platform:
// - Web: <input type="date"> (picker native browser).
// - Native: tombol yang tampilkan tanggal terformat; menekannya membuka
//   kalender/date dialog bawaan OS (TIDAK perlu mengetik manual).
export default function DateField({ value, onChange, placeholder = 'Pilih Tanggal' }) {
  const [show, setShow] = useState(false);
  const currentDate = strToDate(value);
  const display = value
    ? currentDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  if (Platform.OS === 'web') {
    return (
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '11px',
          borderRadius: '12px',
          border: `1px solid ${colors.hairline}`,
          fontSize: '14px',
          color: colors.ink,
          backgroundColor: colors.bg,
        }}
      />
    );
  }

  const onPick = (event, selected) => {
    setShow(false);
    if (event.type === 'set' && selected) onChange(dateToStr(selected));
  };

  return (
    <View>
      <TouchableOpacity
        className="flex-row items-center justify-between border border-hairline rounded-2xl px-4 py-3.5 bg-bg"
        onPress={() => setShow(true)}
        activeOpacity={0.8}
      >
        <Text className={value ? 'text-ink font-bold text-sm' : 'text-ink-muted text-sm'}>
          {value ? display : placeholder}
        </Text>
        <MaterialIcons name="calendar-today" size={18} color={colors.accent} />
      </TouchableOpacity>

      {show && (
        <View className="mt-2 bg-surface rounded-2xl border border-hairline p-2">
          <DateTimePicker
            value={currentDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onPick}
            style={Platform.OS === 'ios' ? { alignSelf: 'center' } : null}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              className="bg-primary rounded-xl py-2 px-5 self-end mt-2"
              onPress={() => setShow(false)}
              activeOpacity={0.85}
            >
              <Text className="text-white font-bold text-[13px]">Selesai</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}