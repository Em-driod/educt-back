import express from 'express';
import { handleFileUpload } from '../controller/aiController.js';

const router = express.Router();

// POST /api/analyze
router.post('/analyze', handleFileUpload);

export default router;