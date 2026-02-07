// backend/models/Job.js
import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  department: String,
  location: String,
  type: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'],
    default: 'Full-time'
  },
  description: String,
  requirements: {
    skills: [String],
    minExperience: Number,
    maxExperience: Number,
    education: {
      type: String,
      enum: ['Diploma', 'Associate', 'Bachelors', 'Masters', 'PhD'],
      default: 'Bachelors'
    }
  },
  salary: {
    min: Number,
    max: Number,
    currency: { type: String, default: 'USD' }
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'closed'],
    default: 'draft'
  },
  applicantsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model('Job', jobSchema);