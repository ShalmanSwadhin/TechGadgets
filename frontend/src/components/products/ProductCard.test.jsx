import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../context/CartContext', () => ({ useCart: () => ({ addToCart: vi.fn() }) }));

import ProductCard from './ProductCard';

const base = {
  _id: 'p1',
  title: 'Test Product',
  brand: 'Brand',
  images: ['https://img.test/a.jpg'],
  ratings: 4,
  numReviews: 2,
  stock: 10,
  featured: false,
  newArrival: false,
  variants: [],
};

const show = (product) =>
  render(
    <MemoryRouter>
      <ProductCard product={{ ...base, ...product }} />
    </MemoryRouter>
  );

// Matching on the formatted number keeps this independent of ICU currency
// symbol/spacing differences between environments.
const price = (n) => screen.queryByText(new RegExp(`${n.toLocaleString('en-US')}\\.00`));

describe('ProductCard price display', () => {
  it('shows the discounted price as the price and the original struck through', () => {
    show({ price: 1450, discountPrice: 1150 });
    expect(price(1150)).toBeInTheDocument();
    expect(price(1450)).toHaveClass('line-through');
    expect(screen.getByText('-21%')).toBeInTheDocument();
  });

  it('shows only the original price when there is no discount', () => {
    show({ price: 1450, discountPrice: null });
    expect(price(1450)).not.toHaveClass('line-through');
    expect(screen.queryByText(/^-\d+%$/)).toBeNull();
  });

  it('treats a zero discount as no discount (not a free product)', () => {
    show({ price: 1450, discountPrice: 0 });
    expect(price(1450)).toBeInTheDocument();
    expect(screen.queryByText(/(^|[^\d,])0\.00$/)).toBeNull();
    expect(screen.queryByText(/^-\d+%$/)).toBeNull();
  });

  it('REGRESSION: a color-variant product shows the product discount (data as stored in production)', () => {
    show({
      price: 1650,
      discountPrice: 1550,
      stock: 0,
      variants: [
        { _id: 'v1', color: 'Black', price: 1650, discountPrice: null, stock: 3 },
        { _id: 'v2', color: 'Blue', price: 1650, discountPrice: null, stock: 3 },
      ],
    });
    expect(price(1550)).toBeInTheDocument();
    expect(price(1650)).toHaveClass('line-through');
    expect(screen.getByText('-6%')).toBeInTheDocument();
    expect(screen.getByText('2 colors')).toBeInTheDocument();
  });

  it('a variant with its own discount uses it', () => {
    show({
      price: 1650,
      discountPrice: null,
      variants: [{ _id: 'v1', color: 'Black', price: 1700, discountPrice: 1600, stock: 3 }],
    });
    expect(price(1600)).toBeInTheDocument();
    expect(price(1700)).toHaveClass('line-through');
  });

  it('old products with no variants key at all keep working', () => {
    const { variants: _omit, ...legacy } = base;
    render(
      <MemoryRouter>
        <ProductCard product={{ ...legacy, price: 1000, discountPrice: 800 }} />
      </MemoryRouter>
    );
    expect(price(800)).toBeInTheDocument();
    expect(price(1000)).toHaveClass('line-through');
  });
});
