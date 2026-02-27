const mongoose = require('mongoose');

// Hero Section
const heroSchema = new mongoose.Schema({
  title: { type: String, default: 'Vector Junior College' },
  subtitle: { type: String, default: 'Excellence in Education Since 2000' },
  description: { type: String, default: 'Shaping futures through quality education and holistic development.' },
  backgroundImage: { type: String, default: '' },
  backgroundImages: { type: [String], default: [] },
  marqueeItems: { type: [String], default: [] },
  buttonText: { type: String, default: 'Explore Now' },
}, { timestamps: true });

// Notice/Announcement
const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  date: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  tag: { type: String, enum: ['Important', 'Admission', 'Exam', 'Event', 'General'], default: 'General' },
}, { timestamps: true });

// Course Card
const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, default: '' },
  duration: { type: String, default: '2 Years' },
  seats: { type: String, default: '60' },
  icon: { type: String, default: '📚' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Faculty Card
const facultySchema = new mongoose.Schema({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  qualification: { type: String, default: '' },
  experience: { type: String, default: '' },
  image: { type: String, default: '' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Gallery Image
const gallerySchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, enum: ['Campus', 'Events', 'Sports', 'Academics', 'Celebrations'], default: 'Campus' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Testimonial
const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  course: { type: String, default: '' },
  rank: { type: String, default: '' },
  batch: { type: String, default: '' },
  content: { type: String, required: true },
  rating: { type: Number, default: 5, min: 1, max: 5 },
  image: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Stats
const statsSchema = new mongoose.Schema({
  label: { type: String, required: true },
  value: { type: String, required: true },
  icon: { type: String, default: '🎯' },
  order: { type: Number, default: 0 },
}, { timestamps: true });

// College Info (About section)
const collegeInfoSchema = new mongoose.Schema({
  aboutTitle: { type: String, default: 'About Vector Junior College' },
  aboutDescription: { type: String, default: 'Vector Junior College has been a beacon of quality education...' },
  aboutImage: { type: String, default: '' },
  address: { type: String, default: 'Vector Junior College, Your City, State - 500001' },
  phone: { type: String, default: '+91 98765 43210' },
  email: { type: String, default: 'info@vectorcollege.edu' },
  mapEmbedUrl: { type: String, default: '' },
  admissionOpen: { type: Boolean, default: true },
  admissionYear: { type: String, default: '2024-25' },
  courseOptions: { type: [String], default: ['JEE Mains', 'NEET'] },
}, { timestamps: true });

// Enquiry
const enquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  course: { type: String, default: '' },
  message: { type: String, default: '' },
  status: { type: String, enum: ['New', 'Read', 'Resolved'], default: 'New' },
}, { timestamps: true });

const Hero = mongoose.model('Hero', heroSchema);
const Notice = mongoose.model('Notice', noticeSchema);
const Course = mongoose.model('Course', courseSchema);
const Faculty = mongoose.model('Faculty', facultySchema);
const Gallery = mongoose.model('Gallery', gallerySchema);
const Testimonial = mongoose.model('Testimonial', testimonialSchema);
const Stats = mongoose.model('Stats', statsSchema);
const CollegeInfo = mongoose.model('CollegeInfo', collegeInfoSchema);
const Enquiry = mongoose.model('Enquiry', enquirySchema);

module.exports = { Hero, Notice, Course, Faculty, Gallery, Testimonial, Stats, CollegeInfo, Enquiry };
