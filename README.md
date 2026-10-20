# AI Transcription & Translation App

> Real-time multilingual speech-to-text, neural translation, and intelligent meeting summarization powered by OpenAI (Whisper & GPT-4o), with Microsoft Teams and Outlook calendar integration.

[![OpenAI](https://img.shields.io/badge/AI-OpenAI%20GPT--4o%20%26%20Whisper-00A67E?logo=openai&logoColor=white)](https://platform.openai.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styles-Tailwind%20CSS-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-000000?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Microsoft Teams](https://img.shields.io/badge/Integration-Microsoft%20Teams%20%26%20Outlook-0078D4?logo=microsoftteams&logoColor=white)](https://teams.microsoft.com/)
[![Netlify](https://img.shields.io/badge/Deploy-Netlify-00C7B7?logo=netlify&logoColor=white)](https://netlify.com/)

---

## 🌟 Key Features

- **OpenAI Speech-to-Text (Whisper)**: High-fidelity audio transcription verbatim across languages using `whisper-1`.
- **OpenAI Neural Translation & Intelligence (GPT-4o & GPT-4o-mini)**:
  - Lightning-fast real-time translation into Welsh (Cymraeg), English, French, Spanish, German, Hindi, and more.
  - Multi-speaker diarization matching participants by their real Name & Surname from the organizational directory.
- **Executive Summarization**: Automated extraction of concise executive overviews (TL;DR), key takeaways, decisions, and prioritized action items with assignees.
- **Microsoft Teams & Outlook Calendar Integration**:
  - Microsoft Teams Adaptive Card channel dispatching.
  - RFC 5545 `.ics` universal calendar file download for Microsoft Outlook and Exchange Online.
  - Direct attendee email invites and calendar holds.
- **Document & Subtitle Export**: One-click download as PDF, Word (.docx), Subtitles (.srt), and plain text (.txt).
- **Audio & Video Player**: Synchronized interactive transcript player with timestamp seeking and audio waveform visualizer.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20 LTS recommended)
- **npm** or **pnpm**
- **OpenAI API Key**: Obtain from [OpenAI Platform](https://platform.openai.com/api-keys)

### 2. Clone and Install

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY

# Install dependencies
npm install
```

### 3. Setup Environment Variables

Copy the example environment configuration:

```bash
cp .env.example .env
```

Open `.env` in your editor and insert your OpenAI API Key:

```env
OPENAI_API_KEY="sk-proj-YourOpenAiApiKeyHere"
```

*(Optional Microsoft Teams webhook URL can also be added for live channel notifications)*:

```env
TEAMS_WEBHOOK_URL="https://outlook.office.com/webhook/..."
```

### 4. Run Locally

Start the full-stack development server (Express backend + Vite frontend):

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🔑 How to Get Your OpenAI API Key

1. Go to the [OpenAI Platform](https://platform.openai.com/).
2. Sign in or create a developer account.
3. In the sidebar or dashboard, click **API Keys**.
4. Click **"+ Create new secret key"**.
5. Give it a descriptive name (e.g. `ai-transcription-app`) and copy the secret key (starting with `sk-proj-...`).
6. Paste it into your `.env` file as `OPENAI_API_KEY="your_key"`, or enter it directly in the in-app **Live OpenAI API Key Tester** in the **GitHub & OpenAI** tab!

---

## 🐙 Push to GitHub

The local Git repository is pre-initialized on branch `main` and all application files are committed.

To push to your personal or organization GitHub account:

### Step 1: Create a Repository on GitHub
1. Open [github.com/new](https://github.com/new).
2. Set the repository name (e.g. `ai-transcription-translation-app`).
3. Keep it **Public** or **Private** and leave "Initialize this repository with a README" **unchecked** (we already have a complete codebase ready).
4. Click **Create repository**.

### Step 2: Link & Push via Terminal

Run these three commands in your project root:

```bash
# 1. Ensure you are on the main branch
git branch -M main

# 2. Add your GitHub repository as remote origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git

# 3. Push to GitHub
git push -u origin main
```

### Subsequent Commits

Whenever you make future updates:

```bash
git add .
git commit -m "Update features"
git push
```

---

## 🔒 Security & Environment Protection

- Your `OPENAI_API_KEY` will **never** be committed to GitHub.
- The `.gitignore` is pre-configured to strictly ignore `.env`, `.env.local`, `.env.*`.
- When deploying to production or configuring GitHub Actions, set `OPENAI_API_KEY` as a secret or environment variable:
  - **GitHub Actions**: Repository Settings ➔ Secrets and variables ➔ Actions ➔ New repository secret (Name: `OPENAI_API_KEY`).
  - **Netlify**: Site configuration ➔ Environment variables.

---

## 🌐 Deploy to Netlify

The repository includes a pre-configured `netlify.toml` for zero-configuration client-side routing.

1. Go to [app.netlify.com](https://app.netlify.com) and click **"Add new site" > "Import an existing project"**.
2. Connect your GitHub account and select this repository.
3. Build Settings are detected automatically:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. In **Site configuration > Environment variables**, add:
   - `OPENAI_API_KEY` = your OpenAI API Key.
5. Click **Deploy Site**.

---

## 🐳 Docker Deployment

To build and run as a standalone container:

```bash
# Build Docker image
docker build -t omnivoice-app .

# Run container on port 3000
docker run -p 3000:3000 -e OPENAI_API_KEY="sk-proj-..." omnivoice-app
```

---

## 📄 License

MIT License. Built for seamless multilingual collaboration.
