// Resume Parser & Portfolio Generator
let currentData = null;

function getElement(id) {
  return document.getElementById(id);
}

function parseResumeText(raw) {
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const parsed = {
    name: '', title: '', email: '', linkedin: '', github: '', phone: '', location: '', summary: '', experience: [], education: [], skills: [], awards: []
  };

  let section = 'header';
  let currentExperience = null;
  let currentEducation = null;

  const tryAddSection = (header) => {
    const label = header.toLowerCase();
    if (label.includes('summary') || label.includes('professional')) return 'summary';
    if (label.includes('experience') || label.includes('work')) return 'experience';
    if (label.includes('education')) return 'education';
    if (label.includes('skill')) return 'skills';
    if (label.includes('award') || label.includes('honor')) return 'awards';
    return null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Extract contact info in header
    if (!parsed.name && i === 0) parsed.name = line;
    if (!parsed.title && i === 1 && !line.includes('@')) parsed.title = line;

    const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !parsed.email) parsed.email = emailMatch[0];

    if (/linkedin\.com/i.test(line) && !parsed.linkedin) parsed.linkedin = line.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com[^\s]*/i)?.[0] || line;
    if (/github\.com/i.test(line) && !parsed.github) parsed.github = line.match(/(?:https?:\/\/)?(?:www\.)?github\.com[^\s]*/i)?.[0] || line;
    if (/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(line) && !parsed.phone) parsed.phone = line.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/)[0];

    const sectionKey = tryAddSection(line);
    if (sectionKey) {
      section = sectionKey;
      continue;
    }

    if (section === 'header') continue;

    if (section === 'summary') {
      if (!line.match(/^\d|\-|\*|•|EXPERIENCE|EDUCATION|SKILLS/i)) {
        parsed.summary += (parsed.summary ? ' ' : '') + line;
      }
      continue;
    }

    if (section === 'experience') {
      if (/^[-*•]/.test(line)) {
        if (currentExperience) {
          const bullet = line.replace(/^[-*•]+\s*/, '');
          currentExperience.bullets.push(bullet);
        }
      } else if (/\d{4}|\d+\/\d+/.test(line) && currentExperience) {
        currentExperience.date = line;
      } else if (line && !currentExperience) {
        currentExperience = { title: line, company: '', date: '', bullets: [] };
        parsed.experience.push(currentExperience);
      } else if (currentExperience && !currentExperience.company) {
        currentExperience.company = line;
      }
      continue;
    }

    if (section === 'education') {
      if (/^[-*•]/.test(line)) {
        const text = line.replace(/^[-*•]+\s*/, '');
        currentEducation = { degree: text, school: '', date: '', details: '' };
        parsed.education.push(currentEducation);
      } else if (currentEducation) {
        if (!currentEducation.school) {
          currentEducation.school = line;
        } else if (!currentEducation.date && /\d{4}/.test(line)) {
          currentEducation.date = line;
        } else {
          currentEducation.details += (currentEducation.details ? ' ' : '') + line;
        }
      }
      continue;
    }

    if (section === 'skills') {
      const candidates = line.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
      parsed.skills.push(...candidates);
      continue;
    }

    if (section === 'awards') {
      if (line) parsed.awards.push(line);
      continue;
    }
  }

  return parsed;
}

function generatePortfolioHTML(data) {
  const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  scroll-behavior: smooth;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 11pt;
  line-height: 1.6;
  color: #1a1a1a;
  background: #ffffff;
  margin: 0;
  padding: 20px;
}

.resume-container {
  max-width: 8.5in;
  margin: 0 auto;
  background: #ffffff;
  padding: 0.75in;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border: 1px solid #e5e7eb;
  position: relative;
}

.resume-body {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
}

.sidebar {
  background: #1f2937;
  color: white;
  border-radius: 10px;
  border: 1px solid #374151;
  padding: 24px;
}

.sidebar h2 {
  margin: 0 0 16px;
  font-size: 16px;
  color: #f8fafc;
}

.sidebar .mini-title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 14px 0 8px;
  color: #93c5fd;
}

.sidebar p,
.sidebar a,
.sidebar li {
  color: #d1d5db;
}

