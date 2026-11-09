import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const apiMock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }));
vi.mock('../../services/api', () => ({ default: apiMock }));
vi.mock('../../context/ToastContext', () => ({ useToast: () => ({ showToast: vi.fn() }) }));

import AdminProducts from './AdminProducts';

// Shapes mirror what GET /api/products actually returns (Mongoose toJSON):
// specifications is a plain object, variants carry _id, discountPrice may be null.
const plainProduct = {
  _id: 'p-plain',
  title: 'Anker Zolo 30W Adapter',
  description: 'Compact 30W PD charger.',
  category: 'Fast Chargers',
  brand: 'Anker',
  price: 1450,
  discountPrice: 1150,
  stock: 12,
  sku: 'ANK-30',
  warranty: '6 months',
  tags: ['charger', 'pd'],
  thumbnail: 'https://img.test/anker-thumb.jpg',
  images: ['https://img.test/anker-1.jpg', 'https://img.test/anker-2.jpg'],
  featured: true,
  newArrival: false,
  specifications: { Power: '30W', Ports: '1x USB-C' },
  variants: [],
};

const variantProduct = {
  _id: 'p-variant',
  title: 'Soundcore R50i Earbuds',
  description: 'ANC earbuds.',
  category: 'Earbuds',
  brand: 'Soundcore',
  price: 1650,
  discountPrice: 1550,
  stock: 0,
  sku: '',
  warranty: '1 year',
  tags: [],
  thumbnail: 'https://img.test/r50i.jpg',
  images: ['https://img.test/r50i.jpg'],
  featured: false,
  newArrival: true,
  specifications: {},
  variants: [
    { _id: 'v1', color: 'Black', price: 1650, discountPrice: null, stock: 4 },
    { _id: 'v2', color: 'Blue', price: 1700, discountPrice: 1600, stock: 6 },
  ],
};

const fieldByLabel = (label) => {
  const lbl = screen.getByText(label, { selector: 'label' });
  return lbl.parentElement.querySelector('input, textarea, select');
};

async function renderList(products = [plainProduct, variantProduct]) {
  apiMock.get.mockResolvedValue({ data: { products } });
  render(<AdminProducts />);
  await screen.findByText(products[0].title);
}

async function clickEdit(title) {
  const row = screen.getByText(title).closest('tr');
  await userEvent.click(within(row).getAllByRole('button')[0]);
}

beforeEach(() => {
  vi.clearAllMocks();
  apiMock.put.mockResolvedValue({ data: { success: true } });
  apiMock.post.mockResolvedValue({ data: { success: true } });
});

