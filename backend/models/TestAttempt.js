const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    selectedOptionIndex: { type: Number } // null or undefined means unattempted
}, { _id: false });

const testAttemptSchema = new mongoose.Schema({
    studentId: { type: Number, required: true, index: true },
    onlineTestId: { type: mongoose.Schema.Types.ObjectId, ref: 'OnlineTest', required: true, index: true },
    attemptNumber: { type: Number, required: true, default: 1 },
    startTime: { type: Date, required: true, default: Date.now },
    endTime: { type: Date },
    status: { type: String, enum: ['in-progress', 'submitted', 'auto-submitted-violation'], default: 'in-progress' },
    fullscreenExits: { type: Number, default: 0 },
    answers: [answerSchema],
    score: {
        totalMarks: { type: Number, default: 0 },
        correctAnswers: { type: Number, default: 0 },
        wrongAnswers: { type: Number, default: 0 },
        unattempted: { type: Number, default: 0 }
    }
}, { timestamps: true });

module.exports = mongoose.model('TestAttempt', testAttemptSchema);
