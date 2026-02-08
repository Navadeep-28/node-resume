// backend/services/aiService.js
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AIService {
  constructor() {
    this.model = 'gpt-4o-mini'; // Use 'gpt-4o' for better results (more expensive)
  }

  // Main resume analysis function
  async analyzeResume(resumeText, jobRequirements = null) {
    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(resumeText, jobRequirements);

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3, // Lower = more consistent results
        max_tokens: 4000
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      
      // Add metadata
      analysis.analyzedAt = new Date();
      analysis.aiModel = this.model;
      analysis.aiPowered = true;

      return analysis;

    } catch (error) {
      console.error('OpenAI Analysis Error:', error);
      throw new Error(`AI Analysis failed: ${error.message}`);
    }
  }

  // Build system prompt
  buildSystemPrompt() {
    return `You are an expert HR recruiter and resume analyst with 20 years of experience. 
Your task is to analyze resumes thoroughly and provide detailed, accurate assessments.

You MUST respond with valid JSON only. No markdown, no explanations outside JSON.

Be objective, thorough, and provide actionable insights. 
Extract information even if it's not explicitly stated but can be inferred.
If information is not found, use null or empty arrays - never make up data.`;
  }

  // Build user prompt
  buildUserPrompt(resumeText, jobRequirements) {
    let prompt = `Analyze the following resume and extract all relevant information.

RESUME TEXT:
"""
${resumeText}
"""

`;

    if (jobRequirements) {
      prompt += `
JOB REQUIREMENTS TO MATCH AGAINST:
- Required Skills: ${jobRequirements.skills?.join(', ') || 'Not specified'}
- Minimum Experience: ${jobRequirements.minExperience || 0} years
- Maximum Experience: ${jobRequirements.maxExperience || 'No limit'} years
- Required Education: ${jobRequirements.education || 'Not specified'}

`;
    }

    prompt += `
Provide your analysis in the following JSON structure:

{
  "contact": {
    "name": "Full name of the candidate",
    "email": "Email address",
    "phone": "Phone number",
    "location": "City, State/Country",
    "linkedin": "LinkedIn URL if found",
    "github": "GitHub URL if found",
    "portfolio": "Portfolio/Website URL if found"
  },
  "summary": "A 2-3 sentence professional summary of the candidate",
  "skills": {
    "technical": ["List of technical/hard skills"],
    "programming": ["Programming languages"],
    "frameworks": ["Frameworks and libraries"],
    "databases": ["Database technologies"],
    "cloud": ["Cloud platforms and DevOps tools"],
    "soft": ["Soft skills"],
    "other": ["Other relevant skills"],
    "proficiencyLevels": {
      "expert": ["Skills they're expert in"],
      "proficient": ["Skills they're proficient in"],
      "familiar": ["Skills they're familiar with"]
    }
  },
  "experience": {
    "totalYears": 0,
    "level": "Entry/Junior/Mid-Level/Senior/Lead/Principal/Executive",
    "positions": [
      {
        "title": "Job Title",
        "company": "Company Name",
        "location": "Location",
        "startDate": "Start date",
        "endDate": "End date or Present",
        "duration": "Duration in years/months",
        "responsibilities": ["Key responsibilities"],
        "achievements": ["Quantifiable achievements"],
        "technologies": ["Technologies used"]
      }
    ],
    "industries": ["Industries worked in"],
    "careerProgression": "Description of career growth"
  },
  "education": {
    "degrees": [
      {
        "degree": "Degree type (PhD/Masters/Bachelors/etc)",
        "field": "Field of study",
        "institution": "University/College name",
        "location": "Location",
        "graduationYear": 2020,
        "gpa": "GPA if mentioned",
        "honors": ["Honors/Awards"]
      }
    ],
    "certifications": [
      {
        "name": "Certification name",
        "issuer": "Issuing organization",
        "year": 2023,
        "expiryYear": null
      }
    ],
    "courses": ["Relevant courses or training"],
    "highestDegree": "Highest degree obtained"
  },
  "projects": [
    {
      "name": "Project name",
      "description": "Brief description",
      "technologies": ["Technologies used"],
      "role": "Role in project",
      "highlights": ["Key highlights or achievements"]
    }
  ],
  "languages": [
    {
      "language": "Language name",
      "proficiency": "Native/Fluent/Intermediate/Basic"
    }
  ],
  "achievements": [
    "List of notable achievements, awards, publications"
  ],
  "analysis": {
    "strengths": ["Top 5 strengths of this candidate"],
    "weaknesses": ["Potential concerns or gaps"],
    "uniqueValue": "What makes this candidate unique",
    "cultureFit": "Assessment of soft skills and team fit",
    "redFlags": [
      {
        "issue": "Description of concern",
        "severity": "high/medium/low",
        "explanation": "Why this might be a concern"
      }
    ],
    "growthPotential": "Assessment of candidate's growth potential"
  },
  "matchScore": {
    "overall": 0,
    "breakdown": {
      "skills": 0,
      "experience": 0,
      "education": 0,
      "culture": 0
    },
    "matchedSkills": ["Skills that match job requirements"],
    "missingSkills": ["Required skills not found"],
    "overqualified": false,
    "underqualified": false,
    "recommendation": "Highly Recommended/Recommended/Potential/Not Recommended",
    "recommendationReason": "Explanation for the recommendation"
  },
  "interviewQuestions": [
    {
      "category": "Technical/Behavioral/Experience/Culture",
      "question": "Suggested interview question",
      "purpose": "What this question aims to assess",
      "followUp": "Potential follow-up question"
    }
  ],
  "salaryEstimate": {
    "min": 0,
    "max": 0,
    "currency": "USD",
    "basis": "Explanation of salary estimate"
  },
  "overallAssessment": "A comprehensive 3-4 sentence assessment of the candidate"
}

Important:
- Match score should be 0-100
- If no job requirements provided, score based on overall resume quality
- Be specific and extract actual data from the resume
- For missing information, use null or empty arrays
- Ensure all JSON is valid and properly formatted`;

    return prompt;
  }

  // Generate interview questions based on resume
  async generateInterviewQuestions(resumeText, jobTitle, focusAreas = []) {
    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert technical interviewer. Generate thoughtful, probing interview questions 
that will help assess the candidate's true abilities and fit for the role.`
          },
          {
            role: 'user',
            content: `Based on this resume, generate 10 interview questions for a ${jobTitle} position.

RESUME:
${resumeText}

${focusAreas.length > 0 ? `Focus areas: ${focusAreas.join(', ')}` : ''}

Return JSON with this structure:
{
  "questions": [
    {
      "category": "Technical/Behavioral/Situational/Experience",
      "difficulty": "Easy/Medium/Hard",
      "question": "The question",
      "purpose": "What this assesses",
      "idealAnswer": "Key points to look for in the answer",
      "redFlags": "Warning signs in responses",
      "followUps": ["Follow-up questions"]
    }
  ]
}`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Interview Questions Error:', error);
      throw error;
    }
  }

  // Compare multiple resumes
  async compareResumes(resumes, jobRequirements) {
    try {
      const resumeSummaries = resumes.map((r, i) => `
CANDIDATE ${i + 1}:
Name: ${r.analysis?.contact?.name || 'Unknown'}
${r.rawText?.substring(0, 2000)}...
`).join('\n---\n');

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert HR recruiter comparing candidates for a position.'
          },
          {
            role: 'user',
            content: `Compare these ${resumes.length} candidates for a position with these requirements:
${JSON.stringify(jobRequirements, null, 2)}

CANDIDATES:
${resumeSummaries}

Return JSON with:
{
  "ranking": [
    {
      "rank": 1,
      "candidateName": "Name",
      "score": 85,
      "strengths": ["Key strengths"],
      "concerns": ["Concerns"],
      "bestFor": "What role/aspect they're best suited for"
    }
  ],
  "comparison": {
    "skillsComparison": "Comparison of technical skills",
    "experienceComparison": "Comparison of experience",
    "cultureComparison": "Comparison of soft skills/culture fit"
  },
  "recommendation": "Overall hiring recommendation",
  "diversityNote": "Note on team diversity considerations"
}`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Compare Resumes Error:', error);
      throw error;
    }
  }

  // Generate job description from requirements
  async generateJobDescription(requirements) {
    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert HR professional who writes compelling, inclusive job descriptions.'
          },
          {
            role: 'user',
            content: `Generate a professional job description based on:
${JSON.stringify(requirements, null, 2)}

Return JSON:
{
  "title": "Job title",
  "summary": "Engaging job summary",
  "responsibilities": ["List of responsibilities"],
  "requirements": ["Required qualifications"],
  "niceToHave": ["Preferred qualifications"],
  "benefits": ["Company benefits"],
  "aboutCompany": "Company description placeholder",
  "equalOpportunity": "EEO statement"
}`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Generate JD Error:', error);
      throw error;
    }
  }

  // Analyze resume for ATS optimization
  async analyzeATSOptimization(resumeText, jobDescription) {
    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert in ATS (Applicant Tracking Systems) and resume optimization.'
          },
          {
            role: 'user',
            content: `Analyze this resume for ATS optimization against the job description.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Return JSON:
{
  "atsScore": 0-100,
  "keywordMatch": {
    "found": ["Keywords from JD found in resume"],
    "missing": ["Important keywords missing"],
    "matchPercentage": 0
  },
  "formatting": {
    "score": 0-100,
    "issues": ["Formatting issues"],
    "suggestions": ["Improvement suggestions"]
  },
  "sections": {
    "present": ["Sections found"],
    "missing": ["Recommended sections missing"],
    "order": "Assessment of section order"
  },
  "improvements": [
    {
      "priority": "high/medium/low",
      "issue": "Issue description",
      "suggestion": "How to fix it",
      "example": "Example of improvement"
    }
  ],
  "overallAssessment": "Summary of ATS readiness"
}`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('ATS Analysis Error:', error);
      throw error;
    }
  }

  // Check if API key is configured
  isConfigured() {
    return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-api-key-here';
  }
}

export default new AIService();