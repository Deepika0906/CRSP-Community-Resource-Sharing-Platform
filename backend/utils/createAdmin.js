// Run with: npm run seed:admin
// Creates (or promotes) an admin account using values from environment
// variables so credentials are never hard-coded in source.
//
// PowerShell usage:
//   $env:ADMIN_EMAIL="admin@crsp.local"; $env:ADMIN_PASSWORD="ChangeMe123!"; npm run seed:admin

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const run = async () => {
  await connectDB();

  const email = process.env.ADMIN_EMAIL || 'admin@crsp.local';
  const password = process.env.ADMIN_PASSWORD || 'Admin@12345';
  const name = process.env.ADMIN_NAME || 'Platform Admin';

  let user = await User.findOne({ email });

  if (user) {
    user.role = 'admin';
    user.status = 'active';
    await user.save();
    console.log(`Existing user ${email} promoted to admin.`);
  } else {
    user = await User.create({
      name,
      email,
      password,
      phone: '0000000000',
      address: 'HQ',
      role: 'admin',
    });
    console.log(`Admin account created.`);
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
    console.log('IMPORTANT: log in and change this password immediately.');
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
