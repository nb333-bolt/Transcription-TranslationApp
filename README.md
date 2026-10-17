# AI Transcription & Translation App

> Real-time multilingual speech-to-text, neural translation, and intelligent meeting summarization powered by Google Gemini, with Microsoft Teams and Outlook calendar integration.

[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%20Flash-4285F4?logo=google&logoColor=white)](https://aistudio.google.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styles-Tailwind%20CSS-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-000000?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Microsoft 365](https://img.shields.io/badge/Integration-Teams%20%26%20Outlook-0078D4?logo=microsoftteams&logoColor=white)](https://teams.microsoft.com/)

---

## 🌟 Key Features

- **Multilingual Speech-to-Text**: Fast transcription with speaker diarization (names and roles) using Google Gemini multimodal models (`gemini-3.8-flash` and `gemini-3.1-flash-lite`).
- **Welsh & Global Language Translation**: Real-time translation supporting Welsh (Cymraeg), English, French, Spanish, German, Hindi, and more.
- **Executive Summarization**: Automated extraction of executive overviews, key discussion points, and prioritized action items with assignees.
- **Direct Meeting Invites & M365 Integration**:
  - One-click Outlook Web calendar invite generation
  - Microsoft Teams video join links
  - RFC 5545 `.ics` universal calendar file download with 15-minute reminders
  - Microsoft Teams Adaptive Card channel posting
- **Document & Subtitle Export**: One-click download as PDF, Word (.docx), Subtitles (.srt), and plain text (.txt).
- **Audio & Video Player**: Synchronized interactive transcript player with timestamp seeking and audio waveform visualizer.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun**
- **Google Gemini API Key**: Free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

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

Open `.env` in your editor and insert your Google Gemini API Key:

```env
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"
```

*(Optional Microsoft 365 credentials can also be added for live Azure AD / Teams synchronization)*:
```env
AZURE_CLIENT_ID=""
AZURE_TENANT_ID=""
AZURE_CLIENT_SECRET=""
TEAMS_WEBHOOK_URL=""
```

### 4. Run the Application

```bash
npm run dev
```

Open your browser at **`http://localhost:3000`**.

---

## 🔑 How to Get Your Gemini API Key

1. Visit **[Google AI Studio](https://aistudio.google.com/app/apikey)**.
2. Sign in with your Google account.
3. Click **"Create API Key"** (or **"Get API Key"**).
4. Select or create a Google Cloud project.
5. Copy your API Key (format starts with `AIzaSy...`).
6. Paste it into your `.env` file as `GEMINI_API_KEY="your_key"`.

> 💡 **Free Tier**: Google AI Studio provides a free usage tier with generous limits for development and personal projects.

---

## 📦 How to Push this App to GitHub

Follow these steps in your terminal to publish this codebase to your own GitHub repository:

### Step 1: Create a New GitHub Repository
1. Go to **[GitHub: New Repository](https://github.com/new)**.
2. Enter a repository name (for example, `ai-transcription-translation-app`).
3. Set the visibility to **Public** or **Private**.
4. **Do not** initialize with a README, .gitignore, or license (they are already included in this project).
5. Click **"Create repository"**.

### Step 2: Push Local Code to GitHub

Run the following commands in the project root directory:

```bash
# 1. Ensure you are on the main branch
git branch -M main

# 2. Link your new GitHub repository (replace with your GitHub URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git

# 3. Push the codebase
git push -u origin main
```

*(If you ever make local changes later, commit and push anytime with)*:
```bash
git add .
git commit -m "Update application features"
git push
```

---

## 🔒 Safe Credential Management (No Leaked Keys)

- The `.gitignore` file is pre-configured to **strictly ignore all `.env*` files** while only tracking `.env.example`.
- Your `GEMINI_API_KEY` will **never** be committed to GitHub.
- When deploying to production or configuring GitHub Actions, set `GEMINI_API_KEY` as a secret or environment variable:
  - **GitHub Actions**: Repository Settings ➔ Secrets and variables ➔ Actions ➔ New repository secret (Name: `GEMINI_API_KEY`).
  - **Azure**: App Service / Container App ➔ Configuration ➔ Application settings.
  - **Netlify**: Site configuration ➔ Environment variables.

---

## 🚢 Production Deployment

### Option A: Azure Container Apps / App Service
```bash
# Build docker container
docker build -t omnivoice-app .

# Or deploy via Azure CLI
az containerapp up \
  --name omnivoice-app \
  --source . \
  --ingress external \
  --target-port 3000 \
  --env-vars GEMINI_API_KEY="YOUR_KEY"
```

### Option B: Netlify
Deploy frontend using the pre-configured `netlify.toml`:
```bash
npm run build
npx netlify deploy --prod --dir=dist
```
Set `GEMINI_API_KEY` in Netlify Site Settings ➔ Environment Variables.

---

## 📄 License
This project is licensed under the MIT License.
