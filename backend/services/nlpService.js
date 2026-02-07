// backend/services/nlpService.js
import natural from 'natural';
import compromise from 'compromise';
import Sentiment from 'sentiment';
import keywordExtractor from 'keyword-extractor';

const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;
const sentiment = new Sentiment();

// Skills database
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
    this.tfidf = new TfIdf();
  }

  // Extract skills from text
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

    // Extract additional keywords
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

  // Extract experience details
  extractExperience(text) {
    const doc = compromise(text);
    const experiences = [];
    
    // Find years of experience patterns
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

    // Extract company names (basic pattern)
    const companyPatterns = [
      /(?:worked at|employed at|experience at|worked for)\s+([A-Z][a-zA-Z\s&]+)/gi,
      /([A-Z][a-zA-Z\s&]+)\s*[-–]\s*(?:Software|Developer|Engineer|Manager|Lead)/gi
    ];

    // Extract job titles
    const jobTitles = [];
    const titlePatterns = [
      /(?:as|position|role|title)[:\s]+([A-Za-z\s]+(?:Developer|Engineer|Manager|Designer|Analyst|Lead|Director|Architect))/gi,
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
      experiences
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

  // Extract education details
  extractEducation(text) {
    const education = [];
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

    // Extract university names
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

    // Extract fields of study
    const fields = [];
    const fieldPatterns = [
      /(?:in|degree in|major in)\s+(computer science|information technology|software engineering|data science|electrical engineering|mechanical engineering|business administration|mathematics|physics)/gi
    ];

    for (const pattern of fieldPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          fields.push(match[1].trim());
        }
      }
    }

    return {
      degrees: [...new Set(degrees)],
      universities: [...new Set(universities)].slice(0, 3),
      fields: [...new Set(fields)],
      highestDegree: degrees[0] || 'Not specified',
      score: this.calculateEducationScore(degrees)
    };
  }

  calculateEducationScore(degrees) {
    const scores = { 'PhD': 100, 'Masters': 85, 'Bachelors': 70, 'Associate': 55, 'Diploma': 40 };
    return degrees.length > 0 ? scores[degrees[0]] || 30 : 20;
  }

  // Extract contact information
  extractContactInfo(text) {
    const contact = {};

    // Email
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailPattern);
    contact.email = emails ? emails[0] : null;

    // Phone
    const phonePattern = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
    const phones = text.match(phonePattern);
    contact.phone = phones ? phones[0] : null;

    // LinkedIn
    const linkedinPattern = /linkedin\.com\/in\/([a-zA-Z0-9-]+)/gi;
    const linkedin = text.match(linkedinPattern);
    contact.linkedin = linkedin ? linkedin[0] : null;

    // GitHub
    const githubPattern = /github\.com\/([a-zA-Z0-9-]+)/gi;
    const github = text.match(githubPattern);
    contact.github = github ? github[0] : null;

    // Name (first line or after name:)
    const doc = compromise(text);
    const people = doc.people().out('array');
    contact.name = people[0] || this.extractName(text);

    // Location
    const locationPattern = /(?:location|address|city)[:\s]+([A-Za-z\s,]+)/gi;
    const location = locationPattern.exec(text);
    contact.location = location ? location[1].trim() : null;

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

  // Analyze sentiment and professionalism
  analyzeSentiment(text) {
    const result = sentiment.analyze(text);
    
    // Calculate professionalism score based on various factors
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

  // Detect red flags
  detectRedFlags(text, experience) {
    const redFlags = [];
    const warnings = [];
    const suggestions = [];

    // Employment gaps detection (simplified)
    const gapPatterns = /gap|break|unemployed|sabbatical|career break/gi;
    if (gapPatterns.test(text)) {
      warnings.push({
        type: 'employment_gap',
        message: 'Potential employment gap detected',
        severity: 'medium'
      });
    }

    // Job hopping detection
    const jobMentions = (text.match(/(?:worked at|employed at|position at)/gi) || []).length;
    if (jobMentions > 5 && experience.totalYears < 8) {
      warnings.push({
        type: 'job_hopping',
        message: 'Frequent job changes detected',
        severity: 'medium'
      });
    }

    // Missing sections
    if (!/@/.test(text)) {
      redFlags.push({
        type: 'missing_email',
        message: 'No email address found',
        severity: 'high'
      });
    }

    // Check for quantifiable achievements
    const quantifiablePattern = /\d+%|\$[\d,]+|\d+\s*(?:users|customers|projects|clients)/gi;
    if (!quantifiablePattern.test(text)) {
      suggestions.push({
        type: 'no_metrics',
        message: 'Consider adding quantifiable achievements',
        severity: 'low'
      });
    }

    // Resume length check
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

  // Calculate match score with job requirements
  calculateMatchScore(resumeData, jobRequirements) {
    let score = 0;
    const matchDetails = {
      skillsMatch: [],
      missingSkills: [],
      experienceMatch: false,
      educationMatch: false
    };

    // Skills matching (50% weight)
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

    // Experience matching (30% weight)
    const requiredExperience = jobRequirements.minExperience || 0;
    if (resumeData.experience.totalYears >= requiredExperience) {
      score += 30;
      matchDetails.experienceMatch = true;
    } else {
      const expRatio = resumeData.experience.totalYears / requiredExperience;
      score += Math.min(30, expRatio * 30);
    }

    // Education matching (20% weight)
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

  // Generate interview questions
  generateInterviewQuestions(resumeData) {
    const questions = [];
    
    // Skill-based questions
    const skills = Object.values(resumeData.skills.categorized).flat();
    if (skills.length > 0) {
      const topSkills = skills.slice(0, 3);
      topSkills.forEach(skill => {
        questions.push({
          category: 'Technical',
          question: `Can you describe a challenging project where you used ${skill}?`,
          focus: skill
        });
      });
    }

    // Experience-based questions
    if (resumeData.experience.totalYears > 0) {
      questions.push({
        category: 'Experience',
        question: `With ${resumeData.experience.totalYears} years of experience, what's been your most significant career achievement?`,
        focus: 'achievements'
      });
    }

    // Leadership questions for senior roles
    if (['Senior', 'Lead/Staff', 'Principal/Director'].includes(resumeData.experience.experienceLevel)) {
      questions.push({
        category: 'Leadership',
        question: 'Can you describe your experience mentoring junior team members?',
        focus: 'leadership'
      });
    }

    // Behavioral questions
    questions.push({
      category: 'Behavioral',
      question: 'Tell me about a time you had to deal with a difficult team situation.',
      focus: 'teamwork'
    });

    return questions.slice(0, 8);
  }

  // Full resume analysis
  async analyzeResume(text, jobRequirements = null) {
    const skills = this.extractSkills(text);
    const experience = this.extractExperience(text);
    const education = this.extractEducation(text);
    const contact = this.extractContactInfo(text);
    const sentiment = this.analyzeSentiment(text);
    const flags = this.detectRedFlags(text, experience);
    
    const analysisResult = {
      skills,
      experience,
      education,
      contact,
      sentiment,
      ...flags,
      wordCount: text.split(/\s+/).length,
      analyzedAt: new Date()
    };

    if (jobRequirements) {
      analysisResult.matchScore = this.calculateMatchScore(analysisResult, jobRequirements);
    }

    analysisResult.interviewQuestions = this.generateInterviewQuestions(analysisResult);

    return analysisResult;
  }
}

export default new NLPService();