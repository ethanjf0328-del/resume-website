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
  --bg: #0b1220;
  --card: #111d32;
  --text: #e9eef8;
  --muted: #94a7c2;
  --accent: #42b3ff;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  background: linear-gradient(160deg, #0f1730, #070a13);
  color: var(--text);
  line-height: 1.6;
}
.container { width: min(1100px, 95%); margin: 0 auto; }
.site-header {
  background: rgba(11, 18, 32, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 2rem 0;
  margin-bottom: 1.2rem;
}
.site-header h1 { margin: 0; font-size: 2.2rem; }
.site-header p { margin: .4rem 0; color: var(--muted); }
.contact { display: flex; flex-wrap: wrap; gap: .75rem; }
.contact a { color: var(--accent); text-decoration: none; font-weight: 600; font-size: 0.9rem; }
.card { background: var(--card); border: 1px solid rgba(255,255,255,0.09); border-radius: 10px; padding: 1.2rem; margin-bottom: 1rem; }
.card h2 { margin-top: 0; font-size: 1.35rem; border-left: 4px solid var(--accent); padding-left: 0.75rem; }
.entry { margin-top: 0.8rem; }
.entry h3 { margin: .25rem 0; color: #d2dff5; }
.date { color: var(--muted); font-size: .93rem; margin: .1rem 0 .5rem; }
.entry ul { margin: 0.3rem 0; padding-left: 1.5rem; }
.entry li { margin: 0.2rem 0; }
.skills-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: .7rem; padding: 0; list-style: none; margin: 0; }
.skills-grid li { background: rgba(66, 179, 255, 0.14); border: 1px solid rgba(66, 179, 255, 0.25); padding: .5rem .6rem; border-radius: 6px; }
.site-footer { text-align: center; color: var(--muted); padding: 1rem 0; }
@media (max-width: 650px) {
  .site-header h1 { font-size: 1.5rem; }
  .site-header p { font-size: .9rem; }
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
  <title>${data.name || 'Resume'}</title>
  <style>${css}</style>
</head>
<body>
  <header class="site-header">
    <div class="container">
      <h1>${data.name || 'Your Name'}</h1>
      <p>${data.title || 'Professional'}</p>
      <div class="contact">
        ${contactLinks.join('')}
      </div>
      ${data.location ? `<p style="color:#94a7c2; margin-top:.65rem;">${data.location}</p>` : ''}
    </div>
  </header>

  <main class="container">
    ${data.summary ? `<section class="card">
      <h2>Professional Summary</h2>
      <p>${data.summary}</p>
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
      <h2>Skills</h2>
      <ul class="skills-grid">${skillsHtml}</ul>
    </section>` : ''}

    ${data.awards.length > 0 ? `<section class="card">
      <h2>Honors & Awards</h2>
      ${awardsHtml}
    </section>` : ''}
  </main>

  <footer class="site-footer">
    <div class="container">
      <p>Generated with Resume to Website Converter</p>
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

