import React, { useState } from 'react';
import { CheckCircle2, Copy, Check } from 'lucide-react';
import { SummaryData, ActionItem } from '../types';

interface SummaryDashboardProps {
  summary: SummaryData;
  selectedLanguage: string;
  sourceLanguage: string;
  transcriptText: string;
  onUpdateSummary: (newSummary: SummaryData) => void;
}

export const SummaryDashboard: React.FC<SummaryDashboardProps> = ({
  summary,
  selectedLanguage,
  sourceLanguage,
}) => {
  const [showTranslated, setShowTranslated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionItems, setActionItems] = useState<Array<ActionItem & { completed?: boolean }>>(
    summary.actionItems || []
  );

  const translatedExecutive = summary.translatedExecutive?.[selectedLanguage];
  const summaryText =
    showTranslated && translatedExecutive ? translatedExecutive : summary.executive;

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const toggleAction = (idx: number) => {
    const next = [...actionItems];
    next[idx].completed = !next[idx].completed;
    setActionItems(next);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-4 space-y-4">
      {/* Summary Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-200">Summary</h3>
          <div className="flex items-center gap-2">
            {translatedExecutive && (
              <button
                onClick={() => setShowTranslated(!showTranslated)}
                className="text-[11px] font-medium text-cyan-400 hover:underline"
              >
                {showTranslated ? `View in ${sourceLanguage}` : `View in ${selectedLanguage}`}
              </button>
            )}
            <button
              onClick={handleCopy}
              className="text-slate-400 hover:text-white p-1 rounded"
              title="Copy summary"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {summaryText || 'No summary available.'}
        </p>
      </div>

      {/* Key Takeaways */}
      {summary.keyPoints && summary.keyPoints.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <h4 className="text-xs font-semibold text-slate-200">Key Points</h4>
          <ul className="space-y-1">
            {summary.keyPoints.map((point, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="text-cyan-400 leading-tight">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Items */}
      {actionItems.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800 flex-1 overflow-y-auto">
          <h4 className="text-xs font-semibold text-slate-200">Action Items</h4>
          <div className="space-y-1.5">
            {actionItems.map((item, idx) => (
              <div
                key={idx}
                onClick={() => toggleAction(idx)}
                className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                  item.completed
                    ? 'bg-slate-950/40 border-slate-850 text-slate-500'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <CheckCircle2
                  className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                    item.completed ? 'text-emerald-400' : 'text-slate-600'
                  }`}
                />
                <span className={item.completed ? 'line-through' : ''}>
                  {item.task}
                  {item.owner && (
                    <span className="text-[10px] text-slate-500 ml-1.5">({item.owner})</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
