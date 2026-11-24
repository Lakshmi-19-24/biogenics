import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Customer } from '../models/customer.model.js';
import { Order } from '../models/order.model.js';

/**
 * One-time, NON-DESTRUCTIVE backfill.
 *
 * Old customers were created before the `createdBy` field existed, so a
 * salesperson would no longer see them. This script fills in the missing
 * owner using the best evidence available, in this order:
 *   1. customer.assignedTo
 *   2. the user who wrote the customer's first interaction
 *   3. the user who created the customer's earliest order
 *
 * It ONLY sets `createdBy` on customers that don't have one yet.
 * It never deletes, overwrites or changes any other field.
 * Customers with no evidence are left alone (Owner/Admin/Manager still see them).
 *
 * Usage (from /backend):
 *   npm run backfill:customer-owners           # dry run - shows what WOULD change
 *   npm run backfill:customer-owners -- --apply  # actually writes createdBy
 */
const APPLY = process.argv.includes('--apply');

const run = async () => {
  await connectDB();

  const customers = await Customer.find({
    $or: [{ createdBy: { $exists: false } }, { createdBy: null }]
  }).select('_id name assignedTo interactions');

  console.log(`Customers without an owner: ${customers.length}`);

  let fromAssigned = 0;
  let fromInteraction = 0;
  let fromOrder = 0;
  let unresolved = 0;
  const ops = [];

  for (const c of customers) {
    let owner = null;

    if (c.assignedTo) {
      owner = c.assignedTo;
      fromAssigned += 1;
    } else if (c.interactions?.length) {
      const first = [...c.interactions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
      if (first?.createdBy) {
        owner = first.createdBy;
        fromInteraction += 1;
      }
    }

    if (!owner) {
      const order = await Order.findOne({ $or: [{ customer: c._id }, { customerId: c._id }] })
        .sort('createdAt')
        .select('createdBy');
      if (order?.createdBy) {
        owner = order.createdBy;
        fromOrder += 1;
      }
    }

    if (!owner) {
      unresolved += 1;
      continue;
    }

    ops.push({ updateOne: { filter: { _id: c._id, createdBy: null }, update: { $set: { createdBy: owner } } } });
  }

  console.log(`  from assignedTo:        ${fromAssigned}`);
  console.log(`  from first interaction: ${fromInteraction}`);
  console.log(`  from earliest order:    ${fromOrder}`);
  console.log(`  no evidence (left as-is, still visible to Owner/Admin/Manager): ${unresolved}`);

  if (!APPLY) {
    console.log('\nDRY RUN - nothing was changed. Re-run with --apply to save.');
  } else if (ops.length) {
    const result = await Customer.bulkWrite(ops);
    console.log(`\nUpdated ${result.modifiedCount} customers. No customers were deleted.`);
  } else {
    console.log('\nNothing to update.');
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
