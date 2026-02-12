// backend/services/nlpService.js
import natural from 'natural';
import compromise from 'compromise';
import Sentiment from 'sentiment';
import keywordExtractor from 'keyword-extractor';
import aiService from './aiService.js';

const tokenizer = new natural.WordTokenizer();
const sentiment = new Sentiment();

// Skills database for fallback
const skillsDatabase = {
  programming: ['javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'typescript', 'php', 'swift', 'kotlin', 'scala', 'r', 'matlab'],
  frontend: ['react', 'vue', 'angular', 'svelte', 'html', 'css', 'sass', 'less', 'tailwind', 'bootstrap', 'jquery', 'redux', 'next.js', 'nuxt', 'gatsby'],
  backend: ['node.js', 'express', 'django', 'flask', 'spring', 'laravel', 'rails', 'asp.net', 'fastapi', 'nestjs', 'graphql', 'rest api'],
  database: ['mongodb', 'postgresql', 'mysql', 'oracle', 'redis', 'elasticsearch', 'cassandra', 'dynamodb', 'firebase', 'sqlite'],
  cloud: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd', 'devops', 'linux', 'nginx'],
  ml_ai: ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'nlp', 'computer vision', 'data science'],
  soft_skills: ['leadership', 'communication', 'teamwork', 'problem-solving', 'analytical', 'creative', 'management', 'agile', 'scrum']
};

class NLPService {
  constructor() {
    this.useAI = aiService.isConfigured();
  }

  // --- UPDATED: Main analysis function with mode selection ---
  async analyzeResume(text, jobRequirements = null, mode = 'ai') {
    const aiAvailable = aiService.isConfigured();
    
    console.log(`Processing Request - Mode: ${mode}, AI Available: ${aiAvailable}`);
    
    // 1. If User chose AI AND AI is configured -> Use AI
    if (mode === 'ai' && aiAvailable) {
      try {
        console.log('🤖 Starting AI Analysis...');
        const aiAnalysis = await aiService.analyzeResume(text, jobRequirements);
        return this.transformAIResponse(aiAnalysis, text);
      } catch (error) {
        console.error('⚠️ AI Failed, falling back to rule-based:', error.message);
        // Fallback is crucial if AI crashes (e.g. rate limit)
        return this.ruleBasedAnalysis(text, jobRequirements);
      }
    }
    
    // 2. If User chose Rule-Based OR AI is not configured -> Use Rule-Based
    else {
      console.log('⚡ Running Rule-Based Analysis');
      return this.ruleBasedAnalysis(text, jobRequirements);
    }
  }

