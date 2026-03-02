const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { readSheet, appendRow, updateCell } = require('../services/sheets');
const { scoreInterview, generateConversationalResponse, scoreFromTranscript } = require('../services/gemini');
const Retell = require('retell-sdk');

// Map topic keys to Retell Agent IDs from environment variables
const RETELL_AGENT_IDS = {
    google_ads: process.env.RETELL_AGENT_ID_GOOGLE_ADS,
    meta_ads: process.env.RETELL_AGENT_ID_META_ADS,
    seo: process.env.RETELL_AGENT_ID_SEO,
    digital_marketing: process.env.RETELL_AGENT_ID_DIGITAL_MARKETING,
    hr: process.env.RETELL_AGENT_ID_HR,
};

const retellClient = new Retell({ apiKey: process.env.RETELL_API_KEY });

const activeInterviews = new Map(); // Store generated questions temporarily to prevent cheating

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Middleware to verify JWT
const auth = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).json({ message: 'No token provided' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Unauthorized' });
        req.user = decoded;
        next();
    });
};

// GET status of all topics for the student's batch
router.get('/status', auth, async (req, res) => {
    try {
        const [batchConfigs, students] = await Promise.all([
            readSheet('BatchConfig'),
            readSheet('Students'),
        ]);
        const studentBatch = req.user.batchCode;
        const myConfigs = batchConfigs.filter(bc => bc.BatchCode === studentBatch);

        // Find this student's row to read their scores
        const studentRow = students.find(
            s => (s.Email || '').trim().toLowerCase() === (req.user.email || '').trim().toLowerCase()
        );

        const topicsList = ['meta_ads', 'google_ads', 'seo', 'digital_marketing', 'hr'];
        const status = topicsList.map(topic => {
            const config = myConfigs.find(c => c.Topic === topic);
            const score = studentRow ? (studentRow[`${topic}_Score`] || '') : '';
            return {
                topic,
                unlocked: config ? config.Unlocked === 'TRUE' : false,
                completed: score !== '',
                score,
                feedback: studentRow ? (studentRow[`${topic}_Feedback`] || '') : '',
            };
        });

        res.json(status);
    } catch (error) {
        console.error('Status Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// START interview: Get 10 random questions for a topic
router.get('/start/:topic', auth, async (req, res) => {
    const { topic } = req.params;
    try {
        // Check if unlocked first
        const batchConfigs = await readSheet('BatchConfig');
        const unlocked = batchConfigs.some(bc => bc.BatchCode === req.user.batchCode && bc.Topic === topic && bc.Unlocked === 'TRUE');

        if (!unlocked) return res.status(403).json({ message: 'This interview is currently locked for your batch.' });

        // All questions for this topic are now in a sheet named exactly like the topic
        let allQuestions = [];
        try {
            allQuestions = await readSheet(topic);
        } catch (e) {
            console.warn(`Could not read sheet ${topic}:`, e);
        }

        if (allQuestions.length === 0) return res.status(404).json({ message: 'No questions found for this topic.' });

        // Shuffle and pick 10 (or less if fewer are available)
        const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 10);

        // Remove expected answers before sending to client, but keep server state
        const sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);

        activeInterviews.set(sessionId, selected.map(q => ({
            question: q.Question,
            expected: q.ExpectedAnswer
        })));

        // Only send question text to the UI
        const clientQuestions = selected.map(q => ({
            question: q.Question,
            id: q.Question
        }));

        res.json({ sessionId, questions: clientQuestions });
    } catch (error) {
        console.error('Start Interview Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// CHAT endpoint for real conversational voice back and forth
router.post('/chat', auth, async (req, res) => {
    console.log('--- Received /chat request ---');
    console.log('Topic:', req.body.topic);
    console.log('History length:', req.body.history ? req.body.history.length : 0);
    console.log('SessionId:', req.body.sessionId);

    const { topic, history, isFinished, sessionId } = req.body;
    try {
        const questions = activeInterviews.get(sessionId) || [];
        console.log('Retrieved questions from memory:', questions.length);
        const response = await generateConversationalResponse(topic, questions, history, isFinished);
        res.json(response);
    } catch (error) {
        console.error('Chat Error:', error);
        res.status(500).json({ message: 'Server error in generating chat' });
    }
});

// CREATE RETELL WEB CALL — returns an access_token for the frontend SDK
router.post('/create-web-call', auth, async (req, res) => {
    const { topic } = req.body;

    const agentId = RETELL_AGENT_IDS[topic];
    if (!agentId) {
        return res.status(400).json({ message: `No Retell agent configured for topic: ${topic}` });
    }

    try {
        // Check topic is unlocked for this student's batch
        const batchConfigs = await readSheet('BatchConfig');
        const unlocked = batchConfigs.some(
            bc => bc.BatchCode === req.user.batchCode && bc.Topic === topic && bc.Unlocked === 'TRUE'
        );
        if (!unlocked) {
            return res.status(403).json({ message: 'This interview is currently locked for your batch.' });
        }

        const webCallResponse = await retellClient.call.createWebCall({
            agent_id: agentId,
            metadata: {
                studentEmail: req.user.email,
                studentName: req.user.name,
                topic: topic,
                batchCode: req.user.batchCode,
            },
        });
        res.json({
            access_token: webCallResponse.access_token,
            call_id: webCallResponse.call_id,
        });
    } catch (error) {
        console.error('Retell Create Web Call Error:', error);
        res.status(500).json({ message: 'Failed to create Retell web call.' });
    }
});

// SUBMIT interview
router.post('/submit', auth, async (req, res) => {
    const { topic, qaPairs, sessionId } = req.body; // qaPairs: [{ question, answer }]
    try {
        const allQuestions = activeInterviews.get(sessionId) || [];

        const scoringData = qaPairs.map(studentPair => {
            const original = allQuestions.find(q => q.question === studentPair.question);
            return {
                question: studentPair.question,
                answer: studentPair.answer,
                expected: original ? original.expected : ''
            };
        });

        const result = await scoreInterview(topic, scoringData);

        // Save the score into the Student's sheet side-by-side with their credentials
        await updateCell('Students', 'Email', req.user.email, topic, `${result.overallScore}/10 - ${result.globalFeedback.substring(0, 50)}...`);

        // Free memory
        activeInterviews.delete(sessionId);

        res.json(result);
    } catch (error) {
        console.error('Submit Interview Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// COMPLETE interview — marks as Pending in sheet, then scores via Gemini from transcript.
// Real score from Retell webhook (production) will overwrite if it arrives later.
router.post('/complete', auth, async (req, res) => {
    const { topic, transcript } = req.body;

    const scoreCol = `${topic}_Score`;
    const feedbackCol = `${topic}_Feedback`;

    try {
        // Write "Pending" immediately so Done screen starts polling
        await updateCell('Students', 'Email', req.user.email, scoreCol, 'Pending');
        await updateCell('Students', 'Email', req.user.email, feedbackCol, 'Score being analyzed by Pooja. Please check back shortly.');
        console.log(`📋 Marked interview as Pending: ${req.user.email} — ${topic}`);
    } catch (err) {
        console.error('Complete: sheet write error:', err.message);
    }

    // ✅ Respond to client immediately — DoneScreen polling begins
    res.json({
        overallScore: null,
        globalFeedback: 'Your interview has been recorded. Pooja is analyzing your answers — check your dashboard in a moment for your score! 🎯',
        questionsAsked: 0,
        status: 'pending',
    });

    // ── Score in background via Gemini using the transcript ──────────────
    // This runs AFTER the HTTP response is sent.
    // If the Retell webhook also fires (production), it will overwrite this score.
    if (Array.isArray(transcript) && transcript.length > 0) {
        (async () => {
            try {
                console.log(`🤖 Scoring transcript for ${req.user.email} — ${topic} (${transcript.length} messages)...`);
                const result = await scoreFromTranscript(topic, transcript);

                if (result && result.overallScore !== null && result.overallScore !== undefined) {
                    const scoreStr = `${result.overallScore}/10`;

                    // Write real score to Students sheet
                    await updateCell('Students', 'Email', req.user.email, scoreCol, scoreStr);
                    await updateCell('Students', 'Email', req.user.email, feedbackCol, result.globalFeedback || '');

                    // Log to Results sheet
                    try {
                        await appendRow('Results', [
                            new Date().toISOString(),
                            req.user.email,
                            req.user.batchCode || '',
                            topic,
                            scoreStr,
                            result.globalFeedback || '',
                            result.questionsAsked || 0,
                        ]);
                    } catch (e) {
                        console.warn('[Complete] Results sheet append failed:', e.message);
                    }

                    console.log(`✅ Gemini score saved: ${req.user.email} — ${topic} — ${scoreStr}`);
                } else {
                    // Gemini returned no usable score — leave as Pending for admin
                    const msg = result?.globalFeedback || 'Scoring could not be completed. Please contact admin.';
                    await updateCell('Students', 'Email', req.user.email, feedbackCol, msg);
                    console.warn(`⚠️ No score returned by Gemini for ${req.user.email} — ${topic}`);
                }
            } catch (err) {
                console.error('[Complete] Background Gemini scoring error:', err.message);
            }
        })();
    } else {
        console.warn(`[Complete] No transcript for ${req.user.email} — ${topic}. Score depends on Retell webhook only.`);
    }
});


module.exports = router;
