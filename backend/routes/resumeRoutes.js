// backend/routes/resumeRoutes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  uploadResume,
  uploadMultipleResumes,
  getResumes,
  getResumeById,
  updateResume,
  deleteResume,
  compareResumes,
  reanalyzeResume,
  generateInterviewQuestions,
  analyzeATS,
  getAIStatus
} from '../controllers/resumeController.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOCX, DOC, and TXT files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Routes
router.get('/ai-status', getAIStatus);
router.post('/upload', upload.single('resume'), uploadResume);
router.post('/upload-batch', upload.array('resumes', 50), uploadMultipleResumes);
router.get('/', getResumes);
router.get('/:id', getResumeById);
router.put('/:id', updateResume);
router.delete('/:id', deleteResume);
router.post('/compare', compareResumes);
router.post('/:id/reanalyze', reanalyzeResume);
router.post('/:id/interview-questions', generateInterviewQuestions);
router.post('/:id/ats-analysis', analyzeATS);

export default router;