const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const StudentProfile = require('../models/StudentProfile');
const Marks = require('../models/Marks');
const Attendance = require('../models/Attendance');
const Test = require('../models/Test');
const TestAttempt = require('../models/TestAttempt');
const OnlineTest = require('../models/OnlineTest');

// All routes require student role
router.use(protect, authorize('student'));

// GET /api/student/dashboard — Aggregated dashboard data
router.get('/dashboard', async (req, res) => {
    try {
        const studentId = req.user.userId;
        const profile = await StudentProfile.findOne({ studentId });
        if (!profile) return res.status(404).json({ message: 'Student profile not found' });

        const marks = await Marks.find({ studentId }).populate('testId');
        const attempts = await TestAttempt.find({ studentId, status: { $in: ['submitted', 'auto-submitted-violation'] } }).populate('onlineTestId');
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

        // Add offline marks
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
                    type: 'offline'
                };
            }
            testMap[tid].totalObtained += m.marksObtained;
            testMap[tid].totalMax += m.totalMarks;
        });

        // Add CBT attempts
        attempts.forEach(a => {
            if (!a.onlineTestId) return;
            const tid = a.onlineTestId._id.toString();
            const totalMax = a.onlineTestId.questions.reduce((sum, q) => sum + (q.positiveMarks || 4), 0);

            // Only show marks if showResults is true
            const isVisible = a.onlineTestId.showResults;

            if (!testMap[tid] || (isVisible && a.score.totalMarks > testMap[tid].totalObtained)) {
                testMap[tid] = {
                    testId: tid,
                    testName: a.onlineTestId.title,
                    date: a.endTime || a.updatedAt || a.startTime,
                    totalObtained: isVisible ? a.score.totalMarks : null,
                    totalMax: totalMax,
                    type: 'cbt',
                    resultsPublished: isVisible
                };
            }
        });

        const testResults = Object.values(testMap).map(t => ({
            ...t,
            percentage: t.totalMax > 0 && t.totalObtained !== null ? Math.round((t.totalObtained / t.totalMax) * 1000) / 10 : null,
        }));

        // Overall average (only include published tests)
        const publishedResults = testResults.filter(t => t.totalObtained !== null);
        const overallAvg = publishedResults.length > 0
            ? Math.round(publishedResults.reduce((s, t) => s + t.percentage, 0) / publishedResults.length * 10) / 10
            : 0;

        // Latest test result
        const latestTestResult = testResults.sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null;

        // Calculate rank in latest published test (Offline only for now)
        let latestRank = null;
        let latestTotalStudents = 0;
        if (latestTestResult && latestTestResult.type === 'offline') {
            const allMarks = await Marks.find({ testId: latestTestResult.testId });
            const studentTotals = {};
            allMarks.forEach(m => {
                if (!studentTotals[m.studentId]) studentTotals[m.studentId] = 0;
                studentTotals[m.studentId] += m.marksObtained;
            });
            const sorted = Object.entries(studentTotals).sort((a, b) => b[1] - a[1]);
            latestRank = sorted.findIndex(([id]) => parseInt(id) === studentId) + 1;
            latestTotalStudents = sorted.length;
        } else if (latestTestResult && latestTestResult.type === 'cbt') {
            const allAttempts = await TestAttempt.find({ onlineTestId: latestTestResult.testId });
            const studentTotals = {};
            allAttempts.forEach(a => {
                const sId = a.studentId;
                if (!studentTotals[sId] || a.score.totalMarks > studentTotals[sId]) {
                    studentTotals[sId] = a.score.totalMarks;
                }
            });
            const sorted = Object.entries(studentTotals).sort((a, b) => b[1] - a[1]);
            latestRank = sorted.findIndex(([id]) => parseInt(id) === studentId) + 1;
            latestTotalStudents = sorted.length;
        }

        // Subject-wise averages and accuracy (Offline)
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

        // Add CBT subject scores
        attempts.forEach(a => {
            if (!a.onlineTestId || !a.onlineTestId.questions) return;

            // Map individual question marks by subject
            const subData = {};
            a.onlineTestId.questions.forEach(q => {
                const sub = q.subject || 'General';
                if (!subData[sub]) subData[sub] = { total: 0, max: 0, correct: 0, wrong: 0, unattempted: 0 };
                subData[sub].max += (q.positiveMarks || 4);
            });

            a.answers.forEach(ans => {
                const q = a.onlineTestId.questions.find(qx => qx._id.toString() === ans.questionId.toString());
                if (!q) return;
                const sub = q.subject || 'General';

                let isCorrect = false;
                if (q.type === 'Numerical' && ans.numericalAnswer !== undefined && ans.numericalAnswer !== null) {
                    isCorrect = Math.abs(ans.numericalAnswer - q.correctNumericalAnswer) < 0.001;
                } else if ((!q.type || q.type === 'MCQ') && ans.selectedOptionIndex !== undefined) {
                    isCorrect = ans.selectedOptionIndex === q.correctOptionIndex;
                }

                if (isCorrect) {
                    subData[sub].total += (q.positiveMarks || 4);
                    subData[sub].correct++;
                } else if (ans.selectedOptionIndex !== undefined || (ans.numericalAnswer !== undefined && ans.numericalAnswer !== null)) {
                    subData[sub].total -= (q.negativeMarks || 1);
                    subData[sub].wrong++;
                } else {
                    subData[sub].unattempted++;
                }
            });

            Object.keys(subData).forEach(sub => {
                if (!subjectMap[sub]) subjectMap[sub] = { total: 0, max: 0, count: 0, correct: 0, wrong: 0, unattempted: 0 };
                subjectMap[sub].total += subData[sub].total;
                subjectMap[sub].max += subData[sub].max;
                subjectMap[sub].correct += subData[sub].correct;
                subjectMap[sub].wrong += subData[sub].wrong;
                subjectMap[sub].unattempted += subData[sub].unattempted;
                subjectMap[sub].count++; // We treat one CBT attempt as 1 entry per subject
            });
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
        const attempts = await TestAttempt.find({ studentId, status: { $in: ['submitted', 'auto-submitted-violation'] } }).populate('onlineTestId');

        // Group by test
        const testMap = {};

        // Process Offline Marks
        marks.forEach(m => {
            if (!m.testId || !m.testId.isPublished) return;
            const tid = m.testId._id.toString();
            if (!testMap[tid]) {
                testMap[tid] = {
                    testId: tid,
                    testName: m.testId.testName,
                    date: m.testId.date,
                    batch: m.testId.batch,
                    type: 'offline',
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

        // Process CBT Attempts
        attempts.forEach(a => {
            if (!a.onlineTestId || !a.onlineTestId.questions) return;
            const tid = a.onlineTestId._id.toString();

            // Re-calculate subject-wise arrays
            const subData = {};
            a.onlineTestId.questions.forEach(q => {
                const sub = q.subject || 'General';
                if (!subData[sub]) subData[sub] = { total: 0, max: 0 };
                subData[sub].max += (q.positiveMarks || 4);
            });

            a.answers.forEach(ans => {
                const q = a.onlineTestId.questions.find(qx => qx._id.toString() === ans.questionId.toString());
                if (!q) return;
                const sub = q.subject || 'General';

                let isCorrect = false;
                if (q.type === 'Numerical' && ans.numericalAnswer !== undefined && ans.numericalAnswer !== null) {
                    isCorrect = Math.abs(ans.numericalAnswer - q.correctNumericalAnswer) < 0.001;
                } else if ((!q.type || q.type === 'MCQ') && ans.selectedOptionIndex !== undefined) {
                    isCorrect = ans.selectedOptionIndex === q.correctOptionIndex;
                }

                if (isCorrect) {
                    subData[sub].total += (q.positiveMarks || 4);
                } else if (ans.selectedOptionIndex !== undefined || (ans.numericalAnswer !== undefined && ans.numericalAnswer !== null)) {
                    subData[sub].total -= (q.negativeMarks || 1);
                }
            });

            // If multiple attempts exist, only replace if score is higher
            const maxSubOverall = Object.values(subData).reduce((sum, d) => sum + d.max, 0);
            const isVisible = a.onlineTestId.showResults;

            if (!testMap[tid] || (isVisible && a.score.totalMarks > testMap[tid].totalObtained)) {
                testMap[tid] = {
                    testId: tid,
                    testName: a.onlineTestId.title,
                    date: a.endTime || a.updatedAt || a.startTime,
                    batch: a.onlineTestId.batch,
                    type: 'cbt',
                    resultsPublished: isVisible,
                    subjects: isVisible ? Object.keys(subData).map(sub => ({
                        subject: sub,
                        marksObtained: subData[sub].total,
                        totalMarks: subData[sub].max
                    })) : [],
                    totalObtained: isVisible ? a.score.totalMarks : null,
                    totalMax: maxSubOverall,
                };
            }
        });

        const results = Object.values(testMap).map(t => ({
            ...t,
            percentage: t.totalMax > 0 && t.totalObtained !== null ? Math.round((t.totalObtained / t.totalMax) * 1000) / 10 : null,
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
        const holiday = records.filter(a => a.status === 'Holiday').length;
        res.json({
            records,
            total,
            present,
            holiday,
            absent: total - present - holiday,
            percentage: total > 0 ? Math.round((present / total) * 1000) / 10 : 0,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/student/tests/:testId — Detailed test result with topic breakdown + rankings
router.get('/tests/:testId', async (req, res) => {
    try {
        const studentId = req.user.userId;
        const test = await Test.findById(req.params.testId);
        if (!test) return res.status(404).json({ message: 'Test not found' });

        // Get this student's marks for this test
        const myMarks = await Marks.find({ testId: test._id, studentId });

        // Build subject breakdown with topic details
        const subjects = test.subjects.map(sub => {
            const mark = myMarks.find(m => m.subject === sub.name);
            return {
                name: sub.name,
                totalMarks: sub.totalMarks,
                topics: sub.topics || [],
                totalQuestions: sub.totalQuestions || 0,
                marksObtained: mark?.marksObtained ?? null,
                correctAnswers: mark?.correctAnswers ?? 0,
                wrongAnswers: mark?.wrongAnswers ?? 0,
                unattempted: mark?.unattempted ?? 0,
                topicBreakdown: mark?.topicBreakdown || [],
            };
        });

        // My total
        const myTotal = myMarks.reduce((s, m) => s + m.marksObtained, 0);
        const myMax = myMarks.reduce((s, m) => s + m.totalMarks, 0);

        // Get ALL marks for this test to compute rankings
        const allMarks = await Marks.find({ testId: test._id });
        const studentTotals = {};
        allMarks.forEach(m => {
            if (!studentTotals[m.studentId]) studentTotals[m.studentId] = { total: 0, max: 0 };
            studentTotals[m.studentId].total += m.marksObtained;
            studentTotals[m.studentId].max += m.totalMarks;
        });

        // Sort by total descending
        const sorted = Object.entries(studentTotals)
            .map(([id, data]) => ({ studentId: parseInt(id), total: data.total, max: data.max }))
            .sort((a, b) => b.total - a.total);

        // Attach names and assign ranks
        const profiles = await StudentProfile.find({ studentId: { $in: sorted.map(s => s.studentId) } });
        const profileMap = {};
        profiles.forEach(p => { profileMap[p.studentId] = p.name; });

        const rankings = sorted.map((s, i) => ({
            rank: i + 1,
            studentId: s.studentId,
            name: profileMap[s.studentId] || 'Unknown',
            totalMarks: s.total,
            maxMarks: s.max,
            percentage: s.max > 0 ? Math.round((s.total / s.max) * 1000) / 10 : 0,
            isMe: s.studentId === studentId,
        }));

        const myRank = rankings.find(r => r.isMe)?.rank || null;

        res.json({
            test: {
                _id: test._id,
                testName: test.testName,
                date: test.date,
                category: test.category,
                batch: test.batch,
                positiveMarks: test.positiveMarks,
                negativeMarks: test.negativeMarks,
            },
            subjects,
            myTotal,
            myMax,
            myPercentage: myMax > 0 ? Math.round((myTotal / myMax) * 1000) / 10 : 0,
            myRank,
            totalStudents: rankings.length,
            rankings,
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

