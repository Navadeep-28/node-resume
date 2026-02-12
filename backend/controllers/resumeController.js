// backend/controllers/resumeController.js
import mongoose from 'mongoose';
import Resume from '../models/Resume.js';
import Job from '../models/Job.js';
import parserService from '../services/parserService.js';
import nlpService from '../services/nlpService.js';
import aiService from '../services/aiService.js';
import fs from 'fs/promises';

// Helper to pause execution (for rate limiting)
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export const uploadResume = async (req, res) => {
  try {
    const io = req.app.get('io');
    const file = req.file;
    const { jobId, analysisMode = 'ai' } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // FIX: Ensure jobId is a valid MongoDB ObjectId, otherwise set to null
    const validJobId = (jobId && mongoose.Types.ObjectId.isValid(jobId)) ? jobId : null;

    // 1. Create initial resume record
    const resume = new Resume({
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      status: 'processing',
      jobId: validJobId
    });

    await resume.save();

    // 2. Emit processing started
    if (io) {
      io.emit('resume-processing', {
        resumeId: resume._id,
        status: 'started',
        progress: 10,
        message: 'Starting analysis...'
      });
    }

    // 3. Parse the file
    let text = '';
    try {
      text = await parserService.parseFile(file.path, file.mimetype);
    } catch (parseError) {
      console.error('Parsing error:', parseError);
      resume.status = 'failed';
      await resume.save();
      return res.status(500).json({ error: 'Failed to parse resume file' });
    }
    
    resume.rawText = text;

    if (io) {
      io.emit('resume-processing', {
        resumeId: resume._id,
        status: 'parsing-complete',
        progress: 30,
        message: 'Text extracted, analyzing...'
      });
    }

    // 4. Get job requirements if jobId provided
    let jobRequirements = null;
    if (validJobId) {
      try {
        const job = await Job.findById(validJobId);
        if (job) {
          jobRequirements = job.requirements;
        }
      } catch (jobError) {
        console.warn('Job lookup failed:', jobError);
      }
    }

    if (io) {
      io.emit('resume-processing', {
        resumeId: resume._id,
        status: 'analyzing',
        progress: 50,
        message: analysisMode === 'ai' ? '🤖 Analyzing with AI...' : '⚡ Analyzing patterns...'
      });
    }

    // 5. Analyze with NLP/AI
    let analysis;
    try {
      analysis = await nlpService.analyzeResume(text, jobRequirements, analysisMode);
    } catch (analysisError) {
      console.error('Analysis error:', analysisError);
      // Fallback to empty analysis if service fails completely
      analysis = {
        contact: {},
        skills: { categorized: {}, totalSkills: 0 },
        experience: { totalYears: 0 },
        education: { degrees: [] },
        matchScore: { overallScore: 0 }
      };
    }

    resume.analysis = analysis;
    if (analysis && analysis.matchScore) {
      resume.matchScore = analysis.matchScore;
    }
    resume.status = 'completed';

    // 6. Save final result
    await resume.save();

    // Update job applicants count
    if (validJobId) {
      try {
        await Job.findByIdAndUpdate(validJobId, { $inc: { applicantsCount: 1 } });
      } catch (e) {
        console.warn('Failed to update job applicant count');
      }
    }

    if (io) {
      io.emit('resume-processing', {
        resumeId: resume._id,
        status: 'completed',
        progress: 100,
        message: 'Analysis complete!',
        data: resume
      });
    }

    // 7. Clean up uploaded file
    try {
      await fs.unlink(file.path);
    } catch (e) {
      console.warn('Failed to delete temp file:', e);
    }

    res.status(201).json(resume);
  } catch (error) {
    console.error('❌ Upload Critical Error:', error);
    
    // Attempt to log validation errors if Mongoose fails
    if (error.name === 'ValidationError') {
      console.error('Validation Details:', JSON.stringify(error.errors, null, 2));
    }

    res.status(500).json({ 
      error: 'Resume processing failed', 
      details: error.message 
    });
  }
};

