import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { formatRupiah } from '../utils/currency';

// Modal pemilihan opsi produk: pilih 1 varian, checklist modifier,
// catatan manual, dan jumlah. Menghitung harga real-time:
// (harga dasar + extraPrice varian) * quantity.
export default function ProductOptionModal({ visible, product, onClose, onConfirm }) {
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [selectedModifiers, setSelectedModifiers] = useState({});
  const [customNote, setCustomNote] = useState('');
  const [quantity, setQuantity] = useState(1);

  const variants = useMemo(() => product?.variants || [], [product]);
  const modifiers = useMemo(() => product?.modifiers || [], [product]);
  const stockLimit = Number(product?.stock || 0);

  // Reset pilihan setiap kali modal dibuka ulang
  useEffect(() => {
    if (visible) {
      setSelectedVariantId(variants.length > 0 ? variants[0].id : '');
      const defaultMods = {};
      modifiers.forEach((m) => {
        if (m.options && m.options.length > 0) defaultMods[m.id] = m.options[0];
      });
      setSelectedModifiers(defaultMods);
      setCustomNote('');
      setQuantity(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, product]);

  useEffect(() => {
    if (quantity > stockLimit && stockLimit > 0) setQuantity(stockLimit);
  }, [stockLimit, quantity]);

  if (!product) return null;

  const basePrice = Number(product.price) || 0;
  const selectedVariant =
    variants.find((v) => v.id === selectedVariantId) || (variants.length === 0 ? null : variants[0]);
  const extraPrice = Number(selectedVariant?.extraPrice) || 0;
  const unitPrice = basePrice + extraPrice;
  const totalPrice = unitPrice * quantity;

  const selectedModifiersList = modifiers
    .filter((m) => selectedModifiers[m.id])
    .map((m) => ({ id: m.id, name: m.name, option: selectedModifiers[m.id] }));

  const handleConfirm = () => {
    onConfirm({
      variant: selectedVariant || null,
      modifiers: selectedModifiersList,
      customNote,
      quantity,
    });
  };

  const chipBase = 'px-4 py-2.5 rounded-2xl border flex-row items-center mr-2 mb-2';
  const chipSelected = 'bg-primary border-primary';
  const chipIdle = 'bg-surface border-hairline';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-surface rounded-t-[28px] max-h-[90%]">
          <View className="w-10 h-1.5 rounded-full bg-hairline self-center mt-3 mb-2" />

          {/* Header Produk */}
          <View className="flex-row items-center justify-between px-5 pb-3">
            <View className="flex-1 pr-3">
              <Text className="text-[17px] font-extrabold text-ink -tracking-tight" numberOfLines={2}>
                {product.name || product.nama || 'Produk'}
              </Text>
              <Text className="text-[13px] font-semibold text-accent mt-0.5">
                {formatRupiah(unitPrice)}
                {extraPrice > 0 && (
                  <Text className="text-[11px] font-medium text-ink-muted">
                    {' '}({formatRupiah(basePrice)} + {formatRupiah(extraPrice)})
                  </Text>
                )}
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
            {/* Varian */}
            {variants.length > 0 && (
              <View className="mb-4">
                <Text className="text-xs font-bold text-ink-muted mb-2">Varian</Text>
                <View className="flex-row flex-wrap">
                  {variants.map((variant) => {
                    const isSelected = selectedVariantId === variant.id;
                    const extra = Number(variant.extraPrice) || 0;
                    return (
                      <TouchableOpacity
                        key={variant.id}
                        className={`${chipBase} ${isSelected ? chipSelected : chipIdle}`}
                        onPress={() => setSelectedVariantId(variant.id)}
                        activeOpacity={0.8}
                      >
                        <View
                          className={`w-4 h-4 rounded-full border-[1.5px] items-center justify-center mr-2 ${
                            isSelected ? 'border-white' : 'border-hairline'
                          }`}
                        >
                          {isSelected && <View className="w-2 h-2 rounded-full bg-accent" />}
                        </View>
                        <Text
                          className={`text-[13px] font-bold ${isSelected ? 'text-white' : 'text-ink'}`}
                        >
                          {variant.name}
                          {extra > 0 && (
                            <Text className={isSelected ? 'text-white/70' : 'text-ink-muted'}>
                              {'  '}+{formatRupiah(extra)}
                            </Text>
                          )}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Modifiers */}
            {modifiers.length > 0 && (
              <View className="mb-4">
                <Text className="text-xs font-bold text-ink-muted mb-2">
                  Opsi / Catatan Tambahan
                </Text>
                {modifiers.map((modifier) => {
                  const current = selectedModifiers[modifier.id];
                  return (
                    <View key={modifier.id} className="mb-3">
                      <Text className="text-[13px] font-semibold text-ink mb-1.5">
                        {modifier.name}
                      </Text>
                      <View className="flex-row flex-wrap">
                        {(modifier.options || []).map((option) => {
                          const isSelected = current === option;
                          return (
                            <TouchableOpacity
                              key={option}
                              className={`${chipBase} ${isSelected ? chipSelected : chipIdle}`}
                              onPress={() =>
                                setSelectedModifiers((prev) => ({ ...prev, [modifier.id]: option }))
                              }
                              activeOpacity={0.8}
                            >
                              <Text
                                className={`text-[13px] font-bold ${
                                  isSelected ? 'text-white' : 'text-ink'
                                }`}
                              >
                                {option}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Catatan */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-ink-muted mb-2">Catatan (opsional)</Text>
              <View className="flex-row items-start bg-bg rounded-2xl px-4 py-2.5 border border-hairline">
                <MaterialIcons name="edit-note" size={18} color={colors['ink-muted']} style={{ marginTop: 2 }} />
                <TextInput
                  className="flex-1 text-sm font-medium text-ink ml-2.5"
                  placeholder="cth. Tanpa gula, tambah es..."
                  placeholderTextColor={colors['ink-muted']}
                  value={customNote}
                  onChangeText={setCustomNote}
                  multiline
                  maxLength={80}
                />
              </View>
            </View>

            {/* Jumlah */}
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-xs font-bold text-ink-muted">Jumlah</Text>
              <View className="flex-row items-center bg-bg rounded-2xl px-2 py-1.5">
                <TouchableOpacity
                  className="w-8 h-8 rounded-xl bg-surface border border-hairline items-center justify-center"
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                  activeOpacity={0.8}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <MaterialIcons name="remove" size={18} color={colors.ink} />
                </TouchableOpacity>
                <Text className="font-extrabold text-ink text-[15px] mx-4 min-w-[20px] text-center">
                  {quantity}
                </Text>
                <TouchableOpacity
                  className="w-8 h-8 rounded-xl bg-primary items-center justify-center"
                  onPress={() => {
                    if (quantity + 1 <= stockLimit || stockLimit === 0) {
                      setQuantity((q) => q + 1);
                    }
                  }}
                  activeOpacity={0.8}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <MaterialIcons name="add" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer: total + tombol */}
          <View className="px-5 pt-3 pb-7 border-t border-hairline">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-bold text-ink-muted">
                Total ({quantity}) item
              </Text>
              <Text className="text-[20px] font-extrabold text-accent -tracking-tight">
                {formatRupiah(totalPrice)}
              </Text>
            </View>
            <TouchableOpacity
              className="bg-primary rounded-2xl py-4 flex-row items-center justify-center"
              onPress={handleConfirm}
              activeOpacity={0.9}
            >
              <MaterialIcons name="add-shopping-cart" size={18} color="#fff" />
              <Text className="text-white font-bold text-[15px] ml-2">
                Masukkan ke Keranjang
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}