// frontend/src/pages/ResumeUpload.jsx
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Zap,
  Cpu
} from 'lucide-react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import api from '../services/api';

const socket = io('http://localhost:5000');

export default function ResumeUpload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const [results, setResults] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [analysisMode, setAnalysisMode] = useState('ai');

  const { data: aiStatus } = useQuery({
    queryKey: ['aiStatus'],
    queryFn: () => api.get('/resumes/ai-status').then(res => res.data),
  });

  const { data: jobsData } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.get('/jobs?status=active').then(res => res.data),
  });

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending'
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt']
    },
    multiple: true
  });

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setUploading(true);
    setResults([]);

    socket.on('resume-processing', (data) => {
      setProgress(prev => ({ ...prev, [data.resumeId]: data }));
    });

    socket.on('batch-processing', (data) => {
      setProgress(prev => ({ ...prev, batch: data }));
    });

    try {
      const formData = new FormData();
      formData.append('analysisMode', analysisMode);
      files.forEach(f => formData.append('resumes', f.file));
      if (selectedJob) formData.append('jobId', selectedJob);

      const response = await api.post('/resumes/upload-batch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResults(response.data.results);
      toast.success(`Successfully processed ${response.data.successful} resumes!`);
      setFiles([]);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      socket.off('resume-processing');
      socket.off('batch-processing');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl shadow-lg glow-primary mb-6"
        >
          <Upload className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className="text-3xl font-bold text-white">Upload Resumes</h1>
        <p className="text-white/50 mt-2">Select analysis mode and drop files for AI-powered analysis</p>
      </div>

      {/* Mode Selection Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* AI Mode Option */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => aiStatus?.aiEnabled ? setAnalysisMode('ai') : toast.error('AI not configured on server')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            analysisMode === 'ai'
              ? 'bg-violet-500/20 border-violet-500/50 shadow-lg shadow-violet-500/10'
              : 'bg-white/5 border-white/10 hover:bg-white/10 opacity-70'
          } ${!aiStatus?.aiEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Cpu className={`w-5 h-5 ${analysisMode === 'ai' ? 'text-violet-400' : 'text-white/50'}`} />
              <span className={`font-semibold ${analysisMode === 'ai' ? 'text-violet-300' : 'text-white/70'}`}>
                AI Intelligence
              </span>
            </div>
            {analysisMode === 'ai' && <div className="w-3 h-3 bg-violet-400 rounded-full shadow-lg shadow-violet-400/50" />}
          </div>
          <p className="text-xs text-white/50">
            Deep analysis using Google Gemini. Extracts insights, salary estimates, and detailed strengths.
            <span className="block mt-1 text-violet-300/70 text-[10px] uppercase tracking-wider">Slower • More Accurate</span>
          </p>
        </motion.button>

        {/* Rule-Based Option */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setAnalysisMode('rule')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            analysisMode === 'rule'
              ? 'bg-blue-500/20 border-blue-500/50 shadow-lg shadow-blue-500/10'
              : 'bg-white/5 border-white/10 hover:bg-white/10 opacity-70'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className={`w-5 h-5 ${analysisMode === 'rule' ? 'text-blue-400' : 'text-white/50'}`} />
              <span className={`font-semibold ${analysisMode === 'rule' ? 'text-blue-300' : 'text-white/70'}`}>
                Fast Pattern Match
              </span>
            </div>
            {analysisMode === 'rule' && <div className="w-3 h-3 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50" />}
          </div>
          <p className="text-xs text-white/50">
            Instant keyword and regex matching. Best for quick screening of large batches.
            <span className="block mt-1 text-blue-300/70 text-[10px] uppercase tracking-wider">Instant • Standard</span>
          </p>
        </motion.button>
      </motion.div>

      {/* Job Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl glass-card p-6"
      >
        <label className="block text-sm font-medium text-white/80 mb-3">
          Match Against Job Position (Optional)
        </label>
        <select
          value={selectedJob}
          onChange={(e) => setSelectedJob(e.target.value)}
          className="input-field"
        >
          <option value="">No specific job - General Analysis</option>
          {jobsData?.jobs?.map(job => (
            <option key={job._id} value={job._id}>
              {job.title} - {job.department}
            </option>
          ))}
        </select>
      </motion.div>

      {/* Dropzone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div
          {...getRootProps()}
          className={`relative rounded-2xl glass-card p-12 text-center cursor-pointer transition-all duration-300 border-2 border-dashed ${
            isDragActive
              ? 'border-primary-500 bg-primary-500/10'
              : 'border-white/20 hover:border-white/40'
          }`}
        >
          <input {...getInputProps()} />
          
          {/* Animated background */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            <motion.div
              animate={{
                scale: isDragActive ? [1, 1.2, 1] : 1,
                opacity: isDragActive ? [0.2, 0.4, 0.2] : 0.1
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-accent-500/20"
            />
          </div>

          <motion.div
            animate={{ y: isDragActive ? -10 : 0 }}
            className="relative z-10"
          >
            <motion.div
              animate={{ 
                rotate: isDragActive ? [0, 10, -10, 0] : 0,
                scale: isDragActive ? 1.1 : 1
              }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl border border-white/20 mb-6"
            >
              <Upload className="w-12 h-12 text-white/60" />
            </motion.div>
            
            {isDragActive ? (
              <p className="text-xl font-semibold text-primary-400">Drop files here...</p>
            ) : (
              <>
                <p className="text-xl font-semibold text-white">Drag & drop resumes here</p>
                <p className="text-white/50 mt-2">or click to browse files</p>
                <p className="text-sm text-white/30 mt-4">
                  Supports PDF, DOCX, DOC, TXT (Max 10MB each)
                </p>
              </>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Selected Files ({files.length})
              </h3>
              <button
                onClick={() => setFiles([])}
                className="text-sm text-red-400 hover:text-red-300 font-medium transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-hide">
              {files.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 group"
                >
                  <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center border border-primary-500/30">
                    <FileText className="w-6 h-6 text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{item.file.name}</p>
                    <p className="text-sm text-white/50">
                      {(item.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeFile(item.id)}
                    className="p-2 text-white/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-500/20"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              ))}
            </div>

            {/* Upload Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={uploadFiles}
              disabled={uploading}
              className="w-full mt-6 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {analysisMode === 'ai' ? <Sparkles className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                  Analyze {files.length} Resume{files.length > 1 ? 's' : ''} with {analysisMode === 'ai' ? 'AI' : 'Pattern Matching'}
                </>
              )}
            </motion.button>

            {/* Progress */}
            {uploading && progress.batch && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4"
              >
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-white/60">Processing: {progress.batch.fileName}</span>
                  <span className="font-medium text-primary-400">
                    {progress.batch.current} / {progress.batch.total}
                  </span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.batch.progress}%` }}
                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full relative"
                  >
                    <span className="absolute inset-0 shimmer" />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-2xl glass-card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary-400" />
              <h3 className="text-lg font-semibold text-white">Analysis Results</h3>
            </div>

            <div className="space-y-3">
              {results.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-4 p-4 rounded-xl border ${
                    result.success 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${result.success ? 'text-emerald-300' : 'text-red-300'}`}>
                      {result.success 
                        ? result.resume.analysis?.contact?.name || result.resume.originalName
                        : result.fileName
                      }
                    </p>
                    {result.success && (
                      <div className="flex items-center gap-4 mt-1 text-sm text-white/50">
                        <span>Score: {result.resume.matchScore?.overallScore || 'N/A'}%</span>
                        <span>•</span>
                        <span>{result.resume.analysis?.skills?.totalSkills || 0} skills</span>
                        <span>•</span>
                        <span>{result.resume.analysis?.experience?.experienceLevel || 'N/A'}</span>
                      </div>
                    )}
                    {!result.success && (
                      <p className="text-sm text-red-400/80">{result.error}</p>
                    )}
                  </div>
                  {result.success && (
                    <span className={`score-badge ${
                      result.resume.matchScore?.overallScore >= 75 ? 'score-high' :
                      result.resume.matchScore?.overallScore >= 50 ? 'score-medium' : 'score-low'
                    }`}>
                      {result.resume.matchScore?.recommendation?.status || 'Analyzed'}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {[
          { icon: Zap, title: 'Fast Processing', desc: 'AI-powered analysis in seconds', gradient: 'from-yellow-500 to-orange-500' },
          { icon: Sparkles, title: 'Smart Matching', desc: 'Match candidates to jobs instantly', gradient: 'from-primary-500 to-cyan-500' },
          { icon: FileText, title: 'Detailed Reports', desc: 'Get comprehensive insights', gradient: 'from-violet-500 to-purple-500' }
        ].map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            whileHover={{ y: -5 }}
            className="p-6 rounded-2xl glass-card text-center group"
          >
            <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
              <feature.icon className="w-7 h-7 text-white" />
            </div>
            <h4 className="font-semibold text-white">{feature.title}</h4>
            <p className="text-sm text-white/50 mt-1">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}