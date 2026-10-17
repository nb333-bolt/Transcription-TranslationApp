import React, { useState, useRef, useEffect } from 'react';
import { Search, Volume2, Copy, Check, Edit2 } from 'lucide-react';
import { TranscriptSegment } from '../types';

interface TranscriptViewProps {
  segments: TranscriptSegment[];
  activeSegmentId: string | null;
  onSegmentClick: (startSeconds: number) => void;
  selectedLanguage: string;
  sourceLanguage: string;
  onSegmentEdit?: (segmentId: string, newOriginal: string, newTranslation?: string) => void;
  onSpeakerEdit?: (segmentId: string, newSpeaker: string) => void;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  segments,
  activeSegmentId,
  onSegmentClick,
  selectedLanguage,
  sourceLanguage,
  onSegmentEdit,
  onSpeakerEdit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingTranslation, setEditingTranslation] = useState('');

  const activeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeSegmentId && activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activeSegmentId]);

  const handleCopy = (seg: TranscriptSegment) => {
    const textToCopy = `${seg.speaker} (${seg.startTime}):\n${seg.originalText}\n[${selectedLanguage}] ${seg.translations?.[selectedLanguage] || ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(seg.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleSpeak = (text: string, langName: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const lower = langName.toLowerCase();
    if (lower.includes('welsh') || lower.includes('cymr')) {
      utterance.lang = 'cy-GB';
    } else if (lower.includes('fren') || lower.includes('français')) {
      utterance.lang = 'fr-FR';
    } else if (lower.includes('span') || lower.includes('español')) {
      utterance.lang = 'es-ES';
    } else if (lower.includes('germ') || lower.includes('deutsch')) {
      utterance.lang = 'de-DE';
    } else if (lower.includes('hind')) {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-GB';
    }
    window.speechSynthesis.speak(utterance);
  };

  const startEditing = (seg: TranscriptSegment) => {
    setEditingId(seg.id);
    setEditingText(seg.originalText);
    setEditingTranslation(seg.translations?.[selectedLanguage] || '');
  };

  const saveEdit = (segId: string) => {
    if (onSegmentEdit) {
      onSegmentEdit(segId, editingText, editingTranslation);
    }
    setEditingId(null);
  };

  const filteredSegments = segments.filter((seg) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const origMatch = seg.originalText.toLowerCase().includes(q);
    const transMatch = (seg.translations?.[selectedLanguage] || '').toLowerCase().includes(q);
    const speakerMatch = seg.speaker.toLowerCase().includes(q);
    return origMatch || transMatch || speakerMatch;
  });

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Clean Header Bar */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold text-slate-200">Transcript &amp; Translation</h3>
        <div className="relative w-48">
          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>

      {/* Column Titles */}
      <div className="grid grid-cols-2 px-4 py-2 bg-slate-950/60 border-b border-slate-800 text-[11px] font-medium text-slate-400">
        <div>Original ({sourceLanguage})</div>
        <div>Translation ({selectedLanguage})</div>
      </div>

      {/* Segments List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
        {filteredSegments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No matching speech found.</div>
        ) : (
          filteredSegments.map((seg) => {
            const isActive = seg.id === activeSegmentId;
            const isEditing = seg.id === editingId;
            const transText = seg.translations?.[selectedLanguage] || '';

            return (
              <div
                key={seg.id}
                ref={isActive ? activeRef : null}
                className={`p-3.5 transition-colors ${
                  isActive ? 'bg-cyan-950/30 ring-1 ring-cyan-500/30' : 'hover:bg-slate-800/40'
                }`}
              >
                {/* Meta Header */}
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <button
                    onClick={() => onSegmentClick(seg.startSeconds)}
                    className="flex items-center gap-2 text-left group"
                  >
                    <span className="font-mono text-[11px] text-cyan-400 font-semibold group-hover:underline">
                      {seg.startTime}
                    </span>
                    <span className="font-medium text-slate-300">{seg.speaker}</span>
                  </button>

                  <div className="flex items-center gap-1 text-slate-400">
                    <button
                      onClick={() => handleSpeak(seg.originalText, sourceLanguage)}
                      className="p-1 hover:text-white rounded"
                      title="Listen"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => startEditing(seg)}
                      className="p-1 hover:text-white rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleCopy(seg)}
                      className="p-1 hover:text-white rounded"
                      title="Copy"
                    >
                      {copiedId === seg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Edit Form or Text */}
                {isEditing ? (
                  <div className="space-y-2 mt-2">
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full p-2 text-xs rounded bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                      rows={2}
                    />
                    <textarea
                      value={editingTranslation}
                      onChange={(e) => setEditingTranslation(e.target.value)}
                      className="w-full p-2 text-xs rounded bg-slate-950 border border-slate-700 text-cyan-200 focus:outline-none focus:border-cyan-500"
                      rows={2}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveEdit(seg.id)}
                        className="px-3 py-1 text-xs font-semibold bg-cyan-500 text-slate-950 rounded hover:bg-cyan-400"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="grid grid-cols-2 gap-4 text-xs cursor-pointer"
                    onClick={() => onSegmentClick(seg.startSeconds)}
                  >
                    <p className="text-slate-300 leading-relaxed font-normal">{seg.originalText}</p>
                    <p className="text-cyan-200/90 leading-relaxed font-normal">
                      {transText || <span className="text-slate-500 italic">No translation</span>}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
