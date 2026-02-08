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
  
  // --- MAJOR FIX: Use Mixed type for the entire analysis object ---
  // This prevents ALL validation errors for nested fields like suggestions, skills, etc.
  analysis: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Also make matchScore flexible to prevent errors there too
  matchScore: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      overallScore: 0,
      matchDetails: {},
      recommendation: { status: 'Pending', color: 'gray' }
    }
  },

  // References
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  // User data
  tags: [String],
  notes: String,
  starred: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  strict: false // Allow extra fields just in case
});

// Indexes
// Note: You can still index fields inside Mixed types!
resumeSchema.index({ 'analysis.contact.email': 1 });
resumeSchema.index({ 'matchScore.overallScore': -1 });
resumeSchema.index({ status: 1 });
resumeSchema.index({ createdAt: -1 });
resumeSchema.index({ 'analysis.aiPowered': 1 });

export default mongoose.model('Resume', resumeSchema);