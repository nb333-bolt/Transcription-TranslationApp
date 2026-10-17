import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check,
  UserCheck,
  Mail,
  Sparkles,
  Shield,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import { Participant } from '../types';
import { parseNameFromEmail, DEFAULT_PARTICIPANTS } from '../constants/languages';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  onUpdateParticipants: (updated: Participant[]) => void;
  onApplyToTranscript: (participants: Participant[]) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  participants,
  onUpdateParticipants,
  onApplyToTranscript,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [asAdmin, setAsAdmin] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'admin'>('all');
  const [appliedNotice, setAppliedNotice] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleAddEmail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = emailInput.trim();
    if (!raw) return;

    // Handle comma or space separated emails
    const emails = raw
      .split(/[,\s]+/)
      .map((em) => em.trim())
      .filter((em) => em.includes('@'));

    if (emails.length === 0) {
      showStatus('Please enter a valid email address.');
      return;
    }

    const newParticipants: Participant[] = [...participants];
    let addedCount = 0;

    emails.forEach((email) => {
      if (!newParticipants.some((p) => p.email.toLowerCase() === email.toLowerCase())) {
        const { firstName, lastName, fullName } = parseNameFromEmail(email);
        newParticipants.push({
          id: `part-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          email,
          firstName,
          lastName,
          fullName,
          isAdmin: asAdmin,
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      onUpdateParticipants(newParticipants);
      setEmailInput('');
      showStatus(`Added ${addedCount} ${asAdmin ? 'admin speaker(s)' : 'speaker(s)'}!`);
    } else {
      showStatus('Email already in speaker list.');
    }
  };

  const handleDeleteSpeaker = (id: string, name: string) => {
    const updated = participants.filter((p) => p.id !== id);
    onUpdateParticipants(updated);
    showStatus(`Deleted speaker "${name}"`);
  };

  const handleToggleAdmin = (id: string) => {
    const updated = participants.map((p) =>
      p.id === id ? { ...p, isAdmin: !p.isAdmin } : p
    );
    onUpdateParticipants(updated);
    const target = updated.find((p) => p.id === id);
    if (target) {
      showStatus(`${target.fullName} is now ${target.isAdmin ? 'an Admin Speaker' : 'a Regular Speaker'}`);
    }
  };

  const handleSaveName = (id: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    const parts = trimmed.split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    const updated = participants.map((p) =>
      p.id === id ? { ...p, firstName, lastName, fullName: trimmed } : p
    );
    onUpdateParticipants(updated);
    setEditingId(null);
    showStatus(`Name updated to "${trimmed}"`);
  };

  const handleResetDefaults = () => {
    onUpdateParticipants(DEFAULT_PARTICIPANTS);
    showStatus('Reset speakers to default directory.');
  };

  const handleApply = () => {
    onApplyToTranscript(participants);
    setAppliedNotice(true);
    setTimeout(() => {
      setAppliedNotice(false);
      onClose();
    }, 1200);
  };

  const adminCount = participants.filter((p) => p.isAdmin).length;
  const filteredParticipants = filterMode === 'admin'
    ? participants.filter((p) => p.isAdmin)
    : participants;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-5 space-y-4 text-slate-100 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Admin &amp; Speaker Directory</h2>
              <p className="text-[11px] text-slate-400">Add, manage, and delete admin speakers with auto name detection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Temporary Notification banner */}
        {statusMessage && (
          <div className="text-xs bg-cyan-950/70 border border-cyan-800 text-cyan-300 px-3 py-1.5 rounded-lg flex items-center justify-between">
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Add Email Form */}
        <form onSubmit={handleAddEmail} className="space-y-2.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
          <label className="text-xs text-slate-300 font-medium block">
            Add speaker email address (auto-detects first name &amp; surname):
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. sarah.jenkins@company.com, carys.evans@gov.wales"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              type="submit"
              disabled={!emailInput.trim()}
              className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
              <input
                type="checkbox"
                checked={asAdmin}
                onChange={(e) => setAsAdmin(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-cyan-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-cyan-400" />
                <span>Mark as <strong>Admin Speaker</strong></span>
              </span>
            </label>

            <span className="text-[11px] text-slate-500">
              {participants.length} speakers ({adminCount} admins)
            </span>
          </div>
        </form>

        {/* Filter Bar: All Speakers vs Admin Speakers */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-850 text-xs">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filterMode === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Speakers ({participants.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('admin')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                filterMode === 'admin'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3 h-3" />
              <span>Admin Speakers ({adminCount})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
            title="Reset to default speakers"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        {/* List of Registered Speakers with Detected Names */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[180px] max-h-[300px]">
          {filteredParticipants.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/60 rounded-xl border border-slate-850 space-y-2">
              <ShieldAlert className="w-6 h-6 mx-auto text-slate-600" />
              <p>
                {filterMode === 'admin'
                  ? 'No admin speakers yet. Toggle the shield badge on any speaker to grant admin role.'
                  : 'No speakers in directory. Add an email above.'}
              </p>
            </div>
          ) : (
            filteredParticipants.map((p, idx) => (
              <div
                key={p.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                  p.isAdmin
                    ? 'bg-cyan-950/30 border-cyan-800/50 hover:border-cyan-700/60'
                    : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    {/* Admin Status Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleAdmin(p.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors ${
                        p.isAdmin
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'bg-slate-850 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-750'
                      }`}
                      title={p.isAdmin ? 'Admin Speaker: Click to revoke' : 'Regular Speaker: Click to make Admin'}
                    >
                      <Shield className="w-2.5 h-2.5" />
                      <span>{p.isAdmin ? 'Admin' : 'Speaker'}</span>
                    </button>

                    {/* Detected Name & Surname (editable inline) */}
                    {editingId === p.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="px-2 py-0.5 rounded bg-slate-900 border border-cyan-500 text-xs text-white focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveName(p.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveName(p.id)}
                          className="p-1 rounded bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                          title="Save name"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(p.id);
                          setEditingName(p.fullName);
                        }}
                        className="font-bold text-slate-200 hover:text-cyan-300 transition-colors truncate text-left"
                        title="Click to edit detected Name & Surname"
                      >
                        {p.fullName}
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 truncate mt-1 pl-0.5">{p.email}</p>
                </div>

                {/* Delete Speaker Button */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDeleteSpeaker(p.id, p.fullName)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-800/40 transition-colors"
                    title={`Delete speaker ${p.fullName}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div className="text-[11px] text-slate-400">
            Replaces &quot;Speaker 1&quot; &amp; &quot;Speaker 2&quot; with verified names
          </div>

          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            {appliedNotice ? <Check className="w-3.5 h-3.5 text-white" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{appliedNotice ? 'Applied!' : 'Apply to Transcript'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
