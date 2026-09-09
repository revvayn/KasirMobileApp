// Builder HTML struk termal (Courier New) — dipakai TransactionDetail
// dan reprint dari History. Membaca snapshot item: variant, modifiers,
// customNote, discountPercent, dan invoiceNumber transaksi.
import { getItemOptionsLabel } from './cartLabel';

// Total diskon dari semua item (selisih harga asli vs harga setelah diskon%).
export const getItemsDiscountAmount = (items) =>
  (Array.isArray(items) ? items.flat() : []).reduce((sum, item) => {
    const qty = Number(item.qty || item.quantity) || 1;
    const rawUnit =
      Number(item.price || 0) + Number(item.variant?.extraPrice || 0);
    const discountPercent = Number(item.discountPercent || 0);
    const discounted = Math.round(rawUnit * (1 - discountPercent / 100));
    return sum + (rawUnit - discounted) * qty;
  }, 0);

export const getInvoiceNumber = (transaction) =>
  transaction?.invoiceNumber || `#${String(transaction?.id || transaction?.firestoreDocId || '').substring(0, 8) || 'N/A'}`;

export const buildReceiptHtml = (transaction) => {
  const rawItems = Array.isArray(transaction?.items)
    ? transaction.items.flat()
    : [];
  const itemsDiscount = getItemsDiscountAmount(rawItems);
  const invoiceDiscount = Number(transaction?.discountAmount || 0);
  const totalDiscount = itemsDiscount + invoiceDiscount;
  const total = Number(transaction?.totalAmount || 0);

  const itemsHtml = rawItems
    .map(
      (item) => `
        <tr>
          <td style="padding: 4px 0; font-size: 12px;">
            ${item?.name || item?.nama || 'Produk'} x${item?.qty || item?.quantity || 1}
            ${(() => {
              const opts = getItemOptionsLabel(item);
              const disc = Number(item.discountPercent || 0);
              const parts = [];
              if (opts) parts.push(opts);
              if (disc > 0) parts.push(`Diskon ${disc}%`);
              return parts.length
                ? `<br/><span style="font-size: 10px;">${parts
                    .join(' • ')
                    .replace(/"/g, '&quot;')}</span>`
                : '';
            })()}
          </td>
          <td style="padding: 4px 0; font-size: 12px; text-align: right;">Rp ${Number(
            item?.subtotal || (item?.price * (item?.qty || 1)) || 0
          ).toLocaleString('id-ID')}</td>
        </tr>
      `
    )
    .join('');

  const discountRows =
    totalDiscount > 0
      ? `
        <div class="row-flex">
          <span>Diskon:</span>
          <span>-Rp ${totalDiscount.toLocaleString('id-ID')}</span>
        </div>
      `
      : '';

  return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 280px;
              margin: 0 auto;
              padding: 10px;
            }
            .text-center { text-align: center; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; }
            .row-flex { display: flex; justify-content: space-between; font-size: 12px; margin: 2px 0; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <h2 style="margin: 0;">STRUK PENJUALAN</h2>
            <p style="font-size: 10px; margin: 2px 0;">${getInvoiceNumber(transaction)}</p>
            <p style="font-size: 10px; margin: 2px 0;">${transaction?.formattedTime || new Date().toLocaleString('id-ID')}</p>
          </div>

          <div class="divider"></div>

          <table>
            ${itemsHtml}
          </table>

          <div class="divider"></div>

          <div class="row-flex">
            <span>Metode:</span>
            <span class="bold">${transaction?.paymentMethod || 'CASH'}</span>
          </div>
          ${discountRows}
          <div class="row-flex" style="font-size: 14px; margin-top: 4px;">
            <span class="bold">TOTAL:</span>
            <span class="bold">Rp ${total.toLocaleString('id-ID')}</span>
          </div>

          ${
            transaction?.paymentMethod === 'CASH'
              ? `
            <div class="row-flex">
              <span>Bayar:</span>
              <span>Rp ${Number(transaction?.cashReceived || total || 0).toLocaleString('id-ID')}</span>
            </div>
            <div class="row-flex">
              <span>Kembali:</span>
              <span>Rp ${Number(transaction?.change || 0).toLocaleString('id-ID')}</span>
            </div>
          `
              : ''
          }

          <div class="divider"></div>
          <div class="text-center" style="margin-top: 10px; font-size: 11px;">
            <p style="margin: 0;">Terima Kasih</p>
            <p style="margin: 2px 0;">Selamat Belanja Kembali!</p>
          </div>
        </body>
      </html>
    `;
};