export const uploadMultipleResumes = async (req, res) => {
  try {
    const io = req.app.get('io');
    const files = req.files;
    const { jobId, analysisMode = 'ai' } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // FIX: Ensure jobId is a valid MongoDB ObjectId
    const validJobId = (jobId && mongoose.Types.ObjectId.isValid(jobId)) ? jobId : null;

    let jobRequirements = null;
    if (validJobId) {
      const job = await Job.findById(validJobId);
      if (job) {
        jobRequirements = job.requirements;
      }
    }

    const results = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // --- RATE LIMIT FIX: Wait 4 seconds between resumes ---
      if (i > 0) {
        console.log('⏳ Cooling down for API rate limits...');
        await sleep(4000); 
      }
      // ----------------------------------------------------
      
      if (io) {
        io.emit('batch-processing', {
          current: i + 1,
          total: totalFiles,
          fileName: file.originalname,
          progress: Math.round(((i + 1) / totalFiles) * 100),
          message: `Processing ${file.originalname}...`
        });
      }

      try {
        const resume = new Resume({
          fileName: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          status: 'processing',
          jobId: validJobId
        });

        const text = await parserService.parseFile(file.path, file.mimetype);
        resume.rawText = text;

        const analysis = await nlpService.analyzeResume(text, jobRequirements, analysisMode);
        resume.analysis = analysis;
        
        if (analysis && analysis.matchScore) {
          resume.matchScore = analysis.matchScore;
        }
        
        resume.status = 'completed';
        await resume.save();

        try {
          await fs.unlink(file.path);
        } catch (e) {}
        
        results.push({ success: true, resume });
      } catch (error) {
        console.error(`Error processing ${file.originalname}:`, error);
        results.push({ success: false, fileName: file.originalname, error: error.message });
      }
    }

    if (validJobId) {
      const successCount = results.filter(r => r.success).length;
      await Job.findByIdAndUpdate(validJobId, { $inc: { applicantsCount: successCount } });
    }

    if (io) {
      io.emit('batch-complete', { results });
    }

    res.status(201).json({
      total: totalFiles,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
      aiPowered: aiService.isConfigured()
    });
  } catch (error) {
    console.error('Batch upload error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getResumes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      jobId,
      status,
      minScore,
      maxScore,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (jobId) query.jobId = jobId;
    if (status) query.status = status;
    
    if (minScore || maxScore) {
      query['matchScore.overallScore'] = {};
      if (minScore) query['matchScore.overallScore'].$gte = parseInt(minScore);
      if (maxScore) query['matchScore.overallScore'].$lte = parseInt(maxScore);
    }

    if (search) {
      query.$or = [
        { 'analysis.contact.name': { $regex: search, $options: 'i' } },
        { 'analysis.contact.email': { $regex: search, $options: 'i' } },
        { originalName: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const resumes = await Resume.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('jobId', 'title department');

    const total = await Resume.countDocuments(query);

    res.json({
      resumes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      aiPowered: aiService.isConfigured()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id).populate('jobId');
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    res.json(resume);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateResume = async (req, res) => {
  try {
    const { tags, notes, starred } = req.body;
    const resume = await Resume.findByIdAndUpdate(
      req.params.id,
      { tags, notes, starred },
      { new: true }
    );
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    res.json(resume);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findByIdAndDelete(req.params.id);
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    
    if (resume.jobId) {
      await Job.findByIdAndUpdate(resume.jobId, { $inc: { applicantsCount: -1 } });
    }
    
    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const compareResumes = async (req, res) => {
  try {
    const { resumeIds, jobId } = req.body;
    
    if (!resumeIds || resumeIds.length < 2) {
      return res.status(400).json({ error: 'At least 2 resume IDs required for comparison' });
    }

    const resumes = await Resume.find({ _id: { $in: resumeIds } });

    // Try AI-powered comparison first
    if (aiService.isConfigured() && jobId) {
      try {
        const job = await Job.findById(jobId);
        if (job) {
          const aiComparison = await nlpService.compareResumesAI(resumes, job.requirements);
          if (aiComparison) {
            return res.json({ 
              comparison: aiComparison, 
              aiPowered: true 
            });
          }
        }
      } catch (error) {
        console.error('AI comparison failed, using rule-based:', error);
      }
    }

    // Fallback to rule-based comparison
    const comparison = resumes.map(resume => ({
      id: resume._id,
      name: resume.analysis?.contact?.name || resume.originalName,
      skills: resume.analysis?.skills?.totalSkills || 0,
      experience: resume.analysis?.experience?.totalYears || 0,
      experienceLevel: resume.analysis?.experience?.experienceLevel || 'N/A',
      education: resume.analysis?.education?.highestDegree || 'N/A',
      matchScore: resume.matchScore?.overallScore || 0,
      recommendation: resume.matchScore?.recommendation?.status || 'N/A',
      professionalismScore: resume.analysis?.sentiment?.professionalismScore || 0,
      redFlagsCount: resume.analysis?.redFlags?.length || 0,
      warningsCount: resume.analysis?.warnings?.length || 0
    }));

    comparison.sort((a, b) => b.matchScore - a.matchScore);

    res.json({ comparison, aiPowered: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const reanalyzeResume = async (req, res) => {
  try {
    const { jobId } = req.body;
    const resume = await Resume.findById(req.params.id);
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    let jobRequirements = null;
    if (jobId) {
      const job = await Job.findById(jobId);
      if (job) {
        jobRequirements = job.requirements;
        resume.jobId = jobId;
      }
    }

    const analysis = await nlpService.analyzeResume(resume.rawText, jobRequirements);
    resume.analysis = analysis;
    
    if (analysis.matchScore) {
      resume.matchScore = analysis.matchScore;
    }
    
    await resume.save();

    res.json(resume);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const generateInterviewQuestions = async (req, res) => {
  try {
    const { jobTitle, focusAreas } = req.body;
    const resume = await Resume.findById(req.params.id);
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    if (!aiService.isConfigured()) {
      return res.json({ 
        questions: resume.analysis?.interviewQuestions || [],
        aiPowered: false
      });
    }

    const questions = await nlpService.generateInterviewQuestionsAI(
      resume.rawText, 
      jobTitle || 'Software Engineer',
      focusAreas || []
    );

    res.json({ questions: questions?.questions || [], aiPowered: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const analyzeATS = async (req, res) => {
  try {
    const { jobDescription } = req.body;
    const resume = await Resume.findById(req.params.id);
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    if (!aiService.isConfigured()) {
      return res.status(400).json({ 
        error: 'AI service not configured',
        message: 'Please add OPENAI_API_KEY to enable ATS analysis'
      });
    }

    const atsAnalysis = await nlpService.analyzeATSOptimization(
      resume.rawText, 
      jobDescription
    );

    res.json({ atsAnalysis, aiPowered: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAIStatus = async (req, res) => {
  res.json({
    aiEnabled: aiService.isConfigured(),
    model: aiService.isConfigured() ? 'gpt-4o-mini' : null,
    features: {
      resumeAnalysis: true,
      interviewQuestions: aiService.isConfigured(),
      resumeComparison: aiService.isConfigured(),
      atsOptimization: aiService.isConfigured()
    }
  });
};