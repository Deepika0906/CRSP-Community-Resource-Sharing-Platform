// Run with: npm run seed
// Wipes and repopulates the database with demo users and resources so you
// have something to click around during your project demo.

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Resource = require('../models/Resource');
const BorrowRequest = require('../models/BorrowRequest');
const GiveawayRequest = require('../models/GiveawayRequest');
const Notification = require('../models/Notification');
const Wishlist = require('../models/Wishlist');
const Review = require('../models/Review');
const Message = require('../models/Message');

const run = async () => {
  await connectDB();

  console.log('Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Resource.deleteMany({}),
    BorrowRequest.deleteMany({}),
    GiveawayRequest.deleteMany({}),
    Notification.deleteMany({}),
    Wishlist.deleteMany({}),
    Review.deleteMany({}),
    Message.deleteMany({}),
  ]);

  console.log('Creating demo users (password for all: Password@123)...');
  const [alice, bob, carol] = await User.create([
    {
      name: 'Alice Sharma',
      email: 'alice@example.com',
      password: 'Password@123',
      phone: '9000000001',
      address: 'Anna Nagar, Chennai',
    },
    {
      name: 'Bob Kumar',
      email: 'bob@example.com',
      password: 'Password@123',
      phone: '9000000002',
      address: 'T Nagar, Chennai',
    },
    {
      name: 'Carol Fernandes',
      email: 'carol@example.com',
      password: 'Password@123',
      phone: '9000000003',
      address: 'Velachery, Chennai',
    },
  ]);

  console.log('Creating demo resources...');
  await Resource.create([
    {
      title: 'Scientific Calculator (Casio fx-991)',
      description: 'Working perfectly. Free for a student who needs it.',
      category: 'Electronics',
      condition: 'Good',
      sharingMode: 'GIVEAWAY',
      location: 'Chennai',
      owner: alice._id,
      images: [],
    },
    {
      title: 'Study Table Lamp',
      description: 'LED desk lamp, adjustable brightness. Available to borrow for exam season.',
      category: 'Furniture',
      condition: 'Like New',
      sharingMode: 'LEND',
      location: 'Chennai',
      owner: bob._id,
      images: [],
    },
    {
      title: 'Data Structures Textbook',
      description: 'CLRS Introduction to Algorithms, 3rd edition. Lending for a semester.',
      category: 'Books',
      condition: 'Good',
      sharingMode: 'LEND',
      location: 'Chennai',
      owner: carol._id,
      images: [],
    },
    {
      title: 'Badminton Racket Set',
      description: 'Two rackets + shuttlecocks, barely used. Giving away, moving out.',
      category: 'Sports Equipment',
      condition: 'Like New',
      sharingMode: 'GIVEAWAY',
      location: 'Chennai',
      owner: bob._id,
      images: [],
    },
  ]);

  console.log('Seed complete.');
  console.log('Demo accounts:');
  console.log('  alice@example.com / Password@123');
  console.log('  bob@example.com   / Password@123');
  console.log('  carol@example.com / Password@123');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
