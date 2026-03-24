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
:root {
  --bg: #f8f9fb;
  --surface: #ffffff;
  --text: #1a202c;
  --text-secondary: #718096;
  --border: #e2e8f0;
  --accent: #0066cc;
  --accent-light: #e8f4ff;
  --success: #22c55e;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.7;
}
.container { width: min(1200px, 96%); margin: 0 auto; }
.site-header {
  background: linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%);
  border-bottom: 1px solid var(--border);
  padding: 3rem 0;
  margin-bottom: 2rem;
}
.site-header h1 {
  margin: 0;
  font-size: 2.8rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.5px;
}
.site-header p {
  margin: 0.5rem 0 1.2rem;
  font-size: 1.1rem;
  color: var(--text-secondary);
  font-weight: 500;
}
.contact {
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem;
  margin-top: 1rem;
}
.contact a {
  color: var(--accent);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  transition: color 0.2s;
}
.contact a:hover { color: var(--accent); opacity: 0.8; }
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.8rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s;
}
.card:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
.card h2 {
  margin-top: 0;
  margin-bottom: 1.2rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.card h2::before {
  content: '';
  width: 4px;
  height: 1.5rem;
  background: var(--accent);
  border-radius: 2px;
}
.entry {
  margin-top: 1.2rem;
  padding-bottom: 1.2rem;
  border-bottom: 1px solid var(--border);
}
.entry:last-child { border-bottom: none; margin-bottom: 0; }
.entry h3 {
  margin: 0 0 0.3rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
}
.entry-subtitle {
  color: var(--accent);
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.3rem;
}
.date {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0.3rem 0 0.6rem;
  font-weight: 500;
}
.entry ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}
.entry li { margin: 0.35rem 0; color: var(--text); }
.entry p { margin: 0.3rem 0; color: var(--text-secondary); }
.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.8rem;
  padding: 0;
  list-style: none;
  margin: 0;
}
.skills-grid li {
  background: var(--accent-light);
  color: var(--accent);
  border: 1px solid #b3d9ff;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  text-align: center;
  transition: all 0.2s;
}
.skills-grid li:hover {
  background: var(--accent);
  color: white;
  transform: translateY(-2px);
}
.summary-text { color: var(--text-secondary); line-height: 1.8; }
.site-footer {
  text-align: center;
  color: var(--text-secondary);
  padding: 2rem 0;
  border-top: 1px solid var(--border);
  margin-top: 3rem;
  font-size: 0.9rem;
}
@media (max-width: 768px) {
  .site-header { padding: 2rem 0; margin-bottom: 1.5rem; }
  .site-header h1 { font-size: 2rem; }
  .site-header p { font-size: 1rem; }
  .contact { gap: 0.8rem; }
  .card { padding: 1.2rem; }
  .skills-grid { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); }
}
  `;

  const expHtml = data.experience.map(e => `
    <div class="entry">
      <h3>${e.title}${e.company ? ' — ' + e.company : ''}</h3>
      <p class="date">${e.date || ''}</p>
      ${e.bullets.length > 0 ? `<ul>${e.bullets.map(b => `<li>${b}</li>`).join('')}</ul>` : ''}
    </div>
  `).join('');

  const eduHtml = data.education.map(e => `
    <div class="entry">
      <h3>${e.degree}${e.school ? ' — ' + e.school : ''}</h3>
      <p class="date">${e.date || ''}</p>
      ${e.details ? `<p>${e.details}</p>` : ''}
    </div>
  `).join('');

  const skillsHtml = data.skills.length > 0 ? data.skills.map(s => `<li>${s}</li>`).join('') : '<li>No skills provided</li>';
  const awardsHtml = data.awards.length > 0 ? data.awards.map(a => `<p>${a}</p>`).join('') : '<p>No awards provided</p>';

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
  <title>${data.name || 'Professional Portfolio'}</title>
  <style>${css}</style>
</head>
<body>
  <header class="site-header">
    <div class="container">
      <h1>${data.name || 'Professional'}</h1>
      <p>${data.title || 'Engineering Professional'}</p>
      <div class="contact">
        ${contactLinks.join('')}
      </div>
      ${data.location ? `<p style="color: var(--text-secondary); margin-top: 1rem; font-weight: 500;">${data.location}</p>` : ''}
    </div>
  </header>

  <main class="container">
    ${data.summary ? `<section class="card">
      <h2>Professional Summary</h2>
      <p class="summary-text">${data.summary}</p>
    </section>` : ''}

    ${data.experience.length > 0 ? `<section class="card">
      <h2>Work Experience</h2>
      ${expHtml}
    </section>` : ''}

    ${data.education.length > 0 ? `<section class="card">
      <h2>Education</h2>
      ${eduHtml}
    </section>` : ''}

    ${data.skills.length > 0 ? `<section class="card">
      <h2>Technical Skills</h2>
      <ul class="skills-grid">${skillsHtml}</ul>
    </section>` : ''}

    ${data.awards.length > 0 ? `<section class="card">
      <h2>Honors & Certifications</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
        ${data.awards.map(a => `<div style="padding: 0.8rem; background: var(--accent-light); border-left: 4px solid var(--accent); border-radius: 6px;"><p style="margin: 0; color: var(--text); font-weight: 600;">${a}</p></div>`).join('')}
      </div>
    </section>` : ''}
  </main>

  <footer class="site-footer">
    <div class="container">
      <p>Professional Portfolio Generated with Resume to Website Converter</p>
    </div>
  </footer>
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