  // Transform AI response to match our schema
  transformAIResponse(aiAnalysis, originalText) {
    return {
      contact: {
        name: aiAnalysis.contact?.name || null,
        email: aiAnalysis.contact?.email || null,
        phone: aiAnalysis.contact?.phone || null,
        location: aiAnalysis.contact?.location || null,
        linkedin: aiAnalysis.contact?.linkedin || null,
        github: aiAnalysis.contact?.github || null
      },
      skills: {
        categorized: {
          programming: aiAnalysis.skills?.programming || [],
          frontend: aiAnalysis.skills?.frameworks?.filter(f => 
            ['react', 'vue', 'angular', 'svelte'].some(fw => f.toLowerCase().includes(fw))
          ) || [],
          backend: aiAnalysis.skills?.frameworks?.filter(f => 
            ['node', 'express', 'django', 'flask', 'spring'].some(fw => f.toLowerCase().includes(fw))
          ) || [],
          database: aiAnalysis.skills?.databases || [],
          cloud: aiAnalysis.skills?.cloud || [],
          ml_ai: aiAnalysis.skills?.technical?.filter(s => 
            ['machine learning', 'deep learning', 'ai', 'tensorflow', 'pytorch'].some(ml => s.toLowerCase().includes(ml))
          ) || [],
          soft_skills: aiAnalysis.skills?.soft || [],
          other: aiAnalysis.skills?.other || []
        },
        keywords: [
          ...(aiAnalysis.skills?.technical || []),
          ...(aiAnalysis.skills?.programming || []),
          ...(aiAnalysis.skills?.frameworks || [])
        ].slice(0, 30),
        totalSkills: this.countTotalSkills(aiAnalysis.skills),
        proficiencyLevels: aiAnalysis.skills?.proficiencyLevels || {}
      },
      experience: {
        totalYears: aiAnalysis.experience?.totalYears || 0,
        experienceLevel: aiAnalysis.experience?.level || this.categorizeExperienceLevel(aiAnalysis.experience?.totalYears || 0),
        jobTitles: aiAnalysis.experience?.positions?.map(p => p.title) || [],
        positions: aiAnalysis.experience?.positions || [],
        industries: aiAnalysis.experience?.industries || [],
        careerProgression: aiAnalysis.experience?.careerProgression || null
      },
      education: {
        degrees: aiAnalysis.education?.degrees?.map(d => d.degree) || [],
        universities: aiAnalysis.education?.degrees?.map(d => d.institution) || [],
        fields: aiAnalysis.education?.degrees?.map(d => d.field) || [],
        highestDegree: aiAnalysis.education?.highestDegree || 'Not specified',
        certifications: aiAnalysis.education?.certifications || [],
        score: this.calculateEducationScore(aiAnalysis.education?.degrees?.map(d => d.degree) || [])
      },
      projects: aiAnalysis.projects || [],
      languages: aiAnalysis.languages || [],
      achievements: aiAnalysis.achievements || [],
      sentiment: {
        score: 0,
        comparative: 0,
        professionalismScore: this.calculateProfessionalismFromAI(aiAnalysis),
        tone: 'Professional'
      },
      analysis: aiAnalysis.analysis || {},
      redFlags: aiAnalysis.analysis?.redFlags || [],
      warnings: [],
      suggestions: this.generateSuggestionsFromAI(aiAnalysis),
      matchScore: aiAnalysis.matchScore ? {
        overallScore: aiAnalysis.matchScore.overall || 0,
        matchDetails: {
          skillsMatch: aiAnalysis.matchScore.matchedSkills || [],
          missingSkills: aiAnalysis.matchScore.missingSkills || [],
          experienceMatch: !aiAnalysis.matchScore.underqualified,
          educationMatch: true,
          skillMatchPercentage: aiAnalysis.matchScore.breakdown?.skills || 0
        },
        recommendation: this.getRecommendation(aiAnalysis.matchScore.overall || 0),
        breakdown: aiAnalysis.matchScore.breakdown || {}
      } : null,
      interviewQuestions: aiAnalysis.interviewQuestions || [],
      salaryEstimate: aiAnalysis.salaryEstimate || null,
      overallAssessment: aiAnalysis.overallAssessment || null,
      summary: aiAnalysis.summary || null,
      wordCount: originalText.split(/\s+/).length,
      analyzedAt: new Date(),
      aiPowered: true,
      aiModel: aiAnalysis.aiModel || 'gpt-4o-mini'
    };
  }

  // Count total skills from AI response
  countTotalSkills(skills) {
    if (!skills) return 0;
    let count = 0;
    ['technical', 'programming', 'frameworks', 'databases', 'cloud', 'soft', 'other'].forEach(key => {
      if (Array.isArray(skills[key])) {
        count += skills[key].length;
      }
    });
    return count;
  }

