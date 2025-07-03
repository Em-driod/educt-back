import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is not set in your environment variables');
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const requestQueue = [];
let isProcessing = false;

async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;

  while (requestQueue.length > 0) {
    const { prompt, resolve, reject } = requestQueue.shift();

    try {
      console.log('Sending prompt to Groq...');

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: 'You are a JSON API. Always respond with a valid JSON object only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq API Error:', errorText);
        reject(new Error(`Groq API Error: ${response.status} - ${errorText}`));
        continue;
      }

      const data = await response.json();
      const content = data.choices[0].message.content.trim();
      console.log('Groq raw response:', content);

      let parsed;

      try {
        
        parsed = JSON.parse(content);
      } catch (err) {
        console.warn('it is direct JSON parse failed. Attempting fallback...');

        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsed = JSON.parse(match[0]);
          } catch (fallbackErr) {
            console.error(' Fallback parse also failed.');
            reject(new Error('Invalid the JSON format even after fallback'));
            continue;
          }
        } else {
          console.error(' No JSON found in response');
          reject(new Error('No valid JSON object found in model output'));
          continue;
        }
      }

      resolve(parsed);
    } catch (err) {
      console.error('Unexpected error talking to Groq:', err);
      reject(err);
    }
  }

  isProcessing = false;
}

function enqueueRequest(prompt) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ prompt, resolve, reject });
    processQueue();
  });
}

// --- Public APIs ---

export async function generateInsights(text) {
  const prompt = `
Strictly respond ONLY with a valid JSON object.  Respond with FULL SCALE explanations, ADD comments, NO markdown formatting.

You are an expert document analyst. Given the following document, return:
{
  "keyConcepts": [{ "section": string, "explanation": string }],
  "readingGuide": [string],
  "relatedBooks": [{ "title": string, "author": string }],
  "contextualExplanation": [{ "section": string, "explanation": string }],
  "importantSections": [{ "section": string, "explanation": string }]
}

Document:
"""${text}"""
`;

  return enqueueRequest(prompt);
}

export async function generateAnalysis(text) {
  const prompt = `
Strictly respond ONLY with a valid JSON object.  include FULL SCALE explanations, ADD comments, No markdown formatting.

You are an expert analyst. Given the following document, return:
{
  "summary": [{ "section": string, "explanation": string }],
  "keyPoints": [{ "section": string, "explanation": string }],
  "actionItems": [{ "section": string, "explanation": string }],
  "followUpQuestions": [{ "section": string, "explanation": string }],
  "technicalTerms": [{ "term": string, "definition": string }]
}

Document:
"""${text}"""
`;

  return enqueueRequest(prompt);
}
