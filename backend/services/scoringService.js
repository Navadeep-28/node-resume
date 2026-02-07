// backend/services/scoringService.js

class ScoringService {
  constructor() {
    this.weights = {
      skills: 0.40,
      experience: 0.30,
      education: 0.15,
      professionalism: 0.10,
      completeness: 0.05
    };

    this.skillImportance = {
      critical: 3,
      important: 2,
      nice_to_have: 1
    };
  }

  // Calculate overall match score
  calculateMatchScore(resumeData, jobRequirements) {
    const scores = {
      skills: this.calculateSkillsScore(resumeData.skills, jobRequirements.skills),
      experience: this.calculateExperienceScore(resumeData.experience, jobRequirements),
      education: this.calculateEducationScore(resumeData.education, jobRequirements.education),
      professionalism: resumeData.sentiment?.professionalismScore || 50,
      completeness: this.calculateCompletenessScore(resumeData)
    };

    // Calculate weighted score
    let totalScore = 0;
    for (const [key, weight] of Object.entries(this.weights)) {
      totalScore += (scores[key] || 0) * weight;
    }

    return {
      overallScore: Math.round(totalScore),
      breakdown: scores,
      matchDetails: this.getMatchDetails(resumeData, jobRequirements)
    };
  }

  // Calculate skills matching score
  calculateSkillsScore(resumeSkills, requiredSkills = []) {
    if (!requiredSkills || requiredSkills.length === 0) {
      return resumeSkills?.totalSkills > 0 ? 70 : 30;
    }

    const allResumeSkills = this.flattenSkills(resumeSkills?.categorized || {});
    const normalizedResumeSkills = allResumeSkills.map(s => s.toLowerCase().trim());
    
    let matchedCount = 0;
    let totalWeight = 0;

    requiredSkills.forEach((skill, index) => {
      // Earlier skills in the list are considered more important
      const importance = index < 3 ? 3 : index < 6 ? 2 : 1;
      totalWeight += importance;

      const normalizedSkill = skill.toLowerCase().trim();
      
      // Check for exact match or partial match
      const isMatch = normalizedResumeSkills.some(rs => 
        rs === normalizedSkill || 
        rs.includes(normalizedSkill) || 
        normalizedSkill.includes(rs)
      );

      if (isMatch) {
        matchedCount += importance;
      }
    });

    const score = totalWeight > 0 ? (matchedCount / totalWeight) * 100 : 50;
    
    // Bonus for additional relevant skills
    const bonusSkills = Math.min(allResumeSkills.length - requiredSkills.length, 10);
    const bonus = bonusSkills > 0 ? bonusSkills * 1 : 0;

    return Math.min(100, score + bonus);
  }

  // Calculate experience score
  calculateExperienceScore(experience, requirements) {
    const candidateYears = experience?.totalYears || 0;
    const minRequired = requirements?.minExperience || 0;
    const maxRequired = requirements?.maxExperience || 20;

    if (candidateYears >= minRequired && candidateYears <= maxRequired) {
      // Perfect fit
      return 100;
    } else if (candidateYears < minRequired) {
      // Under-qualified
      if (minRequired === 0) return 100;
      const ratio = candidateYears / minRequired;
      return Math.max(20, ratio * 100);
    } else {
      // Over-qualified (slight penalty)
      const overBy = candidateYears - maxRequired;
      return Math.max(60, 100 - overBy * 5);
    }
  }

  // Calculate education score
  calculateEducationScore(education, requiredEducation) {
    const degreeHierarchy = {
      'Diploma': 1,
      'Associate': 2,
      'Bachelors': 3,
      'Masters': 4,
      'PhD': 5
    };

    const candidateDegree = education?.highestDegree || 'Not specified';
    const requiredDegree = requiredEducation || 'Bachelors';

    const candidateLevel = degreeHierarchy[candidateDegree] || 0;
    const requiredLevel = degreeHierarchy[requiredDegree] || 3;

    if (candidateLevel >= requiredLevel) {
      // Meets or exceeds requirements
      return 100;
    } else if (candidateLevel > 0) {
      // Has some education but below requirement
      return (candidateLevel / requiredLevel) * 100;
    } else {
      // Education not specified
      return 40;
    }
  }

  // Calculate resume completeness score
  calculateCompletenessScore(resumeData) {
    let score = 0;
    const checks = [
      { condition: resumeData.contact?.name, points: 15 },
      { condition: resumeData.contact?.email, points: 20 },
      { condition: resumeData.contact?.phone, points: 10 },
      { condition: resumeData.experience?.totalYears > 0, points: 15 },
      { condition: resumeData.education?.degrees?.length > 0, points: 15 },
      { condition: resumeData.skills?.totalSkills > 5, points: 15 },
      { condition: resumeData.contact?.linkedin || resumeData.contact?.github, points: 10 }
    ];

    checks.forEach(check => {
      if (check.condition) score += check.points;
    });

    return score;
  }

