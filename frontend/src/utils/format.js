export const formatPrice = (price) =>
  new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
  }).format(price ?? 0);

// Pricing rules — mirrored by backend/utils/pricing.js so the price shown here
// is always the price checkout charges. A discount only counts when it is a
// positive number below the regular price; null / 0 / '' / NaN / >= price all
// mean "no discount" (0 must never display as a free product).
export const isValidDiscount = (discountPrice, price) =>
  typeof discountPrice === 'number' &&
  Number.isFinite(discountPrice) &&
  discountPrice > 0 &&
  Number.isFinite(price) &&
  discountPrice < price;

export const getEffectivePrice = (product) => {
  if (!product) return 0;
  const { price, discountPrice } = product;
  return isValidDiscount(discountPrice, price) ? discountPrice : price;
};

// A color variant carries its own price and optional discount. The admin sets
// the discount on the product, so a variant with no discount of its own
// inherits the product's discount when it is sold at the product's base price
// (an absolute discount amount does not transfer to a differently priced
// variant). Returns a { price, discountPrice } object for the display helpers.
export const resolveVariantPricing = (product, variant) => {
  if (!variant) return product;
  if (isValidDiscount(variant.discountPrice, variant.price)) return variant;
  const inherits =
    variant.price === product?.price && isValidDiscount(product?.discountPrice, product?.price);
  return { ...variant, discountPrice: inherits ? product.discountPrice : null };
};

// For a cart/order line, the selected color's variant price is authoritative
// when the product has that variant; otherwise the product's own price
// applies unchanged — this is what keeps every non-variant product's pricing
// exactly as it was before variants existed.
export const getLinePrice = (product, color) => {
  const variant = color ? product?.variants?.find((v) => v.color === color) : null;
  return getEffectivePrice(variant ? resolveVariantPricing(product, variant) : product);
};

export const getDiscountPercent = (product) => {
  if (!product || !isValidDiscount(product.discountPrice, product.price)) return 0;
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
