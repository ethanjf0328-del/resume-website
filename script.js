// Auto-fill resume fields from paste text input.

function getElement(id) {
  return document.getElementById(id);
}

function setHtml(id, html) {
  const el = getElement(id);
  if (el) el.innerHTML = html;
}

function createWorkEntry(item) {
  return `
    <div class="entry">
      <h3>${item.title} — ${item.company}</h3>
      <p class="date">${item.date}</p>
      <ul>${item.points.map(p => `<li>${p}</li>`).join('')}</ul>
    </div>`;
}

function createEducationEntry(item) {
  return `
    <div class="entry">
      <h3>${item.degree} — ${item.institution}</h3>
      <p class="date">${item.date}</p>
      <p>${item.details}</p>
    </div>`;
}

function parseResumeText(raw) {
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const parsed = {
    name: '', title: '', email: '', linkedin: '', github: '', summary: '', experience: [], education: [], skills: [], projects: []
  };

  let section = 'header';
  let temp = [];

  const toLower = (value) => value.toLowerCase();

  const tryAddSection = (header) => {
    const label = header.toLowerCase();
    if (label.includes('summary') || label.includes('professional summary')) return 'summary';
    if (label.includes('experience') || label.includes('work')) return 'experience';
    if (label.includes('education')) return 'education';
    if (label.includes('skill')) return 'skills';
    if (label.includes('project')) return 'projects';
    return null;
  };

  let currentSubsection = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!parsed.name && i === 0) parsed.name = line;
    if (!parsed.title && i === 1) parsed.title = line;

    const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) parsed.email = emailMatch[0];

    if (!parsed.linkedin && /linkedin\.com\/\S+/i.test(line)) parsed.linkedin = line.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/\S+/i)[0];
    if (!parsed.github && /github\.com\/\S+/i.test(line)) parsed.github = line.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/\S+/i)[0];

    const sectionKey = tryAddSection(line);
    if (sectionKey) {
      section = sectionKey;
      continue;
    }

    if (section === 'header') continue;

    if (section === 'summary' && !line.match(/^\d|\-|\*|•/)) {
      parsed.summary += (parsed.summary ? ' ' : '') + line;
      continue;
    }

    if (section === 'experience') {
      if (/^[-*•]/.test(line)) {
        const text = line.replace(/^[-*•]+\s*/, '');
        if (!currentSubsection || currentSubsection.type !== 'experience') {
          currentSubsection = { type: 'experience', title: text, company: '', date: '', points: [] };
          parsed.experience.push(currentSubsection);
        } else {
          currentSubsection.points.push(text);
        }
      } else if (/\d{4}/.test(line) && parsed.experience.length > 0) {
        const last = parsed.experience[parsed.experience.length - 1];
        last.date = line;
      } else if (parsed.experience.length > 0) {
        const parts = line.split(/\s[-@|]\s/).map(p => p.trim());
        const last = parsed.experience[parsed.experience.length - 1];
        if (parts.length >= 2) {
          last.title = parts[0];
          last.company = parts[1];
        } else {
          if (!last.company) last.company = line;
          else last.points.push(line);
        }
      }
      continue;
    }

    if (section === 'education') {
      if (/^[-*•]/.test(line)) {
        const text = line.replace(/^[-*•]+\s*/, '');
        parsed.education.push({ degree: text, institution: '', date: '', details: '' });
      } else if (parsed.education.length > 0) {
        const last = parsed.education[parsed.education.length - 1];
        if (!last.institution) {
          last.institution = line;
        } else if (!last.date && /\d{4}/.test(line)) {
          last.date = line;
        } else {
          last.details += (last.details ? ' ' : '') + line;
        }
      }
      continue;
    }

    if (section === 'skills') {
      const candidates = line.split(/[,;\|\u2022]/).map(s => s.trim()).filter(Boolean);
      parsed.skills.push(...candidates);
      continue;
    }

    if (section === 'projects') {
      if (/^[-*•]/.test(line)) {
        const text = line.replace(/^[-*•]+\s*/, '');
        parsed.projects.push({ name: text, description: '', links: '' });
      } else if (parsed.projects.length > 0) {
        const last = parsed.projects[parsed.projects.length - 1];
        last.description += (last.description ? ' ' : '') + line;
      }
      continue;
    }
  }

  return parsed;
}

function applyToPage(data) {
  if (data.name) getElement('name').innerText = data.name;
  if (data.title) getElement('title').innerText = data.title;
  if (data.email) {
    const e = getElement('email');
    e.innerText = data.email;
    e.href = `mailto:${data.email}`;
  }
  if (data.linkedin) {
    const e = getElement('linkedin');
    e.innerText = data.linkedin;
    e.href = data.linkedin;
  }
  if (data.github) {
    let gh = getElement('github');
    if (!gh) {
      gh = document.createElement('a');
      gh.id = 'github';
      gh.target = '_blank';
      document.querySelector('.contact').appendChild(gh);
    }
    gh.innerText = data.github;
    gh.href = data.github;
  }

  setHtml('summary', `<h2>Professional Summary</h2><p>${data.summary || 'No summary found in text.'}</p>`);

  const expHtml = data.experience.length > 0 ? data.experience.map(createWorkEntry).join('') : '<p>No experience parsed automatically.</p>';
  setHtml('experience', `<h2>Work Experience</h2>${expHtml}`);

  const eduHtml = data.education.length > 0 ? data.education.map(createEducationEntry).join('') : '<p>No education parsed automatically.</p>';
  setHtml('education', `<h2>Education</h2>${eduHtml}`);

  const skillsHtml = data.skills.length > 0 ? data.skills.map(s => `<li>${s}</li>`).join('') : '<li>No skills parsed automatically.</li>';
  setHtml('skills', `<h2>Skills</h2><ul class="skills-grid">${skillsHtml}</ul>`);

  const projectHtml = data.projects.length > 0 ? data.projects.map(p => `
      <div class="entry">
        <h3>${p.name}</h3>
        <p>${p.description}</p>
      </div>`).join('') : '<p>No projects parsed automatically.</p>';
  setHtml('projects', `<h2>Projects</h2>${projectHtml}`);
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
    const parsed = parseResumeText(raw);
    applyToPage(parsed);
    status.innerText = 'Imported successfully. Review content and adjust manually as needed.';
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

function installPdfHandler() {
  const pdfInput = getElement('resumePdf');
  const importBtn = getElement('importPdfBtn');
  const status = getElement('pdfStatus');

  importBtn.addEventListener('click', async () => {
    const file = pdfInput.files?.[0];
    if (!file) {
      status.innerText = 'Please select a PDF file first.';
      return;
    }
    status.innerText = 'Reading PDF…';
    try {
      const text = await extractTextFromPdf(file);
      getElement('resumeInput').value = text;
      const parsed = parseResumeText(text);
      applyToPage(parsed);
      status.innerText = 'PDF imported successfully (text extracted, go verify).';
    } catch (error) {
      console.error(error);
      status.innerText = 'PDF import failed. It may be a complex layout PDF. Please paste text manually.';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  installImportHandler();
  installPdfHandler();
});

