'use strict';

const ATSAnalysis = require('../models/ATSAnalysis');

// Common ATS keywords by category
const COMMON_TECH_SKILLS = [
  'javascript', 'python', 'java', 'c++', 'c#', 'typescript', 'react', 'node', 'express',
  'angular', 'vue', 'sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'docker', 'kubernetes',
  'aws', 'azure', 'gcp', 'git', 'html', 'css', 'rest', 'api', 'graphql', 'machine learning',
  'data science', 'linux', 'agile', 'scrum', 'ci/cd', 'terraform', 'microservices',
];

const ACTION_VERBS = [
  'achieved', 'built', 'created', 'delivered', 'designed', 'developed', 'enhanced',
  'implemented', 'improved', 'increased', 'led', 'managed', 'optimized', 'reduced',
  'spearheaded', 'streamlined', 'transformed', 'architected', 'automated', 'deployed',
];

// ─── Individual Scoring Functions ─────────────────────────────────────────────

/**
 * Score: Contact Information (10 pts)
 */
const scoreContactInfo = (parsed) => {
  let score = 0;
  const suggestions = [];
  const MAX = 10;

  if (parsed.fullName) score += 2; else suggestions.push('Add your full name prominently at the top');
  if (parsed.email) score += 3; else suggestions.push('Include a professional email address');
  if (parsed.phone) score += 2; else suggestions.push('Add a phone number');
  if (parsed.linkedin) score += 2; else suggestions.push('Add your LinkedIn profile URL');
  if (parsed.address || parsed.github || parsed.portfolio) score += 1;

  return {
    score,
    maxScore: MAX,
    feedback: score >= 8 ? 'Excellent contact info' : score >= 5 ? 'Contact info is partially complete' : 'Contact info is incomplete',
    suggestions,
  };
};

/**
 * Score: Resume Length (10 pts)
 */
const scoreResumeLength = (rawText) => {
  const wordCount = rawText.split(/\s+/).filter(Boolean).length;
  const suggestions = [];
  let score = 0;
  const MAX = 10;

  if (wordCount >= 300 && wordCount <= 800) {
    score = 10;
  } else if (wordCount >= 200 && wordCount < 300) {
    score = 6;
    suggestions.push('Your resume is a bit short. Aim for 300–800 words for one page.');
  } else if (wordCount > 800 && wordCount <= 1200) {
    score = 7;
    suggestions.push('Your resume may be too long. Consider trimming to 1 page (300–800 words).');
  } else if (wordCount < 200) {
    score = 3;
    suggestions.push('Resume is too short. Expand with more details about your experience and skills.');
  } else {
    score = 4;
    suggestions.push('Resume is too long. Aim to keep it to 1–2 pages.');
  }

  return {
    score,
    maxScore: MAX,
    feedback: `Resume has ${wordCount} words`,
    suggestions,
  };
};

/**
 * Score: Skills Section (15 pts)
 */
const scoreSkills = (parsed, rawText) => {
  const suggestions = [];
  let score = 0;
  const MAX = 15;

  const lowerText = rawText.toLowerCase();
  const foundTechSkills = COMMON_TECH_SKILLS.filter((s) => lowerText.includes(s));

  if (parsed.skills.length > 0) {
    score += 5;
    if (parsed.skills.length >= 5) score += 3;
    if (parsed.skills.length >= 10) score += 2;
  } else {
    suggestions.push('Add a dedicated Skills section with relevant technical and soft skills');
  }

  score += Math.min(foundTechSkills.length, 5);

  if (foundTechSkills.length < 3) {
    suggestions.push('Include more industry-relevant technical skills (e.g., programming languages, frameworks, tools)');
  }

  if (parsed.skills.length > 0 && parsed.skills.length < 5) {
    suggestions.push('Expand your skills list – aim for at least 8–12 relevant skills');
  }

  return {
    score: Math.min(score, MAX),
    maxScore: MAX,
    feedback: `Found ${parsed.skills.length} skills, including ${foundTechSkills.length} recognizable technical skills`,
    suggestions,
  };
};

/**
 * Score: Education Section (10 pts)
 */
const scoreEducation = (parsed) => {
  const suggestions = [];
  let score = 0;
  const MAX = 10;

  if (parsed.education.length === 0) {
    suggestions.push('Add an Education section with your degree, institution, and graduation year');
    return { score: 0, maxScore: MAX, feedback: 'No education section found', suggestions };
  }

  score += 5;

  const edu = parsed.education[0];
  if (edu.degree) score += 2;
  if (edu.institution) score += 2;
  if (edu.endDate) score += 1;

  if (!edu.degree) suggestions.push('Specify your degree title (e.g., Bachelor of Science in Computer Science)');
  if (!edu.institution) suggestions.push('Include the name of your educational institution');
  if (!edu.endDate) suggestions.push('Add your graduation date or expected graduation year');

  return {
    score,
    maxScore: MAX,
    feedback: edu.degree ? `Found: ${edu.degree}` : 'Education section present but incomplete',
    suggestions,
  };
};

