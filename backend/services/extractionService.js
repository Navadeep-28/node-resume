// backend/services/extractionService.js
import natural from 'natural';
import compromise from 'compromise';

class ExtractionService {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
  }

  // Extract all entities from resume text
  extractEntities(text) {
    return {
      names: this.extractNames(text),
      emails: this.extractEmails(text),
      phones: this.extractPhones(text),
      urls: this.extractUrls(text),
      dates: this.extractDates(text),
      locations: this.extractLocations(text),
      organizations: this.extractOrganizations(text),
      money: this.extractMoney(text)
    };
  }

  // Extract names using compromise NLP
  extractNames(text) {
    const doc = compromise(text);
    const people = doc.people().out('array');
    
    // Also try first line extraction for resume header
    const lines = text.split('\n').filter(l => l.trim());
    const firstLine = lines[0]?.trim() || '';
    
    // Check if first line looks like a name
    if (firstLine && firstLine.length < 50 && !firstLine.includes('@') && !/\d{3}/.test(firstLine)) {
      const words = firstLine.split(/\s+/);
      if (words.length >= 2 && words.length <= 4) {
        if (!people.includes(firstLine)) {
          people.unshift(firstLine);
        }
      }
    }

    return [...new Set(people)].slice(0, 5);
  }

  // Extract email addresses
  extractEmails(text) {
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(emailPattern) || [];
    return [...new Set(matches)];
  }

  // Extract phone numbers
  extractPhones(text) {
    const phonePatterns = [
      /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g,
      /(?:\+?91[-.\s]?)?[6-9]\d{9}/g, // Indian format
      /(?:\+?44[-.\s]?)?\d{4}[-.\s]?\d{6}/g, // UK format
    ];

    const phones = [];
    phonePatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      phones.push(...matches);
    });

    return [...new Set(phones.map(p => p.replace(/\s+/g, ' ').trim()))];
  }

  // Extract URLs (LinkedIn, GitHub, Portfolio, etc.)
  extractUrls(text) {
    const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
    const matches = text.match(urlPattern) || [];
    
    const urls = {
      linkedin: null,
      github: null,
      portfolio: null,
      other: []
    };

    matches.forEach(url => {
      const lowerUrl = url.toLowerCase();
      if (lowerUrl.includes('linkedin.com')) {
        urls.linkedin = url;
      } else if (lowerUrl.includes('github.com')) {
        urls.github = url;
      } else if (!lowerUrl.includes('google.com') && !lowerUrl.includes('facebook.com')) {
        if (!urls.portfolio) {
          urls.portfolio = url;
        } else {
          urls.other.push(url);
        }
      }
    });

    // Also check for profile mentions without full URL
    const linkedinPattern = /linkedin\.com\/in\/([a-zA-Z0-9-]+)/gi;
    const githubPattern = /github\.com\/([a-zA-Z0-9-]+)/gi;

    if (!urls.linkedin) {
      const linkedinMatch = linkedinPattern.exec(text);
      if (linkedinMatch) {
        urls.linkedin = `https://linkedin.com/in/${linkedinMatch[1]}`;
      }
    }

    if (!urls.github) {
      const githubMatch = githubPattern.exec(text);
      if (githubMatch) {
        urls.github = `https://github.com/${githubMatch[1]}`;
      }
    }

    return urls;
  }

  // Extract dates
  extractDates(text) {
    const datePatterns = [
      /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*\d{4}/gi,
      /\d{1,2}\/\d{1,2}\/\d{2,4}/g,
      /\d{4}\s*[-–]\s*(?:\d{4}|present|current|now)/gi,
      /(?:since|from)\s*\d{4}/gi
    ];

    const dates = [];
    datePatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      dates.push(...matches);
    });

    return [...new Set(dates)].slice(0, 20);
  }

  // Extract locations
  extractLocations(text) {
    const doc = compromise(text);
    const places = doc.places().out('array');
    
    // Common location patterns in resumes
    const locationPatterns = [
      /(?:location|address|city|based in)[:\s]+([A-Za-z\s,]+)/gi,
      /([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),\s*([A-Z]{2})\s*\d{5}/g, // US City, ST ZIP
      /([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),\s*([A-Z][a-z]+)/g // City, Country/State
    ];

    const locations = [...places];
    
    locationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        locations.push(match[1]?.trim());
      }
    });

    return [...new Set(locations.filter(Boolean))].slice(0, 5);
  }

  // Extract organizations/companies
  extractOrganizations(text) {
    const doc = compromise(text);
    const orgs = doc.organizations().out('array');
    
    // Common patterns for company names
    const companyPatterns = [
      /(?:worked at|employed at|experience at|worked for|employed by)\s+([A-Z][A-Za-z\s&.,]+)/gi,
      /([A-Z][A-Za-z\s&]+)\s*(?:Inc\.|LLC|Ltd\.|Corp\.|Corporation|Company)/gi
    ];

    const companies = [...orgs];
    
    companyPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        companies.push(match[1]?.trim());
      }
    });

    return [...new Set(companies.filter(c => c && c.length > 2))].slice(0, 10);
  }

  // Extract monetary values (salary expectations, etc.)
  extractMoney(text) {
    const moneyPatterns = [
      /\$[\d,]+(?:\.\d{2})?(?:\s*[-–]\s*\$[\d,]+(?:\.\d{2})?)?(?:\s*(?:k|K|per\s*(?:year|month|hour)|\/(?:yr|hr|mo)))?/g,
      /(?:salary|compensation|ctc|package)[:\s]*[\$₹€£]?[\d,]+(?:\s*[-–]\s*[\$₹€£]?[\d,]+)?(?:\s*(?:k|K|lpa|LPA))?/gi,
      /[\d,]+\s*(?:lpa|LPA|lakhs?)/gi
    ];

    const money = [];
    moneyPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      money.push(...matches);
    });

    return [...new Set(money)];
  }

  // Extract certifications
  extractCertifications(text) {
    const certPatterns = [
      /(?:certified|certification)[:\s]+([A-Za-z\s]+)/gi,
      /(?:AWS|Azure|GCP|Google|Microsoft|Cisco|Oracle|CompTIA|PMP|Scrum|Agile)\s*(?:Certified|Certificate|Certification)?[^.]*(?:Developer|Architect|Engineer|Professional|Associate|Expert|Master|Practitioner)/gi,
      /(?:CPA|CFA|CISSP|CISM|CEH|CCNA|CCNP|MCSE|MCSA|OCA|OCP|RHCE|RHCSA)/g
    ];

    const certs = [];
    certPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      certs.push(...matches.map(m => m.trim()));
    });

    return [...new Set(certs)];
  }

  // Extract projects
  extractProjects(text) {
    const projectPatterns = [
      /(?:project|built|developed|created)[:\s]+([A-Za-z\s]+(?:app|application|system|platform|tool|website|portal|dashboard)?)/gi,
      /(?:key\s*projects?|personal\s*projects?|notable\s*projects?)[:\s]*([^.]+)/gi
    ];

    const projects = [];
    projectPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const project = match[1]?.trim();
        if (project && project.length > 3 && project.length < 100) {
          projects.push(project);
        }
      }
    });

    return [...new Set(projects)].slice(0, 10);
  }

  // Extract languages
  extractLanguages(text) {
    const languages = [
      'English', 'Spanish', 'French', 'German', 'Chinese', 'Mandarin', 'Japanese',
      'Korean', 'Hindi', 'Arabic', 'Portuguese', 'Russian', 'Italian', 'Dutch',
      'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Polish', 'Turkish', 'Vietnamese',
      'Thai', 'Indonesian', 'Malay', 'Tamil', 'Telugu', 'Bengali', 'Punjabi'
    ];

    const found = [];
    const lowerText = text.toLowerCase();

    languages.forEach(lang => {
      if (lowerText.includes(lang.toLowerCase())) {
        found.push(lang);
      }
    });

    return found;
  }

  // Extract achievements with quantifiable metrics
  extractAchievements(text) {
    const achievementPatterns = [
      /(?:achieved|accomplished|delivered|improved|increased|reduced|saved|generated|grew|led|managed|drove)\s+[^.]*\d+[^.]*/gi,
      /\d+%\s*(?:improvement|increase|reduction|growth|savings)/gi,
      /(?:\$|₹|€|£)[\d,.]+\s*(?:in\s*)?(?:revenue|savings|cost\s*reduction|growth)/gi
    ];

    const achievements = [];
    achievementPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      achievements.push(...matches.map(m => m.trim()));
    });

    return [...new Set(achievements)].slice(0, 10);
  }

  // Extract keywords using TF-IDF
  extractKeywords(text, topN = 20) {
    const tokens = this.tokenizer.tokenize(text.toLowerCase());
    
    // Remove stop words
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'this', 'that',
      'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my',
      'your', 'his', 'her', 'its', 'our', 'their', 'what', 'which', 'who',
      'whom', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both',
      'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only',
      'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now'
    ]);

    const filteredTokens = tokens.filter(token => 
      token.length > 2 && 
      !stopWords.has(token) && 
      !/^\d+$/.test(token)
    );

    // Count frequencies
    const freq = {};
    filteredTokens.forEach(token => {
      freq[token] = (freq[token] || 0) + 1;
    });

    // Sort by frequency and return top N
    const sorted = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([word, count]) => ({ word, count }));

    return sorted;
  }

  // Full extraction pipeline
  extractAll(text) {
    return {
      entities: this.extractEntities(text),
      certifications: this.extractCertifications(text),
      projects: this.extractProjects(text),
      languages: this.extractLanguages(text),
      achievements: this.extractAchievements(text),
      keywords: this.extractKeywords(text)
    };
  }
}

export default new ExtractionService();