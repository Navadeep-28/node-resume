// backend/services/parserService.js
import fs from 'fs/promises';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import mammoth from 'mammoth';

class ParserService {
  async parseFile(filePath, mimeType) {
    try {
      let text = '';
      
      switch (mimeType) {
        case 'application/pdf':
          text = await this.parsePDF(filePath);
          break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          text = await this.parseDocx(filePath);
          break;
        case 'text/plain':
          text = await this.parseText(filePath);
          break;
        default:
          throw new Error(`Unsupported file type: ${mimeType}`);
      }
      
      return this.cleanText(text);
    } catch (error) {
      console.error('Error parsing file:', error);
      throw error;
    }
  }

  // UPDATED: Using pdfjs-dist which is much more robust against XRef errors
  async parsePDF(filePath) {
    const dataBuffer = await fs.readFile(filePath);
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(dataBuffer),
      useSystemFonts: true,
      disableFontFace: true,
      verbosity: 0 // Suppress warnings like "bad XRef entry"
    });

    const doc = await loadingTask.promise;
    const numPages = doc.numPages;
    let fullText = '';

    // Extract text from each page
    for (let i = 1; i <= numPages; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  }

  async parseDocx(filePath) {
    const dataBuffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer: dataBuffer });
    return result.value;
  }

  async parseText(filePath) {
    return await fs.readFile(filePath, 'utf-8');
  }

  cleanText(text) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
      .trim();
  }
}

export default new ParserService();