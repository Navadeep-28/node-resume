// backend/services/parserService.js
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs/promises';

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

  async parsePDF(filePath) {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
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
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\n]/g, '')
      .trim();
  }
}

export default new ParserService();