# Resume to Website Converter

Convert any resume into a professional, shareable portfolio website in seconds.

## Features

- ✅ **Paste or Upload** — Text or PDF resume
- ✅ **Auto-Parse** — Extracts name, contact, experience, education, skills, awards
- ✅ **Instant Preview** — See your website live in the browser
- ✅ **Download HTML** — Get a standalone, shareable HTML file
- ✅ **Responsive Design** — Works perfectly on all devices
- ✅ **Professional Theme** — Modern dark/blue portfolio look

## How to Use

1. **Paste Resume Text**
   - Copy your resume text and paste into the textarea
   - Click "Generate My Website"

2. **Or Upload PDF**
   - Select your resume PDF file
   - Click "Import PDF"

3. **Preview**
   - See your website instantly in the preview

4. **Download**
   - Click "Download as HTML"
   - Save and share the file

## Deploy

### GitHub Pages
1. Fork this repo or create your own
2. Push this code to GitHub
3. Settings → Pages → Source: `master` + `/ (root)`
4. Share the public URL: `https://yourusername.github.io/resume-website/`

### Or Host Elsewhere
- Download the generated HTML
- Upload to any static hosting (Netlify, Vercel, etc.)

## Local Testing

```bash
python -m http.server 8000
```

Visit `http://localhost:8000`

## Files

- `index.html` — Main converter UI
- `styles.css` — Theme styling
- `script.js` — Resume parser & HTML generator
- `README.md` — This file

## Customization

Edit `styles.css` to change colors, fonts, layout. The parser in `script.js` handles most resume formats automatically.
