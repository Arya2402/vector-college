const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true, index: true },
    studentId: { type: Number, required: true, index: true },
    subject: { type: String, required: true },
    marksObtained: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    // For accuracy calculation (JEE-style +4/-1)
    correctAnswers: { type: Number, default: 0 },
    wrongAnswers: { type: Number, default: 0 },
    unattempted: { type: Number, default: 0 },
}, { timestamps: true });

// One entry per student per subject per test
marksSchema.index({ testId: 1, studentId: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('Marks', marksSchema);
