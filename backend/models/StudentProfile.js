const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
    studentId: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true },
    batch: { type: String, required: true },
    course: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
