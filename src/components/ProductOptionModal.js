import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { formatRupiah } from '../utils/currency';
import { calcUnitPrice } from '../store/useCartStore';
import { getItemOptionsLabel } from '../utils/cartLabel';

// Modal pemilihan opsi produk dalam mode BATCH:
// kasir bisa menambah beberapa baris pesanan dengan varian/opsi/catatan
// berbeda SEKALIGUS tanpa keluar modal (cth. 2 nasi goreng pedas + 1 normal).
// Tiap pilihan di-Tambah → masuk daftar; tombol Konfirmasi meng-commit semua.
// Diskon memakai `product.discountPercent` (di-set admin), bukan pilihan kasir.
export default function ProductOptionModal({
  visible,
  product,
  onClose,
  onConfirm,
  existingCartQty = 0,
}) {
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [selectedModifiers, setSelectedModifiers] = useState({});
  const [customNote, setCustomNote] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [batch, setBatch] = useState([]);

  const variants = useMemo(() => product?.variants || [], [product]);
  const modifiers = useMemo(() => product?.modifiers || [], [product]);
  const stockLimit = Number(product?.stock || 0);
  const productDiscount = Math.min(Math.max(Number(product?.discountPercent) || 0, 0), 100);

  // Reset pilihan & daftar setiap kali modal dibuka ulang
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
      setBatch([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, product]);

  if (!product) return null;

  const basePrice = Number(product.price) || 0;
  const selectedVariant =
    variants.find((v) => v.id === selectedVariantId) || (variants.length === 0 ? null : variants[0]);
  const extraPrice = Number(selectedVariant?.extraPrice) || 0;
  const unitPrice = calcUnitPrice(basePrice, extraPrice, productDiscount);

  const selectedModifiersList = modifiers
    .filter((m) => selectedModifiers[m.id])
    .map((m) => ({ id: m.id, name: m.name, option: selectedModifiers[m.id] }));

  const comboKey = (variant, mods, note) =>
    `${variant?.id || 'v'}|${(mods || [])
      .map((m) => `${m.id}:${m.option}`)
      .join(',')}|${(note || '').trim()}`;

  const batchTotalQty = batch.reduce((s, l) => s + l.quantity, 0);
  const batchTotal = batch.reduce((s, l) => s + l.quantity * (Number(l.unitPrice) || 0), 0);
  // Sisa stok untuk produk ini: stok produk - yang sudah di keranjang - yang di daftar modal
  const remainingStock = Math.max(0, stockLimit - existingCartQty - batchTotalQty);
  const stockExceeded = stockLimit > 0 && batchTotalQty + existingCartQty > stockLimit;
  const canAdd = quantity > 0 && remainingStock >= quantity;

  // Tambahkan pilihan saat ini (varian/modi/catatan × quantity) ke daftar.
  // Kombinasi identik digabung (qty dijumlah) — konsisten dengan cartId store.
  const handleAddToBatch = () => {
    if (quantity <= 0) return;
    const key = comboKey(selectedVariant, selectedModifiersList, customNote);
    setBatch((prev) => {
      const idx = prev.findIndex((l) => l.key === key);
      if (idx >= 0) {
        return prev.map((l, i) =>
          i === idx ? { ...l, quantity: l.quantity + quantity } : l
        );
      }
      return [
        ...prev,
        {
          key,
          variant: selectedVariant,
          modifiers: selectedModifiersList,
          customNote,
          quantity,
          unitPrice,
        },
      ];
    });
    setQuantity(1);
  };

  const handleRemoveFromBatch = (key) =>
    setBatch((prev) => prev.filter((l) => l.key !== key));

  // Commit semua baris ke keranjang. Jika ada yang gagal (stok limit),
  // berhenti & jangan tutup modal (HomeScreen sudah menampilkan alert).
  const handleCommit = () => {
    if (batch.length === 0) return;
    for (const line of batch) {
      const result = onConfirm(line);
      if (!result || !result.ok) return;
    }
    onClose();
  };

  const chipBase = 'px-4 py-2.5 rounded-2xl border flex-row items-center mr-2 mb-2';
  const chipSelected = 'bg-primary border-primary';
  const chipIdle = 'bg-surface border-hairline';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-surface rounded-t-[28px] max-h-[92%]">
          <View className="w-10 h-1.5 rounded-full bg-hairline self-center mt-3 mb-2" />

          {/* Header Produk */}
          <View className="flex-row items-center justify-between px-5 pb-3">
            <View className="flex-1 pr-3">
              <Text className="text-[17px] font-extrabold text-ink -tracking-tight" numberOfLines={2}>
                {product.name || product.nama || 'Produk'}
              </Text>
              <Text className="text-[13px] font-semibold text-accent mt-0.5">
                {formatRupiah(unitPrice)}
                {(extraPrice > 0 || productDiscount > 0) && (
                  <Text className="text-[11px] font-medium text-ink-muted">
                    {extraPrice > 0 ? ` (${formatRupiah(basePrice)} + ${formatRupiah(extraPrice)})` : ''}
                    {productDiscount > 0 ? ` diskon ${productDiscount}%` : ''}
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
            <View className="flex-row items-center justify-between mb-3">
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
                    if (quantity + 1 <= remainingStock || stockLimit === 0) {
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

            {/* Tombol tambah ke daftar */}
            <TouchableOpacity
              className={`rounded-2xl py-3 flex-row items-center justify-center mb-4 ${
                canAdd ? 'bg-accent' : 'bg-hairline'
              }`}
              onPress={handleAddToBatch}
              disabled={!canAdd}
              activeOpacity={0.85}
            >
              <MaterialIcons name="playlist-add" size={18} color={canAdd ? '#fff' : colors['ink-muted']} />
              <Text className={`font-bold text-[13px] ml-2 ${canAdd ? 'text-white' : 'text-ink-muted'}`}>
                Tambah ke Daftar — {quantity} × {formatRupiah(unitPrice)}
              </Text>
            </TouchableOpacity>

            {/* Daftar pesanan (batch) */}
            <View className="mb-2">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-bold text-ink-muted">
                  Daftar Pesanan ({batchTotalQty} item)
                </Text>
                {stockLimit > 0 && (
                  <Text className={`text-[10px] font-bold ${remainingStock > 0 ? 'text-success' : 'text-danger'}`}>
                    Sisa stok: {remainingStock}
                  </Text>
                )}
              </View>
              {batch.length === 0 ? (
                <View className="bg-bg rounded-2xl px-4 py-3 border border-hairline">
                  <Text className="text-[11px] font-medium text-ink-muted">
                    Pilih varian/opsi lalu tekan "Tambah ke Daftar". Bisa pilih kombinasi berbeda tanpa keluar.
                  </Text>
                </View>
              ) : (
                batch.map((line) => (
                  <View
                    key={line.key}
                    className="bg-bg rounded-2xl px-3.5 py-2.5 mb-2 border border-hairline flex-row items-center"
                  >
                    <View className="flex-1 pr-2">
                      <Text className="text-[12px] font-bold text-ink" numberOfLines={1}>
                        {getItemOptionsLabel(line)}
                      </Text>
                      <Text className="text-[11px] font-medium text-ink-muted mt-0.5">
                        {line.quantity} × {formatRupiah(line.unitPrice)}
                      </Text>
                    </View>
                    <Text className="font-extrabold text-[13px] text-accent mr-2">
                      {formatRupiah(line.quantity * (Number(line.unitPrice) || 0))}
                    </Text>
                    <TouchableOpacity
                      className="w-8 h-8 rounded-xl bg-danger-soft items-center justify-center"
                      onPress={() => handleRemoveFromBatch(line.key)}
                      activeOpacity={0.8}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <MaterialIcons name="close" size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          {/* Footer: total + tombol */}
          <View className="px-5 pt-3 pb-7 border-t border-hairline">
            {batch.length > 0 ? (
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs font-bold text-ink-muted">
                  Total {batchTotalQty} item
                </Text>
                <Text className="text-[20px] font-extrabold text-accent -tracking-tight">
                  {formatRupiah(batchTotal)}
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs font-bold text-ink-muted">Pilihan saat ini · {quantity} item</Text>
                <Text className="text-[20px] font-extrabold text-accent -tracking-tight">
                  {formatRupiah(unitPrice * quantity)}
                </Text>
              </View>
            )}

            <TouchableOpacity
              className={`rounded-2xl py-4 flex-row items-center justify-center ${
                batch.length > 0 && !stockExceeded ? 'bg-primary' : 'bg-hairline'
              }`}
              onPress={handleCommit}
              disabled={batch.length === 0 || stockExceeded}
              activeOpacity={0.9}
            >
              <MaterialIcons name="add-shopping-cart" size={18} color={batch.length > 0 && !stockExceeded ? '#fff' : colors['ink-muted']} />
              <Text className={`font-bold text-[15px] ml-2 ${batch.length > 0 && !stockExceeded ? 'text-white' : 'text-ink-muted'}`}>
                {batch.length > 0
                  ? `Masukkan ${batchTotalQty} Item ke Keranjang`
                  : 'Pilih dulu, tekan Tambah ke Daftar'}
              </Text>
            </TouchableOpacity>
            {stockExceeded && (
              <Text className="text-[11px] font-bold text-danger text-center mt-2">
                Jumlah melebihi stok tersedia ({stockLimit - existingCartQty} tersisa).
              </Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}