import React from 'react';
import { Upload, Download, Play, Users, Calendar, Cloud } from 'lucide-react';

interface SidebarProps {
  onUpload: () => void;
  onExport: () => void;
  onSwitchSample: () => void;
  onOpenAdmin: () => void;
  onOpenMeetings?: () => void;
  onOpenDeploy?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onUpload,
  onExport,
  onSwitchSample,
  onOpenAdmin,
  onOpenMeetings,
  onOpenDeploy,
}) => {
  return (
    <aside className="w-16 md:w-56 shrink-0 h-screen sticky top-0 bg-slate-950 border-r border-slate-850 flex flex-col justify-between p-3 select-none z-30">
      {/* Top Brand & Actions */}
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
            AI
          </div>
          <div className="hidden md:block overflow-hidden">
            <h1 className="text-xs font-bold text-white tracking-tight leading-snug" title="AI Transcription&Translation App">
              AI Transcription&amp;Translation App
            </h1>
            <p className="text-[10px] text-slate-400 truncate">Multilingual Studio</p>
          </div>
        </div>

        {/* Navigation Action Buttons (Record and Video removed from navigation bar as requested) */}
        <nav className="space-y-1.5">
          {/* 1. Upload */}
          <button
            onClick={onUpload}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
            title="Upload audio or video file"
          >
            <Upload className="w-4 h-4 shrink-0 text-slate-400" />
            <span className="hidden md:inline">Upload</span>
          </button>

          {/* 2. Export */}
          <button
            onClick={onExport}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
            title="Export to PDF or Word DOCX"
          >
            <Download className="w-4 h-4 shrink-0 text-slate-400" />
            <span className="hidden md:inline">Export</span>
          </button>

          {/* 3. Switch Sample */}
          <button
            onClick={onSwitchSample}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
            title="Toggle between bilingual samples"
          >
            <Play className="w-4 h-4 shrink-0 text-cyan-400" />
            <span className="hidden md:inline">Sample</span>
          </button>

          {/* 4. Admin (After Sample Icon) */}
          <button
            onClick={onOpenAdmin}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
            title="Admin: Manage speaker email IDs and names"
          >
            <Users className="w-4 h-4 shrink-0 text-slate-400" />
            <span className="hidden md:inline">Admin</span>
          </button>

          {/* 5. Meetings (Organise meetings, speakers, agendas, rooms, direct & bulk invites) */}
          {onOpenMeetings && (
            <button
              onClick={onOpenMeetings}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-cyan-300 hover:text-white hover:bg-cyan-950/40 border border-cyan-800/40 hover:border-cyan-700 transition-colors"
              title="Organise meetings, assign speakers, rooms & dispatch direct invites"
            >
              <Calendar className="w-4 h-4 shrink-0 text-cyan-400" />
              <span className="hidden md:inline">Meetings &amp; Invites</span>
            </button>
          )}

          {/* 6. Deploy & Integrations (Azure, Netlify, Teams, Outlook, API Keys) */}
          {onOpenDeploy && (
            <button
              onClick={onOpenDeploy}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-blue-300 hover:text-white hover:bg-blue-950/40 border border-blue-800/40 hover:border-blue-700 transition-colors"
              title="Deploy to Azure, Netlify, configure Teams & Outlook, and manage API keys"
            >
              <Cloud className="w-4 h-4 shrink-0 text-blue-400" />
              <span className="hidden md:inline">Deploy &amp; Cloud</span>
            </button>
          )}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="px-2 py-2 text-[10px] text-slate-500 hidden md:block border-t border-slate-900 truncate">
        AI Transcription &amp; Translation
      </div>
    </aside>
  );
};
