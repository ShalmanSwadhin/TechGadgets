import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

/**
 * One-off admin bootstrap. Safe to run against any environment (local or the
 * Atlas cloud DB) and idempotent: if the user already exists it is promoted to
 * admin and its password reset; otherwise a new admin is created.
 *
 * Credentials come from CLI args or environment variables — never hardcoded.
 *
 * Usage (PowerShell):
 *   node seed/createAdmin.js "admin@example.com" "YourStrongPass" "Admin Name"
 * or via env vars in backend/.env:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=YourStrongPass ADMIN_NAME="Admin"
 *   node seed/createAdmin.js
 */
const [, , emailArg, passwordArg, nameArg] = process.argv;

const email = (emailArg || process.env.ADMIN_EMAIL || '').toLowerCase().trim();
const password = passwordArg || process.env.ADMIN_PASSWORD || '';
const name = nameArg || process.env.ADMIN_NAME || 'Admin';

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  console.error('Usage: node seed/createAdmin.js "<email>" "<password>" "[name]"');
  console.error('   or set ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME in .env\n');
  process.exit(1);
}

if (!process.env.MONGODB_URI) fail('MONGODB_URI is not set in the environment (.env).');
if (!email) fail('An admin email is required.');
if (!password) fail('An admin password is required.');
if (password.length < 6) fail('Password must be at least 6 characters.');

try {
  await mongoose.connect(process.env.MONGODB_URI);

  let user = await User.findOne({ email }).select('+password');

  if (user) {
    user.role = 'admin';
    user.isBlocked = false;
    user.password = password; // re-hashed by the model's pre-save hook
    if (nameArg) user.name = name;
    await user.save();
    console.log(`\n✔ Existing user promoted to admin: ${user.email}`);
  } else {
    user = await User.create({ name, email, password, role: 'admin' });
    console.log(`\n✔ New admin created: ${user.email}`);
  }

  console.log(`  name: ${user.name}`);
  console.log(`  role: ${user.role}`);
  console.log('  You can now log in with this email and the password you provided.\n');
  process.exit(0);
} catch (err) {
  console.error(`\n✖ Failed to create admin: ${err.message}\n`);
  process.exit(1);
} finally {
  await mongoose.connection.close().catch(() => {});
}
