// frontend/src/pages/Analytics.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Printer,
  X
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../services/api';
import { exportAsJSON, exportAsCSV, exportAsHTML, exportAsPDF } from '../services/reportService';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Analytics() {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => api.get('/analytics/dashboard').then(res => res.data),
  });

  const { data: skillsAnalytics } = useQuery({
    queryKey: ['skillsAnalytics'],
    queryFn: () => api.get('/analytics/skills').then(res => res.data),
  });

  const handleExportJSON = () => {
    const exportData = { dashboardStats, skillsAnalytics, exportedAt: new Date().toISOString() };
    exportAsJSON(exportData, `analytics-report-${format(new Date(), 'yyyy-MM-dd')}`);
    toast.success('Analytics exported as JSON');
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    if (!dashboardStats?.topSkills) return toast.error('No data to export');
    const csvData = dashboardStats.topSkills.map(skill => ({ Skill: skill._id, Count: skill.count }));
    exportAsCSV(csvData, `skills-analytics-${format(new Date(), 'yyyy-MM-dd')}`);
    toast.success('Skills data exported as CSV');
    setShowExportMenu(false);
  };

  const handleExportHTML = () => {
    if (!dashboardStats) return toast.error('No data to export');
    exportAsHTML(dashboardStats, `analytics-report-${format(new Date(), 'yyyy-MM-dd')}`);
    toast.success('Report exported as HTML');
    setShowExportMenu(false);
  };

  const handlePrintPDF = () => {
    if (!dashboardStats) return toast.error('No data to export');
    exportAsPDF(dashboardStats);
    toast.success('Opening print dialog...');
    setShowExportMenu(false);
  };

  const skillsCategoryData = skillsAnalytics?.skillsByCategory 
    ? Object.entries(skillsAnalytics.skillsByCategory).map(([key, value]) => ({
        name: key.replace('_', ' '),
        value: parseFloat(value?.toFixed(2)) || 0
      }))
    : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary-400" />
            Analytics
          </h1>
          <p className="text-white/50 mt-1">Insights and trends from your resume screening</p>
        </div>
        
        {/* Export Button with Dropdown */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export Report
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
                    <div className="p-2 rounded-lg bg-red-500/20"><Printer className="w-5 h-5 text-red-400" /></div>
                    <div className="text-left">
                      <p className="font-medium text-white">Print / PDF</p>
                      <p className="text-xs text-white/50">Open print dialog</p>
                    </div>
                  </button>

                  // frontend/src/pages/Analytics.jsx (continued)
                  <button onClick={handleExportHTML} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="p-2 rounded-lg bg-blue-500/20"><FileText className="w-5 h-5 text-blue-400" /></div>
                    <div className="text-left">
                      <p className="font-medium text-white">HTML Report</p>
                      <p className="text-xs text-white/50">Formatted report</p>
                    </div>
                  </button>

                  <button onClick={handleExportCSV} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="p-2 rounded-lg bg-emerald-500/20"><FileSpreadsheet className="w-5 h-5 text-emerald-400" /></div>
                    <div className="text-left">
                      <p className="font-medium text-white">CSV Spreadsheet</p>
                      <p className="text-xs text-white/50">Excel compatible</p>
                    </div>
                  </button>

                  <button onClick={handleExportJSON} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="p-2 rounded-lg bg-yellow-500/20"><FileJson className="w-5 h-5 text-yellow-400" /></div>
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

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Resumes', value: dashboardStats?.overview?.totalResumes || 0, icon: Users, gradient: 'from-blue-500 to-cyan-500' },
          { label: 'Processed', value: dashboardStats?.overview?.processedResumes || 0, icon: TrendingUp, gradient: 'from-emerald-500 to-teal-500' },
          { label: 'Active Jobs', value: dashboardStats?.overview?.activeJobs || 0, icon: Target, gradient: 'from-violet-500 to-purple-500' },
          { label: 'Avg Score', value: `${dashboardStats?.overview?.averageScore || 0}%`, icon: BarChart3, gradient: 'from-orange-500 to-pink-500' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="rounded-2xl glass-card p-6 relative overflow-hidden group"
          >
            <div className="relative z-10">
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.gradient} mb-4 shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-white/50">{stat.label}</p>
            </div>
            <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-30 bg-gradient-to-br ${stat.gradient} group-hover:opacity-50 transition-opacity`} />
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
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
                  data={dashboardStats?.scoreDistribution?.map((item, index) => ({
                    name: getScoreLabel(item._id),
                    value: item.count,
                    fill: COLORS[index % COLORS.length]
                  })) || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dashboardStats?.scoreDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: 'white'
                  }}
                />
                <Legend 
                  formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.8)' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Skills by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Average Skills by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillsCategoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.6)' }} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} width={80} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: 'white'
                  }}
                />
                <Bar dataKey="value" fill="url(#analyticsBarGradient)" radius={[0, 8, 8, 0]} />
                <defs>
                  <linearGradient id="analyticsBarGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#d946ef" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Experience Levels */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Experience Levels</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardStats?.experienceDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="_id" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.6)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: 'white'
                  }}
                />
                <Bar dataKey="count" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recommendation Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Recommendations</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="20%"
                outerRadius="90%"
                barSize={20}
                data={dashboardStats?.recommendationDistribution?.map((item) => ({
                  name: item._id,
                  value: item.count,
                  fill: getRecommendationColor(item._id)
                })) || []}
              >
                <RadialBar
                  minAngle={15}
                  background={{ fill: 'rgba(255,255,255,0.05)' }}
                  clockWise
                  dataKey="value"
                />
                <Legend
                  iconSize={10}
                  layout="horizontal"
                  verticalAlign="bottom"
                  formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.8)' }}>{value}</span>}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: 'white'
                  }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Top Skills Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl glass-card p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-6">Most Common Skills</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {dashboardStats?.topSkills?.slice(0, 10).map((skill, index) => (
            <motion.div
              key={skill._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="p-5 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 text-center group cursor-pointer"
            >
              <span className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                {skill.count}
              </span>
              <p className="text-sm text-white/60 mt-2 capitalize truncate group-hover:text-white transition-colors">
                {skill._id}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Click outside to close menu */}
      {showExportMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowExportMenu(false)}
        />
      )}
    </motion.div>
  );
}

function getScoreLabel(id) {
  if (id === 0) return '0-25%';
  if (id === 25) return '25-50%';
  if (id === 50) return '50-75%';
  if (id === 75) return '75-100%';
  return String(id);
}

function getRecommendationColor(status) {
  const colors = {
    'Highly Recommended': '#10b981',
    'Recommended': '#3b82f6',
    'Potential': '#f59e0b',
    'Not Recommended': '#ef4444'
  };
  return colors[status] || '#6b7280';
}