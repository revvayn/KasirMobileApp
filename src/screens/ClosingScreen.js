import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from '@react-navigation/native';
import { getTransactions, filterTransactionsByPeriod, getTransactionProfit } from '../services/transactionService';
import { formatRupiah } from '../utils/currency';
import colors from '../theme/colors';

const buildClosingHtml = (data) => {
  const kategoriRows = (data.categoryBreakdown || [])
    .map(
      (k) => `
        <div class="row-flex">
          <span>${k.category || 'Tanpa Kategori'} (${k.qty} pcs)</span>
          <span>Rp ${k.revenue.toLocaleString('id-ID')}</span>
        </div>`
    )
    .join('\n');

  return `
    <html><head><meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body { font-family: 'Courier New', Courier, monospace; width: 320px; margin: 0 auto; padding: 12px; }
      .text-center { text-align: center; }
      .divider { border-top: 1px dashed #000; margin: 8px 0; }
      .row-flex { display: flex; justify-content: space-between; font-size: 12px; margin: 2px 0; }
      .bold { font-weight: bold; }
    </style></head>
    <body>
      <div class="text-center">
        <h2 style="margin: 0;">REKAP SHIFT / HARIAN</h2>
        <p style="font-size: 11px; margin: 2px 0;">${data.dateLabel}</p>
      </div>
      <div class="divider"></div>
      <div class="row-flex"><span class="bold">Total Transaksi</span><span class="bold">${data.transactions}</span></div>
      <div class="row-flex"><span class="bold">Total Penjualan</span><span class="bold">Rp ${data.revenue.toLocaleString('id-ID')}</span></div>
      <div class="row-flex"><span>Item Terjual</span><span>${data.itemsSold} pcs</span></div>
      <div class="divider"></div>
      <div class="row-flex"><span>Metode Tunai</span><span>Rp ${data.cash.toLocaleString('id-ID')}</span></div>
      <div class="row-flex"><span>Metode QRIS</span><span>Rp ${data.qris.toLocaleString('id-ID')}</span></div>
      <div class="row-flex"><span>Total Diskon</span><span>-Rp ${data.discount.toLocaleString('id-ID')}</span></div>
      <div class="row-flex"><span>Harga Modal</span><span>Rp ${data.cost.toLocaleString('id-ID')}</span></div>
      <div class="row-flex" style="font-size: 13px; margin-top: 4px;"><span class="bold">Laba Kotor</span><span class="bold">Rp ${data.profit.toLocaleString('id-ID')}</span></div>
      <div class="row-flex"><span>Margin</span><span>${data.margin.toFixed(1)}%</span></div>
      <div class="divider"></div>
      <div class="bold" style="font-size: 12px; margin-bottom: 4px;">Per Kategori</div>
      ${kategoriRows || '<div class="row-flex"><span>Tidak ada penjualan.</span></div>'}
      <div class="divider"></div>
      <div class="text-center" style="margin-top: 10px; font-size: 11px;">
        <p style="margin: 0;">Terima Kasih</p>
        <p style="margin: 2px 0;">— Tutup Shift —</p>
      </div>
    </body></html>`;
};

