export interface TranscriptSegment {
  id: string;
  speaker: string;
  startTime: string;
  endTime: string;
  startSeconds: number;
  endSeconds: number;
  originalText: string;
  translations: Record<string, string>;
}

export interface ActionItem {
  task: string;
  owner?: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface SummaryData {
  executive: string;
  keyPoints: string[];
  actionItems: ActionItem[];
  decisions: string[];
  translatedExecutive?: Record<string, string>;
}

export interface RecordingResult {
  id: string;
  title: string;
  createdAt: string;
  durationSeconds: number;
  durationFormatted: string;
  mediaType: 'audio' | 'video';
  mediaUrl?: string;
  mediaBlob?: Blob;
  videoPlaceholderType?: string;
  sourceLanguage: string;
  sourceLanguageCode: string;
  detectedTopic: string;
  overallSentiment: 'Positive' | 'Neutral' | 'Constructive' | 'Mixed';
  fullTranscript: string;
  segments: TranscriptSegment[];
  summary: SummaryData;
  availableLanguages: string[];
  activeTargetLanguage: string;
}

export interface SupportedLanguage {
  name: string;
  code: string;
  flag: string;
  nativeName: string;
}

export interface Participant {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isAdmin?: boolean;
  department?: string;
  isM365User?: boolean;
  jobTitle?: string;
}

export interface MeetingRoom {
  id: string;
  name: string;
  building: string;
  floor: string;
  capacity: number;
  features: string[]; // e.g., 'Teams Rooms', 'Dual Display', '4K Camera', 'Mic Array'
  isAvailable?: boolean;
}

export interface AgendaItem {
  id: string;
  title: string;
  durationMinutes: number;
  presenter?: string;
  notes?: string;
}

export interface ScheduledMeeting {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  roomId?: string;
  roomName?: string;
  speakers: Participant[];
  inviteeEmails: string[];
  agenda: AgendaItem[];
  objective?: string;
  targetLanguages: string[];
  m365SyncEnabled?: boolean;
  teamsMeetingLink?: string;
  invitesSent?: boolean;
  invitesSentAt?: string;
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
}
