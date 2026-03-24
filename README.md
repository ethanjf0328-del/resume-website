# Resume Portfolio Website

A simple static resume website scaffold. Edit `index.html` with your details, and deploy via GitHub Pages, Netlify, or any static hosting.

## Files
- `index.html` — main resume content.
- `styles.css` — layout and style.
- `script.js` — optional interactivity.

## Customize
1. Replace placeholder text (`Your Name`, `Your Job Title`, etc.) in `index.html`.
2. Add more `.entry` blocks in `Work Experience`, `Education`, and `Projects`.
3. Update contact links.

## Run locally
Open `index.html` in the browser or use a local server:

```bash
python -m http.server 8000
```

Then visit http://localhost:8000.

## Import options
1. Paste full resume text into the import box and click `Import`.
2. Or use `Import from PDF` to upload a PDF; the script uses PDF.js to extract text, then parses and fills the page.

## Deploy to the web for public access
### GitHub Pages
1. Create a GitHub repo and push this folder to the repo.
2. In repo settings, enable GitHub Pages on `main` / `gh-pages` branch, root folder.
3. Wait a few min and visit `https://<your-user>.github.io/<repo-name>/`.

### Netlify
1. Drag & drop this folder to https://app.netlify.com/drop.
2. Get a public URL instantly.

### Vercel
1. `vercel` CLI or web import from GitHub.
2. Choose static deploy.

Once deployed, anyone can visit your link in Chrome/Edge/Firefox.
