import Subscriber from '../models/Subscriber.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const subscribe = asyncHandler(async (req, res) => {
  const email = (req.body.email || '').toString().trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400);
    throw new Error('A valid email address is required');
  }

  try {
    await Subscriber.create({ email });
  } catch (err) {
    // Already subscribed — treat as success rather than an error so a
    // repeat signup doesn't look like a failure to the customer.
    if (err.code !== 11000) throw err;
  }

  res.status(201).json({ success: true, message: 'Subscribed' });
});

export const getSubscribers = asyncHandler(async (_req, res) => {
  const subscribers = await Subscriber.find({}).sort({ createdAt: -1 });
  res.json({ success: true, subscribers });
});
