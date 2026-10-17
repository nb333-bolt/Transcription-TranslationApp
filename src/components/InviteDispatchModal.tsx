import React, { useState } from 'react';
import {
  Send,
  X,
  Check,
  Calendar,
  Clock,
  MapPin,
  Users,
  Copy,
  Download,
  ExternalLink,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { ScheduledMeeting, Participant } from '../types';

interface InviteDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: ScheduledMeeting | null;
  allParticipants?: Participant[];
  currentUserEmail?: string;
  onInvitesSentSuccess?: (meetingId: string, recipientEmails: string[]) => void;
}

export const InviteDispatchModal: React.FC<InviteDispatchModalProps> = ({
  isOpen,
  onClose,
  meeting,
  allParticipants = [],
  currentUserEmail = 'nishabhatt.bhatt@gmail.com',
  onInvitesSentSuccess,
}) => {
  if (!isOpen || !meeting) return null;

  // Initialize emails from meeting invitees + speakers
  const initialEmails = Array.from(
    new Set([
      ...(meeting.inviteeEmails || []),
      ...(meeting.speakers ? meeting.speakers.map((s) => s.email) : []),
    ])
  ).filter((em) => em && em.includes('@'));

  const [recipients, setRecipients] = useState<string[]>(
    initialEmails.length > 0 ? initialEmails : [currentUserEmail, 'carys.evans@gov.wales']
  );
  const [newEmailInput, setNewEmailInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [individualSendingEmail, setIndividualSendingEmail] = useState<string | null>(null);
  const [individualSentStatus, setIndividualSentStatus] = useState<Record<string, string>>({});
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{
    success: boolean;
    message: string;
    deliveredCount: number;
    results: Array<{ email: string; status: string; channel: string; timestamp: string }>;
    icsContent?: string;
    outlookWebUrl?: string;
    googleCalendarUrl?: string;
    mailtoUrl?: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dispatch' | 'preview'>('dispatch');

  // Synchronize recipients whenever the meeting or modal state changes
  React.useEffect(() => {
    if (meeting) {
      const merged = Array.from(
        new Set([
          ...(meeting.inviteeEmails || []),
          ...(meeting.speakers ? meeting.speakers.map((s) => s.email) : []),
        ])
      ).filter((em) => em && em.includes('@'));
      if (merged.length > 0) {
        setRecipients(merged);
      }
    }
  }, [meeting?.id, isOpen]);

  // Add new email
  const handleAddEmail = () => {
    const trimmed = newEmailInput.trim();
    if (!trimmed) return;
    const split = trimmed
      .split(/[,\s;]+/)
      .map((e) => e.trim())
      .filter((e) => e.includes('@'));

    const merged = Array.from(new Set([...recipients, ...split]));
    setRecipients(merged);
    setNewEmailInput('');
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setRecipients(recipients.filter((em) => em !== emailToRemove));
  };

  const handleAddUserEmail = () => {
    if (currentUserEmail && !recipients.includes(currentUserEmail)) {
      setRecipients([...recipients, currentUserEmail]);
    }
  };

  // Formatted invitation text
  const teamsLink =
    meeting.teamsMeetingLink ||
    `https://teams.microsoft.com/l/meetup-join/19%3ameeting_${meeting.id}`;

  const agendaText =
    meeting.agenda && meeting.agenda.length > 0
      ? meeting.agenda
          .map(
            (ag, i) =>
              `  ${i + 1}. ${ag.title} (${ag.durationMinutes} mins) - ${ag.presenter || 'Speaker'}`
          )
          .join('\n')
      : '  1. Bilingual Strategy & Objectives (20 mins)\n  2. Live Multilingual Captioning & Translations (30 mins)\n  3. Review & Actions (10 mins)';

  const formattedInviteText = `================================================
MEETING INVITATION: ${meeting.title}
================================================
Date: ${meeting.date}
Time: ${meeting.startTime} - ${meeting.endTime}
Location / Room: ${meeting.roomName || 'Executive Boardroom'}
Assigned Speakers: ${meeting.speakers.map((s) => s.fullName).join(', ')}

JOIN MICROSOFT TEAMS MEETING:
${teamsLink}

AGENDA:
${agendaText}

SUPPORTED REAL-TIME CAPTION LANGUAGES:
${meeting.targetLanguages?.join(', ') || 'English, Welsh, French, Spanish, German, Hindi'}

Please accept the calendar invitation or join directly via Microsoft Teams.
================================================`;

  // Copy Teams link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(teamsLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Copy Full Invite Text
  const handleCopyText = () => {
    navigator.clipboard.writeText(formattedInviteText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  // Download .ics Calendar File
  const handleDownloadICS = () => {
    const url = `/api/meeting-invites/${meeting.id}/ics?title=${encodeURIComponent(
      meeting.title
    )}&date=${meeting.date}&startTime=${meeting.startTime}&endTime=${
      meeting.endTime
    }&roomName=${encodeURIComponent(meeting.roomName || 'Executive Boardroom')}`;
    
    // Create temporary download anchor
    const link = document.createElement('a');
    link.href = url;
    link.download = `${meeting.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_invite.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Send Direct Meeting Invite to a Single Recipient
  const handleSendDirectSingle = async (email: string) => {
    setIndividualSendingEmail(email);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/send-direct-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId: meeting.id,
          title: meeting.title,
          date: meeting.date,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          roomName: meeting.roomName,
          agenda: meeting.agenda,
          recipientEmail: email,
          invitees: [email],
          targetLanguages: meeting.targetLanguages,
          m365Sync: meeting.m365SyncEnabled ?? true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setIndividualSentStatus((prev) => ({
          ...prev,
          [email]: timeStr,
        }));
        if (onInvitesSentSuccess) {
          onInvitesSentSuccess(meeting.id, [email]);
        }
      } else {
        setErrorMessage(data.error || `Failed to dispatch direct invite to ${email}`);
      }
    } catch (e: any) {
      setErrorMessage(e.message || `Network error sending direct invite to ${email}`);
    } finally {
      setIndividualSendingEmail(null);
    }
  };

  // Primary Dispatch via Server / Microsoft Graph / Exchange & SMTP
  const handleDispatchInvites = async () => {
    if (recipients.length === 0) {
      setErrorMessage('Please add at least one recipient email address.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/send-direct-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId: meeting.id,
          title: meeting.title,
          date: meeting.date,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          roomName: meeting.roomName,
          agenda: meeting.agenda,
          invitees: recipients,
          targetLanguages: meeting.targetLanguages,
          m365Sync: meeting.m365SyncEnabled ?? true,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setDispatchResult({
          success: true,
          message: data.message || `Dispatched to ${recipients.length} recipients.`,
          deliveredCount: data.deliveredCount || recipients.length,
          results: data.results || [],
          icsContent: data.invitationDetails?.icsContent,
          outlookWebUrl: data.invitationDetails?.outlookWebUrl,
          googleCalendarUrl: data.invitationDetails?.googleCalendarUrl,
          mailtoUrl: data.invitationDetails?.mailtoUrl,
        });

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newStatuses: Record<string, string> = {};
        recipients.forEach((em) => {
          newStatuses[em] = timeStr;
        });
        setIndividualSentStatus((prev) => ({ ...prev, ...newStatuses }));

        if (onInvitesSentSuccess) {
          onInvitesSentSuccess(meeting.id, recipients);
        }
      } else {
        setErrorMessage(data.error || 'Failed to dispatch meeting invites.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Network error while dispatching meeting invites.');
    } finally {
      setIsSending(false);
    }
  };

  // Outlook Web deep link
  const startCompact = `${meeting.date.replace(/-/g, '')}T${meeting.startTime.replace(':', '')}00`;
  const endCompact = `${meeting.date.replace(/-/g, '')}T${meeting.endTime.replace(':', '')}00`;
  const encodedSubject = encodeURIComponent(`Invitation: ${meeting.title}`);
  const encodedBody = encodeURIComponent(formattedInviteText);
  const encodedLocation = encodeURIComponent(meeting.roomName || 'Executive Boardroom');

  const fallbackOutlookUrl = `https://outlook.office.com/calendar/0/deeplink/compose?subject=${encodedSubject}&body=${encodedBody}&startdt=${meeting.date}T${meeting.startTime}:00&enddt=${meeting.date}T${meeting.endTime}:00&location=${encodedLocation}&to=${encodeURIComponent(
    recipients.join(';')
  )}`;

  const fallbackGoogleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedSubject}&dates=${startCompact}/${endCompact}&details=${encodedBody}&location=${encodedLocation}&add=${encodeURIComponent(
    recipients.join(',')
  )}`;

  const fallbackMailto = `mailto:${encodeURIComponent(
    recipients.join(',')
  )}?subject=${encodedSubject}&body=${encodedBody}`;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Send Meeting Invites
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Ready to Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Send calendar invitations &amp; Teams join details to attendees
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Tabs */}
            <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-xs">
              <button
                onClick={() => setActiveTab('dispatch')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'dispatch'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Send &amp; Channels
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'preview'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Preview Email
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

        {/* Meeting Overview Pill */}
        <div className="bg-slate-950/90 border-b border-slate-800/80 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-semibold text-white text-sm">{meeting.title}</div>
            <div className="flex items-center gap-3 text-slate-400 text-[11px] mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                {meeting.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                {meeting.startTime} - {meeting.endTime}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                {meeting.roomName || 'Executive Boardroom'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-medium border border-slate-700 transition-colors"
              title="Copy Teams Join URL"
            >
              {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLink ? 'Copied Teams Link!' : 'Copy Teams Link'}</span>
            </button>

            <button
              onClick={handleDownloadICS}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-medium border border-slate-700 transition-colors"
              title="Download .ics for Outlook or Apple Calendar"
            >
              <Download className="w-3 h-3 text-cyan-400" />
              <span>Download .ics</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-900/60">
          {activeTab === 'dispatch' ? (
            <>
              {/* Error Notice */}
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Success Banner */}
              {dispatchResult && (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>{dispatchResult.message}</span>
                    </div>
                    <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                      {dispatchResult.deliveredCount} Delivered
                    </span>
                  </div>

                  {/* Delivery Audit Table */}
                  <div className="bg-slate-950/80 rounded-xl p-3 border border-emerald-900/40 space-y-2 text-xs">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Delivery Confirmation Log:
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 divide-y divide-slate-800/60 pr-1">
                      {dispatchResult.results.map((res, i) => (
                        <div key={i} className="flex items-center justify-between pt-1.5 first:pt-0">
                          <span className="font-mono text-slate-200 text-[11px]">{res.email}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 hidden sm:inline">
                              {res.channel}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded font-medium border border-emerald-800/50">
                              <Check className="w-2.5 h-2.5" /> Delivered
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 1. Recipient List & Email Input */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> 1. Invitees &amp; Recipients ({recipients.length})
                  </div>
                  {currentUserEmail && !recipients.includes(currentUserEmail) && (
                    <button
                      type="button"
                      onClick={handleAddUserEmail}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add my email ({currentUserEmail})
                    </button>
                  )}
                </div>

                {/* Recipient Chips */}
                <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 bg-slate-900 rounded-xl border border-slate-800">
                  {recipients.map((email) => {
                    const isM365 =
                      email.includes('.wales') ||
                      email.includes('council.gov') ||
                      email.includes('cymru') ||
                      email.includes('microsoft');
                    const isCurrentUser = email === currentUserEmail;

                    return (
                      <span
                        key={email}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          isCurrentUser
                            ? 'bg-cyan-950/80 text-cyan-200 border-cyan-700/60'
                            : isM365
                            ? 'bg-blue-950/70 text-blue-200 border-blue-800/60'
                            : 'bg-slate-800 text-slate-200 border-slate-700'
                        }`}
                      >
                        <span className="font-mono text-[11px]">{email}</span>
                        {isCurrentUser && (
                          <span className="text-[9px] bg-cyan-800/80 text-cyan-100 px-1 rounded">
                            You
                          </span>
                        )}
                        {isM365 && (
                          <span className="text-[9px] bg-blue-800/80 text-blue-100 px-1 rounded">
                            M365
                          </span>
                        )}
                        {/* Direct Send button for this specific recipient */}
                        <button
                          type="button"
                          onClick={() => handleSendDirectSingle(email)}
                          disabled={individualSendingEmail === email}
                          className="hover:text-cyan-200 p-0.5 ml-0.5 text-cyan-400 hover:bg-cyan-800/40 rounded transition-colors cursor-pointer"
                          title={individualSentStatus[email] ? `Sent at ${individualSentStatus[email]} - Click to resend direct invite` : `Send direct invite to ${email}`}
                        >
                          {individualSendingEmail === email ? (
                            <span className="w-2.5 h-2.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin inline-block"></span>
                          ) : individualSentStatus[email] ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Send className="w-2.5 h-2.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(email)}
                          className="hover:text-rose-400 p-0.5 ml-0.5 rounded cursor-pointer"
                          title="Remove recipient"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}

                  {recipients.length === 0 && (
                    <span className="text-xs text-slate-500 italic p-1">
                      No recipients yet. Add email addresses below.
                    </span>
                  )}
                </div>

                {/* Add new email input */}
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Add attendee email (e.g. colleague@company.com)"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEmail();
                      }
                    }}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddEmail}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* 2. Dispatch Channels */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" /> 2. Send Direct Invitation
                </div>

                {/* Primary Dispatch Action */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                      <span>Dispatch via Microsoft 365 Exchange &amp; Email</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800">
                        Direct SMTP / Graph
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sends customized RFC 5545 calendar invites, bilingual agenda details, and Teams join links to all {recipients.length} attendees.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDispatchInvites}
                    disabled={isSending || recipients.length === 0}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-cyan-900/40 transition-all shrink-0 cursor-pointer"
                  >
                    {isSending ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Dispatching...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Direct Invites to All ({recipients.length})</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Quick 1-Click Launchers (Outlook, Google, Mailto, .ics) */}
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-medium text-slate-400">
                    Or send directly using your personal or organization email apps:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Microsoft Outlook Web Deep Link */}
                    <a
                      href={dispatchResult?.outlookWebUrl || fallbackOutlookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/50 text-xs text-white transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                          O
                        </div>
                        <div>
                          <div className="font-medium group-hover:text-blue-300 transition-colors">
                            Microsoft Outlook (Web)
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Pre-populates event with attendees &amp; Teams link
                          </div>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors shrink-0" />
                    </a>

                    {/* Google Calendar Deep Link */}
                    <a
                      href={dispatchResult?.googleCalendarUrl || fallbackGoogleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 text-xs text-white transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                          G
                        </div>
                        <div>
                          <div className="font-medium group-hover:text-amber-300 transition-colors">
                            Google Calendar
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Create event with attendees in Gmail / Calendar
                          </div>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0" />
                    </a>

                    {/* Default Email Client (mailto:) */}
                    <a
                      href={dispatchResult?.mailtoUrl || fallbackMailto}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 text-xs text-white transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-medium group-hover:text-emerald-300 transition-colors">
                            Desktop Email Client (mailto:)
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Opens Outlook, Apple Mail or Thunderbird
                          </div>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0" />
                    </a>

                    {/* Download .ics Calendar File */}
                    <button
                      type="button"
                      onClick={handleDownloadICS}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/50 text-xs text-white transition-all group text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
                          <Download className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-medium group-hover:text-purple-300 transition-colors">
                            Download .ics Calendar File
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Standard iCalendar format for all apps
                          </div>
                        </div>
                      </div>
                      <Download className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 transition-colors shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* PREVIEW TAB: Formatted Email Text & Copy */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Invitation Preview</h4>
                  <p className="text-xs text-slate-400">
                    This email text and iCalendar invite will be dispatched to attendees.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyText}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition-colors"
                  >
                    {copiedText ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedText ? 'Copied Full Invite!' : 'Copy Full Invite'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed select-all">
                {formattedInviteText}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Microsoft 365 Exchange Online &amp; RFC 5545 iCalendar standard</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
