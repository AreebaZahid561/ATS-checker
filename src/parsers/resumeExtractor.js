'use strict';

/**
 * Regex-based resume field extractor.
 * Extracts structured data from raw resume text.
 */

// ─── Contact Information ──────────────────────────────────────────────────────

const extractEmail = (text) => {
  const match = text.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
  return match ? match[0].toLowerCase() : '';
};

const extractPhone = (text) => {
  const match = text.match(/(\+?\d[\d\s\-().]{7,}\d)/);
  return match ? match[0].trim() : '';
};

const extractLinkedIn = (text) => {
  const match = text.match(/linkedin\.com\/in\/[\w-]+/i);
  return match ? `https://www.${match[0]}` : '';
};

const extractGitHub = (text) => {
  const match = text.match(/github\.com\/[\w-]+/i);
  return match ? `https://www.${match[0]}` : '';
};

const extractPortfolio = (text) => {
  const urlRegex = /https?:\/\/(?!linkedin|github)[\w.-]+\.[a-z]{2,}(\/[\w.-]*)?/i;
  const match = text.match(urlRegex);
  return match ? match[0] : '';
};

// ─── Name Extraction (heuristic: first non-empty line) ───────────────────────

const extractFullName = (text) => {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l.length < 60);

  for (const line of lines.slice(0, 5)) {
    // Skip lines that look like emails, phones, URLs, or section headers
    if (/[@|http|linkedin|github|phone|email|address]/i.test(line)) continue;
    if (/^\d/.test(line)) continue;
    // Simple name heuristic: 2-4 words, all starting with capital
    const words = line.split(/\s+/);
    if (
      words.length >= 2 &&
      words.length <= 5 &&
      words.every((w) => /^[A-Z]/.test(w))
    ) {
      return line;
    }
  }
  return lines[0] || '';
};

// ─── Section Extraction ───────────────────────────────────────────────────────

/**
 * Extract text between a section header and the next known section.
 */
const SECTION_PATTERNS = {
  summary: /^(professional\s*summary|summary|objective|profile|about\s*me)/i,
  skills: /^(skills|technical\s*skills|core\s*competencies|key\s*skills|expertise)/i,
  experience: /^(experience|work\s*experience|employment|professional\s*experience|career)/i,
  education: /^(education|academic|qualifications|degrees?)/i,
  projects: /^(projects?|personal\s*projects?|academic\s*projects?|portfolio)/i,
  certifications: /^(certifications?|certificates?|licenses?|credentials?)/i,
  languages: /^(languages?|language\s*proficiency)/i,
  awards: /^(awards?|honors?|achievements?|accomplishments?)/i,
};

const extractSection = (lines, sectionPattern) => {
  let inSection = false;
  const sectionLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (sectionPattern.test(trimmed)) {
      inSection = true;
      continue;
    }

    if (inSection) {
      // Stop if we hit another known section header
      const isOtherSection = Object.values(SECTION_PATTERNS).some(
        (p) => p !== sectionPattern && p.test(trimmed)
      );
      if (isOtherSection) break;
      sectionLines.push(trimmed);
    }
  }

  return sectionLines.join('\n');
};

// ─── Skills ───────────────────────────────────────────────────────────────────

const extractSkills = (text, lines) => {
  const skillsSectionText = extractSection(lines, SECTION_PATTERNS.skills);

  if (!skillsSectionText) {
    // Fallback: look for common tech keywords in full text
    return [];
  }

  // Split by common delimiters: commas, pipes, bullets, newlines
  const raw = skillsSectionText
    .split(/[,|•\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 50);

  return [...new Set(raw)];
};

// ─── Summary ─────────────────────────────────────────────────────────────────

const extractSummary = (lines) => {
  return extractSection(lines, SECTION_PATTERNS.summary);
};

// ─── Education ────────────────────────────────────────────────────────────────

const extractEducation = (lines) => {
  const sectionText = extractSection(lines, SECTION_PATTERNS.education);
  if (!sectionText) return [];

  const eduLines = sectionText.split('\n').filter((l) => l.trim());
  const entries = [];
  let current = {};

  const degreeKeywords = /\b(bachelor|master|phd|doctorate|associate|diploma|b\.s|m\.s|b\.e|m\.e|bsc|msc|mba|b\.tech|m\.tech)\b/i;
  const datePattern = /\b(19|20)\d{2}\b/;

  for (const line of eduLines) {
    if (degreeKeywords.test(line)) {
      if (current.institution || current.degree) entries.push(current);
      current = { degree: line.trim(), institution: '', field: '', startDate: '', endDate: '', gpa: '' };
    } else if (datePattern.test(line)) {
      const years = line.match(/\b(19|20)\d{2}\b/g);
      if (years) {
        current.startDate = years[0] || '';
        current.endDate = years[1] || 'Present';
      }
      if (!current.institution) current.institution = line.replace(/\d{4}[-–]\d{4}|\d{4}/g, '').trim();
    } else if (!current.institution && line.length > 3) {
      current.institution = line.trim();
    }
  }

  if (current.institution || current.degree) entries.push(current);

  return entries;
};

// ─── Experience ───────────────────────────────────────────────────────────────

const extractExperience = (lines) => {
  const sectionText = extractSection(lines, SECTION_PATTERNS.experience);
  if (!sectionText) return [];

  const expLines = sectionText.split('\n').filter((l) => l.trim());
  const entries = [];
  let current = null;

  const datePattern = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|\d{4}/i;
  const dateRangePattern = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}\s*[-–]\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|(Present|Current)/i;

  for (const line of expLines) {
    if (dateRangePattern.test(line) || (datePattern.test(line) && line.length < 80)) {
      if (current) entries.push(current);
      current = {
        company: '',
        title: line.trim(),
        location: '',
        startDate: '',
        endDate: '',
        description: '',
        bullets: [],
      };
    } else if (current) {
      if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        current.bullets.push(line.replace(/^[•\-*]\s*/, '').trim());
      } else if (!current.company) {
        current.company = line.trim();
      } else {
        current.description += (current.description ? ' ' : '') + line.trim();
      }
    }
  }

  if (current) entries.push(current);

  return entries;
};

