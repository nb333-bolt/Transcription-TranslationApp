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
  Cpu,
} from 'lucide-react';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'gemini' | 'azure' | 'teams' | 'github' | 'netlify';
}

export const DeployModal: React.FC<DeployModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'gemini',
}) => {
  const [activeTab, setActiveTab] = useState<'gemini' | 'azure' | 'teams' | 'github' | 'netlify'>(
    (defaultTab as any) === 'apikeys' ? 'gemini' : defaultTab
  );
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Gemini API Interactive State
  const [geminiStatus, setGeminiStatus] = useState<any>(null);
  const [geminiTestResult, setGeminiTestResult] = useState<any>(null);
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState(() => {
    try {
      return localStorage.getItem('voice_studio_gemini_key') || localStorage.getItem('gemini_api_key') || '';
    } catch {
      return '';
    }
  });
  const [saveGeminiNotice, setSaveGeminiNotice] = useState<string | null>(null);

  // Azure SDK Interactive State
  const [azureStatus, setAzureStatus] = useState<any>(null);
  const [azureTestResult, setAzureTestResult] = useState<any>(null);
  const [isTestingAzure, setIsTestingAzure] = useState(false);
  const [azureKeyInput, setAzureKeyInput] = useState(() => {
    try {
      return localStorage.getItem('voice_studio_azure_speech_key') || localStorage.getItem('voice_studio_azure_key') || '';
    } catch {
      return '';
    }
  });
  const [azureTranslationKeyInput, setAzureTranslationKeyInput] = useState(() => {
    try {
      return (
        localStorage.getItem('voice_studio_azure_translation_key') ||
        localStorage.getItem('voice_studio_azure_key') ||
        ''
      );
    } catch {
      return '';
    }
  });
  const [azureTranslationTestResult, setAzureTranslationTestResult] = useState<any>(null);
  const [isTestingAzureTranslation, setIsTestingAzureTranslation] = useState(false);
  const [azureRegionInput, setAzureRegionInput] = useState(() => {
    try {
      return localStorage.getItem('voice_studio_azure_region') || 'eastus';
    } catch {
      return 'eastus';
    }
  });
  const [saveAzureNotice, setSaveAzureNotice] = useState<string | null>(null);

  // GitHub interactive state
  const [githubUsername, setGithubUsername] = useState('your-username');
  const [githubRepoName, setGithubRepoName] = useState('ai-transcription-translation-app');

  // Teams & Outlook interactive state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingM365, setIsTestingM365] = useState(false);
  const [teamsPostResult, setTeamsPostResult] = useState<any>(null);
  const [isPostingTeams, setIsPostingTeams] = useState(false);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab((defaultTab as any) === 'apikeys' ? 'gemini' : defaultTab);
    }
  }, [defaultTab, isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Load Gemini status
      fetch('/api/gemini/status')
        .then((res) => res.json())
        .then((data) => setGeminiStatus(data))
        .catch((err) => console.warn('Could not load Gemini status:', err));

      // Load Azure status
      fetch('/api/azure/status')
        .then((res) => res.json())
        .then((data) => setAzureStatus(data))
        .catch((err) => console.warn('Could not load Azure status:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleTestGemini = async () => {
    setIsTestingGemini(true);
    setGeminiTestResult(null);
    setSaveGeminiNotice(null);
    try {
      const res = await fetch('/api/gemini/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: geminiKeyInput.trim() || undefined,
        }),
      });
      const data = await res.json();
      setGeminiTestResult(data);
      if (data.success) {
        if (geminiKeyInput.trim()) {
          try {
            localStorage.setItem('voice_studio_gemini_key', geminiKeyInput.trim());
          } catch {}
        }
        fetch('/api/gemini/status')
          .then((r) => r.json())
          .then((s) => setGeminiStatus(s))
          .catch(() => {});
      }
    } catch (e: any) {
      setGeminiTestResult({ success: false, error: e.message || 'Gemini connection failed' });
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handleSaveGeminiKey = async () => {
    if (!geminiKeyInput.trim()) return;
    try {
      const res = await fetch('/api/gemini/save-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: geminiKeyInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        try {
          localStorage.setItem('voice_studio_gemini_key', geminiKeyInput.trim());
        } catch {}
        setSaveGeminiNotice('Gemini API key saved in memory and activated!');
        fetch('/api/gemini/status')
          .then((r) => r.json())
          .then((s) => setGeminiStatus(s));
      } else {
        setSaveGeminiNotice('Failed to save key: ' + data.error);
      }
    } catch (e: any) {
      setSaveGeminiNotice('Error saving key: ' + e.message);
    }
  };

  const handleTestAzure = async () => {
    setIsTestingAzure(true);
    setAzureTestResult(null);
    setSaveAzureNotice(null);
    try {
      const res = await fetch('/api/azure/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speechKey: azureKeyInput.trim() || azureTranslationKeyInput.trim() || undefined,
          region: azureRegionInput.trim() || 'eastus',
        }),
      });
      const data = await res.json();
      setAzureTestResult(data);
      if (data.success) {
        if (azureKeyInput.trim()) {
          try {
            localStorage.setItem('voice_studio_azure_speech_key', azureKeyInput.trim());
            localStorage.setItem('voice_studio_azure_key', azureKeyInput.trim());
            localStorage.setItem('voice_studio_azure_region', azureRegionInput.trim());
          } catch {}
        }
        fetch('/api/azure/status')
          .then((r) => r.json())
          .then((s) => setAzureStatus(s))
          .catch(() => {});
      }
    } catch (e: any) {
      setAzureTestResult({ success: false, error: e.message || 'Azure Speech SDK connection failed' });
    } finally {
      setIsTestingAzure(false);
    }
  };

  const handleTestAzureTranslation = async () => {
    setIsTestingAzureTranslation(true);
    setAzureTranslationTestResult(null);
    setSaveAzureNotice(null);
    try {
      const res = await fetch('/api/azure/test-translation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          translationKey: azureTranslationKeyInput.trim() || azureKeyInput.trim() || undefined,
          region: azureRegionInput.trim() || 'eastus',
        }),
      });
      const data = await res.json();
      setAzureTranslationTestResult(data);
      if (data.success) {
        if (azureTranslationKeyInput.trim()) {
          try {
            localStorage.setItem('voice_studio_azure_translation_key', azureTranslationKeyInput.trim());
            localStorage.setItem('voice_studio_azure_region', azureRegionInput.trim());
          } catch {}
        }
        fetch('/api/azure/status')
          .then((r) => r.json())
          .then((s) => setAzureStatus(s))
          .catch(() => {});
      }
    } catch (e: any) {
      setAzureTranslationTestResult({ success: false, error: e.message || 'Azure Translator connection failed' });
    } finally {
      setIsTestingAzureTranslation(false);
    }
  };

  const handleSaveAzure = async () => {
    const rawSpeech = azureKeyInput.trim();
    const rawTrans = azureTranslationKeyInput.trim();
    if (!rawSpeech && !rawTrans) return;

    // If user provided one key, activate it for both Speech & Translation
    const effectiveSpeech = rawSpeech || rawTrans;
    const effectiveTrans = rawTrans || rawSpeech;
    const cleanRegion = azureRegionInput.trim() || 'eastus';

    if (!rawSpeech && effectiveSpeech) setAzureKeyInput(effectiveSpeech);
    if (!rawTrans && effectiveTrans) setAzureTranslationKeyInput(effectiveTrans);

    try {
      const res = await fetch('/api/azure/save-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speechKey: effectiveSpeech,
          translationKey: effectiveTrans,
          region: cleanRegion,
        }),
      });
      const data = await res.json();
      if (data.success) {
        try {
          localStorage.setItem('voice_studio_azure_speech_key', effectiveSpeech);
          localStorage.setItem('voice_studio_azure_key', effectiveSpeech);
          localStorage.setItem('voice_studio_azure_translation_key', effectiveTrans);
          localStorage.setItem('voice_studio_azure_region', cleanRegion);
        } catch {}
        setSaveAzureNotice('Azure Speech & Translation credentials saved and activated!');
        fetch('/api/azure/status')
          .then((r) => r.json())
          .then((s) => setAzureStatus(s));
      } else {
        setSaveAzureNotice('Failed to save: ' + data.error);
      }
    } catch (e: any) {
      setSaveAzureNotice('Error saving Azure: ' + e.message);
    }
  };

  const handleTestM365 = async () => {
    setIsTestingM365(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/m365/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: webhookUrl || undefined }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (e: any) {
      setTestResult({ success: false, error: e.message || 'Handshake failed' });
    } finally {
      setIsTestingM365(false);
    }
  };

  const githubRemoteUrl = `https://github.com/${githubUsername.trim() || 'your-username'}/${githubRepoName.trim() || 'ai-transcription-translation-app'}.git`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  AI &amp; Cloud Integrations Hub
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Google Gemini • Azure SDK • Teams &amp; Outlook • GitHub
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Configure Google Gemini API, Azure Cognitive Services Speech SDK, Microsoft Teams &amp; Outlook
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Navigation Tabs */}
            <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-xs flex-wrap gap-0.5">
              <button
                onClick={() => setActiveTab('gemini')}
                className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'gemini'
                    ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>Gemini API</span>
              </button>
              <button
                onClick={() => setActiveTab('azure')}
                className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'azure'
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-blue-300" />
                <span>Azure SDK</span>
              </button>
              <button
                onClick={() => setActiveTab('teams')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  activeTab === 'teams'
                    ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Teams &amp; Outlook
              </button>
              <button
                onClick={() => setActiveTab('github')}
                className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'github'
                    ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub</span>
              </button>
              <button
                onClick={() => setActiveTab('netlify')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  activeTab === 'netlify'
                    ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Deploy Netlify
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: GOOGLE GEMINI API */}
          {activeTab === 'gemini' && (
            <div className="space-y-6">
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>Google Gemini API Configuration</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Powers Gemini 3.8 Flash summarization, action item extraction, sentiment analysis, and verbatim audio transcription.
                    </p>
                  </div>
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-900/30 transition-all shrink-0 cursor-pointer"
                  >
                    <span>Get Key at Google AI Studio</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Status Box */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Gemini API Status:</span>
                      {geminiStatus?.configured ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Active ({geminiStatus.maskedKey || 'Configured via Environment'})
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Key Not Yet Configured
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-cyan-300 font-mono">Model: gemini-3.8-flash</span>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Enter your Gemini API key below to test live connection or activate for this session:
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="password"
                      value={geminiKeyInput}
                      onChange={(e) => setGeminiKeyInput(e.target.value)}
                      placeholder="Paste your Gemini key (AIzaSy...)"
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
                          <span>Testing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Test Gemini Connection</span>
                        </>
                      )}
                    </button>
                    {geminiKeyInput.trim() && (
                      <button
                        onClick={handleSaveGeminiKey}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-all shrink-0 cursor-pointer"
                        title="Save key into session and .env"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Key</span>
                      </button>
                    )}
                  </div>

                  {saveGeminiNotice && (
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>{saveGeminiNotice}</span>
                    </div>
                  )}

                  {geminiTestResult && (
                    <div
                      className={`p-3 rounded-lg border text-xs font-mono ${
                        geminiTestResult.success
                          ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                          : 'bg-red-950/40 border-red-800 text-red-300'
                      }`}
                    >
                      {geminiTestResult.success ? (
                        <div className="space-y-1">
                          <div className="font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Gemini API Connected Successfully!</span>
                          </div>
                          <div>Model: {geminiTestResult.model} • Latency: {geminiTestResult.latencyMs}ms</div>
                          <div className="text-slate-300 text-[11px]">Response: "{geminiTestResult.reply}"</div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="font-bold flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            <span>Connection Error</span>
                          </div>
                          <div>{geminiTestResult.error}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Instructions Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-cyan-400">Environment</span>
                      <span className="text-[10px] text-slate-500">Local Dev</span>
                    </div>
                    <h5 className="text-xs font-bold text-white">.env file</h5>
                    <div className="bg-slate-950 p-2 rounded-lg font-mono text-[10px] text-slate-300 border border-slate-800">
                      <code>GEMINI_API_KEY="AIzaSy..."</code>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-cyan-400">GitHub Secrets</span>
                      <span className="text-[10px] text-slate-500">CI / CD</span>
                    </div>
                    <h5 className="text-xs font-bold text-white">Repository Secret</h5>
                    <div className="bg-slate-950 p-2 rounded-lg font-mono text-[10px] text-slate-300 border border-slate-800">
                      <span className="text-cyan-400">Name:</span> GEMINI_API_KEY
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-cyan-400">Netlify Cloud</span>
                      <span className="text-[10px] text-slate-500">Production</span>
                    </div>
                    <h5 className="text-xs font-bold text-white">Env Variables</h5>
                    <div className="bg-slate-950 p-2 rounded-lg font-mono text-[10px] text-slate-300 border border-slate-800">
                      <span className="text-cyan-400">Key:</span> GEMINI_API_KEY
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AZURE COGNITIVE SERVICES (SPEECH & TRANSLATION SDK) */}
          {activeTab === 'azure' && (
            <div className="space-y-6">
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-blue-400" />
                      <span>Microsoft Azure Cognitive Services SDK</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Integrated <code className="text-blue-300">microsoft-cognitiveservices-speech-sdk</code> for enterprise speech-to-text, real-time speech translation, and Azure Translator.
                    </p>
                  </div>
                  <a
                    href="https://portal.azure.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-900/30 transition-all shrink-0 cursor-pointer"
                  >
                    <span>Azure Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Status & Form Box */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Azure SDK Status:</span>
                      {azureStatus?.configured ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Active • Speech: {azureStatus.maskedSpeechKey || 'Ready'} • Translation: {azureStatus.maskedTranslationKey || 'Ready'} ({azureStatus.region})
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Awaiting Credentials (SDK Ready)
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-blue-300 font-mono">SDK: 1.52.0</span>
                  </div>

                  {/* Speech Key for Transcription */}
                  <div className="space-y-1.5 p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-blue-300 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5" />
                        <span>Azure Speech Key (Audio Transcription)</span>
                      </label>
                      <span className="text-[10px] text-slate-400">microsoft-cognitiveservices-speech-sdk</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="password"
                        value={azureKeyInput}
                        onChange={(e) => setAzureKeyInput(e.target.value)}
                        placeholder="Azure Speech subscription key (e.g. 32-character hex)"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                      />
                      <button
                        onClick={handleTestAzure}
                        disabled={isTestingAzure}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold transition-all shrink-0 cursor-pointer"
                      >
                        {isTestingAzure ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Testing SDK...</span>
                          </>
                        ) : (
                          <>
                            <Cpu className="w-3 h-3" />
                            <span>Test Speech SDK</span>
                          </>
                        )}
                      </button>
                    </div>
                    {azureTestResult && (
                      <div
                        className={`p-2 rounded-lg border text-xs font-mono mt-1 ${
                          azureTestResult.success
                            ? 'bg-blue-950/40 border-blue-800 text-blue-300'
                            : 'bg-red-950/40 border-red-800 text-red-300'
                        }`}
                      >
                        {azureTestResult.success ? (
                          <div className="flex items-center gap-1.5 text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{azureTestResult.message || 'Speech SDK verified successfully!'}</span>
                          </div>
                        ) : (
                          <div className="text-red-400">{azureTestResult.error}</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Translation Key for Translation */}
                  <div className="space-y-1.5 p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Azure Translation Key (Bilingual &amp; Multilingual Translation)</span>
                      </label>
                      <span className="text-[10px] text-cyan-400/80">Azure Cognitive Services Translator</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="password"
                        value={azureTranslationKeyInput}
                        onChange={(e) => setAzureTranslationKeyInput(e.target.value)}
                        placeholder="Azure Translator subscription key (e.g. 32-character hex)"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                      <button
                        onClick={handleTestAzureTranslation}
                        disabled={isTestingAzureTranslation}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold transition-all shrink-0 cursor-pointer"
                      >
                        {isTestingAzureTranslation ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Testing Translator...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" />
                            <span>Test Translation Key</span>
                          </>
                        )}
                      </button>
                    </div>
                    {azureTranslationTestResult && (
                      <div
                        className={`p-2 rounded-lg border text-xs font-mono mt-1 ${
                          azureTranslationTestResult.success
                            ? 'bg-cyan-950/40 border-cyan-800 text-cyan-300'
                            : 'bg-red-950/40 border-red-800 text-red-300'
                        }`}
                      >
                        {azureTranslationTestResult.success ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{azureTranslationTestResult.message || 'Azure Translation Key verified!'}</span>
                            </div>
                            {azureTranslationTestResult.sampleTranslation && (
                              <div className="text-[11px] text-slate-300">
                                Sample Welsh: "{azureTranslationTestResult.sampleTranslation}"
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-red-400">{azureTranslationTestResult.error}</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Region & Save */}
                  <div className="flex flex-col sm:flex-row items-end gap-3 pt-1">
                    <div className="w-full sm:w-1/2">
                      <label className="text-[10px] text-slate-400 block mb-1">Azure Cloud Region:</label>
                      <input
                        type="text"
                        value={azureRegionInput}
                        onChange={(e) => setAzureRegionInput(e.target.value)}
                        placeholder="eastus / uksouth / westeurope"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                    <div className="w-full sm:w-1/2 flex items-center gap-2">
                      <button
                        onClick={handleSaveAzure}
                        disabled={!azureKeyInput.trim() && !azureTranslationKeyInput.trim()}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Azure Configuration</span>
                      </button>
                    </div>
                  </div>

                  {saveAzureNotice && (
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>{saveAzureNotice}</span>
                    </div>
                  )}
                </div>

                {/* Features & Capabilities */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Speech-to-Text SDK</span>
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      Verbatim audio transcription with streaming push buffers and punctuation.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Speech Translation</span>
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      Real-time translation into Welsh, Spanish, French, German, and Hindi.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Azure Translator</span>
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      REST text translation engine with high linguistic fidelity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TEAMS & OUTLOOK */}
          {activeTab === 'teams' && (
            <div className="space-y-5">
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-cyan-400" />
                  <span>Microsoft Teams &amp; Outlook Integration</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Send meeting notifications, adaptive summary cards, and calendar invites directly to Microsoft Teams channels and Outlook.
                </p>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300">Teams Incoming Webhook URL (Optional):</label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://outlook.office.com/webhook/..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleTestM365}
                    disabled={isTestingM365}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition-all cursor-pointer"
                  >
                    {isTestingM365 ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Test M365 Handshake</span>
                  </button>
                </div>

                {testResult && (
                  <div className="p-3 rounded-lg border bg-emerald-950/40 border-emerald-800 text-xs text-emerald-300 font-mono">
                    {testResult.message || 'M365 connection active.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: GITHUB */}
          {activeTab === 'github' && (
            <div className="space-y-5">
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Github className="w-4 h-4 text-cyan-400" />
                  <span>Push to GitHub Repository</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Deploy this complete codebase to your own GitHub repository with one push.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">GitHub Username:</label>
                    <input
                      type="text"
                      value={githubUsername}
                      onChange={(e) => setGithubUsername(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Repository Name:</label>
                    <input
                      type="text"
                      value={githubRepoName}
                      onChange={(e) => setGithubRepoName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto space-y-1.5 leading-relaxed">
                  <div className="text-slate-500"># 1. Ensure local branch is main</div>
                  <div className="text-cyan-300">git branch -M main</div>
                  <div className="text-slate-500 pt-1"># 2. Add remote origin</div>
                  <div className="text-emerald-300">git remote add origin {githubRemoteUrl}</div>
                  <div className="text-slate-500 pt-1"># 3. Push code to GitHub</div>
                  <div className="text-amber-300 font-semibold">git push -u origin main</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: NETLIFY */}
          {activeTab === 'netlify' && (
            <div className="space-y-5">
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-emerald-400" />
                  <span>Deploy to Netlify</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Deploy as a high-performance web app on Netlify with automated continuous delivery.
                </p>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                  <div className="font-semibold text-white">Netlify Build Settings:</div>
                  <div className="font-mono text-slate-300">Build Command: <code className="text-emerald-400">npm run build</code></div>
                  <div className="font-mono text-slate-300">Publish Directory: <code className="text-emerald-400">dist</code></div>
                  <div className="font-mono text-slate-300">Environment Variables: <code className="text-cyan-400">GEMINI_API_KEY</code>, <code className="text-blue-400">AZURE_SPEECH_KEY</code></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
