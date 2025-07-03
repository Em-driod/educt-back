// service/fileParser.js

import mammoth from 'mammoth';
import extract from 'pdf-extraction'; // NEW: Import pdf-extraction

export async function extractTextFromBuffer(buffer, mimetype, filename = '') {
  console.log(`[DEBUG] Starting extraction for ${filename || mimetype}`);

  try {
    const isPDF = mimetype === 'application/pdf' ||
                  filename.toLowerCase().endsWith('.pdf');
    const isDOCX = mimetype?.includes('officedocument.wordprocessingml.document') ||
                   filename.toLowerCase().endsWith('.docx');

    if (isPDF) {
      console.log('[DEBUG] Processing PDF file with pdf-extraction...');
      try {
        // pdf-extraction expects a Buffer as input
        const data = await extract(buffer);
        const extractedText = data.text || ''; // Get the extracted text

        if (!extractedText || extractedText.trim().length === 0) {
          console.warn('[WARNING] . This might be a scanned PDF, empty, or a very complex layout.');
          // Even if not robust, we still need to throw if no text is found,
          // otherwise, your AI services will receive empty input.
          throw new Error('No readable text found in PDF. It might be an image-only document or has a complex structure.');
        }

        console.log(`[DEBUG] Successfully extracted ${extractedText.length} characters from PDF using pdf-extraction.`);
        return extractedText;

      } catch (pdfError) {
        console.error('[ERROR] pdf-extraction failed:', pdfError.message);
        // We'll keep error messages simple here, focusing on "something that can work"
        throw new Error(`Failed to extract text from PDF: ${pdfError.message}. The PDF might be corrupted or unsupported.`);
      }
    }

    if (isDOCX) {
      console.log('[DEBUG] Processing DOCX file with mammoth...');
      try {
        const { value } = await mammoth.extractRawText({ buffer });
        const extractedText = value || '';
        if (!extractedText || extractedText.trim().length === 0) {
          console.warn('[WARNING] mammoth extracted no readable text from DOCX.');
          throw new Error('No readable text found in DOCX file. It might be empty or corrupted.');
        }
        console.log(`[DEBUG] Successfully extracted ${extractedText.length} characters from DOCX.`);
        return extractedText;
      } catch (docXError) {
        console.error('[ERROR] mammoth failed:', docXError.message);
        throw new Error(`Failed to extract text from DOCX: ${docXError.message}. The file might be corrupted or in an unsupported DOCX format.`);
      }
    }

    throw new Error(`Unsupported file type: ${mimetype || filename}. Only PDF and DOCX are supported.`);
  } catch (error) {
    console.error('[ERROR] Overall file extraction failed:', error.message);
    throw new Error(`File extraction failed: ${error.message}`);
  }
}

export async function validateExtraction(text) {
  if (!text || !text.trim()) {
    throw new Error('No text content extracted after validation.');
  }
  console.log('[VALIDATION] First 500 characters:', text.slice(0, 500));
  return text;
}