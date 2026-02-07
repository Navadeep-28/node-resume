// frontend/src/pages/CompareResumes.jsx
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitCompare,
  Trophy,
  Star,
  Briefcase,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Loader2
} from 'lucide-react';
import api from '../services/api';

export default function CompareResumes() {
  const [selectedIds, setSelectedIds] = useState([]);
  const [comparisonResult, setComparisonResult] = useState(null);

  const { data: resumesData } = useQuery({
    queryKey: ['allResumes'],
    queryFn: () => api.get('/resumes?limit=100&status=completed').then(res => res.data),
  });

  const compareMutation = useMutation({
    mutationFn: (resumeIds) => api.post('/resumes/compare', { resumeIds }),
    onSuccess: (response) => setComparisonResult(response.data.comparison)
  });

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const handleCompare = () => {
    if (selectedIds.length >= 2) {
      compareMutation.mutate(selectedIds);
    }
  };

  const resumes = resumesData?.resumes || [];

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
            <GitCompare className="w-8 h-8 text-primary-400" />
            Compare Candidates
          </h1>
          <p className="text-white/50 mt-1">Select 2-4 candidates to compare side by side</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCompare}
          disabled={selectedIds.length < 2 || compareMutation.isLoading}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {compareMutation.isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Comparing...
            </>
          ) : (
            <>
              <GitCompare className="w-5 h-5" />
              Compare ({selectedIds.length}/4)
            </>
          )}
        </motion.button>
      </div>

      {/* Selection Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl glass-card p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Select Candidates</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {resumes.map((resume) => {
            const isSelected = selectedIds.includes(resume._id);
            return (
              <motion.div
                key={resume._id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleSelect(resume._id)}
                className={`p-4 rounded-xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'border-primary-500 bg-primary-500/20 shadow-lg shadow-primary-500/20'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${
                    isSelected 
                      ? 'bg-gradient-to-br from-primary-500 to-accent-500' 
                      : 'bg-white/10'
                  }`}>
                    {(resume.analysis?.contact?.name?.[0] || 'R').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">
                      {resume.analysis?.contact?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-white/50">
                      {resume.analysis?.experience?.experienceLevel || 'N/A'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-sm font-semibold ${
                        resume.matchScore?.overallScore >= 70 ? 'text-emerald-400' : 
                        resume.matchScore?.overallScore >= 50 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {resume.matchScore?.overallScore || 0}%
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-primary-400" />
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Comparison Results */}
      <AnimatePresence>
        {comparisonResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Winner Banner */}
            {comparisonResult.length > 0 && (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="rounded-2xl p-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30"
              >
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
                    <Trophy className="w-8 h-8 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Top Candidate: {comparisonResult[0].name}
                    </h3>
                    <p className="text-white/60">
                      Score: {comparisonResult[0].matchScore}% • 
                      {comparisonResult[0].experience} years experience • 
                      {comparisonResult[0].skills} skills
                    </p>
                  </div>
                  <div className="ml-auto">
                    <span className="px-4 py-2 bg-yellow-500/30 text-yellow-300 rounded-full font-semibold border border-yellow-500/30">
                      {comparisonResult[0].recommendation}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Comparison Table */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl glass-card overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-white/60 w-48">
                        Criteria
                      </th>
                      {comparisonResult.map((candidate, index) => (
                        <th key={candidate.id} className="text-center px-6 py-4">
                          <div className="flex flex-col items-center">
                            {index === 0 && (
                              <Trophy className="w-5 h-5 text-yellow-400 mb-1" />
                            )}
                            <span className="font-semibold text-white">{candidate.name}</span>
                            <span className="text-sm text-white/50">#{index + 1}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {/* Match Score */}
                    <tr className="hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white/80">
                        <Star className="w-4 h-4 inline mr-2 text-primary-400" />
                        Match Score
                      </td>
                      {comparisonResult.map((c, i) => (
                        <td key={c.id} className="px-6 py-4 text-center">
                          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
                            i === 0 ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-white/10'
                          }`}>
                            <span className={`text-xl font-bold ${
                              i === 0 ? 'text-emerald-400' : 'text-white'
                            }`}>
                              {c.matchScore}%
                            </span>
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Experience */}
                    <tr className="hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white/80">
                        <Briefcase className="w-4 h-4 inline mr-2 text-primary-400" />
                        Experience
                      </td>
                      {comparisonResult.map((c) => (
                        <td key={c.id} className="px-6 py-4 text-center">
                          <span className="font-semibold text-white">{c.experience} years</span>
                          <p className="text-sm text-white/50">{c.experienceLevel}</p>
                        </td>
                      ))}
                    </tr>

                    {/* Education */}
                    <tr className="hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white/80">
                        <GraduationCap className="w-4 h-4 inline mr-2 text-primary-400" />
                        Education
                      </td>
                      {comparisonResult.map((c) => (
                        <td key={c.id} className="px-6 py-4 text-center font-medium text-white">
                          {c.education}
                        </td>
                      ))}
                    </tr>

                    {/* Skills Count */}
                    <tr className="hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white/80">
                        Total Skills
                      </td>
                      {comparisonResult.map((c) => (
                        <td key={c.id} className="px-6 py-4 text-center">
                          <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full font-medium border border-primary-500/30">
                            {c.skills} skills
                          </span>
                        </td>
                      ))}
                    </tr>

                    {/* Professionalism */}
                    <tr className="hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white/80">
                        Professionalism
                      </td>
                      {comparisonResult.map((c) => (
                        <td key={c.id} className="px-6 py-4 text-center">
                          <div className="w-full max-w-24 mx-auto">
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                                style={{ width: `${c.professionalismScore}%` }}
                              />
                            </div>
                            <span className="text-sm text-white/60">{c.professionalismScore}%</span>
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Red Flags */}
                    <tr className="hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white/80">
                        <AlertTriangle className="w-4 h-4 inline mr-2 text-orange-400" />
                        Red Flags
                      </td>
                      {comparisonResult.map((c) => (
                        <td key={c.id} className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            c.redFlagsCount === 0 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {c.redFlagsCount} flags
                          </span>
                        </td>
                      ))}
                    </tr>

                    {/* Recommendation */}
                    <tr className="hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white/80">
                        Recommendation
                      </td>
                      {comparisonResult.map((c) => (
                        <td key={c.id} className="px-6 py-4 text-center">
                          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                            c.recommendation === 'Highly Recommended' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            c.recommendation === 'Recommended' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                            c.recommendation === 'Potential' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {c.recommendation}
                          </span>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setComparisonResult(null)}
                className="btn-secondary"
              >
                New Comparison
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary flex items-center gap-2"
              >
                Export Report
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}