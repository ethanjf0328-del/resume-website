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
  background: #f7f9fb;
  margin: 0;
  padding: 20px;
}

.resume-container {
  max-width: 8.5in;
  margin: 0 auto;
  background: #ffffff;
  padding: 24px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.1);
  border: 1px solid #e5e7eb;
}

.page {
  page-break-after: always;
  margin-bottom: 20px;
}

.page:last-child {
  page-break-after: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  border-bottom: 2px solid #dbeafe;
  padding-bottom: 10px;
  margin-bottom: 18px;
}

.page-title {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #1f2937;
}

.page-subtitle {
  font-size: 12pt;
  color: #2563eb;
  font-weight: 600;
  margin-top: 4px;
}

.page-meta {
  text-align: right;
  font-size: 10pt;
  color: #6b7280;
}

.page-meta span {
  display: block;
}

.section {
  margin-bottom: 18px;
}

.section-title {
  font-size: 13pt;
  font-weight: 700;
  color: #1f2937;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 10px;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 6px;
}

.description {
  font-size: 11pt;
  color: #374151;
  line-height: 1.7;
}

.timeline {
  position: relative;
  margin-left: 14px;
  padding-left: 12px;
  border-left: 2px solid #dbeafe;
}

.timeline-item {
  margin-bottom: 16px;
  position: relative;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #2563eb;
}

.item-title {
  font-weight: 700;
  color: #1d4ed8;
  margin-bottom: 2px;
}

.item-meta {
  color: #6b7280;
  font-size: 10pt;
  margin-bottom: 8px;
}

.item-bullets {
  margin: 0;
  padding-left: 16px;
  list-style: disc;
}

.item-bullets li {
  margin-bottom: 6px;
  color: #374151;
}

.skills-list,
.awards-list,
.languages-list {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
}

.skills-list li,
.awards-list li,
.languages-list li {
  background: #eff6ff;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 10.5pt;
  font-weight: 600;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.footer {
  font-size: 9.5pt;
  color: #6b7280;
  text-align: right;
  margin-top: 15px;
}

@media screen and (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-meta {
    text-align: left;
  }
}
`;

  // If name parse got polluted with long text, fallback to first 2 words
  let name = data.name || 'Your Name';
  if (name.split(' ').length > 8) {
    name = (name.split(' ').slice(0, 2).join(' ') || 'Your Name');
  }

  const surname = data.title || 'Engineering Professional';

  const experienceItems = data.experience.map((e) => `
    <div class="timeline-item">
      <div class="item-title">${e.title || 'Role'}</div>
      <p class="item-meta">${e.company || ''}${e.company ? ' | ' : ''}${e.date || ''}</p>
      ${e.bullets.length > 0 ? `<ul class="item-bullets">${e.bullets.map(b => `<li>${b}</li>`).join('')}</ul>` : ''}
    </div>
  `).join('');

  const educationItems = data.education.map((e) => `
    <div class="timeline-item">
      <div class="item-title">${e.degree || 'Education'}</div>
      <p class="item-meta">${e.school || ''}${e.school ? ' | ' : ''}${e.date || ''}</p>
      ${e.details ? `<p class="description">${e.details}</p>` : ''}
    </div>
  `).join('');

  const skillsHTML = data.skills.length ? `<ul class="skills-list">${data.skills.map(s => `<li>${s}</li>`).join('')}</ul>` : `<p class="description">Not provided.</p>`;
  const awardsHTML = data.awards.length ? `<ul class="awards-list">${data.awards.map(a => `<li>${a}</li>`).join('')}</ul>` : `<p class="description">None listed.</p>`;

  const languages = data.languages?.length ? `<ul class="languages-list">${data.languages.map(l => `<li>${l}</li>`).join('')}</ul>` : '';

  // Page splitting by length driven by data size
  const summaryPage = `
    <section class="section">
      <h3 class="section-title">Objective</h3>
      <p class="description">${data.summary || 'Resume summary is not provided.'}</p>
    </section>
  `;

  const expSplit = Math.ceil((data.experience.length || 0) / 5) || 1;
  const experiencePages = [];
  for (let i = 0; i < expSplit; i++) {
    const chunk = data.experience.slice(i * 5, i * 5 + 5);
    const chunkHtml = chunk.map(e => `
      <div class="timeline-item">
        <div class="item-title">${e.title || 'Role'}</div>
        <p class="item-meta">${e.company || ''}${e.company ? ' | ' : ''}${e.date || ''}</p>
        ${e.bullets.length > 0 ? `<ul class="item-bullets">${e.bullets.map(b => `<li>${b}</li>`).join('')}</ul>` : ''}
      </div>
    `).join('');
    experiencePages.push(chunkHtml);
  }

  const pages = [];

  // always first page includes objective + 2 experience entries at least
  const firstPageExperience = experiencePages[0] || '';
  pages.push(`
    <div class="page">
      <div class="page-header">
        <div>
          <div class="page-title">${name}</div>
          <div class="page-subtitle">${surname}</div>
        </div>
        <div class="page-meta">
          ${data.location ? `<span>${data.location}</span>` : ''}
          ${data.email ? `<span>${data.email}</span>` : ''}
          ${data.phone ? `<span>${data.phone}</span>` : ''}
        </div>
      </div>

      ${summaryPage}
      <section class="section">
        <h3 class="section-title">Work Experience</h3>
        <div class="timeline">${firstPageExperience}</div>
      </section>

      <section class="section">
        <h3 class="section-title">Skills</h3>
        ${skillsHTML}
      </section>

      <div class="footer">Page 1</div>
    </div>
  `);

  // additional experience pages
  for (let i = 1; i < experiencePages.length; i++) {
    pages.push(`
      <div class="page">
        <div class="page-header">
          <div>
            <div class="page-title">${name}</div>
            <div class="page-subtitle">${surname}</div>
          </div>
          <div class="page-meta">${data.location ? `<span>${data.location}</span>` : ''}</div>
        </div>

        <section class="section">
          <h3 class="section-title">Work Experience (cont.)</h3>
          <div class="timeline">${experiencePages[i]}</div>
        </section>

        <div class="footer">Page ${i + 1}</div>
      </div>
    `);
  }

  // last page: education + awards + languages
  pages.push(`
    <div class="page">
      <div class="page-header">
        <div>
          <div class="page-title">${name}</div>
          <div class="page-subtitle">${surname}</div>
        </div>
        <div class="page-meta">${data.location ? `<span>${data.location}</span>` : ''}</div>
      </div>

      <section class="section">
        <h3 class="section-title">Education</h3>
        <div class="timeline">${educationItems || '<p class="description">No education details yet.</p>'}</div>
      </section>

      <section class="section">
        <h3 class="section-title">Awards & Certifications</h3>
        ${awardsHTML}
      </section>

      ${languages ? `<section class="section"><h3 class="section-title">Languages</h3>${languages}</section>` : ''}

      <div class="footer">Page ${pages.length + 1}</div>
    </div>
  `);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name} | ${surname}</title>
  <style>${css}</style>
</head>
<body>
  <div class="resume-container">
    ${pages.join('')}
  </div>
</body>
</html>`;
}

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

