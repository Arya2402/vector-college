const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Marks = require('../models/Marks');
const Attendance = require('../models/Attendance');
const Test = require('../models/Test');

// All routes require admin role
router.use(protect, authorize('admin'));

// ==================== STUDENT MANAGEMENT ====================

router.post('/students', async (req, res) => {
    try {
        const { userId, password, name, batch, course } = req.body;
        if (!userId || !password || !name || !batch || !course) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const existing = await User.findOne({ userId: parseInt(userId) });
        if (existing) return res.status(400).json({ message: 'User ID already exists' });

        await User.create({ userId: parseInt(userId), password, role: 'student' });
        await StudentProfile.create({ studentId: parseInt(userId), name, batch, course });

        res.status(201).json({ message: 'Student created', userId: parseInt(userId), name, batch, course });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/students', async (req, res) => {
    try {
        const { batch } = req.query;
        const filter = batch ? { batch } : {};
        const profiles = await StudentProfile.find(filter).sort({ name: 1 });
        res.json(profiles);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/academic/students/:studentId — Full student detail for admin
router.get('/students/:studentId', async (req, res) => {
    try {
        const sid = parseInt(req.params.studentId);
        const profile = await StudentProfile.findOne({ studentId: sid });
        if (!profile) return res.status(404).json({ message: 'Student not found' });

        const marks = await Marks.find({ studentId: sid }).populate('testId').sort({ createdAt: -1 });
        const attendance = await Attendance.find({ studentId: sid }).sort({ date: -1 });

        // Calculate attendance stats
        const totalDays = attendance.length;
        const presentDays = attendance.filter(a => a.status === 'Present').length;
        const attendancePercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 1000) / 10 : 0;

        // Group marks by test
        const testMap = {};
        marks.forEach(m => {
            if (!m.testId) return;
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
        const testResults = Object.values(testMap).map(t => ({
            ...t,
            percentage: t.totalMax > 0 ? Math.round((t.totalObtained / t.totalMax) * 1000) / 10 : 0,
        }));

        // Overall average
        const overallAvg = testResults.length > 0
            ? Math.round(testResults.reduce((s, t) => s + t.percentage, 0) / testResults.length * 10) / 10
            : 0;

        // Calculate rank in each test
        for (const tr of testResults) {
            const allMarks = await Marks.find({ testId: tr.testId });
            const studentTotals = {};
            allMarks.forEach(m => {
                if (!studentTotals[m.studentId]) studentTotals[m.studentId] = 0;
                studentTotals[m.studentId] += m.marksObtained;
            });
            const sorted = Object.entries(studentTotals).sort((a, b) => b[1] - a[1]);
            tr.rank = sorted.findIndex(([id]) => parseInt(id) === sid) + 1;
            tr.totalStudents = sorted.length;
        }

        // Subject averages for weak subject detection
        const subjectTotals = {};
        marks.forEach(m => {
            if (!subjectTotals[m.subject]) subjectTotals[m.subject] = { total: 0, max: 0, count: 0 };
            subjectTotals[m.subject].total += m.marksObtained;
            subjectTotals[m.subject].max += m.totalMarks;
            subjectTotals[m.subject].count += 1;
        });
        const subjectAverages = Object.entries(subjectTotals).map(([subject, data]) => ({
            subject,
            average: data.max > 0 ? Math.round((data.total / data.max) * 1000) / 10 : 0,
            testsCount: data.count,
        }));

        res.json({
            profile,
            attendancePercent,
            totalDays,
            presentDays,
            overallAvg,
            testResults,
            subjectAverages,
            attendance: attendance.slice(0, 30),
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/students/:studentId', async (req, res) => {
    try {
        const sid = parseInt(req.params.studentId);
        await User.findOneAndDelete({ userId: sid, role: 'student' });
        await StudentProfile.findOneAndDelete({ studentId: sid });
        await Marks.deleteMany({ studentId: sid });
        await Attendance.deleteMany({ studentId: sid });
        res.json({ message: 'Student and all related data deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ==================== TEST MANAGEMENT ====================

router.post('/tests', async (req, res) => {
    try {
        const { testName, date, subjects, batch, category, positiveMarks, negativeMarks } = req.body;
        if (!testName || !date || !subjects || !subjects.length || !batch) {
            return res.status(400).json({ message: 'testName, date, subjects, and batch are required' });
        }
        const test = await Test.create({
            testName,
            date: new Date(date),
            category: category || 'General',
            subjects: subjects.map(s => ({ name: s.name, totalMarks: Number(s.totalMarks) || 100, topics: s.topics || [], totalQuestions: Number(s.totalQuestions) || 0 })),
            batch,
            positiveMarks: Number(positiveMarks) || 4,
            negativeMarks: Number(negativeMarks) || 1,
        });
        res.status(201).json(test);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/tests', async (req, res) => {
    try {
        const { batch } = req.query;
        const filter = batch ? { batch } : {};
        const tests = await Test.find(filter).sort({ date: -1 });
        // Add marks count for each test
        const result = await Promise.all(tests.map(async t => {
            const marksCount = await Marks.countDocuments({ testId: t._id });
            const studentsWithMarks = await Marks.distinct('studentId', { testId: t._id });
            return {
                ...t.toObject(),
                marksEnteredCount: studentsWithMarks.length,
            };
        }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/academic/tests/:testId — Test detail with all student marks
router.get('/tests/:testId', async (req, res) => {
    try {
        const test = await Test.findById(req.params.testId);
        if (!test) return res.status(404).json({ message: 'Test not found' });

        const marks = await Marks.find({ testId: test._id });
        const students = await StudentProfile.find({ batch: test.batch }).sort({ name: 1 });

        // Group marks by student
        const studentMarks = {};
        marks.forEach(m => {
            if (!studentMarks[m.studentId]) studentMarks[m.studentId] = { subjects: {}, total: 0, maxTotal: 0 };
            studentMarks[m.studentId].subjects[m.subject] = { marksObtained: m.marksObtained, totalMarks: m.totalMarks, correctAnswers: m.correctAnswers, wrongAnswers: m.wrongAnswers, unattempted: m.unattempted };
            studentMarks[m.studentId].total += m.marksObtained;
            studentMarks[m.studentId].maxTotal += m.totalMarks;
        });

        // Build ranked list
        const ranked = students.map(s => {
            const sm = studentMarks[s.studentId] || { subjects: {}, total: 0, maxTotal: 0 };
            return {
                studentId: s.studentId,
                name: s.name,
                course: s.course,
                subjects: test.subjects.map(sub => ({
                    name: sub.name,
                    totalMarks: sub.totalMarks,
                    marksObtained: sm.subjects[sub.name]?.marksObtained ?? null,
                    correctAnswers: sm.subjects[sub.name]?.correctAnswers ?? null,
                    wrongAnswers: sm.subjects[sub.name]?.wrongAnswers ?? null,
                    unattempted: sm.subjects[sub.name]?.unattempted ?? null,
                })),
                totalObtained: sm.total,
                totalMax: sm.maxTotal || test.subjects.reduce((s, sub) => s + sub.totalMarks, 0),
                percentage: sm.maxTotal > 0 ? Math.round((sm.total / sm.maxTotal) * 1000) / 10 : 0,
                hasMarks: Object.keys(sm.subjects).length > 0,
            };
        });

        // Sort by total descending, assign ranks
        ranked.sort((a, b) => b.totalObtained - a.totalObtained);
        ranked.forEach((r, i) => { r.rank = r.hasMarks ? i + 1 : null; });

        res.json({ test, students: ranked });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/tests/:testId/publish', async (req, res) => {
    try {
        const test = await Test.findById(req.params.testId);
        if (!test) return res.status(404).json({ message: 'Test not found' });
        test.isPublished = !test.isPublished;
        await test.save();
        res.json({ isPublished: test.isPublished });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/tests/:testId', async (req, res) => {
    try {
        await Test.findByIdAndDelete(req.params.testId);
        await Marks.deleteMany({ testId: req.params.testId });
        res.json({ message: 'Test and all marks deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ==================== MARKS ENTRY (per test) ====================

// POST /api/academic/tests/:testId/marks — Enter marks for one student, one subject
router.post('/tests/:testId/marks', async (req, res) => {
    try {
        const { studentId, subject, marksObtained } = req.body;
        const test = await Test.findById(req.params.testId);
        if (!test) return res.status(404).json({ message: 'Test not found' });

        const subjectDef = test.subjects.find(s => s.name === subject);
        if (!subjectDef) return res.status(400).json({ message: `Subject "${subject}" not in this test` });

        const mark = await Marks.findOneAndUpdate(
            { testId: test._id, studentId: parseInt(studentId), subject },
            { marksObtained: Number(marksObtained), totalMarks: subjectDef.totalMarks },
            { upsert: true, new: true, runValidators: true }
        );
        res.status(201).json(mark);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/academic/tests/:testId/marks/bulk — Bulk enter marks
router.post('/tests/:testId/marks/bulk', async (req, res) => {
    try {
        const { entries } = req.body; // [{studentId, subject, marksObtained}]
        const test = await Test.findById(req.params.testId);
        if (!test) return res.status(404).json({ message: 'Test not found' });

        const ops = entries.map(e => {
            const subDef = test.subjects.find(s => s.name === e.subject);
            return {
                updateOne: {
                    filter: { testId: test._id, studentId: parseInt(e.studentId), subject: e.subject },
                    update: {
                        marksObtained: Number(e.marksObtained),
                        totalMarks: subDef?.totalMarks || 100,
                        correctAnswers: Number(e.correctAnswers) || 0,
                        wrongAnswers: Number(e.wrongAnswers) || 0,
                        unattempted: Number(e.unattempted) || 0,
                    },
                    upsert: true,
                }
            };
        });
        await Marks.bulkWrite(ops);
        res.json({ message: `${entries.length} marks entries saved` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ==================== ATTENDANCE (batch-wise) ====================

// POST /api/academic/attendance/batch — Mark attendance for entire batch
router.post('/attendance/batch', async (req, res) => {
    try {
        const { date, batch, records } = req.body; // records: [{studentId, status}]
        if (!date || !batch || !records || !records.length) {
            return res.status(400).json({ message: 'date, batch, and records are required' });
        }
        const d = new Date(date);
        const ops = records.map(r => ({
            updateOne: {
                filter: { studentId: parseInt(r.studentId), date: d },
                update: { status: r.status },
                upsert: true,
            }
        }));
        await Attendance.bulkWrite(ops);
        res.json({ message: `Attendance recorded for ${records.length} students` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/academic/attendance/date/:date — Get attendance for a specific date
router.get('/attendance/date/:date', async (req, res) => {
    try {
        const d = new Date(req.params.date);
        const start = new Date(d); start.setHours(0, 0, 0, 0);
        const end = new Date(d); end.setHours(23, 59, 59, 999);
        const { batch } = req.query;

        const records = await Attendance.find({ date: { $gte: start, $lte: end } });
        let students = [];
        if (batch) {
            students = await StudentProfile.find({ batch }).sort({ name: 1 });
        }

        // Map existing records
        const statusMap = {};
        records.forEach(r => { statusMap[r.studentId] = r.status; });

        const result = students.map(s => ({
            studentId: s.studentId,
            name: s.name,
            status: statusMap[s.studentId] || null,
        }));

        res.json({ date: req.params.date, records: result });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/academic/attendance/student/:studentId — Full history for student
router.get('/attendance/student/:studentId', async (req, res) => {
    try {
        const records = await Attendance.find({ studentId: parseInt(req.params.studentId) }).sort({ date: -1 });
        const total = records.length;
        const present = records.filter(r => r.status === 'Present').length;
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

// ==================== ANALYTICS ====================

router.get('/analytics', async (req, res) => {
    try {
        const students = await StudentProfile.find();
        const tests = await Test.find({ isPublished: true }).sort({ date: -1 });
        const totalStudents = students.length;
        const totalTests = tests.length;

        // Top rankers from latest test
        let topRankers = [];
        let latestTest = null;
        if (tests.length > 0) {
            latestTest = tests[0];
            const marks = await Marks.find({ testId: latestTest._id });
            const studentTotals = {};
            marks.forEach(m => {
                if (!studentTotals[m.studentId]) studentTotals[m.studentId] = { total: 0, max: 0 };
                studentTotals[m.studentId].total += m.marksObtained;
                studentTotals[m.studentId].max += m.totalMarks;
            });
            const sorted = Object.entries(studentTotals)
                .map(([id, data]) => ({ studentId: parseInt(id), total: data.total, max: data.max, pct: data.max > 0 ? Math.round((data.total / data.max) * 1000) / 10 : 0 }))
                .sort((a, b) => b.total - a.total);

            // Attach names
            topRankers = await Promise.all(sorted.slice(0, 5).map(async (s, i) => {
                const profile = await StudentProfile.findOne({ studentId: s.studentId });
                return { rank: i + 1, name: profile?.name || 'Unknown', studentId: s.studentId, total: s.total, max: s.max, percentage: s.pct };
            }));
        }

        // Batch-wise student count
        const batchCounts = {};
        students.forEach(s => { batchCounts[s.batch] = (batchCounts[s.batch] || 0) + 1; });

        // Subject averages across all published tests
        const allMarks = await Marks.find({ testId: { $in: tests.map(t => t._id) } });
        const subjectAggr = {};
        allMarks.forEach(m => {
            if (!subjectAggr[m.subject]) subjectAggr[m.subject] = { total: 0, max: 0, count: 0 };
            subjectAggr[m.subject].total += m.marksObtained;
            subjectAggr[m.subject].max += m.totalMarks;
            subjectAggr[m.subject].count++;
        });
        const subjectAverages = Object.entries(subjectAggr).map(([subject, d]) => ({
            subject,
            average: d.max > 0 ? Math.round((d.total / d.max) * 1000) / 10 : 0,
            entries: d.count,
        }));

        // Attendance overview
        const allAttendance = await Attendance.find();
        const totalRecords = allAttendance.length;
        const totalPresent = allAttendance.filter(a => a.status === 'Present').length;

        res.json({
            totalStudents,
            totalTests,
            latestTest: latestTest ? { name: latestTest.testName, date: latestTest.date } : null,
            topRankers,
            batchCounts,
            subjectAverages,
            overallAttendance: totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 1000) / 10 : 0,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
