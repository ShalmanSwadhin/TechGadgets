export const formatPrice = (price) =>
  new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
  }).format(price ?? 0);

export const getEffectivePrice = (product) => {
  if (!product) return 0;
  const { price, discountPrice } = product;
  return discountPrice != null && discountPrice < price ? discountPrice : price;
};

export const getDiscountPercent = (product) => {
  if (!product?.discountPrice || product.discountPrice >= product.price) return 0;
  return Math.round(((product.price - product.discountPrice) / product.price) * 100);
};

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

/**
 * Download an array of plain objects as a CSV file (opens in Excel too).
 */
export const exportToCsv = (filename, rows) => {
  if (!rows?.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    const s = val == null ? '' : String(val);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ].join('\n');

  const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
