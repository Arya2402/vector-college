const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const StudentProfile = require('../models/StudentProfile');
const Marks = require('../models/Marks');
const Attendance = require('../models/Attendance');
const Test = require('../models/Test');

// All routes require student role
router.use(protect, authorize('student'));

// GET /api/student/dashboard — Aggregated dashboard data
router.get('/dashboard', async (req, res) => {
    try {
        const studentId = req.user.userId;
        const profile = await StudentProfile.findOne({ studentId });
        if (!profile) return res.status(404).json({ message: 'Student profile not found' });

        const marks = await Marks.find({ studentId }).populate('testId');
        const attendance = await Attendance.find({ studentId }).sort({ date: -1 });
        const upcomingTests = await Test.find({
            batch: profile.batch,
            isPublished: true,
            date: { $gte: new Date() }
        }).sort({ date: 1 });

        // Attendance stats
        const totalDays = attendance.length;
        const presentDays = attendance.filter(a => a.status === 'Present').length;
        const attendancePercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 1000) / 10 : 0;

        // Group marks by test and calc percentage per test
        const testMap = {};
        marks.forEach(m => {
            if (!m.testId) return;
            const tid = m.testId._id.toString();
            if (!testMap[tid]) {
                testMap[tid] = {
                    testId: tid,
                    testName: m.testId.testName,
                    date: m.testId.date,
                    totalObtained: 0,
                    totalMax: 0,
                };
            }
            testMap[tid].totalObtained += m.marksObtained;
            testMap[tid].totalMax += m.totalMarks;
        });

        const testResults = Object.values(testMap).map(t => ({
            ...t,
            percentage: t.totalMax > 0 ? Math.round((t.totalObtained / t.totalMax) * 1000) / 10 : 0,
        }));

        // Overall average
        const overallAvg = testResults.length > 0
            ? Math.round(testResults.reduce((s, t) => s + t.percentage, 0) / testResults.length * 10) / 10
            : 0;

        // Latest test result
        const latestTestResult = testResults.sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null;

        // Calculate rank in latest published test
        let latestRank = null;
        let latestTotalStudents = 0;
        if (latestTestResult) {
            const allMarks = await Marks.find({ testId: latestTestResult.testId });
            const studentTotals = {};
            allMarks.forEach(m => {
                if (!studentTotals[m.studentId]) studentTotals[m.studentId] = 0;
                studentTotals[m.studentId] += m.marksObtained;
            });
            const sorted = Object.entries(studentTotals).sort((a, b) => b[1] - a[1]);
            latestRank = sorted.findIndex(([id]) => parseInt(id) === studentId) + 1;
            latestTotalStudents = sorted.length;
        }

        // Subject-wise averages and accuracy
        const subjectMap = {};
        marks.forEach(m => {
            if (!subjectMap[m.subject]) subjectMap[m.subject] = { total: 0, max: 0, count: 0, correct: 0, wrong: 0, unattempted: 0 };
            subjectMap[m.subject].total += m.marksObtained;
            subjectMap[m.subject].max += m.totalMarks;
            subjectMap[m.subject].correct += (m.correctAnswers || 0);
            subjectMap[m.subject].wrong += (m.wrongAnswers || 0);
            subjectMap[m.subject].unattempted += (m.unattempted || 0);
            subjectMap[m.subject].count++;
        });
        const subjectAverages = Object.entries(subjectMap).map(([subject, data]) => {
            const sumAttempts = data.correct + data.wrong;
            return {
                subject,
                average: data.max > 0 ? Math.round((data.total / data.max) * 1000) / 10 : 0,
                accuracy: sumAttempts > 0 ? Math.round((data.correct / sumAttempts) * 1000) / 10 : 0,
                testsCount: data.count,
            };
        });

        res.json({
            profile,
            overallAvg,
            attendancePercent,
            totalDays,
            presentDays,
            latestTestResult,
            latestRank,
            latestTotalStudents,
            subjectAverages,
            totalTests: testResults.length,
            nextTest: upcomingTests[0] || null,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/student/marks — All marks grouped by test
router.get('/marks', async (req, res) => {
    try {
        const studentId = req.user.userId;
        const marks = await Marks.find({ studentId }).populate('testId');

        // Group by test
        const testMap = {};
        marks.forEach(m => {
            if (!m.testId || !m.testId.isPublished) return;
            const tid = m.testId._id.toString();
            if (!testMap[tid]) {
                testMap[tid] = {
                    testId: tid,
                    testName: m.testId.testName,
                    date: m.testId.date,
                    batch: m.testId.batch,
                    subjects: [],
                    totalObtained: 0,
                    totalMax: 0,
                };
            }
            testMap[tid].subjects.push({
                subject: m.subject,
                marksObtained: m.marksObtained,
                totalMarks: m.totalMarks,
            });
            testMap[tid].totalObtained += m.marksObtained;
            testMap[tid].totalMax += m.totalMarks;
        });

        const results = Object.values(testMap).map(t => ({
            ...t,
            percentage: t.totalMax > 0 ? Math.round((t.totalObtained / t.totalMax) * 1000) / 10 : 0,
        })).sort((a, b) => new Date(b.date) - new Date(a.date));

        // Get rank for each test
        for (const tr of results) {
            const allMarks = await Marks.find({ testId: tr.testId });
            const studentTotals = {};
            allMarks.forEach(m => {
                if (!studentTotals[m.studentId]) studentTotals[m.studentId] = 0;
                studentTotals[m.studentId] += m.marksObtained;
            });
            const sorted = Object.entries(studentTotals).sort((a, b) => b[1] - a[1]);
            tr.rank = sorted.findIndex(([id]) => parseInt(id) === studentId) + 1;
            tr.totalStudents = sorted.length;
        }

        res.json(results);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/student/attendance
router.get('/attendance', async (req, res) => {
    try {
        const records = await Attendance.find({ studentId: req.user.userId }).sort({ date: -1 });
        const total = records.length;
        const present = records.filter(a => a.status === 'Present').length;
        res.json({
            records,
            total,
            present,
            absent: total - present,
            percentage: total > 0 ? Math.round((present / total) * 1000) / 10 : 0,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/student/tests — Upcoming published tests
router.get('/tests', async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ studentId: req.user.userId });
        if (!profile) return res.status(404).json({ message: 'Profile not found' });
        const tests = await Test.find({
            batch: profile.batch,
            isPublished: true,
            date: { $gte: new Date() }
        }).sort({ date: 1 });
        res.json(tests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
