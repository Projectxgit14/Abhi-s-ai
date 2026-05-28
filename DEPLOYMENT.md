# Deployment Guide

## Best First Option: GitHub Pages

Use GitHub Pages first because this project is static and does not need a backend.

1. Push the project to GitHub.
2. Open the repository settings.
3. Go to `Pages`.
4. Select `Deploy from a branch`.
5. Choose `main` and `/root`.
6. Wait for GitHub to publish the live URL.

## Better Later: Vercel Or Netlify

Use Vercel or Netlify if you add:

- OpenAI API calls
- Serverless functions
- Authentication
- Analytics
- Contact forms
- Database storage

## Do Not Put API Keys In Frontend Code

If you upgrade this to a real LLM-backed agent, keep the API key on the server. Browser JavaScript is public, so any key placed in `app.js` can be copied by visitors.

## Upgrade Architecture

```text
Visitor -> Portfolio UI -> Serverless API -> LLM provider
                              |
                              -> profile knowledge base
```

This keeps the public website fast while protecting private secrets.
