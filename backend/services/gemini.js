const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Note: We use gemini-1.5-flash for the JSON scoring task, and gemini-2.5-flash for the voice chat.

/**
 * Generates the next back-and-forth conversational piece including audio payload.
 */
async function generateConversationalResponse(topic, questions, history, isFinished) {
  // Force the conversational model to 2.5 Flash as requested by user
  const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const questionsString = questions.map((q, i) => `Question ${i + 1}: ${q.question} (Expected concept: ${q.expected})`).join('\n');
  let systemInstruction = `You are a professional Interviewer for a Digital Marketing Academy assessing a student on ${topic.toUpperCase().replace('_', ' ')}.
The total number of questions is ${questions.length}.
Here is your required list of questions to ask:
${questionsString}

Instructions:
1. Speak concisely and naturally like a human interviewer.
2. If the user is just starting (e.g., saying Hello), introduce yourself and immediately ask Question 1.
3. For subsequent user answers, give extremely brief feedback (1 short sentence) on their previous answer naturally, then pivot and ask the NEXT question from your list.
4. Do NOT ask multiple questions at once. Only ask one question at a time.
5. Once all questions have been asked and answered, say "Thank you, that concludes our questions. I will now process your final feedback." Do not ask anything else.`;

  if (isFinished) {
    systemInstruction = `The interview is completely finished. The student has answered all questions. 
Give them an encouraging final verbal feedback summary (3-4 sentences max) based on their overall interview performance found in the chat history. Do not ask any further questions.`;
  }

  try {
    const result = await chatModel.generateContent({
      contents: history,
      systemInstruction
    });

    const response = await result.response;
    const textPart = response.candidates[0].content.parts.find(p => p.text);

    return {
      text: textPart ? textPart.text : '',
      audioBase64: null
    };
  } catch (err) {
    console.error('Gemini Chat Error:', err.message);
    throw err;
  }
}

/**
 * Scores an interview session based on student answers and expected points.
 * @param {string} topic 
 * @param {Array} qaPairs [{ question, answer, expected }]
 */
async function scoreInterview(topic, qaPairs) {
  const prompt = `
    You are an expert interviewer in Digital Marketing. 
    Topic: ${topic}
    
    Below are 10 questions asked and the student's spoken answers (transcribed by STT, may have minor typos).
    For each pair, provide:
    1. A score from 0 to 1 (e.g. 0.8) based on accuracy and completeness compared to professional standards.
    2. Brief constructive feedback (1 sentence).

    Data:
    ${JSON.stringify(qaPairs, null, 2)}

    Return ONLY a JSON object in this exact format:
    {
      "overallScore": number (out of 10),
      "perQuestion": [
        { "score": number, "feedback": "string" },
        ...
      ],
      "globalFeedback": "string summarizing main strengths and weaknesses"
    }
  `;

  try {
    const scoreModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await scoreModel.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean JSON if it has markdown blocks
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini Scoring Error:', error);
    // Fallback if AI fails
    return {
      overallScore: 0,
      perQuestion: qaPairs.map(() => ({ score: 0, feedback: "Error processing score" })),
      globalFeedback: "Technical error during scoring. Please contact admin."
    };
  }
}

/**
 * Scores a voice interview from a full ElevenLabs conversation transcript.
 * @param {string} topic
 * @param {Array} transcript  [{ role: 'agent'|'user', text: string }]
 */
async function scoreFromTranscript(topic, transcript) {
  const transcriptText = transcript
    .map(m => `${m.role === 'agent' ? 'Interviewer (Pooja)' : 'Student'}: ${m.text}`)
    .join('\n');

  const prompt = `
You are an expert evaluator for a Digital Marketing Academy.

Topic of the interview: ${topic.replace('_', ' ').toUpperCase()}

Below is the full transcript of a voice interview between "Interviewer (Pooja)" and the "Student":

---
${transcriptText}
---

Based ONLY on the student's answers in the transcript above:
1. Give an overall score out of 10 (decimal allowed, e.g. 7.5).
2. Write 2-3 sentences of constructive feedback highlighting strengths and areas to improve.
3. Count how many distinct questions were asked.

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "overallScore": <number 0-10>,
  "globalFeedback": "<string>",
  "questionsAsked": <number>
}
`;

  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 15000; // 15s between retries for rate limits

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const scoreModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
      const result = await scoreModel.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text);
    } catch (error) {
      const isRateLimit = error.status === 429;
      console.error(`Gemini Transcript Scoring Error (attempt ${attempt}/${MAX_RETRIES}):`, error.status || error.message);

      if (isRateLimit && attempt < MAX_RETRIES) {
        console.log(`Rate limited. Retrying in ${RETRY_DELAY_MS / 1000}s...`);
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }

      // Final fallback after all retries
      return {
        overallScore: null,
        globalFeedback: isRateLimit
          ? 'Score pending: AI scoring service is busy. The admin will update your score shortly.'
          : 'Scoring could not be completed at this time. Please contact admin.',
        questionsAsked: 0,
      };
    }
  }
}

module.exports = { scoreInterview, generateConversationalResponse, scoreFromTranscript };
