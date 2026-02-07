// frontend/src/pages/JobDetail.jsx
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  GraduationCap,
  Users,
  Star,
  TrendingUp
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import api from '../services/api';

export default function JobDetail() {
  const { id } = useParams();

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => api.get(`/jobs/${id}`).then(res => res.data),
  });

  const { data: candidates } = useQuery({
    queryKey: ['jobCandidates', id],
    queryFn: () => api.get(`/jobs/${id}/candidates`).then(res => res.data),
  });

  if (jobLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!job) {
    return <div>Job not found</div>;
  }

  // Prepare chart data
  const scoreDistribution = [
    { range: '0-25', count: 0 },
    { range: '26-50', count: 0 },
    { range: '51-75', count: 0 },
    { range: '76-100', count: 0 }
  ];

  candidates?.forEach(c => {
    const score = c.matchScore?.overallScore || 0;
    if (score <= 25) scoreDistribution[0].count++;
    else if (score <= 50) scoreDistribution[1].count++;
    else if (score <= 75) scoreDistribution[2].count++;
    else scoreDistribution[3].count++;
  });

  const topCandidates = candidates?.slice(0, 5) || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Back Button */}
      <Link
        to="/jobs"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Jobs
      </Link>

      {/* Job Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-6">
            <div className="p-4 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl shadow-lg">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
              <div className="flex flex-wrap gap-4 mt-3 text-gray-500">
                {job.department && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {job.department}
                  </span>
                )}
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {job.type}
                </span>
                {job.salary?.min && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {job.salary.currency} {job.salary.min.toLocaleString()} - {job.salary.max?.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full font-medium ${
            job.status === 'active' ? 'bg-green-100 text-green-700' :
            job.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {job.status}
          </span>
        </div>

        {job.description && (
          <p className="mt-6 text-gray-600 leading-relaxed">{job.description}</p>
        )}
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6"
        >
          <Users className="w-8 h-8 text-primary-500 mb-2" />
          <p className="text-3xl font-bold text-gray-900">{candidates?.length || 0}</p>
          <p className="text-gray-500">Total Applicants</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6"
        >
          <Star className="w-8 h-8 text-yellow-500 mb-2" />
          <p className="text-3xl font-bold text-gray-900">
            {candidates?.filter(c => (c.matchScore?.overallScore || 0) >= 75).length || 0}
          </p>
          <p className="text-gray-500">Top Matches (75%+)</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6"
        >
          <TrendingUp className="w-8 h-8 text-green-500 mb-2" />
          <p className="text-3xl font-bold text-gray-900">
            {candidates?.length > 0 
              ? Math.round(candidates.reduce((sum, c) => sum + (c.matchScore?.overallScore || 0), 0) / candidates.length)
              : 0
            }%
          </p>
          <p className="text-gray-500">Average Score</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-6"
        >
          <GraduationCap className="w-8 h-8 text-accent-500 mb-2" />
          <p className="text-3xl font-bold text-gray-900">{job.requirements?.education || 'Any'}</p>
          <p className="text-gray-500">Min. Education</p>
        </motion.div>
      </div>

      {/* Requirements & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requirements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-2">Required Skills</p>
              <div className="flex flex-wrap gap-2">
                {job.requirements?.skills?.map(skill => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
                {!job.requirements?.skills?.length && (
                  <span className="text-gray-400">No specific skills required</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500">Experience</p>
                <p className="font-semibold text-gray-900">
                  {job.requirements?.minExperience || 0} - {job.requirements?.maxExperience || 10} years
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500">Education</p>
                <p className="font-semibold text-gray-900">
                  {job.requirements?.education || 'Any'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Score Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="range" tick={{ fill: '#6b7280' }} />
                <YAxis tick={{ fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="count" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#d946ef" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Top Candidates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Top Candidates</h3>
          <Link
            to={`/resumes?jobId=${id}`}
            className="text-primary-500 hover:text-primary-600 font-medium text-sm"
          >
            View All →
          </Link>
        </div>

        {topCandidates.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No candidates yet</p>
            <Link to="/upload">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary mt-4"
              >
                Upload Resumes
              </motion.button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {topCandidates.map((candidate, index) => (
              <motion.div
                key={candidate._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold">
                  {(candidate.analysis?.contact?.name?.[0] || 'R').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">
                    {candidate.analysis?.contact?.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {candidate.analysis?.experience?.experienceLevel} • {candidate.analysis?.skills?.totalSkills || 0} skills
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    (candidate.matchScore?.overallScore || 0) >= 75 ? 'text-green-600' :
                    (candidate.matchScore?.overallScore || 0) >= 50 ? 'text-blue-600' : 'text-yellow-600'
                  }`}>
                    {candidate.matchScore?.overallScore || 0}%
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    candidate.matchScore?.recommendation?.status === 'Highly Recommended' ? 'bg-green-100 text-green-700' :
                    candidate.matchScore?.recommendation?.status === 'Recommended' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {candidate.matchScore?.recommendation?.status || 'Analyzed'}
                  </span>
                </div>
                <Link to={`/resumes/${candidate._id}`}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600"
                  >
                    View
                  </motion.button>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}