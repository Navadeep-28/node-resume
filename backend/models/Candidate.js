// backend/models/Candidate.js
import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
  // Personal Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: String,
  location: String,
  
  // Professional Links
  linkedin: String,
  github: String,
  portfolio: String,
  
  // Current Status
  status: {
    type: String,
    enum: ['new', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'],
    default: 'new'
  },
  
  // Source tracking
  source: {
    type: String,
    enum: ['upload', 'email', 'api', 'manual'],
    default: 'upload'
  },
  
  // Associated resumes (candidate may have multiple resume versions)
  resumes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  }],
  
  // Current/Primary resume
  currentResume: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  },
  
  // Applications to jobs
  applications: [{
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['applied', 'reviewing', 'shortlisted', 'interviewing', 'offered', 'hired', 'rejected'],
      default: 'applied'
    },
    matchScore: Number,
    notes: String
  }],
  
  // Interview history
  interviews: [{
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job'
    },
    type: {
      type: String,
      enum: ['phone', 'video', 'onsite', 'technical', 'hr', 'final'],
      default: 'phone'
    },
    scheduledAt: Date,
    conductedAt: Date,
    interviewer: String,
    feedback: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled'
    }
  }],
  
  // Skills (aggregated from resumes)
  skills: [String],
  
  // Experience summary
  experience: {
    totalYears: Number,
    currentRole: String,
    currentCompany: String,
    level: {
      type: String,
      enum: ['Entry Level', 'Junior', 'Mid-Level', 'Senior', 'Lead/Staff', 'Principal/Director']
    }
  },
  
  // Education summary
  education: {
    highestDegree: String,
    institution: String,
    field: String,
    graduationYear: Number
  },
  
  // Tags for organization
  tags: [String],
  
  // Notes from recruiters
  notes: [{
    content: String,
    createdBy: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Rating by recruiters
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  
  // Flags
  starred: {
    type: Boolean,
    default: false
  },
  archived: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  lastContactedAt: Date,
  lastActivityAt: Date
  
}, {
  timestamps: true
});

// Indexes
candidateSchema.index({ email: 1 });
candidateSchema.index({ name: 'text', email: 'text' });
candidateSchema.index({ status: 1 });
candidateSchema.index({ 'applications.job': 1 });
candidateSchema.index({ tags: 1 });
candidateSchema.index({ starred: 1 });
candidateSchema.index({ createdAt: -1 });

// Virtual for full name
candidateSchema.virtual('displayName').get(function() {
  return this.name || this.email.split('@')[0];
});

// Method to add application
candidateSchema.methods.addApplication = function(jobId, matchScore) {
  const existingApp = this.applications.find(app => app.job.toString() === jobId.toString());
  
  if (!existingApp) {
    this.applications.push({
      job: jobId,
      matchScore,
      status: 'applied'
    });
  }
  
  return this.save();
};

// Method to update application status
candidateSchema.methods.updateApplicationStatus = function(jobId, status, notes) {
  const app = this.applications.find(a => a.job.toString() === jobId.toString());
  
  if (app) {
    app.status = status;
    if (notes) app.notes = notes;
  }
  
  return this.save();
};

// Static method to find or create candidate by email
candidateSchema.statics.findOrCreate = async function(data) {
  let candidate = await this.findOne({ email: data.email.toLowerCase() });
  
  if (!candidate) {
    candidate = new this({
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      location: data.location,
      linkedin: data.linkedin,
      github: data.github
    });
    await candidate.save();
  }
  
  return candidate;
};

// Static method for search
candidateSchema.statics.search = async function(query, options = {}) {
  const {
    page = 1,
    limit = 20,
    status,
    tags,
    minRating,
    starred
  } = options;

  const filter = {};
  
  if (query) {
    filter.$text = { $search: query };
  }
  
  if (status) {
    filter.status = status;
  }
  
  if (tags && tags.length > 0) {
    filter.tags = { $in: tags };
  }
  
  if (minRating) {
    filter.rating = { $gte: minRating };
  }
  
  if (starred !== undefined) {
    filter.starred = starred;
  }

  const candidates = await this.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('currentResume', 'matchScore analysis.skills');

  const total = await this.countDocuments(filter);

  return {
    candidates,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export default mongoose.model('Candidate', candidateSchema);