.sidebar a {
  color: #93c5fd;
  text-decoration: none;
}

.sidebar a:hover {
  text-decoration: underline;
}

.sidebar ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.sidebar li {
  margin-bottom: 8px;
  font-size: 11pt;
}

.profile-block {
  background: #111827;
  border-radius: 8px;
  padding: 14px;
  text-align: center;
  margin-bottom: 20px;
}

.profile-block .avatar {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: #374151;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #ffffff;
  margin-bottom: 10px;
}

.profile-block h3 {
  margin: 0 0 4px;
  font-size: 18px;
  color: #f8fafc;
}

.profile-block p { margin: 0; font-size: 11pt; color: #9ca3af; }

.main-content {
  background: #ffffff;
}

.timeline {
  position: relative;
  padding-left: 14px;
  border-left: 2px solid #e5e7eb;
}

.timeline-item {
  position: relative;
  margin-bottom: 20px;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -9px;
  top: 4px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #2563eb;
  border: 2px solid white;
}

.objective-box {
  background: #f1f5f9;
  border-left: 4px solid #2563eb;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
}

@media screen and (max-width: 900px) {
  .resume-body {
    grid-template-columns: 1fr;
  }

  .sidebar {
    margin-bottom: 18px;
  }
}

.name-title {
  margin-bottom: 8px;
}

.resume-name {
  font-size: 28pt;
  font-weight: 700;
  color: #1f2937;
  letter-spacing: -0.5px;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.resume-title {
  font-size: 14pt;
  font-weight: 500;
  color: #2563eb;
  margin-bottom: 8px;
}

.resume-location {
  font-size: 11pt;
  color: #6b7280;
  font-weight: 400;
  margin-bottom: 16px;
}

.contact-section {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  font-size: 10pt;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #374151;
}

.contact-item::before {
  content: '';
  width: 4px;
  height: 4px;
  background: #2563eb;
  border-radius: 50%;
}

.contact-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.contact-link:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

/* Section Styles */
.section {
  margin-bottom: 28px;
  page-break-inside: avoid;
}

.section-title {
  font-size: 13pt;
  font-weight: 700;
  color: #1f2937;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
  position: relative;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, #2563eb, #3b82f6);
}

/* Summary Section */
.summary-content {
  font-size: 11pt;
  line-height: 1.7;
  color: #374151;
  text-align: justify;
  background: #f8fafc;
  padding: 16px;
  border-radius: 6px;
  border-left: 4px solid #2563eb;
}

/* Experience Section */
.experience-entry {
  margin-bottom: 20px;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: box-shadow 0.2s;
}

.experience-entry:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.experience-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.experience-title {
  font-size: 12pt;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.experience-company {
  font-size: 11pt;
  color: #2563eb;
  font-weight: 600;
  margin: 4px 0;
}

.experience-date {
  font-size: 10pt;
  color: #6b7280;
  font-weight: 500;
  white-space: nowrap;
}

.experience-bullets {
  margin-top: 8px;
  padding-left: 0;
}

.experience-bullets li {
  margin-bottom: 4px;
  color: #374151;
  font-size: 11pt;
  line-height: 1.5;
  position: relative;
  padding-left: 16px;
}

.experience-bullets li::before {
  content: '▸';
  position: absolute;
  left: 0;
  color: #2563eb;
  font-weight: bold;
}

/* Education Section */
.education-entry {
  margin-bottom: 16px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  border-left: 3px solid #10b981;
}

.education-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
  flex-wrap: wrap;
  gap: 4px;
}

.education-degree {
  font-size: 11pt;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.education-school {
  font-size: 10pt;
  color: #059669;
  font-weight: 600;
  margin: 2px 0;
}

.education-date {
  font-size: 10pt;
  color: #6b7280;
  font-weight: 500;
}

.education-details {
  font-size: 10pt;
  color: #6b7280;
  margin-top: 4px;
  font-style: italic;
}

/* Skills Section */
.skills-section {
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
  list-style: none;
}

.skill-item {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #1e40af;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 10pt;
  font-weight: 600;
  text-align: center;
  border: 1px solid #93c5fd;
  transition: transform 0.2s, box-shadow 0.2s;
}

.skill-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Awards Section */
.awards-list {
  list-style: none;
  padding: 0;
}

.award-item {
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
  position: relative;
  padding-left: 20px;
}

.award-item:last-child {
  border-bottom: none;
}

.award-item::before {
  content: '🏆';
  position: absolute;
  left: 0;
  top: 8px;
  font-size: 12pt;
}

.award-text {
  font-size: 11pt;
  color: #374151;
  font-weight: 500;
}

/* Print Styles */
@media print {
  body {
    margin: 0;
    padding: 0;
    background: white;
  }

  .resume-container {
    max-width: 100%;
    box-shadow: none;
    border: none;
    padding: 0.5in;
  }

  .experience-entry,
  .education-entry {
    break-inside: avoid;
  }

  .contact-link {
    color: #000000 !important;
    text-decoration: none !important;
  }
}

/* Mobile Styles */
@media screen and (max-width: 768px) {
  .resume-container {
    padding: 0.5in;
  }

  .resume-name {
    font-size: 24pt;
  }

  .contact-section {
    flex-direction: column;
    gap: 8px;
  }

  .experience-header,
  .education-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .skills-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
}
  `;

  const expHtml = data.experience.map(e => `
    <div class="experience-entry">
      <div class="experience-header">
        <div>
          <h3 class="experience-title">${e.title}</h3>
          <div class="experience-company">${e.company || ''}</div>
        </div>
        <div class="experience-date">${e.date || ''}</div>
      </div>
      ${e.bullets.length > 0 ? `<ul class="experience-bullets">${e.bullets.map(b => `<li>${b}</li>`).join('')}</ul>` : ''}
    </div>
  `).join('');

  const eduHtml = data.education.map(e => `
    <div class="education-entry">
      <div class="education-header">
        <div>
          <h4 class="education-degree">${e.degree}</h4>
          <div class="education-school">${e.school || ''}</div>
        </div>
        <div class="education-date">${e.date || ''}</div>
      </div>
      ${e.details ? `<div class="education-details">${e.details}</div>` : ''}
    </div>
  `).join('');

  const skillsHtml = data.skills.length > 0 ? data.skills.map(s => `<li class="skill-item">${s}</li>`).join('') : '<li class="skill-item" style="color: #999;">No technical skills provided</li>';
  const awardsHtml = data.awards.length > 0 ? data.awards.map(a => `<li class="award-item"><span class="award-text">${a}</span></li>`).join('') : '<li class="award-item"><span class="award-text" style="color: #999;">No honors or certifications provided</span></li>';

  const contactLinks = [];
  if (data.email) contactLinks.push(`<a href="mailto:${data.email}">${data.email}</a>`);
  if (data.phone) contactLinks.push(`<a>${data.phone}</a>`);
  if (data.linkedin) contactLinks.push(`<a href="${data.linkedin}" target="_blank">LinkedIn</a>`);
  if (data.github) contactLinks.push(`<a href="${data.github}" target="_blank">GitHub</a>`);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${data.name || 'Professional Resume'} - Resume</title>
  <style>${css}</style>
</head>
<body>
  <div class="resume-container">
    <div class="resume-body">
      <aside class="sidebar">
        <div class="profile-block">
          <div class="avatar">${(data.name || 'A').charAt(0)}</div>
          <h3>${data.name || 'Your Name'}</h3>
          <p>${data.title || 'Engineering Professional'}</p>
        </div>

        ${data.location ? `<div><h4 class="mini-title">Location</h4><p>${data.location}</p></div>` : ''}
        ${data.phone ? `<div><h4 class="mini-title">Phone</h4><p>${data.phone}</p></div>` : ''}
        ${data.email ? `<div><h4 class="mini-title">Email</h4><p><a href="mailto:${data.email}">${data.email}</a></p></div>` : ''}
        ${data.linkedin ? `<div><h4 class="mini-title">LinkedIn</h4><p><a href="${data.linkedin}" target="_blank">${data.linkedin}</a></p></div>` : ''}
        ${data.github ? `<div><h4 class="mini-title">GitHub</h4><p><a href="${data.github}" target="_blank">${data.github}</a></p></div>` : ''}

        ${data.summary ? `<div class="mini-title">Objective</div><div class="objective-box">${data.summary}</div>` : ''}

        ${data.skills.length > 0 ? `<div class="mini-title">Skills</div><ul class="skills-grid">${skillsHtml}</ul>` : ''}
        ${data.awards.length > 0 ? `<div class="mini-title">Awards</div><ul class="awards-list">${awardsHtml}</ul>` : ''}
      </aside>

      <main class="main-content">
        ${data.experience.length > 0 ? `<div class="section"><h2 class="section-title">Experience</h2><div class="timeline">${expHtml}</div></div>` : ''}

        ${data.education.length > 0 ? `<div class="section"><h2 class="section-title">Education</h2><div class="timeline">${eduHtml}</div></div>` : ''}
      </main>
    </div>
  </div>
</body>
</html>`;
}

function installImportHandler() {
  const button = getElement('importBtn');
  const input = getElement('resumeInput');
  const status = getElement('importStatus');

  button.addEventListener('click', () => {
    const raw = input.value.trim();
    if (!raw) {
      status.innerText = 'Please paste your resume text first.';
      return;
    }
    status.innerText = 'Parsing resume...';
    currentData = parseResumeText(raw);
    showPreview();
    status.innerText = 'Resume parsed! Your website is ready below.';
  });
}

async function extractTextFromPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    text += pageText + '\n';
  }
  return text;
}

