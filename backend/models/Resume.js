// backend/models/Resume.js
import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  originalName: String,
  mimeType: String,
  size: Number,
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  rawText: String,
  analysis: {
    skills: {
      categorized: {
        programming: [String],
        frontend: [String],
        backend: [String],
        database: [String],
        cloud: [String],
        ml_ai: [String],
        soft_skills: [String],
        other: [String]
      },
      keywords: [String],
      totalSkills: Number
    },
    experience: {
      totalYears: Number,
      experienceLevel: String,
      jobTitles: [String]
    },
    education: {
      degrees: [String],
      universities: [String],
      fields: [String],
      highestDegree: String,
      score: Number
    },
    contact: {
      name: String,
      email: String,
      phone: String,
      linkedin: String,
      github: String,
      location: String
    },
    sentiment: {
      score: Number,
      comparative: Number,
      professionalismScore: Number,
      tone: String
    },
    redFlags: [{
      type: { type: String },
      message: String,
      severity: String
    }],
    warnings: [{
      type: { type: String },
      message: String,
      severity: String
    }],
    suggestions: [{
      type: { type: String },
      message: String,
      severity: String
    }],
    wordCount: Number,
    interviewQuestions: [{
      category: String,
      question: String,
      focus: String
    }]
  },
  matchScore: {
    overallScore: Number,
    matchDetails: {
      skillsMatch: [String],
      missingSkills: [String],
      experienceMatch: Boolean,
      educationMatch: Boolean
    },
    recommendation: {
      status: String,
      color: String,
      action: String
    }
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  tags: [String],
  notes: String,
  starred: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
resumeSchema.index({ 'analysis.contact.email': 1 });
resumeSchema.index({ 'matchScore.overallScore': -1 });
resumeSchema.index({ status: 1 });
resumeSchema.index({ createdAt: -1 });

export default mongoose.model('Resume', resumeSchema);