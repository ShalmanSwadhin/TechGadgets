import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const apiMock = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('../services/api', () => ({ default: apiMock }));
vi.mock('../context/CartContext', () => ({ useCart: () => ({ addToCart: vi.fn() }) }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ isAuthenticated: false }) }));
vi.mock('../context/ToastContext', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../hooks/useSeo', () => ({ useSeo: () => {} }));

import ProductDetailPage from './ProductDetailPage';

const product = (over) => ({
  _id: 'p1',
  title: 'Soundcore R50i Earbuds',
  description: 'desc',
  brand: 'Soundcore',
  category: 'Earbuds',
  images: ['https://img.test/a.jpg'],
  ratings: 4,
  numReviews: 0,
  warranty: '1 year',
  stock: 0,
  specifications: {},
  variants: [],
  ...over,
});

async function open(p) {
  apiMock.get.mockImplementation((url) => {
    if (url.endsWith('/related')) return Promise.resolve({ data: { products: [] } });
    if (url.startsWith('/reviews')) return Promise.resolve({ data: { reviews: [] } });
    return Promise.resolve({ data: { product: p } });
  });
  render(
    <MemoryRouter initialEntries={['/products/p1']}>
      <Routes>
        <Route path="/products/:id" element={<ProductDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
  await screen.findByRole('heading', { level: 1 });
}

const price = (n) => screen.queryByText(new RegExp(`${n.toLocaleString('en-US')}\\.00`));

beforeEach(() => vi.clearAllMocks());

describe('ProductDetailPage price display', () => {
  it('shows discounted price with the original struck through (no variants)', async () => {
    await open(product({ price: 1450, discountPrice: 1150, stock: 5 }));
    expect(price(1150)).toBeInTheDocument();
    expect(price(1450)).toHaveClass('line-through');
    expect(screen.getByText('-21%')).toBeInTheDocument();
  });

  it('shows only the original price when there is no valid discount', async () => {
    await open(product({ price: 1450, discountPrice: 0, stock: 5 }));
    expect(price(1450)).toBeInTheDocument();
    expect(price(1450)).not.toHaveClass('line-through');
    expect(screen.queryByText(/^-\d+%$/)).toBeNull();
  });

  it('REGRESSION: color-variant product shows the product discount for each color', async () => {
    await open(
      product({
        price: 1650,
        discountPrice: 1550,
        variants: [
          { _id: 'v1', color: 'Black', price: 1650, discountPrice: null, stock: 3 },
          { _id: 'v2', color: 'Blue', price: 1650, discountPrice: null, stock: 3 },
        ],
      })
    );
    expect(price(1550)).toBeInTheDocument();
    expect(price(1650)).toHaveClass('line-through');
    await userEvent.click(screen.getByRole('button', { name: 'Blue' }));
    expect(price(1550)).toBeInTheDocument();
    expect(price(1650)).toHaveClass('line-through');
  });

  it('switching to a differently priced color without a discount shows its full price', async () => {
    await open(
      product({
        price: 1650,
        discountPrice: 1550,
        variants: [
          { _id: 'v1', color: 'Black', price: 1650, discountPrice: null, stock: 3 },
          { _id: 'v2', color: 'Gold', price: 1800, discountPrice: null, stock: 3 },
        ],
      })
    );
    await userEvent.click(screen.getByRole('button', { name: 'Gold' }));
    expect(price(1800)).toBeInTheDocument();
    expect(price(1800)).not.toHaveClass('line-through');
    expect(screen.queryByText(/^-\d+%$/)).toBeNull();
  });
});
