// backend/controllers/resumeController.js
import Resume from '../models/Resume.js';
import Job from '../models/Job.js';
import parserService from '../services/parserService.js';
import nlpService from '../services/nlpService.js';
import fs from 'fs/promises';
import path from 'path';

export const uploadResume = async (req, res) => {
  try {
    const io = req.app.get('io');
    const file = req.file;
    const { jobId } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create initial resume record
    const resume = new Resume({
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      status: 'processing',
      jobId: jobId || null
    });

    await resume.save();

    // Emit processing started
    io.emit('resume-processing', {
      resumeId: resume._id,
      status: 'started',
      progress: 10
    });

    // Parse the file
    const text = await parserService.parseFile(file.path, file.mimetype);
    resume.rawText = text;

    io.emit('resume-processing', {
      resumeId: resume._id,
      status: 'parsing-complete',
      progress: 30
    });

    // Get job requirements if jobId provided
    let jobRequirements = null;
    if (jobId) {
      const job = await Job.findById(jobId);
      if (job) {
        jobRequirements = job.requirements;
      }
    }

    io.emit('resume-processing', {
      resumeId: resume._id,
      status: 'analyzing',
      progress: 50
    });

    // Analyze with NLP
    const analysis = await nlpService.analyzeResume(text, jobRequirements);

    resume.analysis = analysis;
    if (jobRequirements) {
      resume.matchScore = analysis.matchScore;
    }
    resume.status = 'completed';

    await resume.save();

    // Update job applicants count
    if (jobId) {
      await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });
    }

    io.emit('resume-processing', {
      resumeId: resume._id,
      status: 'completed',
      progress: 100,
      data: resume
    });

    // Clean up uploaded file
    await fs.unlink(file.path);

    res.status(201).json(resume);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const uploadMultipleResumes = async (req, res) => {
  try {
    const io = req.app.get('io');
    const files = req.files;
    const { jobId } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    let jobRequirements = null;
    if (jobId) {
      const job = await Job.findById(jobId);
      if (job) {
        jobRequirements = job.requirements;
      }
    }

    const results = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      io.emit('batch-processing', {
        current: i + 1,
        total: totalFiles,
        fileName: file.originalname,
        progress: Math.round(((i + 1) / totalFiles) * 100)
      });

      try {
        const resume = new Resume({
          fileName: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          status: 'processing',
          jobId: jobId || null
        });

        const text = await parserService.parseFile(file.path, file.mimetype);
        resume.rawText = text;

        const analysis = await nlpService.analyzeResume(text, jobRequirements);
        resume.analysis = analysis;
        
        if (jobRequirements) {
          resume.matchScore = analysis.matchScore;
        }
        
        resume.status = 'completed';
        await resume.save();

        await fs.unlink(file.path);
        results.push({ success: true, resume });
      } catch (error) {
        results.push({ success: false, fileName: file.originalname, error: error.message });
      }
    }

    if (jobId) {
      const successCount = results.filter(r => r.success).length;
      await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: successCount } });
    }

    io.emit('batch-complete', { results });

    res.status(201).json({
      total: totalFiles,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
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
      }
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
    const { resumeIds } = req.body;
    
    if (!resumeIds || resumeIds.length < 2) {
      return res.status(400).json({ error: 'At least 2 resume IDs required for comparison' });
    }

    const resumes = await Resume.find({ _id: { $in: resumeIds } });

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

    // Sort by match score
    comparison.sort((a, b) => b.matchScore - a.matchScore);

    res.json({ comparison });
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
    
    if (jobRequirements) {
      resume.matchScore = analysis.matchScore;
    }
    
    await resume.save();

    res.json(resume);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};