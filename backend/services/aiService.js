// backend/services/aiService.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Helper to pause execution (for retries)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class AIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      
      // ✅ Using 'gemini-2.0-flash' (Fast, Smart, and Large Context Window)
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    }
  }

  // Robust JSON Cleaner
  cleanJSON(text) {
    if (!text) return null;
    try {
      // Remove markdown code blocks and whitespace
      let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      // Find valid JSON start and end
      const firstBracket = cleaned.indexOf('{');
      const lastBracket = cleaned.lastIndexOf('}');
      
      if (firstBracket !== -1 && lastBracket !== -1) {
        cleaned = cleaned.substring(firstBracket, lastBracket + 1);
      }
      
      return JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse JSON from AI response. Raw text:", text);
      return null;
    }
  }

  // --- NEW: Retry Logic Wrapper ---
  async retryOperation(operation, retries = 3, delay = 5000) {
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error) {
        // Check if error is 429 (Too Many Requests) or 503 (Service Unavailable)
        if (error.message.includes('429') || error.message.includes('503')) {
          console.log(`⚠️ Rate limit hit. Retrying in ${delay / 1000}s... (Attempt ${i + 1}/${retries})`);
          await sleep(delay);
          // Increase delay for next retry (Exponential backoff)
          delay *= 2; 
        } else {
          throw error; // Throw other errors immediately
        }
      }
    }
    throw new Error('Max retries exceeded for AI request');
  }

  // 1. Deep Resume Analysis
  async analyzeResume(resumeText, jobRequirements = null) {
    if (!this.isConfigured()) throw new Error("Gemini API Key not found");

    // Wrap in retry logic
    return this.retryOperation(async () => {
      let prompt = `
        You are a Senior Technical Recruiter with 20 years of experience. 
        Perform a deep analysis of this resume. Do not just extract text; infer skills, seniority, and cultural fit.

        RESUME TEXT:
        """
        ${resumeText.substring(0, 90000)}
        """
      `;

      if (jobRequirements) {
        prompt += `
        COMPARE AGAINST THESE JOB REQUIREMENTS:
        ${JSON.stringify(jobRequirements)}
        `;
      }

      prompt += `
        Return strict JSON (no markdown) with this EXACT structure:
        {
          "contact": { 
            "name": "Candidate Name", "email": "Email", "phone": "Phone", "location": "City, Country", "linkedin": "URL", "github": "URL", "portfolio": "URL" 
          },
          "summary": "Write a 3-sentence executive summary of the candidate.",
          "skills": {
            "technical": ["Hard Skills (Languages, Frameworks)"],
            "soft": ["Soft Skills (Leadership, Communication)"],
            "frameworks": ["Specific Frameworks"],
            "tools": ["DevOps, IDEs, Tools"],
            "proficiencyLevels": {
              "expert": ["Skills they mastered"],
              "proficient": ["Skills they use daily"],
              "familiar": ["Skills mentioned once"]
            }
          },
          "experience": {
            "totalYears": 0,
            "level": "Intern/Junior/Mid-Level/Senior/Staff/Principal",
            "positions": [
              { 
                "title": "Job Title", 
                "company": "Company", 
                "location": "Location", 
                "duration": "e.g., 'Jan 2020 - Present'", 
                "summary": "One line summary of impact" 
              }
            ],
            "careerProgression": "Briefly analyze if their career is stagnant, steady, or fast-tracked."
          },
          "education": {
            "degrees": [ { "degree": "Degree", "institution": "University", "year": "Year", "field": "Major" } ],
            "highestDegree": "Highest Degree Name",
            "certifications": [ { "name": "Cert Name", "issuer": "Issuer", "year": 2023 } ]
          },
          "projects": [ 
            { "name": "Project Name", "description": "What it does", "technologies": ["Tech Stack"] } 
          ],
          "matchScore": {
            "overall": 0,
            "breakdown": { "skills": 0, "experience": 0, "education": 0, "culture": 0 },
            "recommendation": "Highly Recommended/Recommended/Potential/Not Recommended",
            "missingSkills": ["Critical skills missing"],
            "matchedSkills": ["Key skills present"],
            "underqualified": false
          },
          "analysis": {
            "strengths": ["List 3 distinct technical strengths"],
            "weaknesses": ["List 2 potential areas of concern"],
            "cultureFit": "Analyze their likely cultural fit based on writing style and hobbies.",
            "growthPotential": "High/Medium/Low assessment",
            "redFlags": [ { "issue": "e.g. Job Hopping", "severity": "High/Medium", "explanation": "Why this is a risk" } ]
          },
          "salaryEstimate": {
            "min": 0, "max": 0, "currency": "USD", "basis": "Based on experience level and tech stack market rates."
          },
          "interviewQuestions": [
            { "category": "Technical", "question": "A specific question based on their actual projects.", "purpose": "To verify depth of knowledge." }
          ],
          "overallAssessment": "Final verdict paragraph."
        }
      `;

      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const analysis = this.cleanJSON(text);
      
      if (!analysis) throw new Error("AI returned invalid JSON");

      // Metadata
      analysis.analyzedAt = new Date();
      analysis.aiModel = "gemini-2.0-flash";
      analysis.aiPowered = true;

      return analysis;
    });
  }

  // 2. Generate Specific Interview Questions
  async generateInterviewQuestions(resumeText, jobTitle, focusAreas = []) {
    if (!this.isConfigured()) return null;
    
    // Wrap in retry logic
    return this.retryOperation(async () => {
      const prompt = `
        Generate 10 highly specific interview questions for a ${jobTitle} position based on this resume.
        Focus Areas: ${focusAreas.join(', ') || 'General Competence'}.
        
        RESUME: "${resumeText.substring(0, 15000)}..."
        
        Return JSON: 
        { 
          "questions": [
            { 
              "category": "Technical/Behavioral/System Design", 
              "difficulty": "Easy/Medium/Hard",
              "question": "The question text", 
              "purpose": "What specific skill does this test?",
              "idealAnswer": "Key points to look for in the answer."
            }
          ] 
        }
      `;
      
      const result = await this.model.generateContent(prompt);
      return this.cleanJSON(result.response.text());
    });
  }

  // 3. Compare Multiple Candidates
  async compareResumes(resumes, jobRequirements) {
    if (!this.isConfigured()) return null;
    
    // Wrap in retry logic
    return this.retryOperation(async () => {
      // Gemini 2.0 Flash has a huge context window, so we can send multiple full resumes
      const candidates = resumes.map((r, i) => 
        `CANDIDATE ${i+1} (ID: ${r._id}):\nName: ${r.originalName}\nText: ${r.rawText.substring(0, 5000)}`
      ).join('\n\n----------------\n\n');
      
      const prompt = `
        Compare these candidates for the following Job Requirements: 
        ${JSON.stringify(jobRequirements)}
        
        CANDIDATES DATA:
        ${candidates}
        
        Return JSON: 
        { 
          "ranking": [
            { 
              "rank": 1, 
              "candidateName": "Name", 
              "id": "ID",
              "score": 0-100, 
              "strengths": ["Strength 1"], 
              "concerns": ["Concern 1"],
              "bestFor": "Best suited role type (e.g., Leadership, R&D, Maintenance)"
            }
          ], 
          "recommendation": "Which candidate is the absolute best fit and why?",
          "comparison": {
            "skillsComparison": "Comparative text analysis of skills",
            "experienceComparison": "Comparative text analysis of experience"
          }
        }
      `;
      
      const result = await this.model.generateContent(prompt);
      return this.cleanJSON(result.response.text());
    });
  }

  // 4. ATS Optimization Analysis
  async analyzeATSOptimization(resumeText, jobDescription) {
    if (!this.isConfigured()) return null;
    
    // Wrap in retry logic
    return this.retryOperation(async () => {
      const prompt = `
        Analyze this resume for ATS (Applicant Tracking System) readability and keyword matching against the Job Description.
        
        JOB DESCRIPTION: "${jobDescription.substring(0,2000)}..."
        RESUME: "${resumeText.substring(0,10000)}..."
        
        Return JSON: 
        { 
          "atsScore": 0-100, 
          "keywordMatch": { 
            "found": ["List of JD keywords found"], 
            "missing": ["Important JD keywords missing"], 
            "matchPercentage": 0 
          },
          "formatting": { 
            "score": 0-100, 
            "issues": ["e.g. Tables used, Header unreadable"], 
            "suggestions": ["Fix 1", "Fix 2"] 
          },
          "overallAssessment": "How well will this resume parse?" 
        }
      `;
      
      const result = await this.model.generateContent(prompt);
      return this.cleanJSON(result.response.text());
    });
  }

  isConfigured() {
    return !!this.apiKey;
  }
}

export default new AIService();