/**
 * Score: Work Experience (20 pts)
 */
const scoreExperience = (parsed) => {
  const suggestions = [];
  let score = 0;
  const MAX = 20;

  if (parsed.experience.length === 0) {
    suggestions.push('Add a Work Experience section detailing your past roles');
    return { score: 0, maxScore: MAX, feedback: 'No work experience found', suggestions };
  }

  score += 5;
  if (parsed.experience.length >= 2) score += 5;

  // Check for action verbs and bullet points
  const expText = parsed.experience.map((e) => `${e.description} ${e.bullets.join(' ')}`).join(' ').toLowerCase();
  const foundVerbs = ACTION_VERBS.filter((v) => expText.includes(v));

  score += Math.min(foundVerbs.length * 2, 6);

  const hasBullets = parsed.experience.some((e) => e.bullets.length > 0);
  if (hasBullets) score += 4;

  if (foundVerbs.length < 3) {
    suggestions.push('Use strong action verbs (e.g., developed, implemented, optimized) to describe your achievements');
  }
  if (!hasBullets) {
    suggestions.push('Use bullet points to describe your responsibilities and achievements for each role');
  }
  if (parsed.experience.length === 1) {
    suggestions.push('If you have more experience, make sure to list all relevant positions');
  }

  return {
    score: Math.min(score, MAX),
    maxScore: MAX,
    feedback: `Found ${parsed.experience.length} experience entr${parsed.experience.length > 1 ? 'ies' : 'y'}`,
    suggestions,
  };
};

/**
 * Score: Professional Summary (10 pts)
 */
const scoreSummary = (parsed) => {
  const suggestions = [];
  let score = 0;
  const MAX = 10;

  if (!parsed.summary) {
    suggestions.push('Add a Professional Summary section (3–5 sentences highlighting your expertise and value)');
    return { score: 0, maxScore: MAX, feedback: 'No professional summary found', suggestions };
  }

  const wordCount = parsed.summary.split(/\s+/).filter(Boolean).length;
  score += 4;

  if (wordCount >= 30 && wordCount <= 100) {
    score += 6;
  } else if (wordCount >= 15) {
    score += 3;
    if (wordCount < 30) suggestions.push('Expand your summary to 3–5 sentences (30–100 words)');
    if (wordCount > 100) suggestions.push('Shorten your summary to 3–5 concise sentences');
  } else {
    suggestions.push('Your summary is too brief. Write 3–5 sentences about your expertise and goals');
  }

  return {
    score,
    maxScore: MAX,
    feedback: `Summary found (${wordCount} words)`,
    suggestions,
  };
};

/**
 * Score: Section Completeness (10 pts)
 */
const scoreSectionCompleteness = (parsed) => {
  const suggestions = [];
  let score = 0;
  const MAX = 10;

  const sections = {
    'Contact Info': parsed.email || parsed.phone,
    'Summary': parsed.summary,
    'Skills': parsed.skills.length > 0,
    'Education': parsed.education.length > 0,
    'Experience': parsed.experience.length > 0,
    'Projects': parsed.projects.length > 0,
    'Certifications': parsed.certifications.length > 0,
  };

  const present = Object.values(sections).filter(Boolean).length;
  score = Math.round((present / Object.keys(sections).length) * MAX);

  for (const [section, found] of Object.entries(sections)) {
    if (!found) {
      suggestions.push(`Consider adding a "${section}" section to improve completeness`);
    }
  }

  return {
    score,
    maxScore: MAX,
    feedback: `${present}/${Object.keys(sections).length} standard sections found`,
    suggestions,
  };
};

/**
 * Score: Formatting (10 pts) – heuristic analysis
 */
const scoreFormatting = (rawText) => {
  const suggestions = [];
  let score = 10;
  const MAX = 10;

  // Check for excessive whitespace (bad formatting)
  const emptyLineRatio = (rawText.match(/^\s*$/gm) || []).length / rawText.split('\n').length;
  if (emptyLineRatio > 0.4) {
    score -= 3;
    suggestions.push('Reduce excessive blank lines to improve readability');
  }

  // Check for special characters (may cause ATS parsing issues)
  const specialChars = (rawText.match(/[^\x00-\x7F]/g) || []).length;
  if (specialChars > 20) {
    score -= 2;
    suggestions.push('Avoid special characters or symbols that may confuse ATS parsers');
  }

  // Check for tables/columns (indicated by many pipe chars)
  const pipeCount = (rawText.match(/\|/g) || []).length;
  if (pipeCount > 5) {
    score -= 2;
    suggestions.push('Avoid table-based layouts – ATS systems struggle to parse tabular formats');
  }

  // Check for headers (all caps lines)
  const headerLines = rawText.split('\n').filter((l) => l.trim() === l.trim().toUpperCase() && l.trim().length > 3);
  if (headerLines.length > 0) score = Math.min(score + 1, MAX);

  return {
    score: Math.max(score, 0),
    maxScore: MAX,
    feedback: score >= 8 ? 'Formatting appears clean' : 'Some formatting issues detected',
    suggestions,
  };
};

