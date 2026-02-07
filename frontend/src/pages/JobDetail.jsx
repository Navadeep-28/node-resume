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
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-32 bg-white/10 rounded-lg" />
        <div className="rounded-2xl glass-card p-8 h-48" />
      </div>
    );
  }

  if (!job) return <div className="text-white text-center py-12">Job not found</div>;

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
        className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Jobs
      </Link>

      {/* Job Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl glass-card p-8"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-6">
            <div className="p-4 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl shadow-lg glow-primary">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{job.title}</h1>
              <div className="flex flex-wrap gap-4 mt-3 text-white/50">
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
            job.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
            job.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
            'bg-white/10 text-white/60 border border-white/20'
          }`}>
            {job.status}
          </span>
        </div>

        {job.description && (
          <p className="mt-6 text-white/60 leading-relaxed">{job.description}</p>
        )}
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Applicants', value: candidates?.length || 0, icon: Users, gradient: 'from-blue-500 to-cyan-500' },
          { label: 'Top Matches (75%+)', value: candidates?.filter(c => (c.matchScore?.overallScore || 0) >= 75).length || 0, icon: Star, gradient: 'from-yellow-500 to-orange-500' },
          { label: 'Average Score', value: `${candidates?.length > 0 ? Math.round(candidates.reduce((sum, c) => sum + (c.matchScore?.overallScore || 0), 0) / candidates.length) : 0}%`, icon: TrendingUp, gradient: 'from-emerald-500 to-teal-500' },
          { label: 'Min. Education', value: job.requirements?.education || 'Any', icon: GraduationCap, gradient: 'from-violet-500 to-purple-500' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className="rounded-2xl glass-card p-6 relative overflow-hidden"
          >
            <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.gradient} mb-3 shadow-lg`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-white/50">{stat.label}</p>
            <div className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-30 bg-gradient-to-br ${stat.gradient}`} />
          </motion.div>
        ))}
      </div>

      {/* Requirements & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requirements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Requirements</h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-white/50 mb-2">Required Skills</p>
              <div className="flex flex-wrap gap-2">
                {job.requirements?.skills?.map(skill => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm font-medium border border-primary-500/30"
                  >
                    {skill}
                  </span>
                ))}
                {!job.requirements?.skills?.length && (
                  <span className="text-white/40">No specific skills required</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-sm text-white/50">Experience</p>
                <p className="font-semibold text-white">
                  {job.requirements?.minExperience || 0} - {job.requirements?.maxExperience || 10} years
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-sm text-white/50">Education</p>
                <p className="font-semibold text-white">
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
          className="rounded-2xl glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Score Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="range" tick={{ fill: 'rgba(255,255,255,0.6)' }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.6)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: 'white'
                  }}
                />
                <Bar dataKey="count" fill="url(#jobBarGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="jobBarGradient" x1="0" y1="0" x2="0" y2="1">
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
        className="rounded-2xl glass-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Top Candidates</h3>
          <Link
            to={`/resumes?jobId=${id}`}
            className="text-primary-400 hover:text-primary-300 font-medium text-sm transition-colors"
          >
            View All →
          </Link>
        </div>

        {topCandidates.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white/30" />
            </div>
            <p className="text-white/50">No candidates yet</p>
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
                whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.05)' }}
                className="flex items-center gap-4 p-4 rounded-xl border border-white/10 transition-all cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                  index === 1 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/30' :
                  index === 2 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                  'bg-white/10 text-white/60'
                }`}>
                  {index + 1}
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
                  {(candidate.analysis?.contact?.name?.[0] || 'R').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white">
                    {candidate.analysis?.contact?.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-white/50">
                    {candidate.analysis?.experience?.experienceLevel} • {candidate.analysis?.skills?.totalSkills || 0} skills
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    (candidate.matchScore?.overallScore || 0) >= 75 ? 'text-emerald-400' :
                    (candidate.matchScore?.overallScore || 0) >= 50 ? 'text-blue-400' : 'text-yellow-400'
                  }`}>
                    {candidate.matchScore?.overallScore || 0}%
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    candidate.matchScore?.recommendation?.status === 'Highly Recommended' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    candidate.matchScore?.recommendation?.status === 'Recommended' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {candidate.matchScore?.recommendation?.status || 'Analyzed'}
                  </span>
                </div>
                <Link to={`/resumes/${candidate._id}`}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 rounded-xl bg-primary-500/30 text-primary-400 hover:bg-primary-500/40 border border-primary-500/30 text-sm font-medium"
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