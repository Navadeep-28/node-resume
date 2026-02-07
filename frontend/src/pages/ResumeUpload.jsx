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
  Zap
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

    // Set up socket listeners
    socket.on('resume-processing', (data) => {
      setProgress(prev => ({
        ...prev,
        [data.resumeId]: data
      }));
    });

    socket.on('batch-processing', (data) => {
      setProgress(prev => ({
        ...prev,
        batch: data
      }));
    });

    try {
      const formData = new FormData();
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
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl shadow-lg shadow-primary-500/30 mb-4"
        >
          <Upload className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Resumes</h1>
        <p className="text-gray-500 mt-2">
          Drop your resume files here for AI-powered analysis
        </p>
      </div>

      {/* Job Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-6"
      >
        <label className="block text-sm font-medium text-gray-700 mb-2">
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
        transition={{ delay: 0.2 }}
      >
        <div
          {...getRootProps()}
          className={`relative glass rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragActive
              ? 'border-2 border-dashed border-primary-500 bg-primary-50/50'
              : 'hover:border-2 hover:border-dashed hover:border-gray-300'
          }`}
        >
          <input {...getInputProps()} />
          
          {/* Animated background */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            <motion.div
              animate={{
                scale: isDragActive ? [1, 1.2, 1] : 1,
                opacity: isDragActive ? [0.3, 0.5, 0.3] : 0.1
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
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-4"
            >
              <FileText className="w-10 h-10 text-gray-400" />
            </motion.div>
            
            {isDragActive ? (
              <p className="text-xl font-semibold text-primary-600">Drop files here...</p>
            ) : (
              <>
                <p className="text-xl font-semibold text-gray-700">
                  Drag & drop resumes here
                </p>
                <p className="text-gray-500 mt-2">
                  or click to browse files
                </p>
                <p className="text-sm text-gray-400 mt-4">
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
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Selected Files ({files.length})
              </h3>
              <button
                onClick={() => setFiles([])}
                className="text-sm text-red-500 hover:text-red-600 font-medium"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {files.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl group"
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(item.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeFile(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
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
                  <Zap className="w-5 h-5" />
                  Analyze {files.length} Resume{files.length > 1 ? 's' : ''}
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
                  <span className="text-gray-600">
                    Processing: {progress.batch.fileName}
                  </span>
                  <span className="font-medium text-primary-600">
                    {progress.batch.current} / {progress.batch.total}
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
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
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary-500" />
              <h3 className="text-lg font-semibold text-gray-900">Analysis Results</h3>
            </div>

            <div className="space-y-3">
              {results.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-4 p-4 rounded-xl ${
                    result.success ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${
                      result.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {result.success 
                        ? result.resume.analysis?.contact?.name || result.resume.originalName
                        : result.fileName
                      }
                    </p>
                    {result.success && (
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>Score: {result.resume.matchScore?.overallScore || 'N/A'}%</span>
                        <span>•</span>
                        <span>{result.resume.analysis?.skills?.totalSkills || 0} skills</span>
                        <span>•</span>
                        <span>{result.resume.analysis?.experience?.experienceLevel || 'N/A'}</span>
                      </div>
                    )}
                    {!result.success && (
                      <p className="text-sm text-red-500">{result.error}</p>
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
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {[
          { icon: Zap, title: 'Fast Processing', desc: 'AI-powered analysis in seconds' },
          { icon: Sparkles, title: 'Smart Matching', desc: 'Match candidates to jobs instantly' },
          { icon: FileText, title: 'Detailed Reports', desc: 'Get comprehensive insights' }
        ].map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            whileHover={{ y: -5 }}
            className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 text-center"
          >
            <feature.icon className="w-8 h-8 mx-auto text-primary-500 mb-2" />
            <h4 className="font-semibold text-gray-900">{feature.title}</h4>
            <p className="text-sm text-gray-500">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}