import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  FileCheck,
  X,
  Check,
  Calendar,
  Clock,
  MapPin,
  Users,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { RecordingResult, ScheduledMeeting } from '../types';
import { exportToPDF, exportToDocx, convertMeetingToRecording } from '../utils/exportUtils';
import { SUPPORTED_LANGUAGES, DEMO_SAMPLES } from '../constants/languages';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  recording: RecordingResult;
  currentSelectedLanguage: string;
  recentMeetings?: ScheduledMeeting[];
  recentRecordings?: RecordingResult[];
  onSelectRecording?: (recording: RecordingResult) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  recording,
  currentSelectedLanguage,
  recentMeetings = [],
  recentRecordings = [],
  onSelectRecording,
}) => {
  const [targetLang, setTargetLang] = useState(currentSelectedLanguage);
  const [exporting, setExporting] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<string | null>(null);

  // Compile list of all selectable meetings, putting Recent Meetings FIRST
  const availableMeetings = useMemo(() => {
    const list: Array<{ id: string; label: string; badge: string; recording: RecordingResult }> = [];

    // 1. Any freshly recorded sessions (highest priority)
    recentRecordings.forEach((rec, idx) => {
      const isHistorical = rec.id.startsWith('sample-');
      list.push({
        id: rec.id,
        label: rec.title,
        badge: isHistorical ? 'Historical Sample' : (idx === 0 ? '⚡ Most Recent Session' : 'Recent Session'),
        recording: rec,
      });
    });

    // 2. Active Scheduled meetings converted to rich recording
    recentMeetings.forEach((m, idx) => {
      const converted = convertMeetingToRecording(m, targetLang);
      const exists = list.some((item) => item.id === converted.id || item.label === m.title);
      if (!exists) {
        list.push({
          id: converted.id,
          label: m.title,
          badge: idx === 0 ? '⚡ Recent Meeting' : 'Scheduled Meeting',
          recording: converted,
        });
      }
    });

    // 3. Current active recording if not already in list
    if (recording && !list.some((item) => item.id === recording.id)) {
      const isHistorical = recording.id.startsWith('sample-');
      list.unshift({
        id: recording.id,
        label: recording.title,
        badge: isHistorical ? 'Historical Sample' : '⚡ Current Active Meeting',
        recording,
      });
    }

    // 4. Fallback to historical samples if list is empty
    if (list.length === 0) {
      DEMO_SAMPLES.forEach((sample, i) => {
        list.push({
          id: sample.id,
          label: sample.title,
          badge: i === 0 ? 'Demo Meeting' : 'Sample',
          recording: sample,
        });
      });
    }

    return list;
  }, [recentRecordings, recentMeetings, recording, targetLang]);

  // Default to the first recent meeting in the list
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>(() => {
    // If current recording is not historical, use it; otherwise pick the first recent non-historical meeting if available
    if (recording && !recording.id.startsWith('sample-')) {
      return recording.id;
    }
    return availableMeetings[0]?.id || recording?.id || 'sample-bilingual-sync';
  });

  useEffect(() => {
    if (recording && !recording.id.startsWith('sample-')) {
      setSelectedMeetingId(recording.id);
    } else if (availableMeetings.length > 0) {
      // Find first non-historical meeting if current is historical
      const recent = availableMeetings.find((m) => !m.id.startsWith('sample-'));
      if (recent) {
        setSelectedMeetingId(recent.id);
      } else {
        setSelectedMeetingId(availableMeetings[0].id);
      }
    }
  }, [isOpen, recording]);

  useEffect(() => {
    setTargetLang(currentSelectedLanguage);
  }, [currentSelectedLanguage, isOpen]);

  if (!isOpen) return null;

  const currentSelection = availableMeetings.find((m) => m.id === selectedMeetingId) || availableMeetings[0];
  const activeRecording = currentSelection?.recording || recording;

  const handleExport = async (format: 'pdf' | 'docx') => {
    setExporting(format);
    try {
      if (format === 'pdf') {
        await exportToPDF(activeRecording, targetLang);
      } else {
        await exportToDocx(activeRecording, targetLang);
      }
      setDownloaded(format);
      setTimeout(() => setDownloaded(null), 2500);
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setExporting(null);
    }
  };

  const handleSelectMeeting = (id: string) => {
    setSelectedMeetingId(id);
    const chosen = availableMeetings.find((m) => m.id === id);
    if (chosen && onSelectRecording) {
      onSelectRecording(chosen.recording);
    }
  };

  const speakersDisplay = activeRecording.speakersList?.join(', ') ||
    Array.from(new Set(activeRecording.segments?.map((s) => s.speaker) || [])).join(', ') ||
    'Carys Evans, Gareth Thomas';

  const dateDisplay = activeRecording.date
    ? `${activeRecording.date} ${activeRecording.createdAt ? `• ${activeRecording.createdAt}` : ''}`
    : (activeRecording.createdAt || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-5 text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Export Meeting Report</h2>
              <p className="text-[11px] text-slate-400">Export recent meeting details, agenda &amp; bilingual transcripts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Meeting Selector (Resolves: export recent meeting details instead of historical ones) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Select Meeting to Export:</span>
            <span className="text-[10px] text-cyan-400 font-medium">
              {currentSelection?.badge || 'Recent Meeting'}
            </span>
          </label>
          <div className="relative">
            <select
              value={selectedMeetingId}
              onChange={(e) => handleSelectMeeting(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 appearance-none focus:outline-none focus:border-cyan-500 cursor-pointer pr-9"
            >
              {availableMeetings.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.badge}: {item.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 2. Selected Meeting Details Preview Card */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-bold text-white text-xs leading-snug">{activeRecording.title}</h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/50 shrink-0">
              {currentSelection?.badge || 'Recent'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-300 border-t border-slate-900">
            <div className="flex items-center gap-1.5 truncate">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{dateDisplay}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Duration: {activeRecording.durationFormatted || '01:00'}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{activeRecording.roomName || 'Microsoft Teams'}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate" title={speakersDisplay}>{speakersDisplay}</span>
            </div>
          </div>

          {activeRecording.summary?.executive && (
            <p className="text-[11px] text-slate-400 line-clamp-2 pt-1 italic border-t border-slate-900/60">
              "{activeRecording.summary.executive}"
            </p>
          )}
        </div>

        {/* 3. Translation Language Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Translate Report Into Language:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setTargetLang(lang.name)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  targetLang === lang.name
                    ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300 font-bold shadow-sm shadow-cyan-950/50'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.nativeName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Export Download Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={() => handleExport('pdf')}
            disabled={!!exporting}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-600/50 hover:bg-slate-900 transition-all cursor-pointer group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-950/50 border border-red-800/40 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-white">Download PDF Meeting Brief</p>
                <p className="text-[10px] text-slate-400">Formatted executive summary, bilingual table &amp; action points</p>
              </div>
            </div>
            {downloaded === 'pdf' ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-950/40 px-2 py-1 rounded-md border border-emerald-800/50">
                <Check className="w-3.5 h-3.5" />
                <span>Downloaded</span>
              </span>
            ) : (
              <span className="text-xs text-cyan-400 font-medium group-hover:underline">
                {exporting === 'pdf' ? 'Generating...' : 'Export PDF'}
              </span>
            )}
          </button>

          <button
            onClick={() => handleExport('docx')}
            disabled={!!exporting}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-600/50 hover:bg-slate-900 transition-all cursor-pointer group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-950/50 border border-blue-800/40 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                <FileCheck className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-white">Download Word Document (.docx)</p>
                <p className="text-[10px] text-slate-400">Editable Microsoft Word report with native two-column layout</p>
              </div>
            </div>
            {downloaded === 'docx' ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-950/40 px-2 py-1 rounded-md border border-emerald-800/50">
                <Check className="w-3.5 h-3.5" />
                <span>Downloaded</span>
              </span>
            ) : (
              <span className="text-xs text-blue-400 font-medium group-hover:underline">
                {exporting === 'docx' ? 'Generating...' : 'Export Word'}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