  // Get detailed match information
  getMatchDetails(resumeData, jobRequirements) {
    const allResumeSkills = this.flattenSkills(resumeData.skills?.categorized || {});
    const normalizedResumeSkills = allResumeSkills.map(s => s.toLowerCase().trim());
    const requiredSkills = jobRequirements.skills || [];

    const matchedSkills = [];
    const missingSkills = [];

    requiredSkills.forEach(skill => {
      const normalizedSkill = skill.toLowerCase().trim();
      const isMatch = normalizedResumeSkills.some(rs => 
        rs === normalizedSkill || 
        rs.includes(normalizedSkill) || 
        normalizedSkill.includes(rs)
      );

      if (isMatch) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    });

    const experienceMatch = (resumeData.experience?.totalYears || 0) >= (jobRequirements.minExperience || 0);
    
    const degreeHierarchy = ['Diploma', 'Associate', 'Bachelors', 'Masters', 'PhD'];
    const candidateDegreeIndex = degreeHierarchy.indexOf(resumeData.education?.highestDegree);
    const requiredDegreeIndex = degreeHierarchy.indexOf(jobRequirements.education || 'Bachelors');
    const educationMatch = candidateDegreeIndex >= requiredDegreeIndex;

    return {
      skillsMatch: matchedSkills,
      missingSkills,
      experienceMatch,
      educationMatch,
      skillMatchPercentage: requiredSkills.length > 0 
        ? Math.round((matchedSkills.length / requiredSkills.length) * 100) 
        : 100
    };
  }

  // Get recommendation based on score
  getRecommendation(score) {
    if (score >= 85) {
      return {
        status: 'Highly Recommended',
        color: 'green',
        action: 'Schedule Interview',
        priority: 1
      };
    } else if (score >= 70) {
      return {
        status: 'Recommended',
        color: 'blue',
        action: 'Review Further',
        priority: 2
      };
    } else if (score >= 50) {
      return {
        status: 'Potential',
        color: 'yellow',
        action: 'Consider for Other Roles',
        priority: 3
      };
    } else {
      return {
        status: 'Not Recommended',
        color: 'red',
        action: 'Archive',
        priority: 4
      };
    }
  }

  // Rank multiple candidates
  rankCandidates(candidates, jobRequirements) {
    const scoredCandidates = candidates.map(candidate => {
      const scoreResult = this.calculateMatchScore(candidate.analysis, jobRequirements);
      return {
        ...candidate,
        matchScore: scoreResult,
        recommendation: this.getRecommendation(scoreResult.overallScore)
      };
    });

    // Sort by overall score descending
    scoredCandidates.sort((a, b) => b.matchScore.overallScore - a.matchScore.overallScore);

    // Add ranking
    scoredCandidates.forEach((candidate, index) => {
      candidate.rank = index + 1;
    });

    return scoredCandidates;
  }

  // Helper: Flatten skills object to array
  flattenSkills(categorizedSkills) {
    const allSkills = [];
    for (const category of Object.values(categorizedSkills)) {
      if (Array.isArray(category)) {
        allSkills.push(...category);
      }
    }
    return allSkills;
  }

  // Calculate skill gap analysis
  analyzeSkillGaps(resumeData, jobRequirements) {
    const matchDetails = this.getMatchDetails(resumeData, jobRequirements);
    
    return {
      matchedSkills: matchDetails.skillsMatch,
      missingSkills: matchDetails.missingSkills,
      additionalSkills: this.flattenSkills(resumeData.skills?.categorized || {})
        .filter(skill => !jobRequirements.skills?.includes(skill)),
      recommendations: this.generateSkillRecommendations(matchDetails.missingSkills)
    };
  }

  // Generate learning recommendations for missing skills
  generateSkillRecommendations(missingSkills) {
    const recommendations = missingSkills.map(skill => ({
      skill,
      suggestion: `Consider upskilling in ${skill}`,
      resources: this.getSkillResources(skill)
    }));

    return recommendations;
  }

  // Get learning resources for a skill
  getSkillResources(skill) {
    const resourceMap = {
      'javascript': ['FreeCodeCamp', 'JavaScript.info', 'MDN Web Docs'],
      'python': ['Python.org', 'Real Python', 'Codecademy'],
      'react': ['React.dev', 'Scrimba', 'Egghead.io'],
      'node.js': ['Node.js Docs', 'NodeSchool', 'The Odin Project'],
      'aws': ['AWS Training', 'A Cloud Guru', 'Tutorials Dojo'],
      'docker': ['Docker Docs', 'Play with Docker', 'KodeKloud'],
      'kubernetes': ['Kubernetes.io', 'KodeKloud', 'CNCF Training'],
      'machine learning': ['Coursera ML', 'Fast.ai', 'Kaggle'],
      'default': ['Udemy', 'Coursera', 'LinkedIn Learning']
    };

    const normalizedSkill = skill.toLowerCase();
    return resourceMap[normalizedSkill] || resourceMap['default'];
  }
}

export default new ScoringService();