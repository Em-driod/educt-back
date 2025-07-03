// server.js
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();

// Import functions from dedicated service files
import { extractTextFromBuffer } from './service/fileParser.js';
import { generateInsights, generateAnalysis } from './service/aiService.js';
import { generateContentWithLLM } from './service/aiserver.js';


const app = express();
const PORT = process.env.PORT || 5000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 1
  }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- API Endpoints ---

app.post('/api/insights', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const text = await extractTextFromBuffer(req.file.buffer, req.file.mimetype);
    const insights = await generateInsights(text);

    res.json({
      success: true,
      ...insights
    });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ error: error.message || 'An internal server error occurred for insights.' });
  }
});

app.post('/api/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const text = await extractTextFromBuffer(req.file.buffer, req.file.mimetype);
    const analysis = await generateAnalysis(text);

    res.json({
      success: true,
      ...analysis
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message || 'An internal server error occurred for analysis.' });
  }
});

// Updated Tactical Content Generation Endpoint
app.post('/api/generate-content', async (req, res) => {
  try {
    const {
      contentType = 'strategy',
      topic,
      tactics = [],
      tone = 'professional',
      length = 'medium',
      complexity = 'intermediate',
      audience = 'general business audience',
      keywords = '',
      examples = 'yes',
      humorLevel = 'none'
    } = req.body;

    // Enhanced validation
    if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
      return res.status(400).json({ 
        error: "Invalid topic",
        message: "Please provide a valid topic (at least 3 characters)."
      });
    }

    if (!Array.isArray(tactics) || tactics.length === 0) {
      return res.status(400).json({ 
        error: "Invalid tactics",
        message: "Please provide at least one valid tactical approach."
      });
    }

    console.log('Received content generation request with:', {
      contentType,
      topic,
      tactics,
      tone,
      length,
      complexity,
      audience,
      keywords,
      examples,
      humorLevel
    });

   
    const generatedText = await generateContentWithLLM({
      contentType,
      topic,
      tactics,
      tone,
      length,
      complexity,
      audience,
      keywords,
      examples,
      humorLevel
    });

    res.status(200).json({ 
      success: true,
      content: generatedText 
    });

  } catch (error) {
    console.error("Content Generation Error:", error);
    res.status(500).json({ 
      error: "Content generation failed",
      message: error.message || "An internal server error occurred during content generation."
    });
  }
});

// --- Server Initialization ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});