describe('AdminProducts - Edit form prepopulation', () => {
  it('shows every saved value in its field when Edit is clicked', async () => {
    await renderList();
    await clickEdit(plainProduct.title);

    expect(screen.getByRole('heading', { name: 'Edit Product' })).toBeInTheDocument();
    expect(fieldByLabel('title')).toHaveValue('Anker Zolo 30W Adapter');
    expect(fieldByLabel('brand')).toHaveValue('Anker');
    expect(fieldByLabel('Description')).toHaveValue('Compact 30W PD charger.');
    expect(fieldByLabel('Category')).toHaveValue('Fast Chargers');
    expect(fieldByLabel('price')).toHaveValue(1450);
    expect(fieldByLabel('discountPrice')).toHaveValue(1150);
    expect(fieldByLabel('stock')).toHaveValue(12);
    expect(fieldByLabel('SKU')).toHaveValue('ANK-30');
    expect(fieldByLabel('Warranty')).toHaveValue('6 months');
    expect(fieldByLabel('Tags (comma separated)')).toHaveValue('charger, pd');
    expect(fieldByLabel('Thumbnail image URL')).toHaveValue('https://img.test/anker-thumb.jpg');
    expect(fieldByLabel('Image URLs (one per line)')).toHaveValue(
      'https://img.test/anker-1.jpg\nhttps://img.test/anker-2.jpg'
    );
    expect(screen.getByLabelText('Featured product')).toBeChecked();
    expect(screen.getByLabelText('New arrival')).not.toBeChecked();
    expect(screen.getByDisplayValue('Power')).toBeInTheDocument();
    expect(screen.getByDisplayValue('30W')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1x USB-C')).toBeInTheDocument();
  });

  it('shows saved color variants including price, discount and stock', async () => {
    await renderList();
    await clickEdit(variantProduct.title);

    expect(screen.getByDisplayValue('Black')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Blue')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1700')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1600')).toBeInTheDocument();
    expect(screen.getByDisplayValue('4')).toBeInTheDocument();
    expect(screen.getByDisplayValue('6')).toBeInTheDocument();
  });

  it('keeps the form populated across unrelated re-renders (typing elsewhere)', async () => {
    await renderList();
    await clickEdit(plainProduct.title);
    await userEvent.type(fieldByLabel('SKU'), 'X');
    expect(fieldByLabel('SKU')).toHaveValue('ANK-30X');
    expect(fieldByLabel('title')).toHaveValue('Anker Zolo 30W Adapter');
    expect(fieldByLabel('price')).toHaveValue(1450);
  });

  it('does not leak a previous product into the Add form', async () => {
    await renderList();
    await clickEdit(plainProduct.title);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(screen.getByRole('button', { name: /Add Product/ }));
    expect(screen.getByRole('heading', { name: 'Add Product' })).toBeInTheDocument();
    expect(fieldByLabel('title')).toHaveValue('');
    expect(fieldByLabel('price')).toHaveValue(null);
    expect(fieldByLabel('Category')).toHaveValue('Power Banks');
  });
});

describe('AdminProducts - saving edits', () => {
  it('changing only the title PUTs every other field unchanged to the same record', async () => {
    await renderList();
    await clickEdit(plainProduct.title);
    const title = fieldByLabel('title');
    await userEvent.clear(title);
    await userEvent.type(title, 'Anker Zolo 30W Charger');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(apiMock.put).toHaveBeenCalledTimes(1));
    expect(apiMock.post).not.toHaveBeenCalled();
    const [url, payload] = apiMock.put.mock.calls[0];
    expect(url).toBe('/products/p-plain');
    expect(payload).toMatchObject({
      title: 'Anker Zolo 30W Charger',
      description: plainProduct.description,
      category: plainProduct.category,
      brand: plainProduct.brand,
      price: 1450,
      discountPrice: 1150,
      stock: 12,
      sku: 'ANK-30',
      warranty: '6 months',
      tags: ['charger', 'pd'],
      thumbnail: plainProduct.thumbnail,
      images: plainProduct.images,
      featured: true,
      newArrival: false,
      specifications: { Power: '30W', Ports: '1x USB-C' },
      variants: [],
    });
  });

  it('editing only the discount leaves the regular price untouched', async () => {
    await renderList();
    await clickEdit(plainProduct.title);
    const discount = fieldByLabel('discountPrice');
    await userEvent.clear(discount);
    await userEvent.type(discount, '1000');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(apiMock.put).toHaveBeenCalledTimes(1));
    const payload = apiMock.put.mock.calls[0][1];
    expect(payload.price).toBe(1450);
    expect(payload.discountPrice).toBe(1000);
  });

  it('round-trips variant discount prices unchanged when editing something else', async () => {
    await renderList();
    await clickEdit(variantProduct.title);
    const title = fieldByLabel('title');
    await userEvent.clear(title);
    await userEvent.type(title, 'Soundcore R50i');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(apiMock.put).toHaveBeenCalledTimes(1));
    const payload = apiMock.put.mock.calls[0][1];
    expect(payload.variants).toEqual([
      { color: 'Black', price: 1650, discountPrice: null, stock: 4 },
      { color: 'Blue', price: 1700, discountPrice: 1600, stock: 6 },
    ]);
  });

  it('clearing every specification row on edit actually clears them', async () => {
    await renderList();
    await clickEdit(plainProduct.title);
    const removeButtons = () =>
      screen.getAllByRole('button').filter((b) => b.className.includes('text-red-500') && b.closest('.md\\:grid-cols-\\[1fr_1fr_auto\\]'));
    await userEvent.click(removeButtons()[0]);
    await userEvent.click(removeButtons()[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(apiMock.put).toHaveBeenCalledTimes(1));
    expect(apiMock.put.mock.calls[0][1].specifications).toEqual({});
  });
});

describe('AdminProducts - Add product', () => {
  it('still creates a product via POST with the entered discount', async () => {
    await renderList();
    await userEvent.click(screen.getByRole('button', { name: /Add Product/ }));
    await userEvent.type(fieldByLabel('title'), 'New Gadget');
    await userEvent.type(fieldByLabel('brand'), 'Acme');
    await userEvent.type(fieldByLabel('Description'), 'Nice');
    await userEvent.type(fieldByLabel('price'), '2000');
    await userEvent.type(fieldByLabel('discountPrice'), '1800');
    await userEvent.type(fieldByLabel('stock'), '5');
    await userEvent.type(fieldByLabel('Image URLs (one per line)'), 'https://img.test/new.jpg');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(apiMock.post).toHaveBeenCalledTimes(1));
    expect(apiMock.put).not.toHaveBeenCalled();
    const [url, payload] = apiMock.post.mock.calls[0];
    expect(url).toBe('/products');
    expect(payload).toMatchObject({
      title: 'New Gadget',
      price: 2000,
      discountPrice: 1800,
      stock: 5,
      images: ['https://img.test/new.jpg'],
      variants: [],
    });
  });
});
