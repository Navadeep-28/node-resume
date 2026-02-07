// frontend/src/pages/ResumeDetail.jsx
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Briefcase,
  GraduationCap,
  Star,
  AlertTriangle,
  AlertCircle,
  Lightbulb,
  MessageSquare,
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import api from '../services/api';

export default function ResumeDetail() {
  const { id } = useParams();
  
  const { data: resume, isLoading } = useQuery({
    queryKey: ['resume', id],
    queryFn: () => api.get(`/resumes/${id}`).then(res => res.data),
  });

  if (isLoading) return <DetailSkeleton />;
  if (!resume) return <div className="text-white text-center py-12">Resume not found</div>;

  const { analysis, matchScore } = resume;
  const contact = analysis?.contact || {};
  const skills = analysis?.skills || {};
  const experience = analysis?.experience || {};
  const education = analysis?.education || {};
  const sentiment = analysis?.sentiment || {};

  const skillsRadarData = [
    { skill: 'Programming', value: skills.categorized?.programming?.length || 0, fullMark: 10 },
    { skill: 'Frontend', value: skills.categorized?.frontend?.length || 0, fullMark: 10 },
    { skill: 'Backend', value: skills.categorized?.backend?.length || 0, fullMark: 10 },
    { skill: 'Database', value: skills.categorized?.database?.length || 0, fullMark: 10 },
    { skill: 'Cloud', value: skills.categorized?.cloud?.length || 0, fullMark: 10 },
    { skill: 'ML/AI', value: skills.categorized?.ml_ai?.length || 0, fullMark: 10 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Back Button */}
      <Link
        to="/resumes"
        className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Resumes
      </Link>

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl glass-card p-8"
      >
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-start gap-6">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg glow-primary"
              >
                {(contact.name?.[0] || 'R').toUpperCase()}
              </motion.div>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white">
                  {contact.name || 'Unknown Candidate'}
                </h1>
                <p className="text-lg text-white/60 mt-1">
                  {experience.jobTitles?.[0] || 'No title specified'}
                </p>
                
                <div className="flex flex-wrap gap-4 mt-4">
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-white/60 hover:text-primary-400 transition-colors">
                      <Mail className="w-4 h-4" />
                      {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <span className="flex items-center gap-2 text-white/60">
                      <Phone className="w-4 h-4" />
                      {contact.phone}
                    </span>
                  )}
                  {contact.location && (
                    <span className="flex items-center gap-2 text-white/60">
                      <MapPin className="w-4 h-4" />
                      {contact.location}
                    </span>
                  )}
                </div>

                <div className="flex gap-3 mt-4">
                  {contact.linkedin && (
                    <motion.a
                      whileHover={{ scale: 1.1 }}
                      href={`https://${contact.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 border border-blue-500/30"
                    >
                      <Linkedin className="w-5 h-5" />
                    </motion.a>
                  )}
                  {contact.github && (
                    <motion.a
                      whileHover={{ scale: 1.1 }}
                      href={`https://${contact.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/10 text-white/80 rounded-lg hover:bg-white/20 border border-white/20"
                    >
                      <Github className="w-5 h-5" />
                    </motion.a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Score Card */}
          <div className="lg:w-72">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`p-6 rounded-2xl text-center ${getScoreBg(matchScore?.overallScore)}`}
            >
              <div className="relative inline-block">
                <svg className="w-32 h-32" viewBox="0 0 100 100">
                  <circle
                    className="text-white/10"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="42"
                    cx="50"
                    cy="50"
                  />
                  <motion.circle
                    className={getScoreStroke(matchScore?.overallScore)}
                    strokeWidth="8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="42"
                    cx="50"
                    cy="50"
                    initial={{ strokeDasharray: '0, 264' }}
                    animate={{ 
                      strokeDasharray: `${(matchScore?.overallScore || 0) * 2.64}, 264` 
                    }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">{matchScore?.overallScore || 0}%</span>
                </div>
              </div>
              
              <p className="font-semibold mt-2 text-white">{matchScore?.recommendation?.status || 'Analyzed'}</p>
              <p className="text-sm text-white/60">{matchScore?.recommendation?.action}</p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Skills & Experience */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skills Radar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl glass-card p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-primary-400" />
              Skills Overview
            </h3>
            
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={skillsRadarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} />
                  <Radar
                    name="Skills"
                    dataKey="value"
                    stroke="#0ea5e9"
                    fill="#0ea5e9"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Skill Tags */}
            <div className="mt-4 space-y-4">
              {Object.entries(skills.categorized || {}).map(([category, skillList]) => (
                skillList?.length > 0 && (
                  <div key={category}>
                    <p className="text-sm font-medium text-white/50 capitalize mb-2">{category.replace('_', ' ')}</p>
                    <div className="flex flex-wrap gap-2">
                      {skillList.map(skill => (
                        <motion.span
                          key={skill}
                          whileHover={{ scale: 1.05 }}
                          className="px-3 py-1 bg-gradient-to-r from-primary-500/20 to-accent-500/20 text-primary-300 rounded-full text-sm font-medium border border-primary-500/30"
                        >
                          {skill}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </motion.div>

          {/* Experience & Education */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Experience */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl glass-card p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary-400" />
                Experience
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-primary-500/10 rounded-xl border border-primary-500/20">
                  <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary-400">
                      {experience.totalYears || 0} Years
                    </p>
                    <p className="text-sm text-white/50">Total Experience</p>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-sm text-white/50 mb-1">Level</p>
                  <p className="font-semibold text-white">
                    {experience.experienceLevel || 'Not specified'}
                  </p>
                </div>

                {experience.jobTitles?.length > 0 && (
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-sm text-white/50 mb-2">Previous Roles</p>
                    <div className="space-y-1">
                      {experience.jobTitles.map((title, i) => (
                        <p key={i} className="text-white/80">{title}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Education */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl glass-card p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-accent-400" />
                Education
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-accent-500/10 rounded-xl border border-accent-500/20">
                  <div className="w-12 h-12 bg-accent-500/20 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-accent-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-accent-400">
                      {education.highestDegree || 'Not specified'}
                    </p>
                    <p className="text-sm text-white/50">Highest Degree</p>
                  </div>
                </div>

                {education.universities?.length > 0 && (
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-sm text-white/50 mb-2">Universities</p>
                    {education.universities.map((uni, i) => (
                      <p key={i} className="text-white/80">{uni}</p>
                    ))}
                  </div>
                )}

                {education.fields?.length > 0 && (
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-sm text-white/50 mb-2">Fields of Study</p>
                    {education.fields.map((field, i) => (
                      <p key={i} className="text-white/80 capitalize">{field}</p>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Match Details */}
          {matchScore?.matchDetails && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-2xl glass-card p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-400" />
                Match Analysis
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={`p-4 rounded-xl border ${matchScore.matchDetails.experienceMatch ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {matchScore.matchDetails.experienceMatch ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="font-medium text-white">Experience</span>
                  </div>
                  <p className="text-sm text-white/50">
                    {matchScore.matchDetails.experienceMatch ? 'Meets requirements' : 'Below requirements'}
                  </p>
                </div>

                <div className={`p-4 rounded-xl border ${matchScore.matchDetails.educationMatch ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {matchScore.matchDetails.educationMatch ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="font-medium text-white">Education</span>
                  </div>
                  <p className="text-sm text-white/50">
                    {matchScore.matchDetails.educationMatch ? 'Meets requirements' : 'Below requirements'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-5 h-5 text-blue-400" />
                    <span className="font-medium text-white">Skills Match</span>
                  </div>
                  <p className="text-sm text-white/50">
                    {matchScore.matchDetails.skillsMatch?.length || 0} matching skills
                  </p>
                </div>
              </div>

              {matchScore.matchDetails.missingSkills?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-white/60 mb-2">Missing Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {matchScore.matchDetails.missingSkills.map(skill => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm border border-red-500/30"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Right Column - Flags & Questions */}
        <div className="space-y-6">
          {/* Professionalism Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl glass-card p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Professionalism</h3>
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/50">Score</span>
                <span className="text-lg font-bold text-white">
                  {sentiment.professionalismScore || 0}%
                </span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${sentiment.professionalismScore || 0}%` }}
                  transition={{ duration: 1 }}
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                />
              </div>
            </div>
            <p className="text-sm text-white/50 mt-3">
              Tone: <span className="font-medium text-white">{sentiment.tone}</span>
            </p>
          </motion.div>

          {/* Red Flags */}
          {(analysis?.redFlags?.length > 0 || analysis?.warnings?.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl glass-card p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                Flags & Warnings
              </h3>
              
              <div className="space-y-3">
                {analysis.redFlags?.map((flag, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex items-start gap-3 p-3 bg-red-500/10 rounded-xl border border-red-500/30"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-300">{flag.message}</p>
                      <p className="text-xs text-red-400/60 capitalize">{flag.severity} severity</p>
                    </div>
                  </motion.div>
                ))}

                {analysis.warnings?.map((warning, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="flex items-start gap-3 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/30"
                  >
                    <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-300">{warning.message}</p>
                      <p className="text-xs text-yellow-400/60 capitalize">{warning.severity} severity</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Suggestions */}
          {analysis?.suggestions?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-2xl glass-card p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                Suggestions
              </h3>
              
              <div className="space-y-3">
                {analysis.suggestions.map((suggestion, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-xl border border-blue-500/30">
                    <Lightbulb className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-blue-300">{suggestion.message}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Interview Questions */}
          {analysis?.interviewQuestions?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-2xl glass-card p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                Suggested Questions
              </h3>
              
              <div className="space-y-3">
                {analysis.interviewQuestions.map((q, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/30"
                  >
                    <span className="text-xs font-medium text-purple-400 uppercase">
                      {q.category}
                    </span>
                    <p className="text-white/80 mt-1">{q.question}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function getScoreBg(score) {
  if (score >= 75) return 'bg-emerald-500/20 border border-emerald-500/30';
  if (score >= 50) return 'bg-blue-500/20 border border-blue-500/30';
  if (score >= 25) return 'bg-yellow-500/20 border border-yellow-500/30';
  return 'bg-red-500/20 border border-red-500/30';
}

function getScoreStroke(score) {
  if (score >= 75) return 'text-emerald-400';
  if (score >= 50) return 'text-blue-400';
  if (score >= 25) return 'text-yellow-400';
  return 'text-red-400';
}

function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-32 bg-white/10 rounded-lg" />
      <div className="rounded-2xl glass-card p-8">
        <div className="flex gap-8">
          <div className="w-24 h-24 bg-white/10 rounded-2xl" />
          <div className="flex-1 space-y-4">
            <div className="h-8 w-64 bg-white/10 rounded-lg" />
            <div className="h-4 w-48 bg-white/10 rounded" />
            <div className="h-4 w-32 bg-white/10 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}