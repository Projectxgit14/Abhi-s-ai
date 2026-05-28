# Abhi's AI

A small, deployable personal AI agent for your portfolio. It answers questions about you, your projects, your skills, your resume pitch, and your contact links from a structured knowledge file.

## Why This Is Resume-Worthy

- Interactive portfolio instead of a static resume page.
- No API key required for the public demo.
- Works on GitHub Pages, Netlify, and Vercel.
- Easy to customize by editing one file: `data/profile.js`.
- Designed so it can later be upgraded with OpenAI, embeddings, voice, analytics, or a resume parser.

## Quick Start

Open `index.html` in your browser.

To customize the agent, edit:

```text
data/profile.js
```

Replace the placeholder email, GitHub, LinkedIn, skills, projects, and summary with your real information.

## Deploy On GitHub Pages

1. Create a new GitHub repository.
2. Upload these files to the repository root.
3. Go to `Settings > Pages`.
4. Under `Build and deployment`, choose `Deploy from a branch`.
5. Select the `main` branch and `/root`.
6. Save, then use the Pages URL in your resume.

## Make It More Unique

- Add your real project screenshots inside an `assets/` folder and show them in the UI.
- Add a "proof mode" that links each answer to a GitHub repo, certificate, or live demo.
- Add voice input and speech output.
- Add a downloadable resume button.
- Add analytics to see what recruiters ask most.
- Add a serverless OpenAI backend later so the answers become more conversational without exposing your API key.
- Add a small evaluation file with example questions and expected answers.

See `GITHUB_GROWTH.md` for a practical plan to make the repository more polished and shareable.

## Suggested GitHub Topics

```text
ai-agent
portfolio
personal-ai
resume-project
javascript
github-pages
frontend
chatbot
```

## Resume Bullet

Built and deployed a personal AI portfolio agent with grounded retrieval, structured profile data, and a recruiter-friendly chat interface.
