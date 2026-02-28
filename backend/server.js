const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    // Allow all origins
    return callback(null, true);
  },
  credentials: true
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/content', require('./routes/content'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/academic', require('./routes/academicRoutes'));
app.use('/api/online-tests', require('./routes/onlineTestRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));

// Health check
app.get('/', (req, res) => res.json({ message: 'Vector College API is running!' }));

// Seed default admin and director users
const seedAdmin = async () => {
  const User = require('./models/User');
  try {
    const existingAdmin = await User.findOne({ userId: 100001 });
    if (!existingAdmin) {
      await User.create({
        userId: 100001,
        password: process.env.ADMIN_PASSWORD || 'vector@password',
        role: 'admin',
      });
      console.log('Default admin user seeded (userId: 100001)');
    }

    const existingDirector = await User.findOne({ userId: 200000 });
    if (!existingDirector) {
      await User.create({
        userId: 200000,
        password: process.env.ADMIN_PASSWORD || 'vector@password',
        role: 'director',
      });
      console.log('Default director user seeded (userId: 200000)');
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
};

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    await seedAdmin();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  });
