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
  MoreVertical,
  Edit,
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
          <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
          <p className="text-gray-500 mt-1">{jobs.length} open positions</p>
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
            <div key={i} className="glass rounded-2xl p-6 animate-pulse">
              <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
              <div className="h-4 w-32 bg-gray-100 rounded mb-2" />
              <div className="h-4 w-24 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No jobs created yet</h3>
          <p className="text-gray-500 mt-1">Create your first job to start screening candidates</p>
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
              className="glass rounded-2xl p-6 card-hover group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${getStatusBg(job.status)}`}>
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="relative">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(job.status)}`}>
                    {job.status}
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h3>
              
              <div className="space-y-2 mb-4">
                {job.department && (
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    {job.department}
                  </p>
                )}
                {job.location && (
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </p>
                )}
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {job.applicantsCount || 0} applicants
                </p>
                <p className="text-sm text-gray-500 flex items-center gap-2">
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
                      className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                  {job.requirements.skills.length > 3 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                      +{job.requirements.skills.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link to={`/jobs/${job._id}`} className="flex-1">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-1"
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
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {job.status === 'active' ? (
                    <Pause className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Play className="w-4 h-4 text-green-500" />
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (confirm('Delete this job?')) {
                      deleteMutation.mutate(job._id);
                    }
                  }}
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
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
    active: 'bg-green-100 text-green-600',
    paused: 'bg-yellow-100 text-yellow-600',
    closed: 'bg-gray-100 text-gray-600',
    draft: 'bg-blue-100 text-blue-600'
  };
  return bgs[status] || 'bg-gray-100 text-gray-600';
}

function getStatusBadge(status) {
  const badges = {
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    closed: 'bg-gray-100 text-gray-700',
    draft: 'bg-blue-100 text-blue-700'
  };
  return badges[status] || 'bg-gray-100 text-gray-700';
}