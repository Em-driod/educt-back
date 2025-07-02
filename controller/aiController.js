import { extractTextFromBuffer } from '../service/fileParser.js';
import { digestWithAI } from '../service/aiService.js';

// For file upload
export async function handleFileUpload(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const text = await extractTextFromBuffer(req.file.buffer, req.file.mimetype);
    res.json({ 
      success: true,
      message: 'File uploaded successfully',
      text: text.substring(0, 500) + '...' // Return partial text for preview
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// For file analysis
export async function handleFileAnalysis(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const text = await extractTextFromBuffer(req.file.buffer, req.file.mimetype);
    const analysis = await digestWithAI(text);
    
    res.json({
      success: true,
      points: analysis.keyPoints,
      summary: analysis.summary,
      pageCount: analysis.pageCount,
      wordCount: analysis.wordCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}