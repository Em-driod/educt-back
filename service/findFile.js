import fs from 'fs/promises';
import path from 'path';

async function findFile(startPath, filename) {
  try {
    const entries = await fs.readdir(startPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(startPath, entry.name);

      if (entry.isFile() && entry.name === filename) {
        return fullPath;  // Found the file, return path
      } else if (entry.isDirectory()) {
        // Recursively search inside subfolders
        const found = await findFile(fullPath, filename);
        if (found) return found;
      }
    }
    return null; // Not found in this directory or its subdirs
  } catch (err) {
    // Permission denied or other errors — just ignore and continue
    return null;
  }
}

// Usage example:
const startDirectory = 'C:/Users/HELLO/Desktop/educt/educt-back';  // change this to your root folder
const fileToFind = '05-versions-space.pdf';

findFile(startDirectory, fileToFind)
  .then((result) => {
    if (result) {
      console.log(`🎯 File found at: ${result}`);
    } else {
      console.log(`❌ File "${fileToFind}" not found starting from "${startDirectory}"`);
    }
  })
  .catch(console.error);




  // server.js
  import express from 'express';
  import cors from 'cors';
  import multer from 'multer';
  
  // Import functions from dedicated service files
  import { extractTextFromBuffer } from './service/fileParser.js';
  import { generateInsights, generateAnalysis, generateContentWithLLM } from './service/aiserver.js '; // Updated: generateContentWithLLM imported here
  import { buildTacticalContentPrompt } from './utils/promptUtils.js'; // New: Import prompt builder
  
  const app = express();
  const PORT = process.env.PORT || 5000;
  
  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 25 * 1024 * 1024, // 25MB
      files: 1
    }
  });
  
  // --- Middleware ---
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  
  // --- Static File Serving ---
  
  // --- Routes ---
  
  // Existing File Analysis Endpoints
  app.post('/api/insights', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
  
      const text = await extractTextFromBuffer(req.file.buffer, req.file.mimetype);
      const insights = await generateInsights(text); // Assuming generateInsights is in aiService.js
  
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
      const analysis = await generateAnalysis(text); // Assuming generateAnalysis is in aiService.js
  
      res.json({
        success: true,
        ...analysis
      });
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ error: error.message || 'An internal server error occurred for analysis.' });
    }
  });
  
  // New: Tactical Content Generation Endpoint
  app.post('/api/generate-content', async (req, res) => {
    try {
      const {
        contentType = 'strategy',
        topic,
        tactics = [],
        tone = 'professional',
        length = 'medium',
        complexity = 'intermediate',
        audience = '',
        keywords = '',
        examples = 'yes',
      } = req.body;
  
      // Basic validation matching your frontend
      if (!topic || topic.trim() === '') {
        return res.status(400).json({ message: "Topic is required." });
      }
      if (tactics.length === 0) {
        return res.status(400).json({ message: "At least one tactical approach is required." });
      }
  
      // Build the prompt using the utility function
      const prompt = buildTacticalContentPrompt({
        contentType,
        topic,
        tactics,
        tone,
        length,
        complexity,
        audience,
        keywords,
        examples,
      });
  
      console.log(`--- Generated LLM Prompt ---\n${prompt}\n----------------------------`);
  
      // Call the LLM to generate content using the service function
      const generatedText = await generateContentWithLLM(prompt);
  
      res.status(200).json({ content: generatedText });
  
    } catch (error) {
      console.error("Content Generation Error:", error);
      res.status(500).json({ message: error.message || "An internal server error occurred during content generation. Please try again." });
    }
  });
  
  
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });