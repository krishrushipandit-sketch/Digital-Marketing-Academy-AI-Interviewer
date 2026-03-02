const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { readSheet, updateCellByTwoKeys, appendRow, updateCell } = require('../services/sheets');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Middleware to verify Admin JWT
const adminAuth = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).json({ message: 'No token provided' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err || decoded.role !== 'admin') return res.status(401).json({ message: 'Unauthorized Admin' });
        req.user = decoded;
        next();
    });
};

// GET all batches and their topic unlock status
router.get('/batches', adminAuth, async (req, res) => {
    try {
        const batchConfigs = await readSheet('BatchConfig');
        // Group by BatchCode
        const batches = {};
        batchConfigs.forEach(bc => {
            if (!batches[bc.BatchCode]) batches[bc.BatchCode] = [];
            batches[bc.BatchCode].push({
                topic: bc.Topic,
                unlocked: bc.Unlocked === 'TRUE'
            });
        });
        res.json(batches);
    } catch (error) {
        console.error('Admin Batches Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Toggle topic unlock
router.put('/batches/:batchCode/topic/:topic', adminAuth, async (req, res) => {
    const { batchCode, topic } = req.params;
    const { unlocked } = req.body; // boolean
    console.log(`[Admin] Toggling topic ${topic} for ${batchCode} to ${unlocked}`);
    try {
        await updateCellByTwoKeys('BatchConfig', 'BatchCode', batchCode, 'Topic', topic, 'Unlocked', unlocked ? 'TRUE' : 'FALSE');
        res.json({ message: 'Status updated' });
    } catch (error) {
        console.error('Toggle Unlock Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new batch
router.post('/batches', adminAuth, async (req, res) => {
    const { batchCode } = req.body;
    try {
        const topics = ['meta_ads', 'google_ads', 'seo', 'digital_marketing', 'hr'];
        for (const topic of topics) {
            await appendRow('BatchConfig', {
                BatchCode: batchCode,
                Topic: topic,
                Unlocked: 'FALSE'
            });
        }
        res.json({ message: `Batch ${batchCode} created` });
    } catch (error) {
        console.error('Create Batch Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET all students with their topic scores
router.get('/students', adminAuth, async (req, res) => {
    try {
        const students = await readSheet('Students');
        const topics = ['meta_ads', 'google_ads', 'seo', 'digital_marketing', 'hr'];
        const safeStudents = students.map(s => {
            const topicData = {};
            topics.forEach(t => {
                topicData[`${t}_Score`] = s[`${t}_Score`] || '';
                topicData[`${t}_Feedback`] = s[`${t}_Feedback`] || '';
            });
            return { email: s.Email, name: s.Name, batchCode: s.BatchCode, ...topicData };
        });
        res.json(safeStudents);
    } catch (error) {
        console.error('Admin Students Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// RESET a student's topic so they can retake (admin only)
router.delete('/students/:email/reset/:topic', adminAuth, async (req, res) => {
    const { email, topic } = req.params;
    const decodedEmail = decodeURIComponent(email);

    console.log(`[Reset] Resetting ${decodedEmail} — ${topic}`);

    try {
        // Write empty string to clear score and feedback
        await updateCell('Students', 'Email', decodedEmail, `${topic}_Score`, '');
        await updateCell('Students', 'Email', decodedEmail, `${topic}_Feedback`, '');
        console.log(`[Reset] ✅ Done: ${decodedEmail} — ${topic}`);
        res.json({ message: `Reset ${topic} for ${decodedEmail} successfully.` });
    } catch (error) {
        console.error('[Reset] Error:', error.message, '| email:', decodedEmail, '| topic:', topic);
        res.status(500).json({ message: `Failed to reset: ${error.message}` });
    }
});


// GET all results
router.get('/results', adminAuth, async (req, res) => {
    try {
        const results = await readSheet('Results');
        res.json(results);
    } catch (error) {
        console.error('Admin Results Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
