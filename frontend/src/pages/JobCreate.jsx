// frontend/src/pages/JobCreate.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Briefcase,
  MapPin,
  DollarSign,
  GraduationCap,
  Clock,
  Plus,
  X,
  Sparkles,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const suggestedSkills = [
  'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Java',
  'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'GraphQL',
  'Machine Learning', 'Data Science', 'DevOps', 'Agile', 'Git'
];

export default function JobCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    type: 'Full-time',
    description: '',
    requirements: {
      skills: [],
      minExperience: 0,
      maxExperience: 10,
      education: 'Bachelors'
    },
    salary: { min: '', max: '', currency: 'USD' }
  });
  const [newSkill, setNewSkill] = useState('');

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/jobs', data),
    onSuccess: (response) => {
      toast.success('Job created successfully!');
      navigate(`/jobs/${response.data._id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create job');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...formData, status: 'active' });
  };

  const addSkill = (skill) => {
    if (skill && !formData.requirements.skills.includes(skill)) {
      setFormData(f => ({
        ...f,
        requirements: { ...f.requirements, skills: [...f.requirements.skills, skill] }
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill) => {
    setFormData(f => ({
      ...f,
      requirements: { ...f.requirements, skills: f.requirements.skills.filter(s => s !== skill) }
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl shadow-lg glow-primary mb-6"
        >
          <Briefcase className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className="text-3xl font-bold text-white">Create New Job</h1>
        <p className="text-white/50 mt-2">Define the job requirements for AI-powered candidate matching</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl glass-card p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Job Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
                className="input-field"
                placeholder="e.g., Senior Software Engineer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData(f => ({ ...f, department: e.target.value }))}
                className="input-field"
                placeholder="e.g., Engineering"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(f => ({ ...f, location: e.target.value }))}
                className="input-field"
                placeholder="e.g., San Francisco, CA or Remote"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Employment Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(f => ({ ...f, type: e.target.value }))}
                className="input-field"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Remote">Remote</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-white/60 mb-2">Job Description</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
              className="input-field"
              placeholder="Describe the role, responsibilities, and what you're looking for..."
            />
          </div>
        </motion.div>

        {/* Requirements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl glass-card p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Requirements</h2>

          {/* Skills */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/60 mb-2">Required Skills</label>
            
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(newSkill))}
                className="input-field flex-1"
                placeholder="Type a skill and press Enter"
              />
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => addSkill(newSkill)}
                className="px-4 py-2 bg-primary-500/30 text-primary-400 rounded-xl hover:bg-primary-500/40 transition-colors border border-primary-500/30"
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Selected Skills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.requirements.skills.map(skill => (
                <motion.span
                  key={skill}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full border border-primary-500/30"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="p-0.5 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.span>
              ))}
            </div>

            {/* Suggested Skills */}
            <div>
              <p className="text-sm text-white/40 mb-2">Suggested skills:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedSkills
                  .filter(s => !formData.requirements.skills.includes(s))
                  .slice(0, 10)
                  .map(skill => (
                    <motion.button
                      key={skill}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => addSkill(skill)}
                      className="px-3 py-1 bg-white/5 text-white/60 rounded-full text-sm hover:bg-white/10 transition-colors border border-white/10"
                    >
                      + {skill}
                    </motion.button>
                  ))
                }
              </div>
            </div>
          </div>

          {/* Experience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Min Experience (years)</label>
              <input
                type="number"
                min="0"
                max="50"
                value={formData.requirements.minExperience}
                onChange={(e) => setFormData(f => ({
                  ...f,
                  requirements: { ...f.requirements, minExperience: parseInt(e.target.value) || 0 }
                }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Max Experience (years)</label>
              <input
                type="number"
                min="0"
                max="50"
                value={formData.requirements.maxExperience}
                onChange={(e) => setFormData(f => ({
                  ...f,
                  requirements: { ...f.requirements, maxExperience: parseInt(e.target.value) || 0 }
                }))}
                className="input-field"
              />
            </div>
          </div>

          {/* Education */}
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              <GraduationCap className="w-4 h-4 inline mr-1" />
              Minimum Education
            </label>
            <select
              value={formData.requirements.education}
              onChange={(e) => setFormData(f => ({
                ...f,
                requirements: { ...f.requirements, education: e.target.value }
              }))}
              className="input-field"
            >
              <option value="Diploma">Diploma</option>
              <option value="Associate">Associate Degree</option>
              <option value="Bachelors">Bachelor's Degree</option>
              <option value="Masters">Master's Degree</option>
              <option value="PhD">PhD</option>
            </select>
          </div>
        </motion.div>

        {/* Salary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl glass-card p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">
            <DollarSign className="w-5 h-5 inline mr-1" />
            Compensation (Optional)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Min Salary</label>
              <input
                type="number"
                value={formData.salary.min}
                onChange={(e) => setFormData(f => ({
                  ...f,
                  salary: { ...f.salary, min: e.target.value }
                }))}
                className="input-field"
                placeholder="50000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Max Salary</label>
              <input
                type="number"
                value={formData.salary.max}
                onChange={(e) => setFormData(f => ({
                  ...f,
                  salary: { ...f.salary, max: e.target.value }
                }))}
                className="input-field"
                placeholder="100000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Currency</label>
              <select
                value={formData.salary.currency}
                onChange={(e) => setFormData(f => ({
                  ...f,
                  salary: { ...f.salary, currency: e.target.value }
                }))}
                className="input-field"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-end gap-4"
        >
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/jobs')}
            className="btn-secondary"
          >
            Cancel
          </motion.button>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={createMutation.isLoading}
            className="btn-primary flex items-center gap-2"
          >
            {createMutation.isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Create Job
              </>
            )}
          </motion.button>
        </motion.div>
      </form>
    </motion.div>
  );
}