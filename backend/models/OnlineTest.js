const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    text: { type: String, required: true }, // Supports LaTeX
    imageUrl: { type: String }, // Optional Cloudinary URL
    type: { type: String, default: 'MCQ' },
    options: [{ type: String, required: true }],
    correctOptionIndex: { type: Number, required: true }, // Index in options array
    subtopic: { type: String, required: true }
}, { _id: true }); // Keep _id to easily reference questions for grading

const onlineTestSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    batch: { type: String, required: true },
    password: { type: String, required: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    maxAttempts: { type: Number, required: true, default: 1, min: 1 },
    positiveMarks: { type: Number, default: 4 },
    negativeMarks: { type: Number, default: 1 },
    status: { type: String, enum: ['draft', 'active', 'completed'], default: 'draft' },
    createdBy: { type: Number, required: true }, // author (admin/director)
    questions: [questionSchema]
}, { timestamps: true });

module.exports = mongoose.model('OnlineTest', onlineTestSchema);
