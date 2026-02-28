const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { Hero, Notice, Course, Faculty, Gallery, Testimonial, Stats, CollegeInfo, Enquiry } = require('../models/Content');

// ==================== HELPER ====================

// Custom POST create for public enquiries
router.post('/enquiries', async (req, res) => {
  try {
    const item = new Enquiry(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin routes for resolving/deleting
router.get('/enquiries/all', protect, async (req, res) => {
  try {
    const items = await Enquiry.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/enquiries/:id', protect, async (req, res) => {
  try {
    const item = await Enquiry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/enquiries/:id', protect, async (req, res) => {
  try {
    await Enquiry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create standard admin routes for standard models
const adminRoutes = (Model, routeName) => {
  // GET all (public)
  router.get(`/${routeName}`, async (req, res) => {
    try {
      const items = await Model.find({ isActive: { $ne: false } }).sort({ order: 1, createdAt: -1 });
      res.json(items);
    } catch (err) { res.status(500).json({ message: err.message }); }
  });

  // GET all including inactive (admin only)
  router.get(`/${routeName}/all`, protect, async (req, res) => {
    try {
      const items = await Model.find().sort({ order: 1, createdAt: -1 });
      res.json(items);
    } catch (err) { res.status(500).json({ message: err.message }); }
  });

  // POST create (admin)
  router.post(`/${routeName}`, protect, async (req, res) => {
    try {
      const item = new Model(req.body);
      await item.save();
      res.status(201).json(item);
    } catch (err) { res.status(400).json({ message: err.message }); }
  });

  // PUT update (admin)
  router.put(`/${routeName}/:id`, protect, async (req, res) => {
    try {
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(item);
    } catch (err) { res.status(400).json({ message: err.message }); }
  });

  // DELETE (admin)
  router.delete(`/${routeName}/:id`, protect, async (req, res) => {
    try {
      await Model.findByIdAndDelete(req.params.id);
      res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
  });
};

// ==================== HERO (singleton) ====================
router.get('/hero', async (req, res) => {
  try {
    let hero = await Hero.findOne();
    if (!hero) hero = await Hero.create({});
    res.json(hero);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/hero', protect, async (req, res) => {
  try {
    const updateData = { ...req.body };
    const hero = await Hero.findOneAndUpdate({}, updateData, { new: true, upsert: true, setDefaultsOnInsert: true });
    res.json(hero);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// ==================== COLLEGE INFO (singleton) ====================
router.get('/college-info', async (req, res) => {
  try {
    let info = await CollegeInfo.findOne();
    if (!info) info = await CollegeInfo.create({});
    res.json(info);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/college-info', protect, async (req, res) => {
  try {
    let info = await CollegeInfo.findOne();
    if (!info) info = new CollegeInfo();
    Object.assign(info, req.body);
    await info.save();
    res.json(info);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// ==================== STATS (singleton list) ====================
router.get('/stats', async (req, res) => {
  try {
    const stats = await Stats.find().sort({ order: 1 });
    res.json(stats);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/stats', protect, async (req, res) => {
  try {
    const stat = new Stats(req.body);
    await stat.save();
    res.status(201).json(stat);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/stats/:id', protect, async (req, res) => {
  try {
    const stat = await Stats.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(stat);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/stats/:id', protect, async (req, res) => {
  try {
    await Stats.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ==================== MULTI-ITEM MODELS ====================// Route generations
adminRoutes(Notice, 'notices');
adminRoutes(Course, 'courses');
adminRoutes(Faculty, 'faculty');
adminRoutes(Gallery, 'gallery');
adminRoutes(Testimonial, 'testimonials');

module.exports = router;
