import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  Key,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  Terminal,
  Send,
  HelpCircle,
  FileCode,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Github,
  GitBranch,
  Sparkles,
  Lock,
} from 'lucide-react';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'github' | 'apikeys' | 'azure' | 'netlify' | 'teams';
}

export const DeployModal: React.FC<DeployModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'github',
}) => {
  const [activeTab, setActiveTab] = useState<'github' | 'apikeys' | 'azure' | 'netlify' | 'teams'>(defaultTab);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // GitHub & Gemini interactive state
  const [githubUsername, setGithubUsername] = useState('your-username');
  const [githubRepoName, setGithubRepoName] = useState('ai-transcription-translation-app');
  const [geminiStatus, setGeminiStatus] = useState<any>(null);
  const [geminiTestResult, setGeminiTestResult] = useState<any>(null);
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [testGeminiKeyInput, setTestGeminiKeyInput] = useState('');

  // Teams & Outlook interactive state
  const [tenantId, setTenantId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingM365, setIsTestingM365] = useState(false);
  const [teamsPostResult, setTeamsPostResult] = useState<any>(null);
  const [isPostingTeams, setIsPostingTeams] = useState(false);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/gemini/status')
        .then((res) => res.json())
        .then((data) => setGeminiStatus(data))
        .catch((err) => console.warn('Could not load Gemini status:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleTestM365 = async () => {
    setIsTestingM365(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/m365/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenantId || 'common',
          clientId: clientId || 'omnivoice-studio-client',
          clientSecret: clientSecret || 'demo',
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (e: any) {
      setTestResult({ success: false, error: e.message || 'Handshake failed' });
    } finally {
      setIsTestingM365(false);
    }
  };

  const handlePostTeamsSummary = async () => {
    setIsPostingTeams(true);
    setTeamsPostResult(null);
    try {
      const res = await fetch('/api/teams/post-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl,
          meetingTitle: 'Bilingual Strategy Review',
          summary: 'Executive bilingual speech synthesis completed with real-time Welsh, English, and French translation.',
          teamsLink: 'https://teams.microsoft.com',
        }),
      });
      const data = await res.json();
      setTeamsPostResult(data);
    } catch (e: any) {
      setTeamsPostResult({ success: false, error: e.message });
    } finally {
      setIsPostingTeams(false);
    }
  };

  const handleTestGemini = async () => {
    setIsTestingGemini(true);
    setGeminiTestResult(null);
    try {
      const res = await fetch('/api/gemini/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: testGeminiKeyInput.trim() || undefined,
        }),
      });
      const data = await res.json();
      setGeminiTestResult(data);
    } catch (e: any) {
      setGeminiTestResult({ success: false, error: e.message || 'Gemini connection failed' });
    } finally {
      setIsTestingGemini(false);
    }
  };

  const githubRemoteUrl = `https://github.com/${githubUsername.trim() || 'your-username'}/${githubRepoName.trim() || 'ai-transcription-translation-app'}.git`;
  const gitPushCommand = `# 1. Ensure you are on the main branch\ngit branch -M main\n\n# 2. Add your GitHub repository as remote origin\ngit remote add origin ${githubRemoteUrl}\n\n# 3. Push your application code to GitHub\ngit push -u origin main`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Deploy &amp; Integrations Hub
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  GitHub • Gemini • Teams • Azure • Netlify
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Push to GitHub, configure Google Gemini API Key, Teams &amp; Outlook, Azure, and Netlify
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Navigation Tabs */}
            <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-xs flex-wrap gap-0.5">
              <button
                onClick={() => setActiveTab('github')}
                className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'github'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub &amp; Gemini</span>
              </button>
              <button
                onClick={() => setActiveTab('apikeys')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'apikeys'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                API Keys
              </button>
              <button
                onClick={() => setActiveTab('teams')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'teams'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Teams &amp; Outlook
              </button>
              <button
                onClick={() => setActiveTab('azure')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'azure'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Deploy Azure
              </button>
              <button
                onClick={() => setActiveTab('netlify')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'netlify'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Deploy Netlify
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900/60">
          {/* TAB 0: GITHUB & GEMINI API KEY */}
          {activeTab === 'github' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Header Hero Banner */}
              <div className="bg-gradient-to-r from-slate-950 via-cyan-950/40 to-slate-950 border border-cyan-500/30 rounded-2xl p-5 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-cyan-300 font-bold text-sm">
                    <Github className="w-5 h-5 text-cyan-400" />
                    <span>Push to GitHub &amp; Connect Google Gemini API Key</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Git Initialized on Main
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your project repository is initialized, cleanly formatted, and ready to be pushed to your personal or organization GitHub account. Learn how to link the remote origin and supply your <strong>Google Gemini API Key</strong> safely without leaking secrets.
                </p>
              </div>

              {/* Security Shield Banner */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span>Key Protection Guaranteed by .gitignore</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    The project’s <code className="text-emerald-400 bg-emerald-950/50 px-1 py-0.5 rounded">.gitignore</code> file is pre-configured to strictly ignore <code className="text-amber-400">.env*</code> files while only committing the safe template <code className="text-cyan-400">.env.example</code>. Your private Gemini API key will never be accidentally committed to GitHub.
                  </p>
                </div>
              </div>

              {/* Section 1: Step-by-Step GitHub Push Generator */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-cyan-400" />
                      <span>Step 1: Link &amp; Push to GitHub</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Enter your GitHub username and target repository name to dynamically generate the exact commands.
                    </p>
                  </div>
                  <a
                    href="https://github.com/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors shrink-0"
                  >
                    <span>Create Repo on GitHub</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Input Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      GitHub Username or Org
                    </label>
                    <input
                      type="text"
                      value={githubUsername}
                      onChange={(e) => setGithubUsername(e.target.value)}
                      placeholder="e.g. nishabhatt"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Repository Name
                    </label>
                    <input
                      type="text"
                      value={githubRepoName}
                      onChange={(e) => setGithubRepoName(e.target.value)}
                      placeholder="e.g. ai-transcription-translation-app"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Terminal Commands Block */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono text-[11px] flex items-center gap-1.5 text-cyan-400">
                      <Terminal className="w-3.5 h-3.5" />
                      Run in your project root terminal:
                    </span>
                    <button
                      onClick={() => copyToClipboard(gitPushCommand, 'github-push-all')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-medium transition-all shadow-sm"
                    >
                      {copiedText === 'github-push-all' ? (
                        <>
                          <Check className="w-3 h-3 text-white" />
                          <span>Copied Commands!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-white" />
                          <span>Copy Commands</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto space-y-1.5 leading-relaxed">
                    <div className="text-slate-500"># 1. Ensure your local branch is main</div>
                    <div className="text-cyan-300">git branch -M main</div>
                    <div className="text-slate-500 pt-1"># 2. Add your GitHub repository as remote origin</div>
                    <div className="text-emerald-300">git remote add origin {githubRemoteUrl}</div>
                    <div className="text-slate-500 pt-1"># 3. Push code to GitHub</div>
                    <div className="text-amber-300 font-semibold">git push -u origin main</div>
                  </div>
                </div>
              </div>

              {/* Section 2: How to Configure & Use Gemini API Key */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Step 2: How to Use Your Gemini API Key</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Powering transcription, multi-language speech translation, and bilingual meeting summaries.
                    </p>
                  </div>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-900/30 transition-all shrink-0"
                  >
                    <span>Get Key at Google AI Studio</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-amber-400">Environment</span>
                      <span className="text-[10px] text-slate-500">Local Dev</span>
                    </div>
                    <h5 className="text-xs font-bold text-white">Create .env file</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Copy the template and paste your key:
                    </p>
                    <div className="bg-slate-950 p-2 rounded-lg font-mono text-[10px] text-slate-300 border border-slate-800">
                      <code>cp .env.example .env</code>
                      <code className="block text-amber-400 mt-1">GEMINI_API_KEY=&quot;AIzaSy...&quot;</code>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-cyan-400">GitHub Secrets</span>
                      <span className="text-[10px] text-slate-500">CI / CD</span>
                    </div>
                    <h5 className="text-xs font-bold text-white">Add Repo Secret</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      In your repo: <strong>Settings ➔ Secrets and variables ➔ Actions ➔ New repository secret</strong>.
                    </p>
                    <div className="bg-slate-950 p-2 rounded-lg font-mono text-[10px] text-slate-300 border border-slate-800">
                      <span className="text-cyan-400">Name:</span> GEMINI_API_KEY
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-blue-400">Cloud Deploy</span>
                      <span className="text-[10px] text-slate-500">Azure &amp; Netlify</span>
                    </div>
                    <h5 className="text-xs font-bold text-white">Application Settings</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      In Azure App Service / Netlify Site Settings, configure Environment Variable:
                    </p>
                    <div className="bg-slate-950 p-2 rounded-lg font-mono text-[10px] text-slate-300 border border-slate-800">
                      <span className="text-blue-400">Var:</span> GEMINI_API_KEY
                    </div>
                  </div>
                </div>

                {/* Section 3: Live Gemini Connection Verification */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-white">Live Gemini API Key Tester</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {geminiStatus?.configured && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Key Configured ({geminiStatus.maskedKey || 'Active'})
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Test live connectivity and latency with Google Gemini models (<code className="text-cyan-300">gemini-3.8-flash</code> &amp; <code className="text-cyan-300">gemini-3.1-flash-lite</code>).
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="password"
                      value={testGeminiKeyInput}
                      onChange={(e) => setTestGeminiKeyInput(e.target.value)}
                      placeholder="Optional: enter custom key to test (or leave empty to test active key)"
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                    <button
                      onClick={handleTestGemini}
                      disabled={isTestingGemini}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold shadow transition-all shrink-0 cursor-pointer"
                    >
                      {isTestingGemini ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Testing API...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Test Gemini Connection</span>
                        </>
                      )}
                    </button>
                  </div>

                  {geminiTestResult && (
                    <div
                      className={`p-3 rounded-lg border text-xs font-mono animate-in fade-in ${
                        geminiTestResult.success
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                          : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold mb-1">
                        {geminiTestResult.success ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Gemini API Connected Successfully!</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-rose-400" />
                            <span>Gemini Connection Error</span>
                          </>
                        )}
                      </div>
                      {geminiTestResult.success ? (
                        <div className="space-y-0.5 text-[11px] text-emerald-200">
                          <div>Model Verified: {geminiTestResult.model}</div>
                          <div>Response: &quot;{geminiTestResult.reply}&quot;</div>
                          <div>Roundtrip Latency: {geminiTestResult.latencyMs}ms</div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-rose-200">{geminiTestResult.error}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: WHERE TO FIND API KEYS */}
          {activeTab === 'apikeys' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Overview Banner */}
              <div className="bg-gradient-to-r from-amber-950/40 via-slate-950 to-cyan-950/40 border border-amber-500/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2.5 text-amber-300 font-bold text-sm">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>Where to Find Your API Keys for Deployment</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  This application requires a <strong>Google Gemini API Key</strong> to transcribe speech, translate between languages (Welsh, English, French, Spanish, German, Hindi), and generate bilingual executive summaries. For Microsoft Teams &amp; Outlook enterprise sync, it can optionally use <strong>Microsoft Entra ID</strong> credentials.
                </p>
              </div>

              {/* 1. Google Gemini API Key */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                      <h4 className="text-sm font-bold text-white">
                        1. Google Gemini API Key (Required for AI Speech &amp; Summary)
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400">
                      Obtain your free API key directly from Google AI Studio.
                    </p>
                  </div>

                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-900/30 transition-all shrink-0 cursor-pointer"
                  >
                    <span>Get Key at Google AI Studio</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-cyan-400">Step 1</span>
                    <p className="text-xs text-white font-medium">Open Google AI Studio</p>
                    <p className="text-[11px] text-slate-400">
                      Sign in with your standard Google or Workspace account at <code className="text-cyan-300 text-[10px]">aistudio.google.com/app/apikey</code>.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-cyan-400">Step 2</span>
                    <p className="text-xs text-white font-medium">Create API Key</p>
                    <p className="text-[11px] text-slate-400">
                      Click the blue <strong>&quot;+ Create API Key&quot;</strong> button, select a project or create a default one.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-cyan-400">Step 3</span>
                    <p className="text-xs text-white font-medium">Set Environment Variable</p>
                    <p className="text-[11px] text-slate-400">
                      Set the variable name as <strong className="text-amber-300">GEMINI_API_KEY</strong> in your Azure App Service or Netlify site settings.
                    </p>
                  </div>
                </div>

                {/* Environment Variable Copy Box */}
                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <div className="text-slate-300">
                    <span className="text-amber-400">GEMINI_API_KEY</span>=AIzaSy...
                  </div>
                  <button
                    onClick={() => copyToClipboard('GEMINI_API_KEY', 'gemini-var')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors cursor-pointer"
                  >
                    {copiedText === 'gemini-var' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedText === 'gemini-var' ? 'Copied' : 'Copy Var Name'}</span>
                  </button>
                </div>
              </div>

              {/* 2. Microsoft Entra ID (Azure AD) Credentials */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                      <h4 className="text-sm font-bold text-white">
                        2. Microsoft Entra ID / Azure AD (For Teams &amp; Outlook Sync)
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400">
                      Used for Microsoft 365 Exchange Online calendar events and Teams online meetings.
                    </p>
                  </div>

                  <a
                    href="https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-900/30 transition-all shrink-0 cursor-pointer"
                  >
                    <span>Azure Portal App Registrations</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <p>In the Azure Portal (portal.azure.com):</p>
                  <ol className="list-decimal pl-5 space-y-1 text-slate-400">
                    <li>Navigate to <strong>Microsoft Entra ID &gt; App registrations &gt; New registration</strong>.</li>
                    <li>Name your app (e.g. <code className="text-cyan-300 font-mono">OmniVoice Studio</code>).</li>
                    <li>Copy the <strong>Application (client) ID</strong> and <strong>Directory (tenant) ID</strong>.</li>
                    <li>Under <strong>Certificates &amp; secrets</strong>, click <strong>+ New client secret</strong> and copy the Value.</li>
                    <li>Under <strong>API permissions</strong>, add Microsoft Graph delegated permissions: <code className="text-blue-300 font-mono">OnlineMeetings.ReadWrite</code>, <code className="text-blue-300 font-mono">Calendars.ReadWrite</code>, <code className="text-blue-300 font-mono">Mail.Send</code>.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MICROSOFT TEAMS & OUTLOOK INTEGRATION */}
          {activeTab === 'teams' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-cyan-950/40 border border-blue-500/30 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg">
                      T
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Microsoft Teams &amp; Outlook Integration Hub
                      </h3>
                      <p className="text-xs text-slate-300">
                        Seamlessly join meetings in Teams, schedule in Outlook, and dispatch bilingual calendar invites.
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Microsoft 365 Active
                  </span>
                </div>

                {/* 1-Click Launchers Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Teams Desktop & Web */}
                  <div className="bg-slate-950/80 border border-blue-500/30 hover:border-blue-400/50 rounded-xl p-4 space-y-3 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white font-semibold text-xs">
                        <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                          T
                        </div>
                        <span>Microsoft Teams</span>
                      </div>
                      <span className="text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
                        Deep Link
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      Launch a direct joint bilingual meeting session in the Microsoft Teams app or browser.
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href="https://teams.microsoft.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                      >
                        <span>Open Teams Web</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="msteams:"
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                        title="Launch local Microsoft Teams Desktop App"
                      >
                        App
                      </a>
                    </div>
                  </div>

                  {/* Microsoft Outlook Calendar */}
                  <div className="bg-slate-950/80 border border-blue-500/30 hover:border-blue-400/50 rounded-xl p-4 space-y-3 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white font-semibold text-xs">
                        <div className="w-6 h-6 rounded bg-blue-700 text-white flex items-center justify-center text-[10px] font-bold">
                          O
                        </div>
                        <span>Microsoft Outlook Calendar</span>
                      </div>
                      <span className="text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
                        Exchange Sync
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      Pre-populates bilingual meetings, agendas, and Teams room links in Outlook Calendar.
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href="https://outlook.office.com/calendar/0/deeplink/compose?subject=Bilingual%20Strategy%20Review"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold transition-colors"
                      >
                        <span>Open Outlook Calendar</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="https://outlook.office.com/mail/deeplink/compose"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                        title="Open Outlook Web Mail compose"
                      >
                        Mail
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Microsoft Entra ID Connection Test Form */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Microsoft Graph &amp; Entra ID Handshake
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Live credential validation
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">
                      Directory (Tenant) ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 8f4b6c12-3456-7890-abcd-1234567890ab"
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">
                      Application (Client) ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1a2b3c4d-5678-90ab-cdef-1234567890ab"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-slate-400">
                    Verifies permissions for <code className="text-blue-300">Calendars.ReadWrite</code> and <code className="text-blue-300">OnlineMeetings.ReadWrite</code>.
                  </p>

                  <button
                    onClick={handleTestM365}
                    disabled={isTestingM365}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                  >
                    {isTestingM365 ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Test Entra ID Handshake</span>
                      </>
                    )}
                  </button>
                </div>

                {testResult && (
                  <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                    testResult.success ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200' : 'bg-rose-950/40 border-rose-800 text-rose-200'
                  }`}>
                    <div className="flex items-center gap-2 font-semibold">
                      {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                      <span>{testResult.message || testResult.error}</span>
                    </div>
                    {testResult.permissions && (
                      <div className="text-[10px] text-slate-400">
                        Granted Scopes: {testResult.permissions.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Teams Webhook Summary Dispatcher */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Send className="w-4 h-4" /> Post Meeting Notes to Teams Channel
                </div>

                <p className="text-xs text-slate-400">
                  Sends automated bilingual speech executive summaries and action items into your team&apos;s Microsoft Teams channel using an Incoming Webhook.
                </p>

                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://yourtenant.webhook.office.com/webhookb2/..."
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <button
                    onClick={handlePostTeamsSummary}
                    disabled={isPostingTeams}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
                  >
                    {isPostingTeams ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send to Teams</span>
                      </>
                    )}
                  </button>
                </div>

                {teamsPostResult && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{teamsPostResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DEPLOY ON AZURE */}
          {activeTab === 'azure' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="bg-gradient-to-r from-blue-950/40 via-slate-950 to-cyan-950/40 border border-blue-500/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2.5 text-blue-300 font-bold text-sm">
                  <Cloud className="w-4 h-4 text-blue-400" />
                  <span>Deploy to Microsoft Azure (Container Apps or App Service)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The application includes a production-ready, multi-stage <code className="text-cyan-300 font-mono">Dockerfile</code> engineered to run Express, Vite, and Node.js on port 3000. It can be deployed in minutes on <strong>Azure Container Apps</strong> or <strong>Azure App Service (Linux Web App)</strong>.
                </p>
              </div>

              {/* Option 1: Azure Container Apps (CLI 1-Liner) */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4" /> Method 1: Azure Container Apps (1-Liner CLI)
                  </div>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                    Recommended
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  Run this command in the repository root using the Azure CLI (<code className="text-cyan-300">az</code>):
                </p>

                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 font-mono text-xs text-slate-200 relative group overflow-x-auto">
                  <code>
                    az containerapp up \<br />
                    &nbsp;&nbsp;--name omnivoice-studio \<br />
                    &nbsp;&nbsp;--source . \<br />
                    &nbsp;&nbsp;--ingress external \<br />
                    &nbsp;&nbsp;--target-port 3000 \<br />
                    &nbsp;&nbsp;--env-vars GEMINI_API_KEY=&quot;YOUR_KEY&quot;
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        'az containerapp up --name omnivoice-studio --source . --ingress external --target-port 3000 --env-vars GEMINI_API_KEY="YOUR_KEY"',
                        'az-cli'
                      )
                    }
                    className="absolute top-2.5 right-2.5 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedText === 'az-cli' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedText === 'az-cli' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Option 2: Azure App Service Portal Guide */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4" /> Method 2: Azure App Service (Portal UI)
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <ol className="list-decimal pl-5 space-y-1.5 text-slate-400">
                    <li>Go to <strong>Azure Portal (portal.azure.com)</strong> &gt; <strong>Create a resource &gt; Web App</strong>.</li>
                    <li>Set <strong>Publish</strong> to <strong className="text-white">Docker Container</strong> or <strong className="text-white">Code (Node 20 LTS)</strong>.</li>
                    <li>Operating System: <strong className="text-white">Linux</strong>.</li>
                    <li>Under <strong>Configuration &gt; Application settings</strong>, add:
                      <ul className="list-disc pl-5 mt-1 space-y-0.5 text-slate-300 font-mono text-[11px]">
                        <li><span className="text-amber-400">GEMINI_API_KEY</span> = your Google AI Studio key</li>
                        <li><span className="text-cyan-400">PORT</span> = 3000</li>
                        <li><span className="text-blue-400">NODE_ENV</span> = production</li>
                      </ul>
                    </li>
                    <li>Click <strong>Review + Create</strong>. Your app is live at <code className="text-cyan-300">https://your-app.azurewebsites.net</code>!</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DEPLOY ON NETLIFY */}
          {activeTab === 'netlify' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="bg-gradient-to-r from-teal-950/40 via-slate-950 to-cyan-950/40 border border-teal-500/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2.5 text-teal-300 font-bold text-sm">
                  <Cloud className="w-4 h-4 text-teal-400" />
                  <span>Deploy to Netlify with netlify.toml</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The codebase includes a pre-configured <code className="text-teal-300 font-mono">netlify.toml</code> with client-side SPA routing and build settings ready to deploy directly from GitHub or the Netlify CLI.
                </p>
              </div>

              {/* Netlify Step-by-Step */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> 4 Simple Steps to Deploy on Netlify
                  </div>

                  <a
                    href="https://app.netlify.com/start"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                  >
                    <span>Open Netlify Deploy</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-teal-400 uppercase">Step 1: Push Code</span>
                    <p className="font-medium text-white">Push to GitHub, GitLab or Bitbucket</p>
                    <p className="text-[11px] text-slate-400">
                      Commit your repository files including <code className="text-cyan-300 font-mono">netlify.toml</code> and <code className="text-cyan-300 font-mono">package.json</code>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-teal-400 uppercase">Step 2: Import Project</span>
                    <p className="font-medium text-white">Connect Repo on Netlify</p>
                    <p className="text-[11px] text-slate-400">
                      Log into Netlify and click <strong>&quot;Add new site &gt; Import an existing project&quot;</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-teal-400 uppercase">Step 3: Build Settings</span>
                    <p className="font-medium text-white">Auto-Detected Build</p>
                    <p className="text-[11px] text-slate-400">
                      Build command: <code className="text-amber-300 font-mono">npm run build</code><br />
                      Publish directory: <code className="text-amber-300 font-mono">dist</code>
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-teal-400 uppercase">Step 4: API Key</span>
                    <p className="font-medium text-white">Add Environment Variable</p>
                    <p className="text-[11px] text-slate-400">
                      Under <strong>Site configuration &gt; Environment variables</strong>, add:
                      <code className="block text-amber-300 font-mono mt-1">GEMINI_API_KEY = your_key</code>
                    </p>
                  </div>
                </div>

                {/* Netlify CLI 1-liner */}
                <div className="pt-2">
                  <div className="text-[11px] text-slate-400 mb-1">
                    Or deploy immediately from terminal with Netlify CLI:
                  </div>
                  <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 font-mono text-xs text-slate-200 flex items-center justify-between">
                    <code>npx netlify deploy --build --prod</code>
                    <button
                      onClick={() => copyToClipboard('npx netlify deploy --build --prod', 'netlify-cli')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedText === 'netlify-cli' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedText === 'netlify-cli' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Need deployment help? All configuration files (.dockerignore, Dockerfile, netlify.toml) are ready in your root directory.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
