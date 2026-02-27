const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    totalMarks: { type: Number, required: true, default: 100 },
    topics: [{ type: String }], // e.g. ["Calculus", "Algebra"]
    totalQuestions: { type: Number, default: 0 },
}, { _id: false });

const testSchema = new mongoose.Schema({
    testName: { type: String, required: true },
    date: { type: Date, required: true },
    category: { type: String, default: 'General' }, // JEE Mains, NEET, General, etc.
    subjects: { type: [subjectSchema], required: true, validate: v => v.length > 0 },
    batch: { type: String, required: true },
    isPublished: { type: Boolean, default: false },
    positiveMarks: { type: Number, default: 4 },  // +4 per correct
    negativeMarks: { type: Number, default: 1 },  // -1 per wrong
}, { timestamps: true });

testSchema.index({ batch: 1, date: -1 });

module.exports = mongoose.model('Test', testSchema);
