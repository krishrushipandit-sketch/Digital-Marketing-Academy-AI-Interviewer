const express = require('express');
const router = express.Router();
const { updateCell } = require('../services/sheets');

/**
 * POST /api/webhook/retell
 *
 * Retell calls this after every call ends.
 * It sends the full transcript + post-call analysis (score, call_summary, user_sentiment etc.)
 *
 * Configure in Retell Dashboard:
 *   Dashboard → Webhooks → Add URL → https://yourdomain.com/api/webhook/retell
 *   Events: call_ended
 */
router.post('/retell', async (req, res) => {
    // ✅ Acknowledge Retell IMMEDIATELY (must respond < 5s or Retell retries)
    res.sendStatus(200);

    try {
        const { event, call } = req.body;

        if (!call) {
            console.log('[Webhook] No call object — ignoring.');
            return;
        }

        console.log(`[Webhook] Event: ${event} | Call ID: ${call.call_id} | Status: ${call.call_status}`);

        if (event !== 'call_ended') return;

        // ── Extract student identity from metadata (set when call was created) ──
        const { metadata, call_analysis } = call;

        if (!metadata?.studentEmail || !metadata?.topic) {
            console.warn('[Webhook] Missing metadata (studentEmail/topic) — cannot save score.');
            return;
        }

        const { studentEmail, topic } = metadata;

        // ── Extract score + feedback from Retell Post-Call Data Extraction ──
        const custom = call_analysis?.custom_analysis_data || {};

        // Score — from your custom "score" field in Retell's post-call analysis
        const rawScore = custom.score ?? custom.Score ?? null;

        // Feedback — Retell's auto-generated Call Summary
        const feedback = call_analysis?.call_summary
            || custom.summary
            || custom.feedback
            || 'Interview analysis complete.';

        // Sentiment for logging
        const sentiment = call_analysis?.user_sentiment || 'N/A';
        const callSuccess = call_analysis?.call_successful ?? true;

        if (rawScore === null) {
            console.warn(`[Webhook] No score in post-call analysis for ${studentEmail} — ${topic}. custom_analysis_data:`, JSON.stringify(custom));
            // Still save the feedback/summary even if score is missing
            try {
                await updateCell('Students', 'Email', studentEmail, `${topic}_Feedback`, feedback);
            } catch (e) { console.error('[Webhook] Sheet feedback write error:', e.message); }
            return;
        }

        const scoreStr = `${rawScore}/10`;

        // ── Save to Google Sheets ──
        await updateCell('Students', 'Email', studentEmail, `${topic}_Score`, scoreStr);
        await updateCell('Students', 'Email', studentEmail, `${topic}_Feedback`, feedback);

        console.log(`✅ [Webhook] Saved score for ${studentEmail} | ${topic} | Score: ${scoreStr} | Sentiment: ${sentiment} | Success: ${callSuccess}`);

    } catch (err) {
        console.error('[Webhook] Error processing webhook:', err.message || err);
    }
});

module.exports = router;