async function extractTextFromDocx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function extractTextFromFile(file) {
  const fileName = file.name.toLowerCase();
  
  // Detect file type by extension
  if (fileName.endsWith('.pdf')) {
    return await extractTextFromPdf(file);
  } else if (fileName.endsWith('.docx')) {
    return await extractTextFromDocx(file);
  } else if (fileName.endsWith('.doc')) {
    // For older .doc files, try DOCX first (some work), otherwise ask user
    try {
      return await extractTextFromDocx(file);
    } catch (e) {
      throw new Error('.doc files are not fully supported. Please convert to .docx or paste text manually.');
    }
  } else if (fileName.endsWith('.txt')) {
    // Plain text file
    return await file.text();
  } else {
    // Try to read as plain text (works for .md, .odt as text, etc.)
    try {
      return await file.text();
    } catch (e) {
      throw new Error(`File type .${fileName.split('.').pop()} is not supported. Try PDF, DOCX, TXT, or paste text directly.`);
    }
  }
}

function installFileHandler() {
  const fileInput = getElement('resumeFile');
  const importBtn = getElement('importFileBtn');
  const status = getElement('fileStatus');

  importBtn.addEventListener('click', async () => {
    const file = fileInput.files?.[0];
    if (!file) {
      status.innerText = 'Please select a file first.';
      return;
    }
    
    status.innerText = `Reading ${file.name}...`;
    try {
      const text = await extractTextFromFile(file);
      getElement('resumeInput').value = text;
      currentData = parseResumeText(text);
      showPreview();
      status.innerText = `${file.name} imported successfully!`;
    } catch (error) {
      status.innerText = `Error: ${error.message}`;
    }
  });
}

function showPreview() {
  if (!currentData) return;
  
  const previewSection = getElement('previewSection');
  const previewFrame = getElement('previewFrame');
  const html = generatePortfolioHTML(currentData);
  
  previewFrame.srcdoc = html;
  previewSection.style.display = 'block';
  previewSection.scrollIntoView({ behavior: 'smooth' });
}

function installDownloadHandler() {
  const downloadBtn = getElement('downloadBtn');
  const status = getElement('downloadStatus');

  downloadBtn.addEventListener('click', () => {
    if (!currentData) {
      status.innerText = 'No website generated yet.';
      return;
    }
    
    const html = generatePortfolioHTML(currentData);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(currentData.name || 'resume').replace(/\s+/g, '-').toLowerCase()}-portfolio.html`;
    link.click();
    URL.revokeObjectURL(url);
    
    status.innerText = 'Downloaded! Open the HTML file in your browser to view.';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  installImportHandler();
  installFileHandler();
  installDownloadHandler();
});