  // Calculate professionalism score from AI analysis
  calculateProfessionalismFromAI(aiAnalysis) {
    let score = 70; // Base score
    
    // Increase score for positive indicators
    if (aiAnalysis.experience?.positions?.length > 0) score += 5;
    if (aiAnalysis.education?.degrees?.length > 0) score += 5;
    if (aiAnalysis.achievements?.length > 0) score += 5;
    if (aiAnalysis.projects?.length > 0) score += 5;
    if (aiAnalysis.contact?.linkedin) score += 3;
    if (aiAnalysis.contact?.github) score += 2;
    
    // Decrease for red flags
    if (aiAnalysis.analysis?.redFlags?.length > 0) {
      score -= aiAnalysis.analysis.redFlags.length * 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  // Generate suggestions from AI analysis
  generateSuggestionsFromAI(aiAnalysis) {
    const suggestions = [];
    
    if (aiAnalysis.matchScore?.missingSkills?.length > 0) {
      suggestions.push({
        type: 'skills_gap',
        message: `Consider highlighting or developing these skills: ${aiAnalysis.matchScore.missingSkills.slice(0, 3).join(', ')}`,
        severity: 'medium'
      });
    }
    
    if (!aiAnalysis.contact?.linkedin) {
      suggestions.push({
        type: 'missing_linkedin',
        message: 'Adding a LinkedIn profile URL can strengthen the application',
        severity: 'low'
      });
    }
    
    if (aiAnalysis.projects?.length === 0) {
      suggestions.push({
        type: 'no_projects',
        message: 'Including relevant projects can demonstrate practical skills',
        severity: 'low'
      });
    }
    
    return suggestions;
  }

  // Rule-based analysis (fallback)
  ruleBasedAnalysis(text, jobRequirements) {
    const skills = this.extractSkills(text);
    const experience = this.extractExperience(text);
    const education = this.extractEducation(text);
    const contact = this.extractContactInfo(text);
    const sentimentResult = this.analyzeSentiment(text);
    const flags = this.detectRedFlags(text, experience);
    
    const analysisResult = {
      skills,
      experience,
      education,
      contact,
      sentiment: sentimentResult,
      ...flags,
      wordCount: text.split(/\s+/).length,
      analyzedAt: new Date(),
      aiPowered: false
    };

    if (jobRequirements) {
      analysisResult.matchScore = this.calculateMatchScore(analysisResult, jobRequirements);
    }

    analysisResult.interviewQuestions = this.generateInterviewQuestions(analysisResult);

    return analysisResult;
  }

  // Extract skills from text (rule-based)
  extractSkills(text) {
    const lowerText = text.toLowerCase();
    const foundSkills = {
      programming: [],
      frontend: [],
      backend: [],
      database: [],
      cloud: [],
      ml_ai: [],
      soft_skills: [],
      other: []
    };

    for (const [category, skills] of Object.entries(skillsDatabase)) {
      for (const skill of skills) {
        if (lowerText.includes(skill.toLowerCase())) {
          foundSkills[category].push(skill);
        }
      }
    }

    const extractedKeywords = keywordExtractor.extract(text, {
      language: "english",
      remove_digits: false,
      return_changed_case: true,
      remove_duplicates: true
    });

    return {
      categorized: foundSkills,
      keywords: extractedKeywords.slice(0, 30),
      totalSkills: Object.values(foundSkills).flat().length
    };
  }

  // Extract experience (rule-based)
  extractExperience(text) {
    const yearPatterns = [
      /(\d+)\+?\s*years?\s*(of)?\s*(experience|exp)/gi,
      /experience[:\s]*(\d+)\+?\s*years?/gi,
      /(\d+)\+?\s*years?\s*(in|with|as)/gi
    ];

    let totalYears = 0;
    for (const pattern of yearPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const years = parseInt(match[1]);
        if (years > totalYears && years < 50) {
          totalYears = years;
        }
      }
    }

    const jobTitles = [];
    const titlePatterns = [
      /((?:Senior|Junior|Lead|Principal|Staff)?\s*(?:Software|Full[\s-]?Stack|Frontend|Backend|DevOps|Data|ML|AI)?\s*(?:Developer|Engineer|Architect|Manager|Designer|Analyst))/gi
    ];

    for (const pattern of titlePatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].trim().length > 3) {
          jobTitles.push(match[1].trim());
        }
      }
    }

    return {
      totalYears,
      experienceLevel: this.categorizeExperienceLevel(totalYears),
      jobTitles: [...new Set(jobTitles)].slice(0, 5),
      positions: []
    };
  }

  categorizeExperienceLevel(years) {
    if (years === 0) return 'Entry Level';
    if (years <= 2) return 'Junior';
    if (years <= 5) return 'Mid-Level';
    if (years <= 8) return 'Senior';
    if (years <= 12) return 'Lead/Staff';
    return 'Principal/Director';
  }

  // Extract education (rule-based)
  extractEducation(text) {
    const degrees = [];
    
    const degreePatterns = {
      'PhD': /ph\.?d|doctorate|doctor of philosophy/gi,
      'Masters': /master'?s?|m\.?s\.?|m\.?tech|mba|m\.?eng/gi,
      'Bachelors': /bachelor'?s?|b\.?s\.?|b\.?tech|b\.?e\.?|b\.?a\.?/gi,
      'Associate': /associate'?s?|a\.?s\.?|a\.?a\.?/gi,
      'Diploma': /diploma|certificate|certification/gi
    };

    for (const [degree, pattern] of Object.entries(degreePatterns)) {
      if (pattern.test(text)) {
        degrees.push(degree);
      }
    }

    const universities = [];
    const uniPatterns = [
      /(?:university of|institute of|college of)\s+([A-Za-z\s]+)/gi,
      /([A-Z][a-zA-Z]+)\s+(?:University|Institute|College)/gi
    ];

    for (const pattern of uniPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          universities.push(match[1].trim());
        }
      }
    }

    return {
      degrees: [...new Set(degrees)],
      universities: [...new Set(universities)].slice(0, 3),
      fields: [],
      highestDegree: degrees[0] || 'Not specified',
      score: this.calculateEducationScore(degrees)
    };
  }

  calculateEducationScore(degrees) {
    const scores = { 'PhD': 100, 'Masters': 85, 'Bachelors': 70, 'Associate': 55, 'Diploma': 40 };
    return degrees.length > 0 ? scores[degrees[0]] || 30 : 20;
  }

  // Extract contact info (rule-based)
  extractContactInfo(text) {
    const contact = {};

    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailPattern);
    contact.email = emails ? emails[0] : null;

    const phonePattern = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
    const phones = text.match(phonePattern);
    contact.phone = phones ? phones[0] : null;

    const linkedinPattern = /linkedin\.com\/in\/([a-zA-Z0-9-]+)/gi;
    const linkedin = text.match(linkedinPattern);
    contact.linkedin = linkedin ? linkedin[0] : null;

    const githubPattern = /github\.com\/([a-zA-Z0-9-]+)/gi;
    const github = text.match(githubPattern);
    contact.github = github ? github[0] : null;

    const doc = compromise(text);
    const people = doc.people().out('array');
    contact.name = people[0] || this.extractName(text);

    return contact;
  }

  extractName(text) {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.length < 50 && !/[@\d]/.test(firstLine)) {
        return firstLine;
      }
    }
    return null;
  }

  // Analyze sentiment (rule-based)
  analyzeSentiment(text) {
    const result = sentiment.analyze(text);
    
    const professionalWords = ['achieved', 'developed', 'implemented', 'led', 'managed', 'created', 'designed', 'improved', 'increased', 'reduced', 'delivered', 'collaborated'];
    const unprofessionalWords = ['hate', 'stupid', 'boring', 'easy', 'simple'];
    
    let professionalismScore = 50;
    const lowerText = text.toLowerCase();
    
    for (const word of professionalWords) {
      if (lowerText.includes(word)) professionalismScore += 3;
    }
    
    for (const word of unprofessionalWords) {
      if (lowerText.includes(word)) professionalismScore -= 5;
    }

    professionalismScore = Math.min(100, Math.max(0, professionalismScore));

    return {
      score: result.score,
      comparative: result.comparative,
      positiveWords: result.positive,
      negativeWords: result.negative,
      professionalismScore,
      tone: result.score > 0 ? 'Positive' : result.score < 0 ? 'Negative' : 'Neutral'
    };
  }

  // Detect red flags (rule-based)
  detectRedFlags(text, experience) {
    const redFlags = [];
    const warnings = [];
    const suggestions = [];

    const gapPatterns = /gap|break|unemployed|sabbatical|career break/gi;
    if (gapPatterns.test(text)) {
      warnings.push({
        type: 'employment_gap',
        message: 'Potential employment gap detected',
        severity: 'medium'
      });
    }

    if (!/@/.test(text)) {
      redFlags.push({
        type: 'missing_email',
        message: 'No email address found',
        severity: 'high'
      });
    }

    const quantifiablePattern = /\d+%|\$[\d,]+|\d+\s*(?:users|customers|projects|clients)/gi;
    if (!quantifiablePattern.test(text)) {
      suggestions.push({
        type: 'no_metrics',
        message: 'Consider adding quantifiable achievements',
        severity: 'low'
      });
    }

    const wordCount = text.split(/\s+/).length;
    if (wordCount < 100) {
      redFlags.push({
        type: 'too_short',
        message: 'Resume appears too short',
        severity: 'high'
      });
    } else if (wordCount > 1500) {
      warnings.push({
        type: 'too_long',
        message: 'Resume may be too lengthy',
        severity: 'low'
      });
    }

    return { redFlags, warnings, suggestions };
  }

  // Calculate match score (rule-based)
  calculateMatchScore(resumeData, jobRequirements) {
    let score = 0;
    const matchDetails = {
      skillsMatch: [],
      missingSkills: [],
      experienceMatch: false,
      educationMatch: false
    };

    const requiredSkills = jobRequirements.skills || [];
    const resumeSkills = Object.values(resumeData.skills.categorized).flat().map(s => s.toLowerCase());
    
    let skillMatches = 0;
    for (const skill of requiredSkills) {
      if (resumeSkills.includes(skill.toLowerCase())) {
        skillMatches++;
        matchDetails.skillsMatch.push(skill);
      } else {
        matchDetails.missingSkills.push(skill);
      }
    }
    
    const skillScore = requiredSkills.length > 0 ? (skillMatches / requiredSkills.length) * 50 : 25;
    score += skillScore;

    const requiredExperience = jobRequirements.minExperience || 0;
    if (resumeData.experience.totalYears >= requiredExperience) {
      score += 30;
      matchDetails.experienceMatch = true;
    } else {
      const expRatio = resumeData.experience.totalYears / requiredExperience;
      score += Math.min(30, expRatio * 30);
    }

    const requiredDegree = jobRequirements.education || 'Bachelors';
    const degreeHierarchy = ['Diploma', 'Associate', 'Bachelors', 'Masters', 'PhD'];
    const requiredIndex = degreeHierarchy.indexOf(requiredDegree);
    const candidateIndex = degreeHierarchy.indexOf(resumeData.education.highestDegree);
    
    if (candidateIndex >= requiredIndex) {
      score += 20;
      matchDetails.educationMatch = true;
    } else if (candidateIndex >= 0) {
      score += (candidateIndex / requiredIndex) * 20;
    }

    return {
      overallScore: Math.round(score),
      matchDetails,
      recommendation: this.getRecommendation(score)
    };
  }

  getRecommendation(score) {
    if (score >= 85) return { status: 'Highly Recommended', color: 'green', action: 'Schedule Interview' };
    if (score >= 70) return { status: 'Recommended', color: 'blue', action: 'Review Further' };
    if (score >= 50) return { status: 'Potential', color: 'yellow', action: 'Consider for Other Roles' };
    return { status: 'Not Recommended', color: 'red', action: 'Archive' };
  }

  // Generate interview questions (rule-based)
  generateInterviewQuestions(resumeData) {
    const questions = [];
    
    const skills = Object.values(resumeData.skills.categorized).flat();
    if (skills.length > 0) {
      const topSkills = skills.slice(0, 3);
      topSkills.forEach(skill => {
        questions.push({
          category: 'Technical',
          question: `Can you describe a challenging project where you used ${skill}?`,
          purpose: `Assess practical experience with ${skill}`
        });
      });
    }

    if (resumeData.experience.totalYears > 0) {
      questions.push({
        category: 'Experience',
        question: `With ${resumeData.experience.totalYears} years of experience, what's been your most significant career achievement?`,
        purpose: 'Evaluate accomplishments and self-awareness'
      });
    }

    if (['Senior', 'Lead/Staff', 'Principal/Director'].includes(resumeData.experience.experienceLevel)) {
      questions.push({
        category: 'Leadership',
        question: 'Can you describe your experience mentoring junior team members?',
        purpose: 'Assess leadership and mentoring abilities'
      });
    }

    questions.push({
      category: 'Behavioral',
      question: 'Tell me about a time you had to deal with a difficult team situation.',
      purpose: 'Evaluate teamwork and conflict resolution'
    });

    return questions.slice(0, 8);
  }

  // Generate interview questions with AI
  async generateInterviewQuestionsAI(resumeText, jobTitle, focusAreas = []) {
    if (this.useAI) {
      return await aiService.generateInterviewQuestions(resumeText, jobTitle, focusAreas);
    }
    return null;
  }

  // Compare resumes with AI
  async compareResumesAI(resumes, jobRequirements) {
    if (this.useAI) {
      return await aiService.compareResumes(resumes, jobRequirements);
    }
    return null;
  }

  // ATS optimization with AI
  async analyzeATSOptimization(resumeText, jobDescription) {
    if (this.useAI) {
      return await aiService.analyzeATSOptimization(resumeText, jobDescription);
    }
    return null;
  }
}

export default new NLPService();