// Single source of truth for which price a customer pays. The storefront
// (frontend/src/utils/format.js) mirrors these rules so what is displayed is
// always what checkout charges — keep the two in sync.

// A discount only counts when it is a real, positive number below the price.
// null / undefined / '' / 0 / NaN / negative / >= price all mean "no discount"
// (0 must never mean "free").
export const isValidDiscount = (discountPrice, price) =>
  typeof discountPrice === 'number' &&
  Number.isFinite(discountPrice) &&
  discountPrice > 0 &&
  Number.isFinite(price) &&
  discountPrice < price;

export const getEffectivePrice = (item) =>
  isValidDiscount(item?.discountPrice, item?.price) ? item.discountPrice : item?.price;

// A color variant carries its own price/discount. Admins set the discount on
// the product, so a variant without a discount of its own inherits the
// product's discount when it is sold at the same base price. A variant priced
// differently from the product never inherits (an absolute discount amount
// does not transfer between different prices).
export const resolveVariantPricing = (product, variant) => {
  if (!variant) return product;
  if (isValidDiscount(variant.discountPrice, variant.price)) return variant;
  const inherits =
    variant.price === product?.price && isValidDiscount(product?.discountPrice, product?.price);
  return {
    price: variant.price,
    discountPrice: inherits ? product.discountPrice : null,
  };
};

export const getVariantEffectivePrice = (product, variant) =>
  getEffectivePrice(resolveVariantPricing(product, variant));

// Parses an incoming discount value. Returns { value } (null = no discount) or
// { error } for input that is present but not a usable number.
export const parseDiscountInput = (raw, price) => {
  if (raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '')) {
    return { value: null };
  }
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    return { error: 'Discount price must be a valid, non-negative number.' };
  }
  if (n === 0) return { value: null };
  if (Number.isFinite(price) && n >= price) {
    return { error: 'Discount price must be lower than the regular price.' };
  }
  return { value: n };
};
