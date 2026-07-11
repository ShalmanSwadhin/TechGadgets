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
