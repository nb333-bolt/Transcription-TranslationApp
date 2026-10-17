import React, { useState } from 'react';
import { FileText, FileCheck, X, Check } from 'lucide-react';
import { RecordingResult } from '../types';
import { exportToPDF, exportToDocx } from '../utils/exportUtils';
import { SUPPORTED_LANGUAGES } from '../constants/languages';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  recording: RecordingResult;
  currentSelectedLanguage: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  recording,
  currentSelectedLanguage,
}) => {
  const [targetLang, setTargetLang] = useState(currentSelectedLanguage);
  const [exporting, setExporting] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async (format: 'pdf' | 'docx') => {
    setExporting(format);
    try {
      if (format === 'pdf') {
        await exportToPDF(recording, targetLang);
      } else {
        await exportToDocx(recording, targetLang);
      }
      setDownloaded(format);
      setTimeout(() => setDownloaded(null), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-5 space-y-4 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-semibold text-white">Export Report</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Language Selection */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-400 font-medium block">Translation language:</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setTargetLang(lang.name)}
                className={`p-2 rounded-lg text-xs font-medium border transition-colors ${
                  targetLang === lang.name
                    ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                {lang.nativeName}
              </button>
            ))}
          </div>
        </div>

        {/* Export Formats */}
        <div className="space-y-2 pt-1">
          <button
            onClick={() => handleExport('pdf')}
            disabled={!!exporting}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-red-400" />
              <span className="text-xs font-medium text-slate-200">PDF Document</span>
            </div>
            {downloaded === 'pdf' ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <span className="text-[11px] text-slate-400">Download</span>
            )}
          </button>

          <button
            onClick={() => handleExport('docx')}
            disabled={!!exporting}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <FileCheck className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-slate-200">Word Document (.docx)</span>
            </div>
            {downloaded === 'docx' ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <span className="text-[11px] text-slate-400">Download</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