// ─── Projects ─────────────────────────────────────────────────────────────────

const extractProjects = (lines) => {
  const sectionText = extractSection(lines, SECTION_PATTERNS.projects);
  if (!sectionText) return [];

  const projLines = sectionText.split('\n').filter((l) => l.trim());
  const entries = [];
  let current = null;

  for (const line of projLines) {
    if (/^[A-Z]/.test(line) && line.length < 60) {
      if (current) entries.push(current);
      current = { name: line.trim(), description: '', technologies: [], url: '' };
    } else if (current) {
      if (/https?:\/\//i.test(line)) {
        const urlMatch = line.match(/https?:\/\/\S+/i);
        if (urlMatch) current.url = urlMatch[0];
      } else {
        current.description += (current.description ? ' ' : '') + line.trim();
      }
    }
  }

  if (current) entries.push(current);
  return entries;
};

// ─── Certifications ───────────────────────────────────────────────────────────

const extractCertifications = (lines) => {
  const sectionText = extractSection(lines, SECTION_PATTERNS.certifications);
  if (!sectionText) return [];

  return sectionText
    .split('\n')
    .map((l) => l.replace(/^[•\-*]\s*/, '').trim())
    .filter((l) => l.length > 2)
    .map((l) => ({ name: l, issuer: '', date: '' }));
};

// ─── Languages ────────────────────────────────────────────────────────────────

const extractLanguages = (lines) => {
  const sectionText = extractSection(lines, SECTION_PATTERNS.languages);
  if (!sectionText) return [];

  return sectionText
    .split(/[,|\n•]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 1 && l.length < 30);
};

// ─── Awards ───────────────────────────────────────────────────────────────────

const extractAwards = (lines) => {
  const sectionText = extractSection(lines, SECTION_PATTERNS.awards);
  if (!sectionText) return [];

  return sectionText
    .split('\n')
    .map((l) => l.replace(/^[•\-*]\s*/, '').trim())
    .filter((l) => l.length > 2);
};

// ─── Address ─────────────────────────────────────────────────────────────────

const extractAddress = (text) => {
  const addressPatterns = [
    /\d+\s[\w\s]+,\s[\w\s]+,\s[A-Z]{2}\s\d{5}/,
    /[\w\s]+,\s[\w\s]+,\s[\w\s]+/,
  ];
  for (const pattern of addressPatterns) {
    const match = text.match(pattern);
    if (match) return match[0].trim();
  }
  return '';
};

// ─── Main Extractor ───────────────────────────────────────────────────────────

/**
 * Extract all resume fields from raw text.
 * @param {string} rawText
 * @returns {object} Structured resume data
 */
const extractResumeData = (rawText) => {
  const lines = rawText.split('\n');

  return {
    rawText,
    fullName: extractFullName(rawText),
    email: extractEmail(rawText),
    phone: extractPhone(rawText),
    address: extractAddress(rawText),
    linkedin: extractLinkedIn(rawText),
    github: extractGitHub(rawText),
    portfolio: extractPortfolio(rawText),
    summary: extractSummary(lines),
    skills: extractSkills(rawText, lines),
    education: extractEducation(lines),
    experience: extractExperience(lines),
    projects: extractProjects(lines),
    certifications: extractCertifications(lines),
    languages: extractLanguages(lines),
    awards: extractAwards(lines),
  };
};

module.exports = { extractResumeData };
