// frontend/src/pages/Dashboard.jsx
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FileText,
  Briefcase,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Clock
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { format } from 'date-fns';
import api from '../services/api';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => api.get('/analytics/dashboard').then(res => res.data),
  });

  const statCards = [
    {
      title: 'Total Resumes',
      value: stats?.overview?.totalResumes || 0,
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
      change: '+12%',
      isPositive: true
    },
    {
      title: 'Processed',
      value: stats?.overview?.processedResumes || 0,
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500',
      change: '+8%',
      isPositive: true
    },
    {
      title: 'Active Jobs',
      value: stats?.overview?.activeJobs || 0,
      icon: Briefcase,
      color: 'from-purple-500 to-pink-500',
      change: '+3',
      isPositive: true
    },
    {
      title: 'Avg Score',
      value: `${stats?.overview?.averageScore || 0}%`,
      icon: Sparkles,
      color: 'from-orange-500 to-red-500',
      change: '-2%',
      isPositive: false
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's your hiring overview.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Generate Report
        </motion.button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            variants={itemVariants}
            whileHover={{ y: -5, scale: 1.02 }}
            className="glass rounded-2xl p-6 card-hover"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                stat.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.isPositive ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {stat.change}
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
            <p className="text-gray-500 text-sm mt-1">{stat.title}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <motion.div variants={itemVariants} className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.scoreDistribution?.map((item, index) => ({
                    name: getScoreLabel(item._id),
                    value: item.count
                  })) || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats?.scoreDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(255, 255, 255, 0.9)', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                  }} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Experience Distribution */}
        <motion.div variants={itemVariants} className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Experience Levels</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.experienceDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="_id" tick={{ fill: '#6b7280' }} />
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

      {/* Top Skills & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Skills */}
        <motion.div variants={itemVariants} className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Skills</h3>
          <div className="space-y-4">
            {stats?.topSkills?.slice(0, 8).map((skill, index) => (
              <motion.div
                key={skill._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4"
              >
                <span className="w-8 h-8 flex items-center justify-center bg-primary-100 text-primary-600 rounded-lg text-sm font-semibold">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-700 capitalize">{skill._id}</span>
                    <span className="text-sm text-gray-500">{skill.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(skill.count / stats.topSkills[0].count) * 100}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Resumes</h3>
          <div className="space-y-4">
            {stats?.recentResumes?.map((resume, index) => (
              <motion.div
                key={resume._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 5 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-lg">
                  {(resume.analysis?.contact?.name?.[0] || resume.originalName?.[0] || 'R').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {resume.analysis?.contact?.name || resume.originalName}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {format(new Date(resume.createdAt), 'MMM d, h:mm a')}
                  </div>
                </div>
                <div className={`score-badge ${getScoreClass(resume.matchScore?.overallScore)}`}>
                  {resume.matchScore?.overallScore || 0}%
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recommendation Distribution */}
      <motion.div variants={itemVariants} className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats?.recommendationDistribution?.map((rec, index) => (
            <motion.div
              key={rec._id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className={`p-6 rounded-xl ${getRecommendationBg(rec._id)} text-center`}
            >
              <p className="text-3xl font-bold">{rec.count}</p>
              <p className="text-sm mt-1 opacity-80">{rec._id}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function getScoreLabel(id) {
  if (id === 0) return '0-25%';
  if (id === 25) return '25-50%';
  if (id === 50) return '50-75%';
  if (id === 75) return '75-100%';
  return id;
}

function getScoreClass(score) {
  if (score >= 75) return 'score-high';
  if (score >= 50) return 'score-medium';
  return 'score-low';
}

function getRecommendationBg(status) {
  const bgMap = {
    'Highly Recommended': 'bg-green-100 text-green-700',
    'Recommended': 'bg-blue-100 text-blue-700',
    'Potential': 'bg-yellow-100 text-yellow-700',
    'Not Recommended': 'bg-red-100 text-red-700'
  };
  return bgMap[status] || 'bg-gray-100 text-gray-700';
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass rounded-2xl p-6 h-32">
            <div className="h-12 w-12 bg-gray-200 rounded-xl mb-4" />
            <div className="h-6 w-20 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}