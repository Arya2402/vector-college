const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    text: { type: String, required: true }, // Supports LaTeX
    imageUrl: { type: String }, // Optional Cloudinary URL
    type: { type: String, enum: ['MCQ', 'Numerical'], default: 'MCQ' },
    subject: { type: String, required: true, default: 'General' },
    positiveMarks: { type: Number, required: true, default: 4 },
    negativeMarks: { type: Number, required: true, default: 1 },
    options: [{ type: String }], // Only required for MCQ
    correctOptionIndex: { type: Number }, // Index in options array, for MCQ
    correctNumericalAnswer: { type: Number }, // For Numerical
    subtopic: { type: String, required: true }
}, { _id: true }); // Keep _id to easily reference questions for grading

const onlineTestSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    batch: { type: String, required: true },
    password: { type: String, required: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    maxAttempts: { type: Number, required: true, default: 1, min: 1 },
    startTime: { type: Date },
    endTime: { type: Date },
    showResults: { type: Boolean, default: false },
    status: { type: String, enum: ['draft', 'active', 'completed'], default: 'draft' },
    createdBy: { type: Number, required: true }, // author (admin/director)
    questions: [questionSchema]
}, { timestamps: true });

module.exports = mongoose.model('OnlineTest', onlineTestSchema);
