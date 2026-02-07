// frontend/src/pages/ResumeList.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Star,
  StarOff,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../services/api';

export default function ResumeList() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ minScore: '', maxScore: '', status: '' });
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['resumes', page, search, filters],
    queryFn: () => api.get('/resumes', {
      params: {
        page,
        limit: 10,
        search: search || undefined,
        minScore: filters.minScore || undefined,
        maxScore: filters.maxScore || undefined,
        status: filters.status || undefined,
        sortBy: 'matchScore.overallScore',
        sortOrder: 'desc'
      }
    }).then(res => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/resumes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['resumes']);
      toast.success('Resume deleted successfully');
    }
  });

  const starMutation = useMutation({
    mutationFn: ({ id, starred }) => api.put(`/resumes/${id}`, { starred }),
    onSuccess: () => queryClient.invalidateQueries(['resumes'])
  });

  const resumes = data?.resumes || [];
  const pagination = data?.pagination || {};

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Resumes</h1>
          <p className="text-white/50 mt-1">{pagination.total || 0} candidates in database</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-4 py-3 rounded-xl input-field w-64"
            />
          </div>

          {/* Filter Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-xl transition-all ${
              showFilters 
                ? 'bg-primary-500/30 text-primary-400 border border-primary-500/50' 
                : 'bg-white/10 text-white/60 border border-white/10 hover:bg-white/20'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Filters</h3>
              <button
                onClick={() => setFilters({ minScore: '', maxScore: '', status: '' })}
                className="text-sm text-primary-400 hover:text-primary-300"
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Min Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.minScore}
                  onChange={(e) => setFilters(f => ({ ...f, minScore: e.target.value }))}
                  className="input-field"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Max Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.maxScore}
                  onChange={(e) => setFilters(f => ({ ...f, maxScore: e.target.value }))}
                  className="input-field"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                  className="input-field"
                >
                  <option value="">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resume Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl glass-card overflow-hidden"
      >
        {isLoading ? (
          <TableSkeleton />
        ) : resumes.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-white/30" />
            </div>
            <h3 className="text-lg font-semibold text-white">No resumes found</h3>
            <p className="text-white/50 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white/60">Candidate</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white/60">Experience</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white/60">Skills</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white/60">Score</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white/60">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white/60">Date</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-white/60">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {resumes.map((resume, index) => (
                  <motion.tr
                    key={resume._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
                          {(resume.analysis?.contact?.name?.[0] || resume.originalName?.[0] || 'R').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {resume.analysis?.contact?.name || 'Unknown'}
                          </p>
                          <p className="text-sm text-white/50 truncate max-w-[200px]">
                            {resume.analysis?.contact?.email || resume.originalName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{resume.analysis?.experience?.totalYears || 0} years</p>
                      <p className="text-sm text-white/50">{resume.analysis?.experience?.experienceLevel || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {resume.analysis?.skills?.categorized?.programming?.slice(0, 3).map(skill => (
                          <span key={skill} className="px-2 py-0.5 bg-primary-500/20 text-primary-400 rounded text-xs font-medium border border-primary-500/30">
                            {skill}
                          </span>
                        ))}
                        {(resume.analysis?.skills?.totalSkills || 0) > 3 && (
                          <span className="px-2 py-0.5 bg-white/10 text-white/60 rounded text-xs">
                            +{resume.analysis.skills.totalSkills - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${resume.matchScore?.overallScore || 0}%` }}
                            className={`h-full rounded-full ${getScoreBarColor(resume.matchScore?.overallScore)}`}
                          />
                        </div>
                        <span className={`text-sm font-semibold ${getScoreTextColor(resume.matchScore?.overallScore)}`}>
                          {resume.matchScore?.overallScore || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(resume.status)}`}>
                        {resume.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/50">
                      {format(new Date(resume.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => starMutation.mutate({ id: resume._id, starred: !resume.starred })}
                          className={`p-2 rounded-lg transition-colors ${
                            resume.starred ? 'text-yellow-400 bg-yellow-500/20' : 'text-white/40 hover:bg-white/10'
                          }`}
                        >
                          {resume.starred ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                        </motion.button>
                        <Link to={`/resumes/${resume._id}`}>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 rounded-lg text-white/40 hover:text-primary-400 hover:bg-primary-500/20 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </motion.button>
                        </Link>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this resume?')) {
                              deleteMutation.mutate(resume._id);
                            }
                          }}
                          className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
            <p className="text-sm text-white/50">
              Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </motion.button>
              
              {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <motion.button
                    key={pageNum}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium ${
                      page === pageNum
                        ? 'bg-primary-500/30 text-primary-400 border border-primary-500/50'
                        : 'hover:bg-white/10 text-white/60'
                    }`}
                  >
                    {pageNum}
                  </motion.button>
                );
              })}
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="p-2 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function getScoreBarColor(score) {
  if (score >= 75) return 'bg-emerald-500';
  if (score >= 50) return 'bg-blue-500';
  if (score >= 25) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getScoreTextColor(score) {
  if (score >= 75) return 'text-emerald-400';
  if (score >= 50) return 'text-blue-400';
  if (score >= 25) return 'text-yellow-400';
  return 'text-red-400';
}

function getStatusBadge(status) {
  const badges = {
    completed: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    processing: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    pending: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    failed: 'bg-red-500/20 text-red-400 border border-red-500/30'
  };
  return badges[status] || 'bg-white/10 text-white/60';
}

function TableSkeleton() {
  return (
    <div className="p-6 space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className="w-10 h-10 bg-white/10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-white/10 rounded" />
            <div className="h-3 w-48 bg-white/5 rounded" />
          </div>
          <div className="h-4 w-20 bg-white/10 rounded" />
        </div>
      ))}
    </div>
  );
}