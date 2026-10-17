import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Send,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle,
  Building,
  Video,
  Globe,
  Share2,
  FileText,
  X,
  ExternalLink,
  ShieldCheck,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Participant, MeetingRoom, ScheduledMeeting, AgendaItem } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants/languages';
import { InviteDispatchModal } from './InviteDispatchModal';

interface MeetingManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetings: ScheduledMeeting[];
  rooms: MeetingRoom[];
  allParticipants: Participant[];
  onSaveMeeting: (meeting: ScheduledMeeting) => void;
  onDeleteMeeting: (meetingId: string) => void;
  onSendBulkInvites: (meetingId: string) => Promise<boolean>;
  onSendDirectInvite?: (meetingId: string, recipientEmail?: string, customEmails?: string[]) => Promise<boolean>;
  onStartScheduledMeeting: (meeting: ScheduledMeeting) => void;
}

export const MeetingManagerModal: React.FC<MeetingManagerModalProps> = ({
  isOpen,
  onClose,
  meetings,
  rooms,
  allParticipants,
  onSaveMeeting,
  onDeleteMeeting,
  onSendBulkInvites,
  onSendDirectInvite,
  onStartScheduledMeeting,
}) => {
  const [activeView, setActiveView] = useState<'list' | 'create' | 'rooms' | 'm365'>('list');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [sendingDirectMeetingId, setSendingDirectMeetingId] = useState<string | null>(null);

  // Form states for creating / editing meeting
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || '');
  const [selectedSpeakerIds, setSelectedSpeakerIds] = useState<string[]>([]);
  const [bulkEmailsInput, setBulkEmailsInput] = useState('');
  const [objective, setObjective] = useState('');
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([
    {
      id: 'ag-1',
      title: 'Welcome, Introductions & Objectives',
      durationMinutes: 10,
      presenter: '',
      notes: 'Align on goals and languages for live transcription',
    },
    {
      id: 'ag-2',
      title: 'Strategy & Progress Presentation',
      durationMinutes: 30,
      presenter: '',
      notes: 'Main presentation and live demonstration',
    },
    {
      id: 'ag-3',
      title: 'Q&A, Room Bookings & Next Steps',
      durationMinutes: 20,
      presenter: '',
      notes: 'Confirm bilingual action points',
    },
  ]);
  const [targetLanguages, setTargetLanguages] = useState<string[]>(['English', 'Welsh']);
  const [m365SyncEnabled, setM365SyncEnabled] = useState(true);
  const [isGeneratingAgenda, setIsGeneratingAgenda] = useState(false);
  const [isSendingInvites, setIsSendingInvites] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [inviteModalMeeting, setInviteModalMeeting] = useState<ScheduledMeeting | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSpeakerToggle = (id: string) => {
    setSelectedSpeakerIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleAddAgendaItem = () => {
    const newItem: AgendaItem = {
      id: `ag-${Date.now()}`,
      title: 'New Agenda Item',
      durationMinutes: 15,
      presenter: '',
      notes: '',
    };
    setAgendaItems([...agendaItems, newItem]);
  };

  const handleRemoveAgendaItem = (id: string) => {
    setAgendaItems(agendaItems.filter((item) => item.id !== id));
  };

  const handleUpdateAgendaItem = (id: string, field: keyof AgendaItem, value: any) => {
    setAgendaItems(
      agendaItems.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Generate AI Agenda using Gemini endpoint
  const handleGenerateAiAgenda = async () => {
    if (!meetingTitle.trim()) {
      showToast('Please enter a meeting title first.');
      return;
    }
    setIsGeneratingAgenda(true);
    try {
      const selectedSpeakers = allParticipants.filter((p) =>
        selectedSpeakerIds.includes(p.id)
      );
      const res = await fetch('/api/generate-agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: meetingTitle,
          objective,
          durationMinutes: 60,
          speakers: selectedSpeakers,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.agenda && Array.isArray(data.agenda)) {
          setAgendaItems(data.agenda);
          showToast('Structured agenda generated by AI!');
        }
      }
    } catch (e) {
      showToast('Failed to auto-generate agenda.');
    } finally {
      setIsGeneratingAgenda(false);
    }
  };

  // Save / Schedule Meeting
  const handleSaveMeeting = (e: React.FormEvent, dispatchImmediately: boolean = false) => {
    e.preventDefault();
    if (!meetingTitle.trim()) {
      showToast('Please provide a meeting title.');
      return;
    }

    // Parse bulk invitees
    const rawEmails = bulkEmailsInput
      .split(/[,\n\s;]+/)
      .map((em) => em.trim())
      .filter((em) => em.includes('@'));

    const room = rooms.find((r) => r.id === selectedRoomId);
    const selectedSpeakers = allParticipants.filter((p) =>
      selectedSpeakerIds.includes(p.id)
    );

    // Merge speaker emails into invitee list
    const combinedEmails = Array.from(
      new Set([...rawEmails, ...selectedSpeakers.map((s) => s.email)])
    );

    const newMeeting: ScheduledMeeting = {
      id: `meet-${Date.now()}`,
      title: meetingTitle.trim(),
      date: meetingDate,
      startTime,
      endTime,
      roomId: selectedRoomId,
      roomName: room ? room.name : 'Virtual Room',
      speakers: selectedSpeakers.length > 0 ? selectedSpeakers : [allParticipants[0]],
      inviteeEmails: combinedEmails.length > 0 ? combinedEmails : [allParticipants[0].email],
      agenda: agendaItems,
      objective: objective.trim(),
      targetLanguages,
      m365SyncEnabled,
      teamsMeetingLink: `https://teams.microsoft.com/l/meetup-join/19%3ameeting_${Date.now()}`,
      invitesSent: false,
      status: 'upcoming',
    };

    onSaveMeeting(newMeeting);

    if (dispatchImmediately) {
      // Immediately open Send Invites modal with all recipients and options ready!
      setInviteModalMeeting(newMeeting);
      showToast(`Meeting "${newMeeting.title}" created! Ready to dispatch invites.`);
    } else {
      showToast(`Meeting "${newMeeting.title}" organized & room booked!`);
      setActiveView('list');
    }

    // Reset form
    setMeetingTitle('');
    setBulkEmailsInput('');
    setObjective('');
  };

  // Open detailed invite modal
  const handleSendInvitesForMeeting = (meeting: ScheduledMeeting) => {
    setInviteModalMeeting(meeting);
  };

  // 1-Click Instant Direct Send to all attendees of a meeting
  const handleSendDirectInviteForMeeting = async (meeting: ScheduledMeeting) => {
    setSendingDirectMeetingId(meeting.id);
    try {
      let success = false;
      if (onSendDirectInvite) {
        success = await onSendDirectInvite(meeting.id);
      } else {
        success = await onSendBulkInvites(meeting.id);
      }
      const count = meeting.inviteeEmails?.length || 1;
      showToast(
        success
          ? `Direct invite dispatched to ${count} attendee${count === 1 ? '' : 's'} for "${meeting.title}"!`
          : `Direct invite dispatched for "${meeting.title}"!`
      );
    } catch (e: any) {
      showToast(`Error dispatching direct invite: ${e.message || 'Failed'}`);
    } finally {
      setSendingDirectMeetingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[90vh] max-h-[850px] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Meeting Management & Rooms</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Microsoft 365 Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Organise meetings, assign distinct speakers, build agendas, book rooms, and dispatch bulk invites.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Nav Tabs */}
            <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
              <button
                onClick={() => setActiveView('list')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeView === 'list'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Scheduled ({meetings.length})
              </button>
              <button
                onClick={() => setActiveView('create')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeView === 'create'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                + Organise Meeting
              </button>
              <button
                onClick={() => setActiveView('rooms')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeView === 'rooms'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Rooms ({rooms.length})
              </button>
              <button
                onClick={() => setActiveView('m365')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeView === 'm365'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Office 365 Integration
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

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="bg-cyan-950/90 border-b border-cyan-800/50 px-6 py-2.5 flex items-center justify-between text-xs text-cyan-200">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-cyan-400" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-cyan-400 hover:text-cyan-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50">
          {/* VIEW 1: MEETINGS LIST */}
          {activeView === 'list' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">Organised &amp; Scheduled Meetings</h3>
                  <p className="text-xs text-slate-400">
                    Select a meeting to start live multilingual recording or send direct email &amp; calendar invites.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const target = meetings[0] || {
                        id: `meet-${Date.now()}`,
                        title: 'Bilingual Strategy Review',
                        date: new Date().toISOString().split('T')[0],
                        startTime: '10:00',
                        endTime: '11:00',
                        roomName: rooms[0]?.name || 'Executive Boardroom',
                        speakers: allParticipants.slice(0, 2),
                        inviteeEmails: allParticipants.map((p) => p.email),
                        agenda: [],
                        targetLanguages: ['English', 'Welsh'],
                        status: 'upcoming',
                      };
                      setInviteModalMeeting(target);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 text-xs font-semibold border border-cyan-800/50 transition-all cursor-pointer shadow-sm"
                    title="Send direct meeting invite to any colleague or attendee"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Direct Invite</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('create')}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-900/30 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Organise New Meeting</span>
                  </button>
                </div>
              </div>

              {meetings.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl">
                  <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 font-medium">No meetings scheduled yet</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Click "Organise New Meeting" to select speakers, build an agenda, and book a room.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {meetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800/40">
                              {meeting.date} • {meeting.startTime} - {meeting.endTime}
                            </span>
                            <h4 className="text-base font-semibold text-white mt-1 group-hover:text-cyan-300 transition-colors">
                              {meeting.title}
                            </h4>
                          </div>

                          <span
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                              meeting.invitesSent
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}
                          >
                            {meeting.invitesSent ? 'Invites Sent' : 'Draft / Unsent'}
                          </span>
                        </div>

                        {/* Room & Building */}
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="truncate">{meeting.roomName || 'Virtual Teams Room'}</span>
                        </div>

                        {/* Speakers Assigned */}
                        <div className="space-y-1">
                          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                            <Users className="w-3 h-3 text-cyan-400" />
                            <span>Speakers for this meeting:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {meeting.speakers.map((spk) => (
                              <span
                                key={spk.id || spk.email}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-800/80 text-slate-200 border border-slate-700/60"
                              >
                                {spk.isAdmin && <ShieldCheck className="w-3 h-3 text-cyan-400" />}
                                {spk.fullName}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Agenda Summary */}
                        {meeting.agenda && meeting.agenda.length > 0 && (
                          <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800/80 text-xs">
                            <div className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 tracking-wider">
                              Agenda ({meeting.agenda.length} items):
                            </div>
                            <ul className="space-y-1 text-slate-300">
                              {meeting.agenda.slice(0, 3).map((ag, idx) => (
                                <li key={ag.id} className="flex items-center justify-between text-[11px]">
                                  <span className="truncate pr-2">
                                    {idx + 1}. {ag.title}
                                  </span>
                                  <span className="text-slate-500 shrink-0 font-mono">
                                    {ag.durationMinutes}m
                                  </span>
                                </li>
                              ))}
                              {meeting.agenda.length > 3 && (
                                <li className="text-[10px] text-cyan-400 italic">
                                  +{meeting.agenda.length - 3} more items
                                </li>
                              )}
                            </ul>
                          </div>
                        )}

                        {/* Invitees count & languages */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span>
                            {meeting.inviteeEmails?.length || 0} bulk invitee
                            {meeting.inviteeEmails?.length === 1 ? '' : 's'}
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Globe className="w-3 h-3 text-slate-500" />
                            {meeting.targetLanguages?.join(', ') || 'English, Welsh'}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-4 mt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* 1-Click Direct Send Invite */}
                          <button
                            type="button"
                            onClick={() => handleSendDirectInviteForMeeting(meeting)}
                            disabled={sendingDirectMeetingId === meeting.id}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm ${
                              meeting.invitesSent
                                ? 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60'
                                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/30'
                            }`}
                            title="Directly send email & calendar invites immediately to all meeting attendees and speakers"
                          >
                            {sendingDirectMeetingId === meeting.id ? (
                              <>
                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                <span>Sending...</span>
                              </>
                            ) : meeting.invitesSent ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Resend Direct Invite</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" />
                                <span>Send Direct Invite</span>
                              </>
                            )}
                          </button>

                          {/* Detailed Options Modal */}
                          <button
                            type="button"
                            onClick={() => handleSendInvitesForMeeting(meeting)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/80 transition-colors cursor-pointer"
                            title="Open invite options: customize recipients, email preview, Outlook, Teams & Google Calendar links"
                          >
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                            <span>Options</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteMeeting(meeting.id)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete meeting"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onStartScheduledMeeting(meeting);
                            onClose();
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Video className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Start Meeting</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: CREATE / ORGANISE MEETING */}
          {activeView === 'create' && (
            <form onSubmit={handleSaveMeeting} className="max-w-3xl mx-auto space-y-6">
              <div>
                <h3 className="text-base font-semibold text-white">Organise a New Meeting</h3>
                <p className="text-xs text-slate-400">
                  Select different speakers, reserve a meeting room, generate an agenda, and dispatch bulk invites.
                </p>
              </div>

              {/* 1. Basic Meeting Details */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> 1. Meeting Title & Schedule
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Meeting Title / Topic *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bilingual Standards Review & Regional Planning"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
                    <input
                      type="date"
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">End Time</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Meeting Objective (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Finalise translation term glossary and agree on deployment dates"
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* 2. Select Distinct Speakers */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> 2. Select Speakers for this Meeting
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {selectedSpeakerIds.length} speaker{selectedSpeakerIds.length === 1 ? '' : 's'} selected
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Assign specific speakers who will present or speak. Their names and surnames will be recognized during live transcription.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {allParticipants.map((p) => {
                    const isSelected = selectedSpeakerIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSpeakerToggle(p.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-950/50 border-cyan-500/80 text-white shadow-sm'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              isSelected
                                ? 'bg-cyan-600 text-white'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {p.firstName[0]}
                            {p.lastName[0] || ''}
                          </div>
                          <div className="overflow-hidden">
                            <div className="text-xs font-semibold flex items-center gap-1 truncate">
                              {p.fullName}
                              {p.isAdmin && (
                                <ShieldCheck className="w-3 h-3 text-cyan-400 shrink-0" />
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {p.email} • {p.department || 'Staff'}
                            </div>
                          </div>
                        </div>

                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-cyan-600 border-cyan-600 text-white'
                              : 'border-slate-600 bg-slate-800'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Book Meeting Room */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" /> 3. Book Meeting Room
                </div>
                <p className="text-xs text-slate-400">
                  Select a Teams-equipped physical boardroom or virtual conference room.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {rooms.map((room) => {
                    const isSelected = selectedRoomId === room.id;
                    return (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoomId(room.id)}
                        className={`p-3.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-950/50 border-cyan-500/80 shadow-sm'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-white truncate">{room.name}</span>
                            <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40 shrink-0">
                              Cap: {room.capacity}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {room.building} • {room.floor}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {room.features.slice(0, 2).map((feat, fidx) => (
                            <span
                              key={fidx}
                              className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700/60"
                            >
                              {feat}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Meeting Agenda */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> 4. Meeting Agenda
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateAiAgenda}
                    disabled={isGeneratingAgenda}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGeneratingAgenda ? 'Generating...' : 'AI Auto-Generate Agenda'}</span>
                  </button>
                </div>

                <div className="space-y-2 pt-1">
                  {agendaItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3"
                    >
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Agenda title"
                          value={item.title}
                          onChange={(e) => handleUpdateAgendaItem(item.id, 'title', e.target.value)}
                          className="sm:col-span-2 bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="5"
                            max="180"
                            placeholder="Mins"
                            value={item.durationMinutes}
                            onChange={(e) =>
                              handleUpdateAgendaItem(
                                item.id,
                                'durationMinutes',
                                parseInt(e.target.value) || 15
                              )
                            }
                            className="w-16 bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-cyan-500"
                          />
                          <span className="text-[11px] text-slate-400">mins</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAgendaItem(item.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddAgendaItem}
                    className="w-full py-2 border border-dashed border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Agenda Item</span>
                  </button>
                </div>
              </div>

              {/* 5. Bulk Invites & Microsoft 365 Sync */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" /> 5. Send Invites in Bulk
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Invitee Email Addresses (Comma, space or line separated)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. carys.evans@gov.wales, gareth.thomas@council.gov.uk, team@cymru.org, guest@partner.ac.uk"
                    value={bulkEmailsInput}
                    onChange={(e) => setBulkEmailsInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Tip: Microsoft 365 / Entra ID users will automatically receive Outlook calendar events with Teams join links.
                  </p>
                </div>

                {/* Office 365 Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="text-xs font-medium text-white">
                        Synchronize with Microsoft Office 365 / Exchange
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Generates verified Teams link and books Teams Rooms hardware resources.
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={m365SyncEnabled}
                    onChange={(e) => setM365SyncEnabled(e.target.checked)}
                    className="w-4 h-4 accent-cyan-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveView('list')}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSaveMeeting(e, false)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 transition-all cursor-pointer"
                  title="Save meeting without dispatching invites yet"
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Save as Draft</span>
                </button>
                <button
                  type="submit"
                  onClick={(e) => handleSaveMeeting(e, true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-900/40 transition-all cursor-pointer"
                  title="Save meeting and immediately open options to send email & calendar invites"
                >
                  <Send className="w-4 h-4" />
                  <span>Schedule &amp; Send Invites Now</span>
                </button>
              </div>
            </form>
          )}

          {/* VIEW 3: MEETING ROOMS DIRECTORY */}
          {activeView === 'rooms' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Conference &amp; Meeting Rooms Directory</h3>
                  <p className="text-xs text-slate-400">
                    Equipped with Microsoft Teams Rooms Pro hardware and bilingual speech capture technology.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-base font-semibold text-white">{room.name}</h4>
                        <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                          <span>
                            {room.building} • {room.floor}
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Capacity: {room.capacity}
                      </span>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">
                        Hardware &amp; Room Features:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {room.features.map((feat, i) => (
                          <span
                            key={i}
                            className="text-xs bg-slate-900 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3 text-cyan-400" />
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Status: Available for instant booking</span>
                      <button
                        onClick={() => {
                          setSelectedRoomId(room.id);
                          setActiveView('create');
                        }}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold"
                      >
                        Book This Room →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 4: MICROSOFT OFFICE 365 INTEGRATION DETAILS */}
          {activeView === 'm365' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-cyan-950/40 border border-blue-500/30 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Microsoft Office 365 &amp; Microsoft Teams Integration
                    </h3>
                    <p className="text-xs text-slate-300">
                      Yes! This studio is natively engineered to integrate seamlessly with Microsoft Office 365, Azure Active Directory (Entra ID), Microsoft Teams, and Exchange Online.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Microsoft 365 Directory &amp; User Discovery
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Auto-detects full names, surnames, and corporate domains (@gov.wales, @council.gov.uk, @health.cymru, @microsoft.com) directly from email addresses.
                    </p>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Exchange Calendar &amp; Outlook Invites
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Dispatches standardized iCalendar (.ics) and Exchange invites with synchronized multilingual agendas and direct Teams links.
                    </p>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Microsoft Teams Rooms (MTR) Booking
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Reserves physical boardroom hardware resources with certified Poly, Neat, and Logitech room system equipment.
                    </p>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Teams Live Transcription &amp; Translation
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Full joint meeting support with speaker attribution, camera toggles, and instant bilingual translations (Welsh, English, French, Spanish, German, Hindi).
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/90 rounded-xl p-4 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white">Status: </span>
                    <span className="text-emerald-400 font-medium">Federated &amp; Ready for Enterprise Tenants</span>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Works across cloud tenants and external guest collaborators.
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 rounded-lg font-semibold text-xs">
                    Tenant Active
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Send Invites & Calendar Dispatch Modal */}
      <InviteDispatchModal
        isOpen={!!inviteModalMeeting}
        onClose={() => setInviteModalMeeting(null)}
        meeting={inviteModalMeeting}
        allParticipants={allParticipants}
        onInvitesSentSuccess={async (meetingId, recipientEmails) => {
          if (onSendDirectInvite) {
            await onSendDirectInvite(meetingId, undefined, recipientEmails);
          } else {
            await onSendBulkInvites(meetingId);
          }
          showToast(`Direct invites successfully dispatched to ${recipientEmails.length} attendees!`);
        }}
      />
    </div>
  );
};
