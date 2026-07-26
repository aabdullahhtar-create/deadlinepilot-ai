# DeadlinePilot AI — Final Deployment Checklist

Complete these account-specific steps before submitting the project.

## 1. Add the project to GitHub

1. Create a new GitHub repository named `deadlinepilot-ai`.
2. Set the repository visibility to **Public**.
3. Extract the supplied project ZIP.
4. Open a terminal inside the extracted folder.
5. Run:

```bash
git init
git add .
git commit -m "Build DeadlinePilot AI final project"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/deadlinepilot-ai.git
git push -u origin main
```

## 2. Create a Gemini API key

1. Open Google AI Studio.
2. Create a Gemini API key.
3. Never paste the key into a source-code file.
4. Do not commit `.env.local`.

For local testing, create `.env.local`:

```env
GEMINI_API_KEY=your_real_key_here
GEMINI_MODEL=gemini-2.5-flash
```

## 3. Test locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and test:

- Load the sample brief.
- Generate an AI execution plan.
- Mark several tasks complete.
- Generate the README.
- Run the submission audit.
- Refresh the page and confirm progress remains saved.

Then test the production build:

```bash
npm run build
npm start
```

## 4. Deploy to Vercel

1. Sign in to Vercel using GitHub.
2. Select **Add New → Project**.
3. Import the public `deadlinepilot-ai` repository.
4. Keep the detected framework as **Next.js**.
5. Open **Environment Variables** and add:
   - `GEMINI_API_KEY` = your real key
   - `GEMINI_MODEL` = `gemini-2.5-flash`
6. Select **Deploy**.
7. Open the deployed URL and run the full workflow.

## 5. Update the README links

Replace these placeholders in `README.md`:

- `https://YOUR-VERCEL-URL.vercel.app`
- `https://github.com/YOUR-USERNAME/deadlinepilot-ai`

Commit and push the updated README:

```bash
git add README.md
git commit -m "Add final live and repository links"
git push
```

Vercel will redeploy automatically.

## 6. Final incognito test

Open a private/incognito browser window and verify:

- The GitHub repository opens without login.
- The Vercel application opens without login.
- The sample brief generates a plan.
- The screenshots display inside the README.
- The README contains the live URL, features, AI prompt, stack, setup, and screenshots.
- No `.env.local` or API key appears in the repository.

## 7. Submit

Submit **only** the public GitHub repository URL on the assignment portal.
