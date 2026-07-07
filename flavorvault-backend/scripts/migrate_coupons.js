const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Coupon = require('../models/Coupon');

dotenv.config();

async function migrate() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const coupons = await Coupon.find({});
  console.log(`Found ${coupons.length} coupons`);

  for (const c of coupons) {
    const update = {};

    // Legacy reward coupons created without proper type should be fixed to $5 fixed coupons
    if (String(c.code || '').startsWith('REWARD5-')) {
      if (c.type !== 'fixed' || Number(c.amount) !== 5) {
        update.type = 'fixed';
        update.amount = 5;
        update.discount = 0;
      }
    } else if (!c.type) {
      // If coupon already has an `amount` use fixed, otherwise treat as percent
      if (c.amount && Number(c.amount) > 0) {
        update.type = 'fixed';
      } else {
        update.type = 'percent';
      }
    }

    if (Object.keys(update).length) {
      await Coupon.findByIdAndUpdate(c._id, { $set: update });
      console.log(`Updated ${c.code}:`, update);
    }
  }

  console.log('Migration complete');
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(err => { console.error(err); process.exit(2); });
