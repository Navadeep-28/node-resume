// frontend/src/pages/Dashboard.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Briefcase,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Clock,
  Download,
  FileJson,
  FileSpreadsheet,
  Printer,
  X
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../services/api';
import { exportAsJSON, exportAsCSV, exportAsHTML, exportAsPDF } from '../services/reportService';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => api.get('/analytics/dashboard').then(res => res.data),
  });

  const handleExportJSON = () => {
    if (!stats) return toast.error('No data to export');
    exportAsJSON(stats, `resume-report-${format(new Date(), 'yyyy-MM-dd')}`);
    toast.success('Report exported as JSON');
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    if (!stats?.recentResumes) return toast.error('No resume data to export');
    const csvData = stats.recentResumes.map(resume => ({
      Name: resume.analysis?.contact?.name || 'Unknown',
      Email: resume.analysis?.contact?.email || 'N/A',
      Score: resume.matchScore?.overallScore || 0,
      Experience: resume.analysis?.experience?.totalYears || 0,
      Level: resume.analysis?.experience?.experienceLevel || 'N/A',
      Date: format(new Date(resume.createdAt), 'yyyy-MM-dd')
    }));
    exportAsCSV(csvData, `resume-data-${format(new Date(), 'yyyy-MM-dd')}`);
    toast.success('Report exported as CSV');
    setShowExportMenu(false);
  };

  const handleExportHTML = () => {
    if (!stats) return toast.error('No data to export');
    exportAsHTML(stats, `resume-report-${format(new Date(), 'yyyy-MM-dd')}`);
    toast.success('Report exported as HTML');
    setShowExportMenu(false);
  };

  const handlePrintPDF = () => {
    if (!stats) return toast.error('No data to export');
    exportAsPDF(stats);
    toast.success('Opening print dialog...');
    setShowExportMenu(false);
  };

  const statCards = [
    {
      title: 'Total Resumes',
      value: stats?.overview?.totalResumes || 0,
      icon: FileText,
      gradient: 'from-blue-500 to-cyan-500',
      change: '+12%',
      isPositive: true
    },
    {
      title: 'Processed',
      value: stats?.overview?.processedResumes || 0,
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-teal-500',
      change: '+8%',
      isPositive: true
    },
    {
      title: 'Active Jobs',
      value: stats?.overview?.activeJobs || 0,
      icon: Briefcase,
      gradient: 'from-violet-500 to-purple-500',
      change: '+3',
      isPositive: true
    },
    {
      title: 'Avg Score',
      value: `${stats?.overview?.averageScore || 0}%`,
      icon: Sparkles,
      gradient: 'from-orange-500 to-pink-500',
      change: '-2%',
      isPositive: false
    },
  ];

  if (isLoading) return <DashboardSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-white/50 mt-1">Welcome back! Here's your hiring overview.</p>
        </div>
        
        {/* Export Button */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="btn-primary flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Generate Report
          </motion.button>

          <AnimatePresence>
            {showExportMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-64 rounded-2xl glass-card overflow-hidden z-50"
              >
                <div className="p-3">
                  <p className="px-3 py-2 text-xs font-semibold text-white/50 uppercase">Export Options</p>
                  
                  <button onClick={handlePrintPDF} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="p-2 rounded-lg bg-red-500/20">
                      <Printer className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-white">Print / PDF</p>
                      <p className="text-xs text-white/50">Open print dialog</p>
                    </div>
                  </button>

                  <button onClick={handleExportHTML} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-white">HTML Report</p>
                      <p className="text-xs text-white/50">Formatted report</p>
                    </div>
                  </button>

                  <button onClick={handleExportCSV} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-white">CSV Spreadsheet</p>
                      <p className="text-xs text-white/50">Excel compatible</p>
                    </div>
                  </button>

                  <button onClick={handleExportJSON} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="p-2 rounded-lg bg-yellow-500/20">
                      <FileJson className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-white">JSON Data</p>
                      <p className="text-xs text-white/50">Raw data export</p>
                    </div>
                  </button>
                </div>

                <div className="border-t border-white/10 p-3">
                  <button
                    onClick={() => setShowExportMenu(false)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-white/50 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="relative overflow-hidden rounded-2xl glass-card p-6 group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  stat.isPositive 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {stat.isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {stat.change}
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
              <p className="text-white/50 text-sm mt-1">{stat.title}</p>
            </div>

            <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-30 bg-gradient-to-br ${stat.gradient}`} />
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Score Distribution</h3>
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
                    background: 'rgba(15, 23, 42, 0.9)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '12px',
                    color: 'white'
                  }} 
                />
                <Legend 
                  wrapperStyle={{ color: 'white' }}
                  formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.8)' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Experience Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Experience Levels</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.experienceDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="_id" tick={{ fill: 'rgba(255,255,255,0.6)' }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.6)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: 'white'
                  }}
                />
                <Bar dataKey="count" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Top Skills</h3>
          <div className="space-y-4">
            {stats?.topSkills?.slice(0, 8).map((skill, index) => (
              <motion.div
                key={skill._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4"
              >
                <span className="w-8 h-8 flex items-center justify-center bg-primary-500/20 text-primary-400 rounded-lg text-sm font-semibold border border-primary-500/30">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white/80 capitalize">{skill._id}</span>
                    <span className="text-sm text-white/50">{skill.count}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(skill.count / (stats.topSkills[0]?.count || 1)) * 100}%` }}
                      transition={{ duration: 0.8, delay: index * 0.05 }}
                      className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Recent Resumes</h3>
          <div className="space-y-3">
            {stats?.recentResumes?.map((resume, index) => (
              <motion.div
                key={resume._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.05)' }}
                className="flex items-center gap-4 p-4 rounded-xl border border-white/10 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-lg">
                  {(resume.analysis?.contact?.name?.[0] || resume.originalName?.[0] || 'R').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {resume.analysis?.contact?.name || resume.originalName}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-white/50">
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl glass-card p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Recommendations Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats?.recommendationDistribution?.map((rec, index) => (
            <motion.div
              key={rec._id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className={`p-6 rounded-2xl text-center border ${getRecommendationStyle(rec._id)}`}
            >
              <p className="text-3xl font-bold">{rec.count}</p>
              <p className="text-sm mt-1 opacity-80">{rec._id}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {showExportMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
      )}
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

function getRecommendationStyle(status) {
  const styles = {
    'Highly Recommended': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'Recommended': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Potential': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'Not Recommended': 'bg-red-500/20 text-red-400 border-red-500/30'
  };
  return styles[status] || 'bg-white/10 text-white/60 border-white/20';
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-white/10 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl glass-card p-6 h-32">
            <div className="h-12 w-12 bg-white/10 rounded-xl mb-4" />
            <div className="h-6 w-20 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}