import React from 'react';
import { Mic, Download, Play } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../constants/languages';

interface NavbarProps {
  activeTargetLanguage: string;
  onLanguageChange: (langName: string) => void;
  onOpenRecorder: () => void;
  onOpenExport: () => void;
  onLoadDemo: (sampleId: string) => void;
  currentSampleId: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTargetLanguage,
  onLanguageChange,
  onOpenRecorder,
  onOpenExport,
  onLoadDemo,
  currentSampleId,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-600 flex items-center justify-center text-white text-xs font-bold">
            AI
          </div>
          <span className="font-semibold text-white text-sm tracking-tight">AI Transcription&amp;Translation App</span>
        </div>

        {/* Clean Controls */}
        <div className="flex items-center gap-2">
          {/* Simple Language Switcher: English or Cymraeg */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isActive = activeTargetLanguage === lang.name;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => onLanguageChange(lang.name)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang.nativeName}
                </button>
              );
            })}
          </div>

          {/* Sample Switcher */}
          <button
            onClick={() =>
              onLoadDemo(
                currentSampleId === 'sample-bilingual-sync'
                  ? 'sample-welsh-announcement'
                  : 'sample-bilingual-sync'
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
            title="Switch demo sample"
          >
            <Play className="w-3 h-3 text-cyan-400" />
            <span>Switch Sample</span>
          </button>

          {/* Export Button */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          {/* Record Button */}
          <button
            onClick={onOpenRecorder}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors shadow-sm"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Record</span>
          </button>
        </div>
      </div>
    </header>
  );
};
