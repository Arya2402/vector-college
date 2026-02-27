const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    studentId: { type: Number, required: true, index: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['Present', 'Absent'], required: true },
}, { timestamps: true });

// Prevent duplicate attendance for same student on same date
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
