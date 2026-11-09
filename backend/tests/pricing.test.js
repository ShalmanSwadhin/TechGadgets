import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getEffectivePrice,
  getVariantEffectivePrice,
  isValidDiscount,
  parseDiscountInput,
  resolveVariantPricing,
} from '../utils/pricing.js';

test('isValidDiscount: only a positive number below the price counts', () => {
  assert.equal(isValidDiscount(1550, 1650), true);
  for (const bad of [null, undefined, 0, '', '1550', NaN, -5, 1650, 2000]) {
    assert.equal(isValidDiscount(bad, 1650), false, `expected ${String(bad)} to be rejected`);
  }
});

test('getEffectivePrice: null / missing / zero discount falls back to the original price', () => {
  assert.equal(getEffectivePrice({ price: 1450, discountPrice: 1150 }), 1150);
  assert.equal(getEffectivePrice({ price: 1450, discountPrice: null }), 1450);
  assert.equal(getEffectivePrice({ price: 1450 }), 1450);
  // The old rule (`!= null && < price`) returned 0 here, i.e. a free product.
  assert.equal(getEffectivePrice({ price: 1450, discountPrice: 0 }), 1450);
});

test('variants inherit the product discount only when sold at the product price', () => {
  const product = { price: 1650, discountPrice: 1550 };
  assert.equal(getVariantEffectivePrice(product, { color: 'Black', price: 1650, discountPrice: null }), 1550);
  assert.equal(getVariantEffectivePrice(product, { color: 'Blue', price: 1700, discountPrice: 1600 }), 1600);
  assert.equal(getVariantEffectivePrice(product, { color: 'Gold', price: 1800, discountPrice: null }), 1800);
  assert.equal(getVariantEffectivePrice({ price: 900, discountPrice: null }, { color: 'X', price: 900 }), 900);
  assert.equal(resolveVariantPricing(product, undefined), product);
});

test('parseDiscountInput: empty / null / zero mean no discount', () => {
  for (const empty of [undefined, null, '', '  ', 0, '0']) {
    assert.deepEqual(parseDiscountInput(empty, 1000), { value: null }, `input ${JSON.stringify(empty)}`);
  }
});

test('parseDiscountInput: valid numbers (and numeric strings) are accepted', () => {
  assert.deepEqual(parseDiscountInput(800, 1000), { value: 800 });
  assert.deepEqual(parseDiscountInput('800', 1000), { value: 800 });
});

test('parseDiscountInput: invalid input is rejected with a message', () => {
  for (const bad of ['abc', NaN, -1, '-5', {}, Infinity, 1000, 1200]) {
    const result = parseDiscountInput(bad, 1000);
    assert.ok(result.error, `expected ${String(bad)} to be rejected`);
  }
});
