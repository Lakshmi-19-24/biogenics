import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { ROLES } from '../constants/roles.js';
import { User } from '../models/user.model.js';

/**
 * One-time account fix:
 *   1. Billing user  -> renamed "Yamuna", SAME email, new password.
 *   2. Harshitha     -> account deleted completely.
 *   3. Ruchitha      -> new account (new email + password). Role, manager,
 *                       branch, territory and phone are copied from Harshitha.
 *
 * Usage (from /backend):
 *   YAMUNA_PASSWORD='BGLC@2777' \
 *   RUCHITHA_EMAIL='ruchitha@biogenicslifecare.com' \
 *   RUCHITHA_PASSWORD='BGLC@3777' \
 *   npm run rename:users
 *
 * Optional: RUCHITHA_ROLE=sales|manager|admin (only used if Harshitha is not found).
 */
const requireEnv = (key) => {
  const value = process.env[key];
  if (!value || value.length < 8) {
    throw new Error(`${key} is required and must be at least 8 characters`);
  }
  return value;
};

const run = async () => {
  const yamunaPassword = requireEnv('YAMUNA_PASSWORD');
  const ruchithaPassword = requireEnv('RUCHITHA_PASSWORD');
  const ruchithaEmail = String(requireEnv('RUCHITHA_EMAIL')).toLowerCase().trim();

  await connectDB();

  /* ---------- 1. Billing -> Yamuna (same email, new password) ---------- */
  const billing = await User.find({
    $or: [{ name: /billing/i }, { name: /yamuna/i }, { email: /billing/i }]
  }).select('+password');

  if (billing.length === 1) {
    const user = billing[0];
    user.name = 'Yamuna';
    user.password = yamunaPassword; // hashed by the model's pre-save hook
    user.refreshToken = undefined;
    user.refreshTokenHash = undefined;
    await user.save();
    console.log(`[ok] Billing user is now "Yamuna" | email unchanged: ${user.email} | password updated`);
  } else {
    console.warn(
      `[skip] Billing: expected exactly 1 match, found ${billing.length}` +
        (billing.length ? ` (${billing.map((u) => `${u.name} <${u.email}>`).join(', ')})` : '')
    );
  }

  /* ---------- 2. Delete Harshitha completely ---------- */
  const harshithas = await User.find({ name: /harshitha/i });
  let template = {};

  if (harshithas.length > 1) {
    console.warn(
      `[skip] Harshitha: ${harshithas.length} users matched (${harshithas
        .map((u) => `${u.name} <${u.email}>`)
        .join(', ')}). Nothing deleted, Ruchitha not created.`
    );
    return;
  }

  if (harshithas.length === 1) {
    const old = harshithas[0];
    template = {
      role: old.role,
      manager: old.manager,
      branch: old.branch,
      territory: old.territory,
      phone: old.phone
    };
    await User.deleteOne({ _id: old._id });
    console.log(`[ok] Deleted Harshitha <${old.email}> (role: ${old.role})`);
  } else {
    console.warn('[info] Harshitha not found (already deleted?)');
  }

  /* ---------- 3. Create Ruchitha ---------- */
  const existing = await User.findOne({ email: ruchithaEmail }).select('+password');
  if (existing) {
    existing.name = 'Ruchitha';
    existing.password = ruchithaPassword;
    existing.isActive = true;
    existing.refreshToken = undefined;
    existing.refreshTokenHash = undefined;
    await existing.save();
    console.log(`[ok] Ruchitha already existed - name and password updated <${ruchithaEmail}>`);
    return;
  }

  const role = template.role || process.env.RUCHITHA_ROLE || ROLES.SALES_EXECUTIVE;
  await User.create({
    name: 'Ruchitha',
    email: ruchithaEmail,
    password: ruchithaPassword,
    role,
    manager: template.manager || '',
    branch: template.branch || '',
    territory: template.territory || '',
    phone: template.phone || '',
    isActive: true
  });
  console.log(`[ok] Created Ruchitha <${ruchithaEmail}> (role: ${role})`);
};

run()
  .catch((error) => {
    console.error('Account update failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
