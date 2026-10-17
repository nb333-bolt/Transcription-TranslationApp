import React, { useState, useRef, useEffect } from 'react';
import { Mic, Video, Upload, Square, X, AlertCircle } from 'lucide-react';
import { AudioWaveformVisualizer } from './AudioWaveformVisualizer';
import { LiveSpeechTracker } from '../utils/speechRecognition';
import { SUPPORTED_LANGUAGES } from '../constants/languages';
import { RecordingResult } from '../types';

interface RecordingStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordingComplete: (result: RecordingResult) => void;
  initialMode?: 'mic' | 'video' | 'upload';
}

export const RecordingStudioModal: React.FC<RecordingStudioModalProps> = ({
  isOpen,
  onClose,
  onRecordingComplete,
  initialMode = 'mic',
}) => {
  const [recordMode, setRecordMode] = useState<'mic' | 'video' | 'upload'>(initialMode);

  useEffect(() => {
    if (isOpen) {
      setRecordMode(initialMode);
    }
  }, [isOpen, initialMode]);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [selectedTargetLangs, setSelectedTargetLangs] = useState<string[]>(['Welsh']);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const speechTrackerRef = useRef<LiveSpeechTracker | null>(null);

  useEffect(() => {
    speechTrackerRef.current = new LiveSpeechTracker('en-GB');
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopStreams();
      setIsRecording(false);
      setElapsedSeconds(0);
      setLiveTranscript('');
      setUploadedFile(null);
      setErrorMessage(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

  const stopStreams = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (speechTrackerRef.current) {
      speechTrackerRef.current.stop();
    }
  };

  const startTimer = () => {
    setElapsedSeconds(0);
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    setErrorMessage(null);
    recordedChunksRef.current = [];
    setLiveTranscript('');

    try {
      let stream: MediaStream;
      if (recordMode === 'mic') {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 360 }, facingMode: 'user' },
          audio: true,
        });
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }
      }

      streamRef.current = stream;
      const mimeType = recordMode === 'mic' ? 'audio/webm' : 'video/webm';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        ...(recordMode !== 'mic' ? { videoBitsPerSecond: 800000 } : {}),
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
      startTimer();

      if (speechTrackerRef.current && speechTrackerRef.current.isAvailable()) {
        speechTrackerRef.current.start({
          onTranscriptChange: (text) => {
            setLiveTranscript(text);
          },
          onError: () => {},
        });
      }
    } catch (err: any) {
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Microphone or camera permission was denied.'
          : 'Could not start recording hardware.'
      );
    }
  };

  const handleStopRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    mediaRecorderRef.current.onstop = async () => {
      const mime = recordMode === 'mic' ? 'audio/webm' : 'video/webm';
      const blob = new Blob(recordedChunksRef.current, { type: mime });
      const mediaUrl = URL.createObjectURL(blob);
      await processMediaBlob(blob, mime, mediaUrl, recordMode === 'mic' ? 'audio' : 'video');
    };

    mediaRecorderRef.current.stop();
    stopStreams();
    setIsRecording(false);
  };

  const processMediaBlob = async (
    blob: Blob,
    mimeType: string,
    mediaUrl: string,
    mediaType: 'audio' | 'video'
  ) => {
    setIsProcessing(true);
    setErrorMessage(null);

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
          targetLanguages: selectedTargetLangs,
        }),
      });

      if (!response.ok) {
        throw new Error('Processing failed');
      }

      const data = await response.json();
      const durationSecs = elapsedSeconds > 0 ? elapsedSeconds : 30;
      const durationFmt = formatTime(durationSecs);

      const result: RecordingResult = {
        id: `rec-${Date.now()}`,
        title: data.detectedTopic || (mediaType === 'audio' ? 'Voice Recording' : 'Video Recording'),
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        durationSeconds: durationSecs,
        durationFormatted: durationFmt,
        mediaType,
        mediaUrl,
        mediaBlob: blob,
        sourceLanguage: data.sourceLanguage || 'English',
        sourceLanguageCode: data.sourceLanguageCode || 'en',
        detectedTopic: data.detectedTopic || 'Session',
        overallSentiment: data.overallSentiment || 'Positive',
        fullTranscript: data.fullTranscript || liveTranscript || '',
        segments: data.segments || [
          {
            id: 'seg-1',
            speaker: 'Speaker',
            startTime: '00:00',
            endTime: durationFmt,
            startSeconds: 0,
            endSeconds: durationSecs,
            originalText: data.fullTranscript || liveTranscript,
            translations: data.summary?.translatedExecutive || {},
          },
        ],
        summary: data.summary || {
          executive: 'Recording transcribed.',
          keyPoints: [],
          actionItems: [],
          decisions: [],
        },
        availableLanguages: selectedTargetLangs,
        activeTargetLanguage: selectedTargetLangs[0] || 'Welsh',
      };

      setIsProcessing(false);
      onRecordingComplete(result);
      onClose();
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage('Could not process recording. Please try again.');
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadedFile) return;
    const isVideo = uploadedFile.type.startsWith('video');
    const mediaUrl = URL.createObjectURL(uploadedFile);
    await processMediaBlob(uploadedFile, uploadedFile.type, mediaUrl, isVideo ? 'video' : 'audio');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white">Record or Upload</h2>
          <button
            onClick={onClose}
            disabled={isRecording || isProcessing}
            className="text-slate-400 hover:text-white p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Mode Switcher */}
          {!isRecording && !isProcessing && (
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRecordMode('mic')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                  recordMode === 'mic'
                    ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>Microphone</span>
              </button>

              <button
                type="button"
                onClick={() => setRecordMode('video')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                  recordMode === 'video'
                    ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Camera</span>
              </button>

              <button
                type="button"
                onClick={() => setRecordMode('upload')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                  recordMode === 'upload'
                    ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>File</span>
              </button>
            </div>
          )}

          {/* Language Target */}
          {!isRecording && !isProcessing && (
            <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Translate to:</span>
              <div className="flex gap-2">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setSelectedTargetLangs([lang.name])}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      selectedTargetLangs.includes(lang.name)
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lang.nativeName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Recording State */}
          {isRecording && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-950/40 border border-red-900/50">
                <span className="text-xs font-semibold text-red-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  Recording...
                </span>
                <span className="font-mono text-sm font-bold text-white">
                  {formatTime(elapsedSeconds)}
                </span>
              </div>

              {recordMode === 'video' && (
                <div className="rounded-lg overflow-hidden bg-black aspect-video max-h-48 border border-slate-800">
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <AudioWaveformVisualizer stream={streamRef.current} isRecording={isRecording} />

              {liveTranscript && (
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 max-h-24 overflow-y-auto">
                  {liveTranscript}
                </div>
              )}
            </div>
          )}

          {/* File Upload UI */}
          {!isRecording && !isProcessing && recordMode === 'upload' && (
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-lg bg-slate-950 cursor-pointer">
              <Upload className="w-6 h-6 text-slate-400 mb-2" />
              <span className="text-xs font-medium text-slate-300">
                {uploadedFile ? uploadedFile.name : 'Select audio or video file'}
              </span>
              <input
                type="file"
                accept="audio/*,video/*"
                onChange={(e) => e.target.files && setUploadedFile(e.target.files[0])}
                className="hidden"
              />
            </label>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="p-8 text-center text-xs text-slate-300 space-y-2">
              <p className="font-medium">Processing recording...</p>
              <div className="w-32 bg-slate-800 rounded-full h-1.5 mx-auto overflow-hidden">
                <div className="bg-cyan-500 h-full w-full animate-pulse"></div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-950/40 border border-red-800 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-800 bg-slate-950/40">
          {!isRecording && !isProcessing && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          )}

          {recordMode !== 'upload' ? (
            !isRecording ? (
              <button
                onClick={handleStartRecording}
                disabled={isProcessing}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors disabled:opacity-50"
              >
                Start Recording
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>Stop &amp; Transcribe</span>
              </button>
            )
          ) : (
            <button
              onClick={handleUploadSubmit}
              disabled={!uploadedFile || isProcessing}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors disabled:opacity-50"
            >
              Upload &amp; Process
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