export default function ClosingScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const load = async () => {
    setLoading(true);
    const all = await getTransactions();
    const today = filterTransactionsByPeriod(all, 'today');
    compute(today);
    setLoading(false);
  };

  const compute = (transactions) => {
    let revenue = 0,
      cost = 0,
      profit = 0,
      itemsSold = 0,
      cash = 0,
      qris = 0,
      discount = 0;
    const catMap = {};

    transactions.forEach((t) => {
      revenue += Number(t.totalAmount) || 0;
      discount += Number(t.discountAmount || 0) || 0;
      if (t.paymentMethod === 'QRIS') qris += Number(t.totalAmount) || 0;
      else cash += Number(t.totalAmount) || 0;

      const p = getTransactionProfit(t);
      cost += p.cost;
      profit += p.profit;

      (Array.isArray(t.items) ? t.items.flat() : []).forEach((it) => {
        const qty = Number(it.qty || it.quantity) || 0;
        itemsSold += qty;
        const cat = it.category || 'Tanpa Kategori';
        if (!catMap[cat]) catMap[cat] = { qty: 0, revenue: 0 };
        catMap[cat].qty += qty;
        catMap[cat].revenue += Number(it.subtotal || (it.price * qty)) || 0;
      });
    });

    const categoryBreakdown = Object.keys(catMap)
      .map((cat) => ({ category: cat, ...catMap[cat] }))
      .sort((a, b) => b.revenue - a.revenue);

    setData({
      dateLabel: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
      transactions: transactions.length,
      revenue,
      cost,
      profit,
      margin: revenue > 0 ? (profit / revenue) * 100 : 0,
      itemsSold,
      cash,
      qris,
      discount,
      categoryBreakdown,
    });
  };

  const handleShare = async () => {
    if (!data) return;
    setBusy(true);
    try {
      const html = buildClosingHtml(data);
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        const pdf = await Print.printToFileAsync({ html });
        if (pdf && pdf.uri && (await Sharing.isAvailableAsync())) {
          await Sharing.shareAsync(pdf.uri, { mimeType: 'application/pdf', dialogTitle: 'Bagikan Rekap Shift' });
        }
      }
    } catch (error) {
      console.error('Gagal share rekap:', error);
    } finally {
      setBusy(false);
    }
  };

  if (loading || !data) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const summaryItem = (label, value, icon, tint, soft) => (
    <View className="flex-1 p-3.5 rounded-[18px] bg-surface border border-hairline">
      <View className="flex-row items-center mb-2">
        <View className="w-8 h-8 rounded-lg items-center justify-center mr-2" style={{ backgroundColor: soft }}>
          <MaterialIcons name={icon} size={16} color={tint} />
        </View>
        <Text className="text-[11px] font-bold text-ink-muted">{label}</Text>
      </View>
      <Text className="text-[15px] font-extrabold text-ink" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <View className="bg-primary rounded-[26px] p-5 mb-4 shadow-lg overflow-hidden">
        <View className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5" />
        <Text className="text-white/80 text-[13px] font-semibold">Rekap Shift</Text>
        <Text className="text-white font-bold text-base mt-0.5">{data.dateLabel}</Text>
        <Text className="text-white text-[30px] font-extrabold -tracking-tight mt-2">
          {formatRupiah(data.revenue)}
        </Text>
        <Text className="text-white/60 text-xs font-medium mt-1">
          {data.transactions} transaksi · {data.itemsSold} item terjual
        </Text>
      </View>

      <View className="flex-row flex-wrap justify-between gap-3 mb-4">
        <View className="w-[48%]">
          {summaryItem('Laba Kotor', formatRupiah(data.profit), 'trending-up', colors.success, colors['success-soft'])}
        </View>
        <View className="w-[48%]">
          {summaryItem('Margin', `${data.margin.toFixed(1)}%`, 'percent', colors.accent, colors['accent-soft'])}
        </View>
        <View className="w-[48%]">
          {summaryItem('Tunai', formatRupiah(data.cash), 'payments', '#4A6CF7', '#E7EBFD')}
        </View>
        <View className="w-[48%]">
          {summaryItem('QRIS', formatRupiah(data.qris), 'qr-code', colors.accent, colors['accent-soft'])}
        </View>
        <View className="w-[48%]">
          {summaryItem('Total Diskon', `-${formatRupiah(data.discount)}`, 'local-offer', colors.danger, colors['danger-soft'])}
        </View>
        <View className="w-[48%]">
          {summaryItem('Harga Modal', formatRupiah(data.cost), 'storefront', '#C05621', '#FDEACF')}
        </View>
      </View>

      <View className="bg-surface p-4 rounded-[22px] mb-4 border border-hairline">
        <View className="flex-row items-center mb-3">
          <View className="w-8 h-8 rounded-xl bg-accent-soft items-center justify-center mr-2.5">
            <MaterialIcons name="category" size={18} color={colors.accent} />
          </View>
          <Text className="text-[16px] font-bold text-ink">Penjualan per Kategori</Text>
        </View>
        {data.categoryBreakdown.length === 0 ? (
          <Text className="text-xs font-medium text-ink-muted italic">Belum ada penjualan hari ini.</Text>
        ) : (
          data.categoryBreakdown.map((k, i) => (
            <View key={k.category} className={`flex-row items-center justify-between py-2 ${i !== data.categoryBreakdown.length - 1 ? 'border-b border-hairline' : ''}`}>
              <View className="flex-1 flex-row items-center">
                <View className="w-7 h-7 rounded-lg bg-bg items-center justify-center mr-2.5">
                  <Text className="text-[11px] font-extrabold text-ink-muted">{i + 1}</Text>
                </View>
                <Text className="text-sm font-semibold text-ink flex-1" numberOfLines={1}>
                  {k.category}
                </Text>
              </View>
              <Text className="text-xs font-bold text-ink-muted mr-3">{k.qty} pcs</Text>
              <Text className="font-extrabold text-ink text-[13px]">{formatRupiah(k.revenue)}</Text>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity
        className="bg-primary rounded-2xl py-4 items-center flex-row justify-center mb-8"
        onPress={handleShare}
        disabled={busy}
        activeOpacity={0.9}
      >
        {busy ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <MaterialIcons name="print" size={18} color="#fff" />
            <Text className="text-white font-bold text-[15px] ml-2">Cetak / Bagikan Rekap</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}