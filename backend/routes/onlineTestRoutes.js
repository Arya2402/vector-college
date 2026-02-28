const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const { protect, authorize } = require('../middleware/authMiddleware');
const OnlineTest = require('../models/OnlineTest');
const TestAttempt = require('../models/TestAttempt');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer
const upload = multer({ storage: multer.memoryStorage() });

// ---------------------------------------------------------
// IMAGE UPLOAD (Director/Admin only)
// ---------------------------------------------------------
router.post('/upload-image', protect, authorize('admin', 'director'), upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'vector-college/cbt-questions' },
        (error, result) => {
            if (error) {
                console.error('Cloudinary upload error:', error);
                return res.status(500).json({ message: 'Failed to upload image' });
            }
            res.json({ imageUrl: result.secure_url });
        }
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
});

// ---------------------------------------------------------
// DIRECTOR / ADMIN TEST MANAGEMENT
// ---------------------------------------------------------

// Create new online test
router.post('/', protect, authorize('admin', 'director'), async (req, res) => {
    try {
        const testData = { ...req.body, createdBy: req.user.userId };
        const test = await OnlineTest.create(testData);
        res.status(201).json(test);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all tests (Director/Admin see all, Students see active for their batch)
router.get('/', protect, async (req, res) => {
    try {
        let filter = {};

        if (req.user.role === 'student') {
            filter.status = 'active'; // Strategy: maybe add batch filter later if needed
            // Select only safe fields for student to see before joining
            const tests = await OnlineTest.find(filter).select('-questions.correctOptionIndex -password').sort({ createdAt: -1 });
            return res.json(tests);
        } else {
            // Admin / Director
            const tests = await OnlineTest.find(filter).sort({ createdAt: -1 });
            return res.json(tests);
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single test detail
router.get('/:id', protect, async (req, res) => {
    try {
        const test = await OnlineTest.findById(req.params.id);
        if (!test) return res.status(404).json({ message: 'Test not found' });

        if (req.user.role === 'student') {
            // Don't send passwords and correct answers if it's a student viewing test detail outside attempt
            const safeTest = test.toObject();
            delete safeTest.password;
            safeTest.questions.forEach(q => delete q.correctOptionIndex);
            return res.json(safeTest);
        }

        res.json(test);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update test
router.put('/:id', protect, authorize('admin', 'director'), async (req, res) => {
    try {
        const test = await OnlineTest.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!test) return res.status(404).json({ message: 'Test not found' });
        res.json(test);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete test
router.delete('/:id', protect, authorize('admin', 'director'), async (req, res) => {
    try {
        await OnlineTest.findByIdAndDelete(req.params.id);
        await TestAttempt.deleteMany({ onlineTestId: req.params.id });
        res.json({ message: 'Test and attempts deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get live attempts for a test
router.get('/:id/live', protect, authorize('admin', 'director'), async (req, res) => {
    try {
        const attempts = await TestAttempt.find({ onlineTestId: req.params.id }).sort({ updatedAt: -1 });
        res.json(attempts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Toggle results visibility
router.patch('/:id/toggle-results', protect, authorize('admin', 'director'), async (req, res) => {
    try {
        const test = await OnlineTest.findById(req.params.id);
        if (!test) return res.status(404).json({ message: 'Test not found' });
        test.showResults = !test.showResults;
        await test.save();
        res.json(test);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ---------------------------------------------------------
// STUDENT TEST EXECUTION
// ---------------------------------------------------------

// Check password and create attempt
router.post('/:id/start', protect, authorize('student'), async (req, res) => {
    try {
        const { password } = req.body;
        const test = await OnlineTest.findById(req.params.id);

        if (!test || test.status !== 'active') {
            return res.status(404).json({ message: 'Test not active or found' });
        }

        // Timing enforcement
        const now = new Date();
        if (test.startTime && now < new Date(test.startTime)) {
            return res.status(403).json({ message: 'Test has not started yet' });
        }
        if (test.endTime && now > new Date(test.endTime)) {
            return res.status(403).json({ message: 'Test has ended' });
        }

        if (test.password && test.password !== password) {
            return res.status(401).json({ message: 'Incorrect test password' });
        }

        const existingAttemptsCount = await TestAttempt.countDocuments({
            onlineTestId: test._id,
            studentId: req.user.userId
        });

        if (existingAttemptsCount >= test.maxAttempts) {
            return res.status(403).json({ message: 'Maximum attempts reached' });
        }

        // Check if there is an in-progress attempt already
        let activeAttempt = await TestAttempt.findOne({
            onlineTestId: test._id,
            studentId: req.user.userId,
            status: 'in-progress'
        });

        if (!activeAttempt) {
            activeAttempt = await TestAttempt.create({
                studentId: req.user.userId,
                onlineTestId: test._id,
                attemptNumber: existingAttemptsCount + 1,
            });
        }

        res.status(201).json(activeAttempt);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Ping fullscreen warnings
router.post('/attempt/:attemptId/ping', protect, authorize('student'), async (req, res) => {
    try {
        const { fullscreenExits } = req.body;
        const attempt = await TestAttempt.findOneAndUpdate(
            { _id: req.params.attemptId, studentId: req.user.userId, status: 'in-progress' },
            { fullscreenExits },
            { new: true }
        );
        if (!attempt) return res.status(404).json({ message: 'Active attempt not found' });
        res.json(attempt);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Final submit and scoring
router.post('/attempt/:attemptId/submit', protect, authorize('student'), async (req, res) => {
    try {
        const { answers, autoSubmitReason } = req.body; // answers is array of { questionId, selectedOptionIndex }

        const attempt = await TestAttempt.findOne({ _id: req.params.attemptId, studentId: req.user.userId });
        if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
        if (attempt.status !== 'in-progress') return res.status(400).json({ message: 'Attempt already submitted' });

        const test = await OnlineTest.findById(attempt.onlineTestId);

        let correct = 0;
        let wrong = 0;
        let unattempted = 0;
        let totalMarks = 0;

        const formattedAnswers = [];

        test.questions.forEach(q => {
            const studentAns = answers.find(a => String(a.questionId) === String(q._id));

            if (!studentAns || (studentAns.selectedOptionIndex == null && studentAns.numericalAnswer == null)) {
                unattempted++;
                formattedAnswers.push({ questionId: q._id });
            } else {
                let isCorrect = false;

                if (q.type === 'Numerical') {
                    if (Number(studentAns.numericalAnswer) === Number(q.correctNumericalAnswer)) {
                        isCorrect = true;
                    }
                    formattedAnswers.push({ questionId: q._id, numericalAnswer: studentAns.numericalAnswer });
                } else {
                    // Default MCQ
                    if (parseInt(studentAns.selectedOptionIndex) === q.correctOptionIndex) {
                        isCorrect = true;
                    }
                    formattedAnswers.push({ questionId: q._id, selectedOptionIndex: parseInt(studentAns.selectedOptionIndex) });
                }

                if (isCorrect) {
                    correct++;
                    totalMarks += q.positiveMarks;
                } else {
                    wrong++;
                    totalMarks -= q.negativeMarks;
                }
            }
        });

        attempt.status = autoSubmitReason ? 'auto-submitted-violation' : 'submitted';
        attempt.endTime = Date.now();
        attempt.answers = formattedAnswers;
        attempt.score = {
            totalMarks,
            correctAnswers: correct,
            wrongAnswers: wrong,
            unattempted
        };

        if (req.body.fullscreenExits !== undefined) {
            attempt.fullscreenExits = req.body.fullscreenExits;
        }

        await attempt.save();
        res.json(attempt);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Analysis for Director
router.get('/:id/analysis', protect, authorize('admin', 'director'), async (req, res) => {
    try {
        const test = await OnlineTest.findById(req.params.id);
        if (!test) return res.status(404).json({ message: 'Test not found' });

        const attempts = await TestAttempt.find({ onlineTestId: req.params.id }).sort({ 'score.totalMarks': -1 });

        // Populate student names
        const studentIds = attempts.map(a => a.studentId);
        const profiles = await StudentProfile.find({ studentId: { $in: studentIds } });
        const profileMap = {};
        profiles.forEach(p => { profileMap[p.studentId] = p.name; });

        const results = attempts.map(a => ({
            ...a._doc,
            studentName: profileMap[a.studentId] || `Student #${a.studentId}`
        }));

        // Basic stats
        const summary = {
            totalAttempts: attempts.length,
            highScore: attempts.length > 0 ? Math.max(...attempts.map(a => a.score?.totalMarks || 0)) : 0,
            avgScore: attempts.length > 0 ? Math.round(attempts.reduce((acc, a) => acc + (a.score?.totalMarks || 0), 0) / attempts.length) : 0
        };

        res.json({ test, attempts: results, summary });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
