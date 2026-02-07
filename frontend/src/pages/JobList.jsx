// frontend/src/pages/JobList.jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Briefcase,
  MapPin,
  Users,
  Clock,
  Trash2,
  Eye,
  Pause,
  Play
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function JobList() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.get('/jobs').then(res => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/jobs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['jobs']);
      toast.success('Job deleted successfully');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/jobs/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['jobs']);
      toast.success('Job status updated');
    }
  });

  const jobs = data?.jobs || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Jobs</h1>
          <p className="text-white/50 mt-1">{jobs.length} open positions</p>
        </div>
        <Link to="/jobs/create">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Job
          </motion.button>
        </Link>
      </div>

      {/* Jobs Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl glass-card p-6 animate-pulse">
              <div className="h-6 w-48 bg-white/10 rounded mb-4" />
              <div className="h-4 w-32 bg-white/10 rounded mb-2" />
              <div className="h-4 w-24 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl glass-card p-12 text-center">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-10 h-10 text-white/30" />
          </div>
          <h3 className="text-lg font-semibold text-white">No jobs created yet</h3>
          <p className="text-white/50 mt-1">Create your first job to start screening candidates</p>
          <Link to="/jobs/create">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary mt-6"
            >
              Create First Job
            </motion.button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job, index) => (
            <motion.div
              key={job._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl glass-card p-6 group hover:border-white/30 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${getStatusBg(job.status)}`}>
                  <Briefcase className="w-6 h-6" />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(job.status)}`}>
                  {job.status}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">{job.title}</h3>
              
              <div className="space-y-2 mb-4">
                {job.department && (
                  <p className="text-sm text-white/50 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    {job.department}
                  </p>
                )}
                {job.location && (
                  <p className="text-sm text-white/50 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </p>
                )}
                <p className="text-sm text-white/50 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {job.applicantsCount || 0} applicants
                </p>
                <p className="text-sm text-white/50 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {format(new Date(job.createdAt), 'MMM d, yyyy')}
                </p>
              </div>

              {/* Skills Preview */}
              {job.requirements?.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {job.requirements.skills.slice(0, 3).map(skill => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 bg-primary-500/20 text-primary-400 rounded text-xs border border-primary-500/30"
                    >
                      {skill}
                    </span>
                  ))}
                  {job.requirements.skills.length > 3 && (
                    <span className="px-2 py-0.5 bg-white/10 text-white/50 rounded text-xs">
                      +{job.requirements.skills.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link to={`/jobs/${job._id}`} className="flex-1">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-2 bg-primary-500/30 text-primary-400 rounded-xl text-sm font-medium hover:bg-primary-500/40 transition-colors flex items-center justify-center gap-1 border border-primary-500/30"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </motion.button>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => updateStatusMutation.mutate({
                    id: job._id,
                    status: job.status === 'active' ? 'paused' : 'active'
                  })}
                  className={`p-2 rounded-xl transition-colors ${
                    job.status === 'active' 
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {job.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (confirm('Delete this job?')) {
                      deleteMutation.mutate(job._id);
                    }
                  }}
                  className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function getStatusBg(status) {
  const bgs = {
    active: 'bg-emerald-500/20 text-emerald-400',
    paused: 'bg-yellow-500/20 text-yellow-400',
    closed: 'bg-white/10 text-white/60',
    draft: 'bg-blue-500/20 text-blue-400'
  };
  return bgs[status] || 'bg-white/10 text-white/60';
}

function getStatusBadge(status) {
  const badges = {
    active: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    paused: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    closed: 'bg-white/10 text-white/60 border border-white/20',
    draft: 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
  };
  return badges[status] || 'bg-white/10 text-white/60';
}