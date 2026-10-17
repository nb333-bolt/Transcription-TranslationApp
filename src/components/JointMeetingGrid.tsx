import React from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  ShieldCheck,
  Users,
  Grid,
  Maximize2,
  Send,
} from 'lucide-react';
import { Participant } from '../types';

interface JointMeetingGridProps {
  participants: Participant[];
  currentUserDisplayName: string;
  currentUserInitials: string;
  currentUserIsAdmin?: boolean;
  liveVideoRef: React.RefObject<HTMLVideoElement | null>;
  isCameraOff: boolean;
  isMicMuted: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onEndMeeting: () => void;
  recordingSeconds: number;
  viewMode: 'grid' | 'focus';
  onToggleViewMode: () => void;
  activeSpeakerName?: string;
  onOpenInviteModal?: () => void;
}

export const JointMeetingGrid: React.FC<JointMeetingGridProps> = ({
  participants,
  currentUserDisplayName,
  currentUserInitials,
  currentUserIsAdmin = true,
  liveVideoRef,
  isCameraOff,
  isMicMuted,
  onToggleCamera,
  onToggleMic,
  onEndMeeting,
  recordingSeconds,
  viewMode,
  onToggleViewMode,
  activeSpeakerName,
  onOpenInviteModal,
}) => {
  const formatSeconds = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Build the list of all joint meeting participants
  // 1. Current user ("You")
  // 2. Carys Evans (Admin), Gareth Thomas, and any other admin-added speakers
  const totalCount = 1 + participants.length;

  // Pre-assigned avatar gradient styles for participants for realistic Teams look
  const participantGradients = [
    'from-purple-700 to-indigo-800',
    'from-emerald-700 to-teal-800',
    'from-amber-700 to-orange-800',
    'from-blue-700 to-cyan-800',
    'from-rose-700 to-pink-800',
  ];

  return (
    <div className="flex-1 min-h-[380px] bg-slate-950 border border-slate-800 rounded-2xl relative overflow-hidden shadow-2xl flex flex-col justify-between p-3 group">
      {/* Teams Top Overlay Bar: Timer, Joint Meeting tag, and View controls */}
      <div className="relative z-10 flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          {/* Live recording indicator */}
          <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span className="font-semibold text-white">Joint Teams Meeting</span>
            <span className="font-mono text-cyan-300 text-[11px] ml-1">
              {formatSeconds(recordingSeconds)}
            </span>
          </div>

          {/* Participant count badge */}
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-xs text-slate-300">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>{totalCount} in meeting</span>
          </div>
        </div>

        {/* View mode toggle & Invite button */}
        <div className="flex items-center gap-2">
          {onOpenInviteModal && (
            <button
              type="button"
              onClick={onOpenInviteModal}
              className="flex items-center gap-1.5 bg-cyan-600/90 hover:bg-cyan-500 backdrop-blur-md px-3 py-1 rounded-full border border-cyan-400/30 text-[11px] text-white font-medium transition-all shadow-md"
              title="Send meeting invites to attendees or copy Teams link"
            >
              <Send className="w-3 h-3" />
              <span>Invite</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleViewMode}
            className="flex items-center gap-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[11px] text-slate-300 transition-colors"
            title="Toggle between Gallery Grid and Focus View"
          >
            {viewMode === 'grid' ? (
              <>
                <Grid className="w-3 h-3 text-cyan-400" />
                <span className="hidden sm:inline">Gallery Grid</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3 h-3 text-cyan-400" />
                <span className="hidden sm:inline">Speaker Focus</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: All Users Visible in Meeting Window */}
      <div
        className={`flex-1 grid gap-2.5 my-1 ${
          viewMode === 'focus'
            ? 'grid-cols-1'
            : totalCount <= 2
            ? 'grid-cols-1 sm:grid-cols-2'
            : totalCount <= 4
            ? 'grid-cols-2'
            : 'grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {/* ======================================================== */}
        {/* TILE 1: Current User ("You / Host") with Live Camera     */}
        {/* ======================================================== */}
        <div
          className={`relative rounded-xl overflow-hidden bg-slate-900 border transition-all flex items-center justify-center min-h-[160px] ${
            !isMicMuted
              ? 'border-cyan-500/80 shadow-md shadow-cyan-500/10'
              : 'border-slate-800'
          }`}
        >
          {/* Live Video Element (always mounted for rock-solid stream attachment) */}
          <video
            ref={liveVideoRef as any}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover scale-x-[-1] absolute inset-0 ${
              isCameraOff ? 'hidden' : 'block'
            }`}
          />

          {/* Teams Camera OFF Avatar State */}
          <div
            className={`w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-900 to-slate-950 ${
              !isCameraOff ? 'hidden' : 'flex'
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 border-2 border-cyan-400/50 flex items-center justify-center text-white text-xl font-bold shadow-lg mb-2">
              {currentUserInitials}
            </div>
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <VideoOff className="w-3 h-3 text-slate-500" />
              Camera is turned off
            </span>
          </div>

          {/* User Name Tag & Status in bottom-left */}
          <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-xs">
            <span className="font-semibold text-white truncate max-w-[120px]">
              {currentUserDisplayName} (You)
            </span>
            {currentUserIsAdmin && (
              <span className="inline-flex items-center gap-0.5 bg-cyan-950 text-cyan-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-cyan-700/60">
                <ShieldCheck className="w-2.5 h-2.5" />
                <span>Admin</span>
              </span>
            )}
            <span className="ml-0.5">
              {isMicMuted ? (
                <MicOff className="w-3 h-3 text-red-400" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
              )}
            </span>
          </div>

          {/* Camera status badge top-right */}
          <div className="absolute top-2 right-2 z-10">
            {isCameraOff ? (
              <span className="bg-red-950/80 text-red-300 border border-red-800/80 px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">
                <VideoOff className="w-2.5 h-2.5" />
                Off
              </span>
            ) : (
              <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">
                <Video className="w-2.5 h-2.5" />
                Live
              </span>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* TILES 2..N: All Registered Speakers in the Joint Meeting */}
        {/* ======================================================== */}
        {participants.map((participant, index) => {
          const initials = `${participant.firstName?.charAt(0) || ''}${
            participant.lastName?.charAt(0) || ''
          }`.toUpperCase() || 'SP';

          const gradient =
            participantGradients[index % participantGradients.length];

          const isCurrentlySpeaking =
            activeSpeakerName?.toLowerCase().includes(participant.firstName.toLowerCase()) ||
            activeSpeakerName?.toLowerCase().includes(participant.lastName.toLowerCase());

          return (
            <div
              key={participant.id}
              className={`relative rounded-xl overflow-hidden bg-slate-900 border transition-all flex flex-col items-center justify-center min-h-[160px] ${
                isCurrentlySpeaking
                  ? 'border-cyan-400 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/10'
                  : 'border-slate-800'
              }`}
            >
              {/* Teams Participant Tile View */}
              <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-900 to-slate-950 select-none">
                <div
                  className={`w-16 h-16 rounded-full bg-gradient-to-tr ${gradient} border-2 border-white/20 flex items-center justify-center text-white text-xl font-bold shadow-lg mb-2 relative`}
                >
                  {initials}
                  {isCurrentlySpeaking && (
                    <span className="absolute -inset-1 rounded-full border-2 border-cyan-400 animate-ping opacity-75"></span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-300 font-medium">
                  <span>{participant.fullName}</span>
                </div>

                {/* Subtle speaking waveform animation */}
                <div className="flex items-center gap-1 h-3 mt-1.5">
                  {[20, 50, 80, 45, 65, 30].map((h, barIdx) => (
                    <div
                      key={barIdx}
                      className={`w-1 rounded-full transition-all duration-200 ${
                        isCurrentlySpeaking ? 'bg-cyan-400' : 'bg-slate-700'
                      }`}
                      style={{
                        height: isCurrentlySpeaking
                          ? `${Math.max(25, h * (Math.sin(recordingSeconds * 4 + barIdx) + 1.2) * 0.6)}%`
                          : '25%',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Bottom tag: Participant Name, Admin badge & Mic status */}
              <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-xs">
                <span className="font-semibold text-white truncate max-w-[120px]">
                  {participant.fullName}
                </span>

                {participant.isAdmin && (
                  <span className="inline-flex items-center gap-0.5 bg-cyan-950 text-cyan-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-cyan-700/60">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span>Admin</span>
                  </span>
                )}

                <span className="w-2 h-2 rounded-full bg-emerald-400 ml-0.5"></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Teams Action Toolbar */}
      <div className="relative z-10 flex items-center justify-center pt-2">
        <div className="flex items-center gap-2.5 bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/15 shadow-2xl">
          {/* Turn On / Turn Off Camera Button */}
          <button
            type="button"
            onClick={onToggleCamera}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
              isCameraOff
                ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30 border border-red-500/50'
                : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
            }`}
            title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isCameraOff ? (
              <>
                <VideoOff className="w-4 h-4 text-red-400 shrink-0" />
                <span>Turn On Camera</span>
              </>
            ) : (
              <>
                <Video className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Turn Off Camera</span>
              </>
            )}
          </button>

          {/* Turn On / Turn Off Mic Button */}
          <button
            type="button"
            onClick={onToggleMic}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
              isMicMuted
                ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30 border border-red-500/50'
                : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
            }`}
            title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMicMuted ? (
              <>
                <MicOff className="w-4 h-4 text-red-400 shrink-0" />
                <span>Unmute</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Mute</span>
              </>
            )}
          </button>

          {/* End Meeting & Transcribe (Does not retain user image) */}
          <button
            type="button"
            onClick={onEndMeeting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors shadow-lg shadow-red-600/30"
            title="End meeting (no image retained) and transcribe"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>End Meeting</span>
          </button>
        </div>
      </div>
    </div>
  );
};
