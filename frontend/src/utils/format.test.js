import { describe, expect, it } from 'vitest';
import {
  getDiscountPercent,
  getEffectivePrice,
  getLinePrice,
  isValidDiscount,
  resolveVariantPricing,
} from './format';

describe('isValidDiscount', () => {
  it('accepts a positive number below the price', () => {
    expect(isValidDiscount(1550, 1650)).toBe(true);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['zero', 0],
    ['empty string', ''],
    ['numeric string', '1550'],
    ['NaN', NaN],
    ['negative', -5],
    ['equal to price', 1650],
    ['above price', 2000],
  ])('rejects %s', (_label, value) => {
    expect(isValidDiscount(value, 1650)).toBe(false);
  });
});

describe('getEffectivePrice / getDiscountPercent (non-variant products)', () => {
  it('uses the discounted price when a valid discount exists', () => {
    const p = { price: 1450, discountPrice: 1150 };
    expect(getEffectivePrice(p)).toBe(1150);
    expect(getDiscountPercent(p)).toBe(21);
  });

  it('uses the original price when the discount is null, missing, or zero', () => {
    for (const p of [{ price: 1450, discountPrice: null }, { price: 1450 }, { price: 1450, discountPrice: 0 }]) {
      expect(getEffectivePrice(p)).toBe(1450);
      expect(getDiscountPercent(p)).toBe(0);
    }
  });

  it('never shows a free product for a zero discount (the old code returned 0)', () => {
    expect(getEffectivePrice({ price: 1450, discountPrice: 0 })).toBe(1450);
  });

  it('ignores discounts that are not below the price', () => {
    expect(getEffectivePrice({ price: 1000, discountPrice: 1000 })).toBe(1000);
    expect(getEffectivePrice({ price: 1000, discountPrice: 1200 })).toBe(1000);
  });

  it('handles a missing product', () => {
    expect(getEffectivePrice(undefined)).toBe(0);
    expect(getDiscountPercent(undefined)).toBe(0);
  });
});

describe('resolveVariantPricing (root cause of the missing discount)', () => {
  // Exactly what production stored for "Soundcore R50i Earbuds".
  const product = {
    price: 1650,
    discountPrice: 1550,
    variants: [
      { color: 'Black', price: 1650, discountPrice: null, stock: 3 },
      { color: 'Blue', price: 1650, discountPrice: null, stock: 3 },
    ],
  };

  it('inherits the product discount for a variant sold at the product price', () => {
    const priced = resolveVariantPricing(product, product.variants[0]);
    expect(getEffectivePrice(priced)).toBe(1550);
    expect(getDiscountPercent(priced)).toBe(6);
  });

  it("prefers the variant's own valid discount", () => {
    const v = { color: 'Red', price: 1650, discountPrice: 1400 };
    expect(getEffectivePrice(resolveVariantPricing(product, v))).toBe(1400);
  });

  it('does not transfer the discount to a differently priced variant', () => {
    const v = { color: 'Gold', price: 1800, discountPrice: null };
    expect(getEffectivePrice(resolveVariantPricing(product, v))).toBe(1800);
  });

  it('gives no discount when neither variant nor product has one', () => {
    const plain = { price: 900, discountPrice: null };
    const v = { color: 'Black', price: 900, discountPrice: null };
    expect(getEffectivePrice(resolveVariantPricing(plain, v))).toBe(900);
  });

  it('treats an invalid variant discount (0, >= price) as none and falls back to inheritance', () => {
    for (const bad of [0, 1650, 9999]) {
      const v = { color: 'Black', price: 1650, discountPrice: bad };
      expect(getEffectivePrice(resolveVariantPricing(product, v))).toBe(1550);
    }
  });

  it('returns the product itself when there is no variant', () => {
    expect(resolveVariantPricing(product, undefined)).toBe(product);
  });
});

describe('getLinePrice (cart / checkout)', () => {
  const product = {
    price: 1650,
    discountPrice: 1550,
    variants: [
      { color: 'Black', price: 1650, discountPrice: null, stock: 3 },
      { color: 'Blue', price: 1700, discountPrice: 1600, stock: 3 },
      { color: 'Gold', price: 1800, discountPrice: null, stock: 3 },
    ],
  };

  it('charges the discounted price for a variant that inherits the product discount', () => {
    expect(getLinePrice(product, 'Black')).toBe(1550);
  });

  it("charges a variant's own discount", () => {
    expect(getLinePrice(product, 'Blue')).toBe(1600);
  });

  it('charges the full variant price when no discount applies', () => {
    expect(getLinePrice(product, 'Gold')).toBe(1800);
  });

  it('falls back to product pricing for products without variants / unknown color', () => {
    expect(getLinePrice({ price: 1450, discountPrice: 1150 }, undefined)).toBe(1150);
    expect(getLinePrice({ price: 1450, discountPrice: 1150, variants: [] }, 'Black')).toBe(1150);
  });
});
