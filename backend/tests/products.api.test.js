import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import express from 'express';
import mongoose from 'mongoose';

process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

import { mongodAvailable, startTestDb } from './helpers/testDb.js';

const skip = mongodAvailable() ? false : 'mongod binary not found (set MONGOD_PATH to run integration tests)';

let db;
let server;
let base;
let adminToken;
let Product;

const api = async (method, url, body, token = adminToken) => {
  const res = await fetch(base + url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
};

const baseProduct = (over = {}) => ({
  title: 'Soundcore R50i Earbuds',
  description: 'ANC earbuds',
  category: 'Earbuds',
  brand: 'Soundcore',
  price: 1650,
  discountPrice: 1550,
  stock: 0,
  sku: 'R50I',
  warranty: '1 year',
  tags: ['anc'],
  thumbnail: 'https://img.test/r50i.jpg',
  images: ['https://img.test/r50i.jpg'],
  featured: false,
  newArrival: true,
  specifications: { Battery: '30h' },
  variants: [],
  ...over,
});

before(async () => {
  if (skip) return;
  db = await startTestDb();
  const { generateToken } = await import('../utils/generateToken.js');
  const { default: User } = await import('../models/User.js');
  ({ default: Product } = await import('../models/Product.js'));
  const { default: productRoutes } = await import('../routes/productRoutes.js');
  const { default: orderRoutes } = await import('../routes/orderRoutes.js');
  const { notFound, errorHandler } = await import('../middleware/errorHandler.js');

  const admin = await User.create({
    name: 'Admin',
    email: 'admin@test.local',
    password: 'secret123',
    role: 'admin',
  });
  adminToken = generateToken(admin._id);

  const app = express();
  app.use(express.json());
  app.use('/api/products', productRoutes);
  app.use('/api/orders', orderRoutes);
  app.use(notFound);
  app.use(errorHandler);
  server = http.createServer(app);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  if (skip) return;
  await new Promise((r) => server.close(r));
  await db.stop();
});

test('create → persist → retrieve: regular and discounted price are both stored and returned', { skip }, async () => {
  const created = await api('POST', '/products', baseProduct({ price: 1450, discountPrice: 1150 }));
  assert.equal(created.status, 201);
  assert.equal(created.body.product.price, 1450);
  assert.equal(created.body.product.discountPrice, 1150);

  // Verify straight from MongoDB, bypassing the API.
  const raw = await mongoose.connection.db
    .collection('products')
    .findOne({ _id: new mongoose.Types.ObjectId(created.body.product._id) });
  assert.equal(raw.price, 1450);
  assert.equal(raw.discountPrice, 1150);

  const fetched = await api('GET', `/products/${created.body.product._id}`);
  assert.equal(fetched.body.product.price, 1450);
  assert.equal(fetched.body.product.discountPrice, 1150);

  const list = await api('GET', '/products');
  const inList = list.body.products.find((p) => p._id === created.body.product._id);
  assert.equal(inList.discountPrice, 1150);
});

test('missing / null / empty / zero discount is stored as null (never a valid discount)', { skip }, async () => {
  for (const [label, discountPrice] of [['null', null], ['empty string', ''], ['zero', 0], ['"0"', '0']]) {
    const res = await api('POST', '/products', baseProduct({ title: `no discount ${label}`, discountPrice }));
    assert.equal(res.status, 201, label);
    assert.equal(res.body.product.discountPrice, null, label);
  }
  const { discountPrice: _omit, ...withoutField } = baseProduct({ title: 'discount field omitted' });
  const res = await api('POST', '/products', withoutField);
  assert.equal(res.status, 201);
  assert.equal(res.body.product.discountPrice, null);
});

test('invalid discounts are rejected with 400 and nothing is saved', { skip }, async () => {
  const before = await Product.countDocuments();
  for (const [label, discountPrice] of [
    ['non-numeric', 'abc'],
    ['negative', -10],
    ['equal to price', 1650],
    ['above price', 5000],
  ]) {
    const res = await api('POST', '/products', baseProduct({ title: `bad ${label}`, discountPrice }));
    assert.equal(res.status, 400, label);
    assert.match(res.body.message, /discount/i, label);
  }
  assert.equal(await Product.countDocuments(), before);
});

test('invalid variant discounts are rejected; valid variant discount persists', { skip }, async () => {
  const bad = await api(
    'POST',
    '/products',
    baseProduct({ title: 'bad variant', variants: [{ color: 'Black', price: 1650, discountPrice: 2000, stock: 1 }] })
  );
  assert.equal(bad.status, 400);

  const ok = await api(
    'POST',
    '/products',
    baseProduct({
      title: 'good variant',
      variants: [
        { color: 'Black', price: 1650, discountPrice: null, stock: 4 },
        { color: 'Blue', price: 1700, discountPrice: 1600, stock: 6 },
      ],
    })
  );
  assert.equal(ok.status, 201);
  const got = (await api('GET', `/products/${ok.body.product._id}`)).body.product;
  assert.deepEqual(
    got.variants.map((v) => [v.color, v.price, v.discountPrice, v.stock]),
    [['Black', 1650, null, 4], ['Blue', 1700, 1600, 6]]
  );
});

test('update: changing only the title leaves every other field untouched', { skip }, async () => {
  const created = await api(
    'POST',
    '/products',
    baseProduct({
      title: 'Original title',
      variants: [{ color: 'Black', price: 1650, discountPrice: 1500, stock: 3 }],
    })
  );
  const id = created.body.product._id;
  const before = (await api('GET', `/products/${id}`)).body.product;

  const res = await api('PUT', `/products/${id}`, { title: 'Renamed' });
  assert.equal(res.status, 200);

  const after = (await api('GET', `/products/${id}`)).body.product;
  assert.equal(after.title, 'Renamed');
  const { title: _t1, updatedAt: _u1, ...restBefore } = before;
  const { title: _t2, updatedAt: _u2, ...restAfter } = after;
  assert.deepEqual(restAfter, restBefore);
  assert.equal(await Product.countDocuments({ _id: id }), 1);
});

test('update: editing only the discount does not reset the regular price (and vice versa)', { skip }, async () => {
  const created = await api('POST', '/products', baseProduct({ title: 'Discount edit', price: 2000, discountPrice: 1800 }));
  const id = created.body.product._id;

  let res = await api('PUT', `/products/${id}`, { discountPrice: 1700 });
  assert.equal(res.status, 200);
  assert.equal(res.body.product.price, 2000);
  assert.equal(res.body.product.discountPrice, 1700);

  // Discount validated against the STORED price when the price is not sent.
  res = await api('PUT', `/products/${id}`, { discountPrice: 2500 });
  assert.equal(res.status, 400);
  assert.equal((await Product.findById(id)).discountPrice, 1700);

  res = await api('PUT', `/products/${id}`, { discountPrice: null });
  assert.equal(res.status, 200);
  assert.equal(res.body.product.discountPrice, null);
  assert.equal(res.body.product.price, 2000);
});

test('update persists to the same record (no duplicate) and 404s for unknown ids', { skip }, async () => {
  const created = await api('POST', '/products', baseProduct({ title: 'Dup check' }));
  const id = created.body.product._id;
  const count = await Product.countDocuments();
  await api('PUT', `/products/${id}`, baseProduct({ title: 'Dup check 2', price: 1700, discountPrice: 1600 }));
  assert.equal(await Product.countDocuments(), count);
  const raw = await Product.findById(id);
  assert.equal(raw.title, 'Dup check 2');
  assert.equal(raw.price, 1700);
  assert.equal(raw.discountPrice, 1600);

  const missing = await api('PUT', `/products/${new mongoose.Types.ObjectId()}`, { title: 'x' });
  assert.equal(missing.status, 404);
});

test('existing products created before variants/discount rules keep working', { skip }, async () => {
  // Inserted straight into MongoDB the way a pre-variants document looks: no
  // variants key, no discountPrice key at all.
  const { insertedId } = await mongoose.connection.db.collection('products').insertOne({
    title: 'Legacy product',
    description: 'old',
    category: 'Power Banks',
    brand: 'Old',
    price: 1000,
    stock: 7,
    images: ['https://img.test/legacy.jpg'],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const got = await api('GET', `/products/${insertedId}`);
  assert.equal(got.status, 200);
  assert.equal(got.body.product.price, 1000);
  assert.deepEqual(got.body.product.variants, []);

  // And it can still be edited and given a discount.
  const res = await api('PUT', `/products/${insertedId}`, { title: 'Legacy product (edited)', discountPrice: 900 });
  assert.equal(res.status, 200);
  assert.equal(res.body.product.price, 1000);
  assert.equal(res.body.product.discountPrice, 900);
});

test('admin-only: customers cannot create products', { skip }, async () => {
  const res = await api('POST', '/products', baseProduct(), null);
  assert.equal(res.status, 401);
});

const shipping = {
  fullName: 'T',
  phone: '01700000000',
  district: 'Dhaka',
  thana: 'Gulshan',
  area: 'Road 1',
  country: 'Bangladesh',
};

test('checkout charges the same discounted price the storefront displays (variant product)', { skip }, async () => {
  // Same shape as the products that showed the original price in production.
  const created = await api(
    'POST',
    '/products',
    baseProduct({
      title: 'Checkout variant product',
      price: 1650,
      discountPrice: 1550,
      variants: [
        { color: 'Black', price: 1650, discountPrice: null, stock: 5 },
        { color: 'Gold', price: 1800, discountPrice: null, stock: 5 },
      ],
    })
  );
  const productId = created.body.product._id;

  const black = await api('POST', '/orders', { items: [{ product: productId, quantity: 2, color: 'Black' }], shippingAddress: shipping }, null);
  assert.equal(black.status, 201, JSON.stringify(black.body));
  assert.equal(black.body.order.orderItems[0].price, 1550);
  assert.equal(black.body.order.itemsPrice, 3100);

  const gold = await api('POST', '/orders', { items: [{ product: productId, quantity: 1, color: 'Gold' }], shippingAddress: shipping }, null);
  assert.equal(gold.status, 201, JSON.stringify(gold.body));
  assert.equal(gold.body.order.orderItems[0].price, 1800);
});

test('checkout of a non-variant product with discountPrice 0 charges the full price, not zero', { skip }, async () => {
  // Written directly to bypass the API normalisation, simulating bad legacy data.
  const { insertedId } = await mongoose.connection.db.collection('products').insertOne({
    title: 'Zero discount legacy',
    description: 'x',
    category: 'Power Banks',
    brand: 'Old',
    price: 1000,
    discountPrice: 0,
    stock: 5,
    images: ['https://img.test/z.jpg'],
    variants: [],
  });
  const res = await api('POST', '/orders', { items: [{ product: String(insertedId), quantity: 1 }], shippingAddress: shipping }, null);
  assert.equal(res.status, 201, JSON.stringify(res.body));
  assert.equal(res.body.order.orderItems[0].price, 1000);
});
