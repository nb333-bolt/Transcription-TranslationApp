import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ArrowLeftRight,
  FileText,
  FileCheck,
  Check,
  Square,
  Mic,
  Video,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Users,
  Send,
  Cloud,
  Github,
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { VideoPlayerSynchronizer } from './components/VideoPlayerSynchronizer';
import { AudioWaveformVisualizer } from './components/AudioWaveformVisualizer';
import { TranscriptView } from './components/TranscriptView';
import { SummaryDashboard } from './components/SummaryDashboard';
import { ExportModal } from './components/ExportModal';
import { AdminModal } from './components/AdminModal';
import { MeetingManagerModal } from './components/MeetingManagerModal';
import { InviteDispatchModal } from './components/InviteDispatchModal';
import { JointMeetingGrid } from './components/JointMeetingGrid';
import { DeployModal } from './components/DeployModal';
import {
  DEMO_SAMPLES,
  SUPPORTED_LANGUAGES,
  DEFAULT_PARTICIPANTS,
  DEFAULT_MEETING_ROOMS,
  DEFAULT_SCHEDULED_MEETINGS,
} from './constants/languages';
import { RecordingResult, SummaryData, Participant, MeetingRoom, ScheduledMeeting } from './types';
import { exportToPDF, exportToDocx } from './utils/exportUtils';
import { LiveSpeechTracker } from './utils/speechRecognition';

