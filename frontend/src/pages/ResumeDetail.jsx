// frontend/src/pages/ResumeDetail.jsx
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Mail, Phone, MapPin, Linkedin, Github, Briefcase, 
  GraduationCap, Star, AlertTriangle, Lightbulb, MessageSquare, 
  TrendingUp, Award, Clock, CheckCircle2, XCircle, DollarSign, 
  BrainCircuit, Users, Cpu // Added missing imports for AI section
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  ResponsiveContainer
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
  const aiAnalysis = analysis?.analysis || {}; // AI specific analysis

  const skillsRadarData = [
    { skill: 'Programming', value: skills.categorized?.programming?.length || 0, fullMark: 10 },
    { skill: 'Frontend', value: skills.categorized?.frontend?.length || 0, fullMark: 10 },
    { skill: 'Backend', value: skills.categorized?.backend?.length || 0, fullMark: 10 },
    { skill: 'Cloud', value: skills.categorized?.cloud?.length || 0, fullMark: 10 }, // Changed Database to Cloud for better visual spread
    { skill: 'ML/AI', value: skills.categorized?.ml_ai?.length || 0, fullMark: 10 },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      
      {/* Back Button */}
      <Link to="/resumes" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors">
        <ArrowLeft className="w-5 h-5" /> Back to Resumes
      </Link>

      {/* Header Profile Card */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rounded-2xl glass-card p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 flex items-start gap-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg glow-primary">
              {(contact.name?.[0] || 'R').toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">{contact.name || 'Unknown Candidate'}</h1>
              <p className="text-lg text-white/60 mt-1">{experience.jobTitles?.[0] || 'No title specified'}</p>
              
              <div className="flex flex-wrap gap-4 mt-4">
                {contact.email && <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-white/60 hover:text-primary-400"><Mail className="w-4 h-4" /> {contact.email}</a>}
                {contact.phone && <span className="flex items-center gap-2 text-white/60"><Phone className="w-4 h-4" /> {contact.phone}</span>}
                {contact.location && <span className="flex items-center gap-2 text-white/60"><MapPin className="w-4 h-4" /> {contact.location}</span>}
              </div>
              
              <div className="flex gap-3 mt-4">
                {contact.linkedin && <a href={contact.linkedin} target="_blank" rel="noreferrer" className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 border border-blue-500/30"><Linkedin className="w-5 h-5" /></a>}
                {contact.github && <a href={contact.github} target="_blank" rel="noreferrer" className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 border border-white/20"><Github className="w-5 h-5" /></a>}
              </div>
            </div>
          </div>

          {/* Score Circle */}
          <div className="lg:w-64 flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle className="text-white/10" strokeWidth="8" stroke="currentColor" fill="transparent" r="42" cx="50" cy="50" />
                <motion.circle 
                  className={getScoreStroke(matchScore?.overallScore)} 
                  strokeWidth="8" strokeLinecap="round" stroke="currentColor" fill="transparent" r="42" cx="50" cy="50"
                  initial={{ strokeDasharray: "0 264" }} 
                  animate={{ strokeDasharray: `${(matchScore?.overallScore || 0) * 2.64} 264` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{matchScore?.overallScore || 0}%</span>
                <span className="text-xs text-white/50">Match</span>
              </div>
            </div>
            <span className={`mt-2 px-3 py-1 rounded-full text-xs font-semibold border ${
              matchScore?.recommendation?.status === 'Highly Recommended' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
              'bg-white/10 text-white/80 border-white/20'
            }`}>
              {matchScore?.recommendation?.status || 'Pending'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI Insights Card (Only visible if AI was used) */}
          {analysis.aiPowered && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="rounded-2xl glass-card p-6 border-l-4 border-l-violet-500">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-violet-400" /> 
                Gemini AI Insights
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <h4 className="text-emerald-400 text-sm font-medium flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4" /> Top Strengths</h4>
                    <ul className="list-disc list-inside text-sm text-white/70 space-y-1">
                      {aiAnalysis.strengths?.slice(0, 3).map((s, i) => <li key={i}>{s}</li>) || <li>No specific data available</li>}
                    </ul>
                  </div>
                  
                  {analysis.salaryEstimate?.min > 0 && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <h4 className="text-amber-400 text-sm font-medium flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4" /> Estimated Salary</h4>
                      <p className="text-xl font-bold text-white">
                        {analysis.salaryEstimate.currency} {(analysis.salaryEstimate.min / 1000).toFixed(0)}k - {(analysis.salaryEstimate.max / 1000).toFixed(0)}k
                      </p>
                      <p className="text-xs text-white/50 mt-1">{analysis.salaryEstimate.basis}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <h4 className="text-purple-400 text-sm font-medium flex items-center gap-2 mb-2"><Users className="w-4 h-4" /> Culture Fit</h4>
                    <p className="text-sm text-white/70 leading-relaxed">
                      {aiAnalysis.cultureFit || "Standard corporate fit based on experience."}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <h4 className="text-blue-400 text-sm font-medium flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4" /> Growth Potential</h4>
                    <p className="text-sm text-white/70">
                      {aiAnalysis.growthPotential || "Steady career progression observed."}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Experience Section */}
          <motion.div className="rounded-2xl glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary-400" /> Experience</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center"><Clock className="w-6 h-6 text-primary-400" /></div>
                <div>
                  <p className="text-2xl font-bold text-white">{experience.totalYears || 0} Years</p>
                  <p className="text-sm text-white/50">{experience.careerProgression || 'Total Experience'}</p>
                </div>
              </div>
              
              {experience.positions?.length > 0 ? (
                experience.positions.map((pos, i) => (
                  <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-medium text-white">{pos.title}</h4>
                      <span className="text-xs text-white/40">{pos.duration}</span>
                    </div>
                    <p className="text-sm text-primary-300 mb-2">{pos.company}</p>
                    <p className="text-xs text-white/60">{pos.summary || "No description provided."}</p>
                  </div>
                ))
              ) : (
                // Fallback for rule-based analysis without positions array
                experience.jobTitles?.map((title, i) => (
                  <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <h4 className="font-medium text-white">{title}</h4>
                    <p className="text-xs text-white/40 mt-1">Role extracted from resume</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Education */}
          <motion.div className="rounded-2xl glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-accent-400" /> Education</h3>
            <div className="space-y-3">
              {education.degrees?.map((deg, i) => (
                <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent-500/20 flex items-center justify-center"><Award className="w-5 h-5 text-accent-400" /></div>
                  <div>
                    <p className="font-medium text-white">{typeof deg === 'string' ? deg : deg.degree}</p>
                    <p className="text-sm text-white/50">{typeof deg === 'string' ? '' : `${deg.institution} • ${deg.year || ''}`}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Match Details */}
          {matchScore?.matchDetails && (
            <motion.div className="rounded-2xl glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary-400" /> Match Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={`p-4 rounded-xl border ${matchScore.matchDetails.experienceMatch ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {matchScore.matchDetails.experienceMatch ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
                    <span className="font-medium text-white">Experience</span>
                  </div>
                  <p className="text-sm text-white/50">{matchScore.matchDetails.experienceMatch ? 'Meets requirements' : 'Below requirements'}</p>
                </div>
                <div className={`p-4 rounded-xl border ${matchScore.matchDetails.educationMatch ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {matchScore.matchDetails.educationMatch ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
                    <span className="font-medium text-white">Education</span>
                  </div>
                  <p className="text-sm text-white/50">{matchScore.matchDetails.educationMatch ? 'Meets requirements' : 'Below requirements'}</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-5 h-5 text-blue-400" />
                    <span className="font-medium text-white">Skills Match</span>
                  </div>
                  <p className="text-sm text-white/50">{matchScore.matchDetails.skillsMatch?.length || 0} matching skills</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Skills Radar */}
          <div className="rounded-2xl glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-yellow-400" /> Skill Balance</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={skillsRadarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} />
                  <Radar name="Skills" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {skills.keywords?.slice(0, 8).map(k => (
                <span key={k} className="px-2 py-1 text-xs bg-white/10 rounded-md text-white/70 border border-white/10">{k}</span>
              ))}
            </div>
          </div>

          {/* Red Flags / Warnings */}
          {(aiAnalysis.redFlags?.length > 0 || analysis.redFlags?.length > 0) && (
            <div className="rounded-2xl glass-card p-6 border-l-4 border-l-red-500">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400" /> Attention Needed</h3>
              <div className="space-y-3">
                {[...(aiAnalysis.redFlags || []), ...(analysis.redFlags || [])].slice(0, 3).map((flag, i) => (
                  <div key={i} className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <p className="text-sm font-medium text-red-300">{flag.issue || flag.message}</p>
                    {flag.explanation && <p className="text-xs text-red-400/60 mt-1">{flag.explanation}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {analysis.suggestions?.length > 0 && (
            <div className="rounded-2xl glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-yellow-400" /> Suggestions</h3>
              <div className="space-y-3">
                {analysis.suggestions.map((suggestion, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-xl border border-blue-500/30">
                    <Lightbulb className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-300">{suggestion.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interview Questions */}
          <div className="rounded-2xl glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-blue-400" /> Interview Guide</h3>
            <div className="space-y-3">
              {analysis.interviewQuestions?.slice(0, 3).map((q, i) => (
                <div key={i} className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-xs font-semibold text-blue-300 uppercase tracking-wide mb-1">{q.category || "General"}</p>
                  <p className="text-sm text-white/80 italic">"{q.question}"</p>
                </div>
              ))}
            </div>
          </div>

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
  return <div className="animate-pulse space-y-6"><div className="h-48 bg-white/10 rounded-2xl"></div><div className="h-96 bg-white/10 rounded-2xl"></div></div>;
}