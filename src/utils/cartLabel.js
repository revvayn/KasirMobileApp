// Utilitas label opsi item keranjang (varian, modifier, catatan)
// — dipakai di HomeScreen, PaymentScreen, dan struk/TransactionDetail.
import { formatRupiah } from './currency';

// Label varian, mis. "Dingin (+Rp 2.000)" atau "Panas".
export const getVariantLabel = (variant) => {
  if (!variant || !variant.name) return '';
  const extra = Number(variant.extraPrice) || 0;
  return extra > 0 ? `${variant.name} (+${formatRupiah(extra)})` : variant.name;
};

// Gabungkan pilihan modifier, mis. "Normal • Pedas Banget".
export const getModifiersLabel = (modifiers) =>
  (modifiers || [])
    .map((m) => m.option || m.options || '')
    .filter(Boolean)
    .join(' • ');

// Label lengkap untuk satu item keranjang/transaksi.
export const getItemOptionsLabel = (item) => {
  const parts = [];
  if (item?.variant && item.variant.name) {
    parts.push(getVariantLabel(item.variant));
  }
  const modsLabel = getModifiersLabel(item?.modifiers);
  if (modsLabel) parts.push(modsLabel);
  if (item?.customNote) parts.push(`"${item.customNote}"`);
  return parts.join(' • ');
};