// frontend/src/components/Layout.jsx
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import {
  Home,
  Upload,
  FileText,
  Briefcase,
  BarChart3,
  GitCompare,
  Menu,
  X,
  Sparkles,
  Cpu // <--- Added Cpu import for the AI badge icon
} from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/upload', icon: Upload, label: 'Upload' },
  { path: '/resumes', icon: FileText, label: 'Resumes' },
  { path: '/jobs', icon: Briefcase, label: 'Jobs' },
  { path: '/compare', icon: GitCompare, label: 'Compare' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const { data: aiStatus } = useQuery({
    queryKey: ['aiStatus'],
    queryFn: () => api.get('/resumes/ai-status').then(res => res.data),
    staleTime: 60000, // Cache for 1 minute
  });

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Animated Orbs */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-r from-violet-600/40 to-indigo-600/40 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-r from-fuchsia-600/40 to-pink-600/40 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -80, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-gradient-to-r from-emerald-500/30 to-teal-500/30 rounded-full blur-3xl"
        />
      </div>

      <div className="flex relative z-10">
        {/* Sidebar */}
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 z-40 h-screen w-72 p-4"
            >
              <div className="h-full rounded-3xl glass-card overflow-hidden">
                <div className="flex h-full flex-col">
                  {/* Logo */}
                  <div className="flex items-center gap-4 px-6 py-6 border-b border-white/10">
                    <motion.div
                      whileHover={{ rotate: 180, scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                      className="p-3 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl shadow-lg glow-primary"
                    >
                      <Sparkles className="w-7 h-7 text-white" />
                    </motion.div>
                    <div>
                      <h1 className="text-2xl font-bold gradient-text">ResumeAI</h1>
                      <p className="text-sm text-white/50">Smart Screening</p>
                    </div>
                  </div>

                  {/* Navigation */}
                  <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide">
                    {navItems.map((item, index) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <motion.div
                          key={item.path}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Link
                            to={item.path}
                            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                              isActive
                                ? 'bg-gradient-to-r from-primary-500/30 to-accent-500/30 text-white border border-white/20'
                                : 'hover:bg-white/10 text-white/60 hover:text-white'
                            }`}
                          >
                            {isActive && (
                              <motion.div
                                layoutId="activeNav"
                                className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-2xl"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                              />
                            )}
                            
                            <motion.div
                              whileHover={{ scale: 1.15, rotate: 5 }}
                              whileTap={{ scale: 0.95 }}
                              className="relative z-10"
                            >
                              <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-400' : 'text-white/50 group-hover:text-white'}`} />
                            </motion.div>
                            <span className="font-medium relative z-10">{item.label}</span>
                            {isActive && (
                              <motion.div
                                layoutId="activeDot"
                                className="ml-auto w-2 h-2 bg-primary-400 rounded-full shadow-lg shadow-primary-400/50"
                              />
                            )}
                          </Link>
                        </motion.div>
                      );
                    })}
                  </nav>

                  {/* Footer Tip */}
                  <div className="px-4 py-4 border-t border-white/10">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-primary-500/10 to-accent-500/10 border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-primary-400" />
                        <span className="text-sm font-semibold text-white">Pro Tip</span>
                      </div>
                      <p className="text-xs text-white/60">
                        Upload multiple resumes at once for batch processing
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-0'} p-4`}>
          {/* Top Bar */}
          <header className="mb-6">
            <div className="px-6 py-4 rounded-2xl glass-card">
              <div className="flex items-center justify-between">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all duration-300"
                >
                  {sidebarOpen ? (
                    <X className="w-5 h-5 text-white" />
                  ) : (
                    <Menu className="w-5 h-5 text-white" />
                  )}
                </motion.button>

                <div className="flex items-center gap-3">
                  {/* AI Status Badge - Changed to Gemini */}
                  {aiStatus?.aiEnabled && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30"
                    >
                      <Cpu className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium text-purple-300">Gemini Powered</span>
                    </motion.div>
                  )}
                  
                  {/* System Status - Hidden per your previous request, but added back if you want it */}
                  {/* 
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30"
                  >
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-emerald-400">Online</span>
                  </motion.div>
                  */}
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}