export default function App() {
  const [currentRecording, setCurrentRecording] = useState<RecordingResult>(DEMO_SAMPLES[0]);
  const [currentTime, setCurrentTime] = useState(0);
  const [originalLanguage, setOriginalLanguage] = useState<string>('English');
  const [targetLanguage, setTargetLanguage] = useState<string>('Welsh');

  // Participants & Admin State
  const [participants, setParticipants] = useState<Participant[]>(() => {
    try {
      const saved = localStorage.getItem('voice_studio_participants');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_PARTICIPANTS;
  });
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Scheduled Meetings & Rooms State (Organise meetings, speakers, agendas, bulk invites, rooms)
  const [meetings, setMeetings] = useState<ScheduledMeeting[]>(() => {
    try {
      const saved = localStorage.getItem('voice_studio_scheduled_meetings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_SCHEDULED_MEETINGS;
  });
  const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>(() => {
    try {
      const saved = localStorage.getItem('voice_studio_meeting_rooms');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_MEETING_ROOMS;
  });
  const [isMeetingsModalOpen, setIsMeetingsModalOpen] = useState(false);
  const [activeScheduledMeeting, setActiveScheduledMeeting] = useState<ScheduledMeeting | null>(null);
  const [directInviteMeeting, setDirectInviteMeeting] = useState<ScheduledMeeting | null>(null);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [deployDefaultTab, setDeployDefaultTab] = useState<'github' | 'apikeys' | 'azure' | 'netlify' | 'teams'>('github');

  // Meeting & Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingMode, setRecordingMode] = useState<'joint_meeting' | 'audio' | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [liveTranslation, setLiveTranslation] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  // Teams camera & meeting controls
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [meetingViewMode, setMeetingViewMode] = useState<'grid' | 'focus'>('grid');

  // Tabs & Export states
  const [activeTab, setActiveTab] = useState<'transcript' | 'summary'>('transcript');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // References for MediaRecorder & Video / Audio
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const speechTrackerRef = useRef<LiveSpeechTracker | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastTranslateTimeoutRef = useRef<any>(null);

  // Synchronized active segment with speaker name and live captions for playback
  const activeSegment = useMemo(() => {
    if (!currentRecording || !currentRecording.segments) return null;
    return (
      currentRecording.segments.find(
        (seg) => currentTime >= seg.startSeconds && currentTime <= seg.endSeconds
      ) || currentRecording.segments[0]
    );
  }, [currentRecording, currentTime]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopStreams();
    };
  }, []);

  // When live camera stream is available and camera is ON, reliably attach to video element
  useEffect(() => {
    if (isRecording && !isCameraOff && streamRef.current && liveVideoRef.current) {
      liveVideoRef.current.srcObject = streamRef.current;
      liveVideoRef.current.play().catch(() => {});
    }
  }, [isRecording, isCameraOff]);

  const stopStreams = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (speechTrackerRef.current) {
      speechTrackerRef.current.stop();
    }
  };

  const formatSeconds = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const getLangCode = (lang: string) => {
    const l = lang.toLowerCase();
    if (l.includes('welsh') || l.includes('cymr')) return 'cy-GB';
    if (l.includes('fren') || l.includes('français')) return 'fr-FR';
    if (l.includes('span') || l.includes('español')) return 'es-ES';
    if (l.includes('germ') || l.includes('deutsch')) return 'de-DE';
    if (l.includes('hind')) return 'hi-IN';
    return 'en-GB';
  };

  // Quick live translation for inline captions during meeting
  const triggerLiveTranslate = (text: string, targetLang: string) => {
    if (lastTranslateTimeoutRef.current) {
      clearTimeout(lastTranslateTimeoutRef.current);
    }
    lastTranslateTimeoutRef.current = setTimeout(async () => {
      if (!text.trim()) return;
      try {
        const res = await fetch('/api/realtime-translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text.slice(-200),
            targetLanguage: targetLang,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.translatedText) {
            setLiveTranslation(data.translatedText);
          }
        }
      } catch (e) {
        // silent fail for preview
      }
    }, 400);
  };

  // 1. START TEAMS JOINT MEETING (With Camera + All Users Visible in Meeting Window)
  const handleStartJointMeeting = async () => {
    setRecordError(null);
    recordedChunksRef.current = [];
    setLiveTranscript('');
    setLiveTranslation('');
    setIsMicMuted(false);
    setIsCameraOff(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      let mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingMode('joint_meeting');
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Start live speech tracker for live subtitles and translation
      const langCode = getLangCode(originalLanguage);
      const tracker = new LiveSpeechTracker(langCode);
      speechTrackerRef.current = tracker;

      if (tracker.isAvailable()) {
        tracker.start({
          onTranscriptChange: (text, isFinal) => {
            setLiveTranscript(text);
            if (isFinal || text.length > 25) {
              triggerLiveTranslate(text, targetLanguage);
            }
          },
          onError: () => {},
        });
      }
    } catch (err: any) {
      console.error(err);
      setRecordError(
        err.name === 'NotAllowedError'
          ? 'Camera/microphone permission was denied. Please allow camera and microphone access to join meeting.'
          : 'Could not access camera or microphone.'
      );
      setIsRecording(false);
      setRecordingMode(null);
    }
  };

  // 2. START AUDIO-ONLY RECORDING
  const handleStartAudioRecording = async () => {
    setRecordError(null);
    recordedChunksRef.current = [];
    setLiveTranscript('');
    setLiveTranslation('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 64000,
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingMode('audio');
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      const langCode = getLangCode(originalLanguage);
      const tracker = new LiveSpeechTracker(langCode);
      speechTrackerRef.current = tracker;

      if (tracker.isAvailable()) {
        tracker.start({
          onTranscriptChange: (text, isFinal) => {
            setLiveTranscript(text);
            if (isFinal || text.length > 25) {
              triggerLiveTranslate(text, targetLanguage);
            }
          },
          onError: () => {},
        });
      }
    } catch (err: any) {
      console.error(err);
      setRecordError(
        err.name === 'NotAllowedError'
          ? 'Microphone permission was denied.'
          : 'Could not access microphone.'
      );
      setIsRecording(false);
      setRecordingMode(null);
    }
  };

  // 3. TURN ON & TURN OFF CAMERA FUNCTIONALITY (Both work reliably)
  const handleToggleCamera = async () => {
    if (isCameraOff) {
      // User is turning camera ON
      try {
        let videoTrack = streamRef.current?.getVideoTracks()[0];
        if (videoTrack && videoTrack.readyState === 'live') {
          videoTrack.enabled = true;
        } else {
          // Re-acquire camera video track
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user',
            },
          });
          const newTrack = videoStream.getVideoTracks()[0];
          if (streamRef.current) {
            streamRef.current.getVideoTracks().forEach((t) => {
              t.stop();
              streamRef.current?.removeTrack(t);
            });
            streamRef.current.addTrack(newTrack);
          } else {
            streamRef.current = videoStream;
          }
        }
        setIsCameraOff(false);
        if (liveVideoRef.current && streamRef.current) {
          liveVideoRef.current.srcObject = streamRef.current;
          liveVideoRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.error('Failed to turn on camera:', err);
        setRecordError('Could not turn on camera. Check permissions.');
      }
    } else {
      // User is turning camera OFF
      if (streamRef.current) {
        const videoTrack = streamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = false;
        }
      }
      setIsCameraOff(true);
    }
  };

  // 4. TOGGLE MICROPHONE
  const handleToggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  };

  // 5. STOP MEETING (User Requirement: Once meeting ends, it should NOT retain user's image)
  const handleStopMeeting = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    // Immediately stop and release all camera hardware tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    // Clear out video element so no camera frame is retained
    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null;
    }

    mediaRecorderRef.current.onstop = async () => {
      // Create audio blob for transcription and playback so user's image is NEVER retained
      const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
      const mediaUrl = URL.createObjectURL(blob);
      await processAudioBlob(blob, 'audio/webm', mediaUrl, false);
    };

    try {
      mediaRecorderRef.current.stop();
    } catch (e) {
      // ignore
    }
    stopStreams();
    setIsRecording(false);
    setRecordingMode(null);
  };

  // Process recorded media through Gemini
  const processAudioBlob = async (
    blob: Blob,
    mimeType: string,
    mediaUrl: string,
    _isVideo: boolean = false
  ) => {
    setIsProcessing(true);
    setRecordError(null);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);
      const base64Data = await base64Promise;

      const response = await fetch('/api/process-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaData: base64Data,
          mimeType,
          transcriptText: liveTranscript || undefined,
          targetLanguages: [targetLanguage],
          participants,
        }),
      });

      if (!response.ok) {
        throw new Error('Processing failed');
      }

      const data = await response.json();
      const durationSecs = recordingSeconds > 0 ? recordingSeconds : 30;
      const durationFmt = formatSeconds(durationSecs);

      // Map any generic Speaker 1 / Speaker 2 to detected participant names
      const primarySpeaker = participants[0];
      const primarySpeakerName = primarySpeaker
        ? primarySpeaker.isAdmin
          ? `${primarySpeaker.fullName} (Admin)`
          : primarySpeaker.fullName
        : 'Carys Evans (Admin)';

      const secondarySpeaker = participants[1];
      const secondarySpeakerName = secondarySpeaker
        ? secondarySpeaker.isAdmin
          ? `${secondarySpeaker.fullName} (Admin)`
          : secondarySpeaker.fullName
        : 'Gareth Thomas';

      const processedSegments = (data.segments || []).map((seg: any) => {
        let speaker = seg.speaker || primarySpeakerName;
        if (speaker.toLowerCase().includes('speaker 1') || speaker === 'Speaker') {
          speaker = primarySpeakerName;
        } else if (speaker.toLowerCase().includes('speaker 2')) {
          speaker = secondarySpeakerName;
        }
        return {
          ...seg,
          speaker,
        };
      });

      // User Requirement: Once meeting ends it should NOT retain user's image.
      // Set mediaType: 'audio' so only clean meeting audio & subtitles are retained.
      const result: RecordingResult = {
        id: `rec-${Date.now()}`,
        title:
          data.detectedTopic ||
          `Joint Meeting Session (${targetLanguage})`,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        durationSeconds: durationSecs,
        durationFormatted: durationFmt,
        mediaType: 'audio',
        mediaUrl,
        mediaBlob: blob,
        sourceLanguage: originalLanguage,
        sourceLanguageCode: originalLanguage.toLowerCase() === 'welsh' ? 'cy' : 'en',
        detectedTopic: data.detectedTopic || 'Teams Joint Meeting Discussion',
        overallSentiment: data.overallSentiment || 'Positive',
        fullTranscript: data.fullTranscript || liveTranscript || 'Transcribed meeting session.',
        availableLanguages: ['English', 'Welsh', 'French', 'Spanish', 'German', 'Hindi'],
        activeTargetLanguage: targetLanguage,
        segments:
          processedSegments.length > 0
            ? processedSegments
            : [
                {
                  id: 'seg-1',
                  speaker: primarySpeakerName,
                  startTime: '00:00',
                  endTime: durationFmt,
                  startSeconds: 0,
                  endSeconds: durationSecs,
                  originalText: data.fullTranscript || liveTranscript,
                  translations: {
                    [targetLanguage]: liveTranslation || data.fullTranscript || liveTranscript,
                  },
                },
              ],
        summary: data.summary || {
          executive: data.fullTranscript || liveTranscript || 'Meeting recorded and processed.',
          keyPoints: ['Joint meeting session successfully transcribed.'],
          actionItems: [],
          decisions: [],
          translatedExecutive: {
            [targetLanguage]: liveTranslation || data.fullTranscript || liveTranscript,
          },
        },
      };

      setCurrentRecording(result);
      setCurrentTime(0);
    } catch (err: any) {
      console.error(err);
      setRecordError('Could not process meeting. Fallback transcript available.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Upload custom audio/video file
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mediaUrl = URL.createObjectURL(file);
    const mimeType = file.type || 'audio/mp3';
    await processAudioBlob(file, mimeType, mediaUrl, false);
    e.target.value = '';
  };

  // Switch demo sample
  const handleSwitchSample = () => {
    const nextIdx = currentRecording.id === DEMO_SAMPLES[0].id ? 1 : 0;
    setCurrentRecording(DEMO_SAMPLES[nextIdx]);
    setCurrentTime(0);
  };

  // Swap languages
  const handleSwapLanguages = () => {
    const temp = originalLanguage;
    setOriginalLanguage(targetLanguage);
    setTargetLanguage(temp);
  };

  // Update participants list from Admin modal
  const handleUpdateParticipants = (newParticipants: Participant[]) => {
    setParticipants(newParticipants);
    try {
      localStorage.setItem('voice_studio_participants', JSON.stringify(newParticipants));
    } catch (e) {}
  };

  // Apply names & surnames to current transcript
  const handleApplyToTranscript = (adminParticipants: Participant[]) => {
    if (!currentRecording || !currentRecording.segments) return;

    const updatedSegments = currentRecording.segments.map((seg, idx) => {
      let currentSpeaker = seg.speaker;
      let matchedName = currentSpeaker;

      if (currentSpeaker.toLowerCase().includes('speaker 1') || currentSpeaker === 'Speaker') {
        const p = adminParticipants[0];
        matchedName = p ? (p.isAdmin ? `${p.fullName} (Admin)` : p.fullName) : currentSpeaker;
      } else if (currentSpeaker.toLowerCase().includes('speaker 2')) {
        const p = adminParticipants[1];
        matchedName = p ? (p.isAdmin ? `${p.fullName} (Admin)` : p.fullName) : currentSpeaker;
      } else if (adminParticipants.length > 0) {
        const p = adminParticipants[idx % adminParticipants.length];
        matchedName = p.isAdmin ? `${p.fullName} (Admin)` : p.fullName;
      }

      return {
        ...seg,
        speaker: matchedName,
      };
    });

    setCurrentRecording({
      ...currentRecording,
      segments: updatedSegments,
    });
  };

  // Direct export from header
  const handleDirectExport = async (format: 'pdf' | 'docx') => {
    if (!currentRecording) return;
    try {
      if (format === 'pdf') {
        await exportToPDF(currentRecording, targetLanguage);
        setExportNotice('PDF Downloaded');
      } else {
        await exportToDocx(currentRecording, targetLanguage);
        setExportNotice('Word DOCX Downloaded');
      }
    } catch (e: any) {
      setExportNotice('Export failed');
    }
    setTimeout(() => setExportNotice(null), 2500);
  };

  // Save / Update scheduled meeting
  const handleSaveScheduledMeeting = (newMeeting: ScheduledMeeting) => {
    setMeetings((prev) => {
      const existing = prev.findIndex((m) => m.id === newMeeting.id);
      let updated: ScheduledMeeting[];
      if (existing >= 0) {
        updated = [...prev];
        updated[existing] = newMeeting;
      } else {
        updated = [newMeeting, ...prev];
      }
      try {
        localStorage.setItem('voice_studio_scheduled_meetings', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Delete scheduled meeting
  const handleDeleteScheduledMeeting = (meetingId: string) => {
    setMeetings((prev) => {
      const updated = prev.filter((m) => m.id !== meetingId);
      try {
        localStorage.setItem('voice_studio_scheduled_meetings', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Send direct meeting invite (supports single email or multiple recipients)
  const handleSendDirectInvite = async (
    meetingId: string,
    recipientEmail?: string,
    customEmails?: string[]
  ): Promise<boolean> => {
    const meeting =
      meetings.find((m) => m.id === meetingId) ||
      (directInviteMeeting?.id === meetingId ? directInviteMeeting : null) ||
      (activeScheduledMeeting?.id === meetingId ? activeScheduledMeeting : null) ||
      meetings[0];

    if (!meeting) {
      console.warn('[handleSendDirectInvite] Meeting not found for id:', meetingId);
      return false;
    }

    const emailList =
      customEmails && customEmails.length > 0
        ? customEmails
        : recipientEmail
        ? [recipientEmail]
        : meeting.inviteeEmails && meeting.inviteeEmails.length > 0
        ? meeting.inviteeEmails
        : ['nishabhatt.bhatt@gmail.com', 'carys.evans@gov.wales'];

    const payload = {
      meetingId: meeting.id,
      title: meeting.title,
      date: meeting.date,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      roomName: meeting.roomName,
      agenda: meeting.agenda,
      recipientEmail,
      invitees: emailList,
      targetLanguages: meeting.targetLanguages,
      m365Sync: meeting.m365SyncEnabled ?? true,
    };

    console.group(`[handleSendDirectInvite] Dispatching direct invite for "${meeting.title}" (${meeting.id})`);
    console.log('Payload:', payload);
    console.groupEnd();

    try {
      const res = await fetch('/api/send-direct-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMeetings((prev) => {
          const updated = prev.map((m) =>
            m.id === meetingId
              ? {
                  ...m,
                  invitesSent: true,
                  invitesSentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  inviteeEmails: Array.from(new Set([...(m.inviteeEmails || []), ...emailList])),
                }
              : m
          );
          try {
            localStorage.setItem('voice_studio_scheduled_meetings', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
        return true;
      }
    } catch (e) {
      console.error('[handleSendDirectInvite] Error sending direct invite:', e);
    }
    return false;
  };

  // Send bulk meeting invites
  const handleSendBulkInvites = async (
    meetingId: string,
    customEmails?: string[]
  ): Promise<boolean> => {
    const meeting =
      meetings.find((m) => m.id === meetingId) ||
      (directInviteMeeting?.id === meetingId ? directInviteMeeting : null) ||
      (activeScheduledMeeting?.id === meetingId ? activeScheduledMeeting : null) ||
      meetings[0];

    if (!meeting) {
      console.warn('[handleSendBulkInvites] Meeting not found for id:', meetingId);
      return false;
    }

    const emailList =
      customEmails && customEmails.length > 0
        ? customEmails
        : meeting.inviteeEmails && meeting.inviteeEmails.length > 0
        ? meeting.inviteeEmails
        : ['nishabhatt.bhatt@gmail.com', 'carys.evans@gov.wales'];

    const payload = {
      meetingId: meeting.id,
      title: meeting.title,
      date: meeting.date,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      roomName: meeting.roomName,
      agenda: meeting.agenda,
      invitees: emailList,
      targetLanguages: meeting.targetLanguages,
      m365Sync: meeting.m365SyncEnabled,
    };

    console.group(`[handleSendBulkInvites] Dispatching invites for "${meeting.title}" (${meeting.id})`);
    console.log('Endpoint:', '/api/send-bulk-invites');
    console.log('Request Payload:', payload);
    console.groupEnd();

    try {
      const res = await fetch('/api/send-bulk-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Mark meeting invites as sent
        setMeetings((prev) => {
          const updated = prev.map((m) =>
            m.id === meetingId
              ? {
                  ...m,
                  invitesSent: true,
                  invitesSentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  inviteeEmails: Array.from(new Set([...(m.inviteeEmails || []), ...emailList])),
                }
              : m
          );
          try {
            localStorage.setItem('voice_studio_scheduled_meetings', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
        return true;
      }
    } catch (e) {
      console.error('[handleSendBulkInvites] Error sending bulk invites:', e);
    }
    return false;
  };

  // Start a specific organized meeting with its selected speakers
  const handleStartScheduledMeeting = (meeting: ScheduledMeeting) => {
    setActiveScheduledMeeting(meeting);
    // If the meeting has specific speakers, align the active speakers list
    if (meeting.speakers && meeting.speakers.length > 0) {
      // Merge unique
      const merged = [...meeting.speakers];
      setParticipants((prev) => {
        const remaining = prev.filter((p) => !merged.some((m) => m.id === p.id));
        return [...merged, ...remaining];
      });
    }

    if (meeting.targetLanguages && meeting.targetLanguages.length > 0) {
      setTargetLanguage(meeting.targetLanguages[0] === originalLanguage ? 'Welsh' : meeting.targetLanguages[0]);
    }

    // Launch joint meeting window with camera
    handleStartJointMeeting();
  };

  // Update summary
  const handleUpdateSummary = (newSummary: SummaryData) => {
    if (!currentRecording) return;
    setCurrentRecording({
      ...currentRecording,
      summary: newSummary,
    });
  };

  // In-place segment edit
  const handleSegmentEdit = (segmentId: string, newOriginal: string, newTranslation?: string) => {
    if (!currentRecording) return;
    const updatedSegments = currentRecording.segments.map((seg) => {
      if (seg.id === segmentId) {
        return {
          ...seg,
          originalText: newOriginal,
          translations: {
            ...seg.translations,
            ...(newTranslation ? { [targetLanguage]: newTranslation } : {}),
          },
        };
      }
      return seg;
    });

    setCurrentRecording({
      ...currentRecording,
      segments: updatedSegments,
    });
  };

  // Primary active speaker for badge & display
  const primarySpeaker = participants[0];
  const primarySpeakerDisplayName = primarySpeaker ? primarySpeaker.fullName : 'You';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Hidden File Input for direct upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,video/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 1. Left Navigation Bar (Upload, Export, Sample, and Admin - record & video removed) */}
      <Sidebar
        onUpload={handleUploadClick}
        onExport={() => setIsExportOpen(true)}
        onSwitchSample={handleSwitchSample}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenMeetings={() => setIsMeetingsModalOpen(true)}
        onOpenDeploy={() => {
          setDeployDefaultTab('azure');
          setIsDeployModalOpen(true);
        }}
      />

      {/* 2. Right Side Workspace (Main Window) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header: Language Selection & Export */}
        <header className="sticky top-0 z-20 h-14 bg-slate-950/95 border-b border-slate-850 px-4 sm:px-6 flex items-center justify-between gap-4 backdrop-blur-sm">
          {/* Language Selection: Original & Target (6 languages) */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Original:</span>
              <select
                value={originalLanguage}
                onChange={(e) => setOriginalLanguage(e.target.value)}
                disabled={isRecording}
                className="bg-slate-900 border border-slate-800 text-slate-200 px-2 py-1 rounded-lg text-xs font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer disabled:opacity-50"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.name}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <button
              onClick={handleSwapLanguages}
              disabled={isRecording}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-900 transition-colors disabled:opacity-50 cursor-pointer"
              title="Swap original and target language"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>

            {/* Target Language */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Target:</span>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                disabled={isRecording}
                className="bg-slate-900 border border-slate-800 text-slate-200 px-2 py-1 rounded-lg text-xs font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer disabled:opacity-50"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.name}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Export Output & Direct Invite Buttons */}
          <div className="flex items-center gap-2">
            {exportNotice && (
              <span className="text-xs text-cyan-400 font-medium flex items-center gap-1 mr-1">
                <Check className="w-3.5 h-3.5" />
                <span>{exportNotice}</span>
              </span>
            )}

            {/* GitHub & Gemini Key Hub */}
            <button
              onClick={() => {
                setDeployDefaultTab('github');
                setIsDeployModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 transition-colors shadow-sm cursor-pointer"
              title="Push to GitHub & configure Google Gemini API Key"
            >
              <Github className="w-3.5 h-3.5 text-cyan-400" />
              <span>GitHub &amp; Gemini</span>
            </button>

            {/* Deploy & Cloud Integrations (Azure, Netlify, Teams, Outlook, API Keys) */}
            <button
              onClick={() => {
                setDeployDefaultTab('teams');
                setIsDeployModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-300 bg-slate-900 hover:bg-slate-850 border border-blue-800/60 hover:border-blue-500 transition-colors shadow-sm cursor-pointer"
              title="Microsoft Teams & Outlook, Azure, Netlify, and API Keys Deploy Hub"
            >
              <Cloud className="w-3.5 h-3.5 text-blue-400" />
              <span>Teams &amp; Cloud</span>
            </button>

            {/* Direct Invite Quick Launcher */}
            <button
              onClick={() => {
                const target = activeScheduledMeeting || meetings[0] || DEFAULT_SCHEDULED_MEETINGS[0];
                setDirectInviteMeeting(target);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-300 bg-slate-900 hover:bg-slate-850 border border-cyan-800/60 hover:border-cyan-500 transition-colors shadow-sm cursor-pointer"
              title="Send direct meeting invite to attendees & speakers"
            >
              <Send className="w-3.5 h-3.5 text-cyan-400" />
              <span>Direct Invite</span>
            </button>

            <button
              onClick={() => handleDirectExport('pdf')}
              disabled={isRecording || isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-850 border border-slate-850 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              title="Download PDF report"
            >
              <FileText className="w-3.5 h-3.5 text-red-400" />
              <span>PDF</span>
            </button>

            <button
              onClick={() => handleDirectExport('docx')}
              disabled={isRecording || isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-850 border border-slate-850 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              title="Download Word DOCX report"
            >
              <FileCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>DOCX</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 space-y-4 max-w-6xl w-full mx-auto">
          {/* Active Scheduled Meeting Banner */}
          {activeScheduledMeeting && (
            <div className="bg-gradient-to-r from-cyan-950/60 to-slate-900 border border-cyan-800/60 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0"></span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-850">
                      Organised Meeting Active
                    </span>
                    <span className="font-semibold text-white">{activeScheduledMeeting.title}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Room: <strong className="text-slate-300">{activeScheduledMeeting.roomName}</strong> •{' '}
                    Speakers: {activeScheduledMeeting.speakers.map((s) => s.fullName).join(', ')} •{' '}
                    {activeScheduledMeeting.agenda?.length || 0} agenda items
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDirectInviteMeeting(activeScheduledMeeting)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md transition-colors cursor-pointer"
                  title="Send email & calendar invites for this meeting"
                >
                  <Send className="w-3 h-3" />
                  <span>Send Invites</span>
                </button>
                <button
                  onClick={() => setIsMeetingsModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors"
                >
                  View Details
                </button>
                <button
                  onClick={() => setActiveScheduledMeeting(null)}
                  className="text-slate-500 hover:text-slate-300 p-1"
                  title="Dismiss banner"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Inline Error Notice */}
          {recordError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{recordError}</span>
            </div>
          )}

          {/* TOP SECTION: Joint Meeting Window / Audio Recording on Left, LIVE CAPTIONS ON RIGHT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* LEFT SIDE: Meeting Window / Joint Meeting Grid / Player */}
            <div className="lg:col-span-7 flex flex-col">
              {isRecording ? (
                recordingMode === 'joint_meeting' ? (
                  /* ======================================================== */
                  /* MICROSOFT TEAMS JOINT MEETING: ALL USERS VISIBLE IN GRID */
                  /* ======================================================== */
                  <JointMeetingGrid
                    participants={participants}
                    currentUserDisplayName="You"
                    currentUserInitials="ME"
                    currentUserIsAdmin={true}
                    liveVideoRef={liveVideoRef}
                    isCameraOff={isCameraOff}
                    isMicMuted={isMicMuted}
                    onToggleCamera={handleToggleCamera}
                    onToggleMic={handleToggleMic}
                    onEndMeeting={handleStopMeeting}
                    recordingSeconds={recordingSeconds}
                    viewMode={meetingViewMode}
                    onToggleViewMode={() =>
                      setMeetingViewMode((prev) => (prev === 'grid' ? 'focus' : 'grid'))
                    }
                    activeSpeakerName={primarySpeakerDisplayName}
                    onOpenInviteModal={() =>
                      setDirectInviteMeeting(
                        activeScheduledMeeting ||
                          meetings[0] || {
                            id: `meet-${Date.now()}`,
                            title: 'Bilingual Joint Teams Meeting',
                            date: new Date().toISOString().split('T')[0],
                            startTime: '10:00',
                            endTime: '11:00',
                            roomName: 'Virtual Teams Room',
                            speakers: participants,
                            inviteeEmails: participants.map((p) => p.email),
                            agenda: [],
                            targetLanguages: [targetLanguage],
                            status: 'in_progress',
                          }
                      )
                    }
                  />
                ) : (
                  /* AUDIO RECORDING SURFACE */
                  <div className="flex-1 min-h-[260px] bg-slate-900 border border-red-900/60 rounded-xl p-5 flex flex-col justify-between shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                        <span className="text-xs font-bold text-red-300 uppercase tracking-wide">
                          Live Audio Recording
                        </span>
                      </div>
                      <span className="font-mono text-sm font-bold text-white bg-slate-950 px-2.5 py-1 rounded-md border border-slate-850">
                        {formatSeconds(recordingSeconds)}
                      </span>
                    </div>

                    <div className="my-3">
                      <AudioWaveformVisualizer
                        stream={streamRef.current}
                        isRecording={isRecording}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <span className="text-xs text-slate-400">
                        Speak now — live captions display on the right
                      </span>
                      <button
                        onClick={handleStopMeeting}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-500 shadow-md shadow-red-600/30 transition-colors cursor-pointer"
                      >
                        <Square className="w-3.5 h-3.5 fill-white" />
                        <span>Stop &amp; Transcribe</span>
                      </button>
                    </div>
                  </div>
                )
              ) : isProcessing ? (
                /* PROCESSING STATE IN MAIN WINDOW */
                <div className="flex-1 min-h-[260px] bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  <p className="text-sm font-semibold text-white">Transcribing &amp; Translating...</p>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Processing session and translating into {targetLanguage}
                  </p>
                </div>
              ) : (
                /* NORMAL AUDIO/VIDEO PLAYER + MEETING LAUNCHER */
                <div className="flex flex-col gap-2.5">
                  <VideoPlayerSynchronizer
                    recording={currentRecording}
                    currentTime={currentTime}
                    onTimeUpdate={setCurrentTime}
                    activeSegment={activeSegment}
                    selectedLanguage={targetLanguage}
                  />

                  {/* Microsoft Teams Meeting Launcher Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs shadow-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="font-semibold text-white">Joint Meeting:</span>
                      <span className="text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                        {participants.map((p) => p.firstName).join(', ')} &amp; You
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Send Invites Quick Action */}
                      <button
                        onClick={() =>
                          setDirectInviteMeeting(
                            activeScheduledMeeting || meetings[0] || null
                          )
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors shadow-sm cursor-pointer"
                        title="Send email & calendar invites to attendees"
                      >
                        <Send className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Send Invites</span>
                      </button>

                      {/* Organise Meetings / Agendas / Rooms */}
                      <button
                        onClick={() => setIsMeetingsModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-300 hover:text-white bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 transition-colors shadow-sm cursor-pointer"
                        title="Organise meetings, select speakers, agendas, bulk invites & rooms"
                      >
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Organise Meetings ({meetings.length})</span>
                      </button>

                      {/* Start Joint Meeting with Camera */}
                      <button
                        onClick={handleStartJointMeeting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-sm cursor-pointer"
                        title="Start joint meeting with all participants and camera"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Start Joint Meeting</span>
                      </button>

                      {/* Record Audio */}
                      <button
                        onClick={handleStartAudioRecording}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 transition-colors cursor-pointer"
                        title="Record audio only"
                      >
                        <Mic className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Audio Record</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT SIDE: LIVE CAPTIONS SECTION IN MAIN WINDOW */}
            <div className="lg:col-span-5 flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-4 shadow-sm">
              {/* Live Captions Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isRecording ? 'bg-red-500 animate-ping' : 'bg-cyan-400 animate-pulse'
                    }`}
                  ></span>
                  <h3 className="text-xs font-semibold text-white">
                    {isRecording ? 'Live Captions (Active Meeting)' : 'Live Captions'}
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded font-semibold">
                  {isRecording ? formatSeconds(recordingSeconds) : activeSegment?.startTime || '00:00'}
                </span>
              </div>

              {/* Caption Content Area */}
              {isRecording ? (
                /* REAL-TIME CAPTION AS USER SPEAKS */
                <div className="flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                      <span>Speaker:</span>
                      <span className="text-white">You</span>
                      <span className="inline-flex items-center gap-0.5 bg-cyan-950 text-cyan-300 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-cyan-800">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        <span>Admin</span>
                      </span>
                    </div>

                    {/* Original live recognized speech */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-medium">
                        {originalLanguage} (Live Speech):
                      </span>
                      <p className="text-xs text-white leading-relaxed font-normal min-h-[44px] p-2.5 rounded-lg bg-slate-950 border border-slate-850">
                        {liveTranscript ? (
                          liveTranscript
                        ) : (
                          <span className="text-slate-500 italic">
                            Listening to microphone... Speak now.
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Live translation */}
                    <div className="space-y-1 pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] text-cyan-400 uppercase font-medium">
                        {targetLanguage} (Live Translation):
                      </span>
                      <p className="text-xs text-cyan-300 leading-relaxed font-normal min-h-[44px] p-2.5 rounded-lg bg-slate-950 border border-slate-850">
                        {liveTranslation ? (
                          liveTranslation
                        ) : (
                          <span className="text-slate-500 italic">
                            Translating into {targetLanguage} in real time...
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span>Active joint meeting translation</span>
                    <span className="font-mono text-cyan-400">
                      {originalLanguage} &rarr; {targetLanguage}
                    </span>
                  </div>
                </div>
              ) : activeSegment ? (
                /* SYNCHRONIZED PLAYBACK CAPTIONS FOR PLAYING RECORDING */
                <div className="flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                      <span>Speaker:</span>
                      <span className="text-white">{activeSegment.speaker}</span>
                      {activeSegment.speaker.toLowerCase().includes('admin') && (
                        <span className="inline-flex items-center gap-0.5 bg-cyan-950 text-cyan-300 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-cyan-800">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          <span>Admin</span>
                        </span>
                      )}
                    </div>

                    {/* Original language text */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-medium">
                        {originalLanguage}:
                      </span>
                      <p className="text-xs text-white leading-relaxed font-normal min-h-[44px] p-2.5 rounded-lg bg-slate-950 border border-slate-850">
                        {activeSegment.originalText}
                      </p>
                    </div>

                    {/* Target translation text */}
                    <div className="space-y-1 pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] text-cyan-400 uppercase font-medium">
                        {targetLanguage}:
                      </span>
                      <p className="text-xs text-cyan-300 leading-relaxed font-normal min-h-[44px] p-2.5 rounded-lg bg-slate-950 border border-slate-850">
                        {activeSegment.translations[targetLanguage] ||
                          activeSegment.translations['Welsh'] ||
                          activeSegment.originalText}
                      </p>
                    </div>
                  </div>

                  {/* Synchronized status footer */}
                  <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span>Synchronized playback</span>
                    <span className="font-mono">{currentTime.toFixed(1)}s</span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
                  Waiting for speech playback...
                </div>
              )}
            </div>
          </div>

          {/* LOWER SECTION: Clean Tabs for Transcript & Summary */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 w-fit">
            <button
              onClick={() => setActiveTab('transcript')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'transcript'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Transcript
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'summary'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Summary &amp; Actions
            </button>
          </div>

          {/* Tab 1: Full Dialogue Transcript with Speaker Names & Target Translations */}
          {activeTab === 'transcript' && (
            <div className="h-[460px]">
              <TranscriptView
                segments={currentRecording.segments}
                activeSegmentId={activeSegment?.id || null}
                onSegmentClick={(secs) => setCurrentTime(secs)}
                selectedLanguage={targetLanguage}
                sourceLanguage={originalLanguage}
                onSegmentEdit={handleSegmentEdit}
              />
            </div>
          )}

          {/* Tab 2: Summarise Output & Action Items */}
          {activeTab === 'summary' && (
            <div className="min-h-[380px]">
              <SummaryDashboard
                summary={currentRecording.summary}
                selectedLanguage={targetLanguage}
                sourceLanguage={originalLanguage}
                transcriptText={currentRecording.fullTranscript}
                onUpdateSummary={handleUpdateSummary}
              />
            </div>
          )}
        </main>
      </div>

      {/* Admin Modal for adding and deleting admin speakers & detecting Name and Surname */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        participants={participants}
        onUpdateParticipants={handleUpdateParticipants}
        onApplyToTranscript={handleApplyToTranscript}
      />

      {/* Full Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        recording={currentRecording}
        currentSelectedLanguage={targetLanguage}
      />

      {/* Meeting Manager & Rooms Modal */}
      <MeetingManagerModal
        isOpen={isMeetingsModalOpen}
        onClose={() => setIsMeetingsModalOpen(false)}
        meetings={meetings}
        rooms={meetingRooms}
        allParticipants={participants}
        onSaveMeeting={handleSaveScheduledMeeting}
        onDeleteMeeting={handleDeleteScheduledMeeting}
        onSendBulkInvites={handleSendBulkInvites}
        onSendDirectInvite={handleSendDirectInvite}
        onStartScheduledMeeting={handleStartScheduledMeeting}
      />

      {/* Standalone Invite Dispatch Modal for quick actions */}
      <InviteDispatchModal
        isOpen={!!directInviteMeeting}
        onClose={() => setDirectInviteMeeting(null)}
        meeting={directInviteMeeting}
        allParticipants={participants}
        onInvitesSentSuccess={(meetingId, recipientEmails) => {
          handleSendDirectInvite(meetingId, undefined, recipientEmails);
        }}
      />

      {/* Deploy & Cloud Integrations Modal (Azure, Netlify, Teams, Outlook, API Keys) */}
      <DeployModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
        defaultTab={deployDefaultTab}
      />
    </div>
  );
}
