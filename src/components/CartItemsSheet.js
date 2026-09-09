import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { getItemOptionsLabel } from '../utils/cartLabel';

const DISCOUNT_OPTIONS = [0, 5, 10, 15, 20, 25, 50];

// Bottom sheet daftar kombinasi item keranjang dari SATU produk (varian/note
// berbeda bisa lebih dari satu). Setiap baris punya stepper qty + pilih diskon.
export default function CartItemsSheet({
  visible,
  productName,
  items,
  onClose,
  onIncrease,
  onDecrease,
  onRemove,
  onSetDiscount,
}) {
  const list = items || [];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-surface rounded-t-[28px] max-h-[85%]">
          <View className="w-10 h-1.5 rounded-full bg-hairline self-center mt-3 mb-2" />
          <View className="flex-row items-center justify-between px-5 pb-3">
            <View className="flex-1 pr-3">
              <Text className="text-[16px] font-extrabold text-ink" numberOfLines={1}>
                {productName || 'Keranjang Produk'}
              </Text>
              <Text className="text-[12px] font-medium text-ink-muted mt-0.5">
                {list.length} kombinasi — ubah jumlah atau diskon
              </Text>
            </View>
            <TouchableOpacity
              className="w-9 h-9 rounded-xl bg-bg items-center justify-center"
              onPress={onClose}
              activeOpacity={0.8}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <MaterialIcons name="close" size={20} color={colors['ink-muted']} />
            </TouchableOpacity>
          </View>

          <ScrollView className="px-5" showsVerticalScrollIndicator={false}>
            {list.map((item) => {
              const label = getItemOptionsLabel(item) || 'Item';
              const discountPercent = Number(item.discountPercent || 0);
              return (
                <View
                  key={item.cartId}
                  className="mb-3 rounded-2xl border border-hairline overflow-hidden"
                >
                  <View className="bg-bg px-3.5 py-2.5">
                    <Text className="text-[12px] font-bold text-ink" numberOfLines={2}>
                      {label}
                    </Text>
                    <Text className="text-[11px] font-medium text-ink-muted mt-0.5">
                      @ {Number(item.unitPrice).toLocaleString('id-ID')}
                      {discountPercent > 0 ? ` · diskon ${discountPercent}%` : ''}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between px-3.5 py-2.5">
                    <View className="flex-row items-center bg-bg rounded-xl px-1.5 py-1">
                      <TouchableOpacity
                        className="w-7 h-7 rounded-lg bg-danger items-center justify-center"
                        onPress={() => onDecrease(item.cartId)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <MaterialIcons name="remove" size={16} color="#fff" />
                      </TouchableOpacity>
                      <Text className="font-extrabold text-ink text-sm mx-2.5 min-w-[18px] text-center">
                        {item.qty}
                      </Text>
                      <TouchableOpacity
                        className="w-7 h-7 rounded-lg bg-primary items-center justify-center"
                        onPress={() => onIncrease(item.cartId)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <MaterialIcons name="add" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                    <Text className="font-extrabold text-ink text-[13px]">
                      Rp {Number(item.subtotal || 0).toLocaleString('id-ID')}
                    </Text>
                    <TouchableOpacity
                      className="w-8 h-8 rounded-xl bg-danger-soft items-center justify-center"
                      onPress={() => onRemove(item.cartId)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <MaterialIcons name="delete-outline" size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row flex-wrap items-center px-3.5 pb-3">
                    <Text className="text-[10px] font-bold text-ink-muted mr-2">Diskon</Text>
                    {DISCOUNT_OPTIONS.map((pct) => {
                      const selected = discountPercent === pct;
                      return (
                        <TouchableOpacity
                          key={pct}
                          className={`px-2.5 py-1 rounded-lg border mr-1.5 mb-1 ${
                            selected
                              ? 'bg-primary border-primary'
                              : 'bg-bg border-hairline'
                          }`}
                          onPress={() => onSetDiscount(item.cartId, pct)}
                          activeOpacity={0.8}
                        >
                          <Text className={`text-[11px] font-bold ${selected ? 'text-white' : 'text-ink-muted'}`}>
                            {pct}%
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View className="px-5 pt-3 pb-7 border-t border-hairline">
            <TouchableOpacity className="bg-primary rounded-2xl py-3.5 items-center" onPress={onClose} activeOpacity={0.9}>
              <Text className="text-white font-bold text-[15px]">Selesai</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}