/**
 * Score: Readability (10 pts)
 */
const scoreReadability = (rawText) => {
  const suggestions = [];
  let score = 10;
  const MAX = 10;

  const sentences = rawText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  if (sentences.length === 0) return { score: 0, maxScore: MAX, feedback: 'No text found', suggestions };

  const avgWordsPerSentence =
    rawText.split(/\s+/).filter(Boolean).length / sentences.length;

  if (avgWordsPerSentence > 30) {
    score -= 3;
    suggestions.push('Break long sentences into shorter, more readable bullet points');
  }

  // Check for passive voice indicators
  const passiveCount = (rawText.match(/\b(was|were|been|being)\s+\w+ed\b/gi) || []).length;
  if (passiveCount > 5) {
    score -= 2;
    suggestions.push('Replace passive voice with active voice (e.g., "Led a team" instead of "A team was led by me")');
  }

  // Check for first-person pronouns (bad in resumes)
  const firstPerson = (rawText.match(/\b(I|me|my|myself)\b/g) || []).length;
  if (firstPerson > 3) {
    score -= 2;
    suggestions.push('Avoid first-person pronouns (I, me, my) in your resume');
  }

  return {
    score: Math.max(score, 0),
    maxScore: MAX,
    feedback: `Average sentence length: ${Math.round(avgWordsPerSentence)} words`,
    suggestions,
  };
};

/**
 * Score: Keyword Density (5 pts)
 */
const scoreKeywords = (rawText) => {
  const suggestions = [];
  let score = 0;
  const MAX = 5;

  const lowerText = rawText.toLowerCase();
  const foundKeywords = COMMON_TECH_SKILLS.filter((k) => lowerText.includes(k));

  score = Math.min(foundKeywords.length, MAX);

  if (foundKeywords.length < 3) {
    suggestions.push('Include more industry-standard keywords to pass ATS keyword screening');
    suggestions.push(`Consider adding: ${COMMON_TECH_SKILLS.slice(0, 5).join(', ')}`);
  }

  return {
    score,
    maxScore: MAX,
    feedback: `Found ${foundKeywords.length} ATS-relevant keywords`,
    suggestions,
  };
};

// ─── Main ATS Scoring Function ────────────────────────────────────────────────

/**
 * Run the full ATS scoring engine on a parsed resume.
 * @param {object} parsed - ParsedResume document
 * @returns {object} ATS analysis result
 */
const calculateATSScore = (parsed) => {
  const rawText = parsed.rawText || '';

  const categories = {
    contactInfo: scoreContactInfo(parsed),
    formatting: scoreFormatting(rawText),
    resumeLength: scoreResumeLength(rawText),
    skills: scoreSkills(parsed, rawText),
    education: scoreEducation(parsed),
    experience: scoreExperience(parsed),
    summary: scoreSummary(parsed),
    sectionCompleteness: scoreSectionCompleteness(parsed),
    readability: scoreReadability(rawText),
    keywords: scoreKeywords(rawText),
  };

  // Calculate overall score (weighted average)
  const totalScore = Object.values(categories).reduce((sum, c) => sum + c.score, 0);
  const totalMax = Object.values(categories).reduce((sum, c) => sum + c.maxScore, 0);
  const overallScore = Math.round((totalScore / totalMax) * 100);

  // Aggregate all suggestions, top ones first
  const allSuggestions = Object.values(categories).flatMap((c) => c.suggestions);
  const topSuggestions = allSuggestions.slice(0, 5);

  const grade = ATSAnalysis.computeGrade(overallScore);

  return {
    overallScore,
    grade,
    categories,
    suggestions: allSuggestions,
    topSuggestions,
  };
};

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Analyze a resume and save ATS results to DB.
 * @param {object} parsedResume - ParsedResume mongoose document
 * @param {string} userId
 * @returns {Promise<ATSAnalysis>}
 */
const analyzeResume = async (parsedResume, userId) => {
  const result = calculateATSScore(parsedResume);

  // Upsert – one analysis per resume
  const analysis = await ATSAnalysis.findOneAndUpdate(
    { resume: parsedResume.resume },
    {
      user: userId,
      resume: parsedResume.resume,
      ...result,
    },
    { upsert: true, new: true, runValidators: true }
  );

  return analysis;
};

/**
 * Get existing ATS analysis for a resume.
 * @param {string} resumeId
 * @param {string} userId
 * @returns {Promise<ATSAnalysis|null>}
 */
const getAnalysis = async (resumeId, userId) => {
  return ATSAnalysis.findOne({ resume: resumeId, user: userId });
};

module.exports = { analyzeResume, getAnalysis, calculateATSScore };
