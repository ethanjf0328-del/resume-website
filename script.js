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
* { box-sizing: border-box; }
html { 
  scroll-behavior: smooth;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
body {
  margin: 0;
  padding: 20px;
  font-family: "Calibri", "Segoe UI", "Trebuchet MS", sans-serif;
  background: #ffffff;
  color: #000000;
  line-height: 1.6;
  font-size: 11pt;
}
.resume-container {
  max-width: 8.5in;
  margin: 0 auto;
  background: white;
  padding: 0.75in;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
}
.resume-header {
  text-align: center;
  border-bottom: 2px solid #0066cc;
  padding-bottom: 12px;
  margin-bottom: 12px;
}
.resume-header h1 {
  margin: 0;
  font-size: 16pt;
  font-weight: bold;
  color: #000000;
  letter-spacing: 0.5px;
}
.resume-header p {
  margin: 4px 0;
  font-size: 11pt;
  color: #333333;
  font-weight: 500;
}
.contact-info {
  text-align: center;
  font-size: 10pt;
  margin: 6px 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}
.contact-info a {
  color: #0066cc;
  text-decoration: none;
  word-break: break-word;
}
.contact-info a:hover { text-decoration: underline; }
.section {
  margin-bottom: 12px;
}
.section-title {
  font-size: 12pt;
  font-weight: bold;
  color: #000000;
  border-bottom: 1px solid #0066cc;
  padding-bottom: 2px;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.entry {
  margin-bottom: 8px;
  page-break-inside: avoid;
}
.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 2px;
}
.entry-title {
  font-weight: bold;
  color: #000000;
  margin: 0;
  font-size: 11pt;
}
.entry-subtitle {
  color: #0066cc;
  font-style: italic;
  font-size: 11pt;
  margin: 2px 0;
  font-weight: 500;
}
.entry-date {
  color: #555555;
  font-size: 10pt;
  margin: 0;
  font-weight: 500;
}
.entry ul {
  margin: 4px 0;
  padding-left: 20px;
  list-style-type: disc;
}
.entry li {
  margin: 2px 0;
  color: #333333;
  font-size: 11pt;
}
.entry p {
  margin: 3px 0;
  color: #333333;
  font-size: 11pt;
}
.summary-section {
  margin-bottom: 12px;
  color: #333333;
  font-size: 11pt;
  line-height: 1.5;
}
.skills-container {
  margin-top: 4px;
}
.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  list-style: none;
  padding: 0;
  margin: 4px 0;
}
.skills-list li {
  background: #f0f7ff;
  color: #0066cc;
  padding: 3px 8px;
  border-radius: 3px;
  font-size: 10pt;
  font-weight: 500;
  border: 1px solid #b3d9ff;
}
.awards-container {
  margin-top: 4px;
}
.award-item {
  padding: 4px 0;
  color: #333333;
  font-size: 11pt;
  margin: 2px 0;
  border-left: 3px solid #0066cc;
  padding-left: 8px;
}
@media print {
  body {
    margin: 0;
    padding: 0;
  }
  .resume-container {
    max-width: 100%;
    box-shadow: none;
    padding: 0.75in;
  }
}
@media screen and (max-width: 800px) {
  .resume-container {
    padding: 0.5in;
  }
  .contact-info {
    flex-direction: column;
    gap: 4px;
  }
}
  `;

  const expHtml = data.experience.map(e => `
    <div class="entry">
      <div class="entry-header">
        <strong class="entry-title">${e.title}${e.company ? ', ' + e.company : ''}</strong>
        <span class="entry-date">${e.date || ''}</span>
      </div>
      ${e.bullets.length > 0 ? `<ul>${e.bullets.map(b => `<li>${b}</li>`).join('')}</ul>` : ''}
    </div>
  `).join('');

  const eduHtml = data.education.map(e => `
    <div class="entry">
      <div class="entry-header">
        <strong class="entry-title">${e.degree}${e.school ? ', ' + e.school : ''}</strong>
        <span class="entry-date">${e.date || ''}</span>
      </div>
      ${e.details ? `<p>${e.details}</p>` : ''}
    </div>
  `).join('');

  const skillsHtml = data.skills.length > 0 ? data.skills.map(s => `<li>${s}</li>`).join('') : '<li style="color: #999;">No technical skills provided</li>';
  const awardsHtml = data.awards.length > 0 ? data.awards.map(a => `<div class="award-item">${a}</div>`).join('') : '<div class="award-item" style="color: #999;">No honors or certifications provided</div>';

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
    <div class="resume-header">
      <h1>${data.name || 'Your Name'}</h1>
      <p>${data.title || 'Engineering Professional'}</p>
      ${data.location ? `<p style="margin: 4px 0; color: #555555;">${data.location}</p>` : ''}
      <div class="contact-info">
        ${data.email ? `<a href="mailto:${data.email}">${data.email}</a>` : ''}
        ${data.phone ? `<span>${data.phone}</span>` : ''}
        ${data.linkedin ? `<a href="${data.linkedin}" target="_blank">LinkedIn</a>` : ''}
        ${data.github ? `<a href="${data.github}" target="_blank">GitHub</a>` : ''}
      </div>
    </div>

    ${data.summary ? `<div class="section">
      <div class="section-title">Professional Summary</div>
      <p class="summary-section">${data.summary}</p>
    </div>` : ''}

    ${data.experience.length > 0 ? `<div class="section">
      <div class="section-title">Work Experience</div>
      ${expHtml}
    </div>` : ''}

    ${data.education.length > 0 ? `<div class="section">
      <div class="section-title">Education</div>
      ${eduHtml}
    </div>` : ''}

    ${data.skills.length > 0 ? `<div class="section">
      <div class="section-title">Technical Skills</div>
      <div class="skills-container">
        <ul class="skills-list">${skillsHtml}</ul>
      </div>
    </div>` : ''}

    ${data.awards.length > 0 ? `<div class="section">
      <div class="section-title">Honors & Certifications</div>
      <div class="awards-container">
        ${awardsHtml}
      </div>
    </div>` : ''}
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

