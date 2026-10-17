import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw, ShieldCheck, Users } from 'lucide-react';
import { RecordingResult, TranscriptSegment } from '../types';

interface VideoPlayerSynchronizerProps {
  recording: RecordingResult;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  activeSegment: TranscriptSegment | null;
  selectedLanguage: string;
}

export const VideoPlayerSynchronizer: React.FC<VideoPlayerSynchronizerProps> = ({
  recording,
  currentTime,
  onTimeUpdate,
  activeSegment,
  selectedLanguage,
}) => {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(recording.durationSeconds || 60);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (mediaRef.current && Math.abs(mediaRef.current.currentTime - currentTime) > 0.5) {
      mediaRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  const togglePlay = () => {
    if (!mediaRef.current) return;
    if (isPlaying) {
      mediaRef.current.pause();
    } else {
      mediaRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const handleMediaTimeUpdate = () => {
    if (mediaRef.current) {
      onTimeUpdate(mediaRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (mediaRef.current && mediaRef.current.duration && !isNaN(mediaRef.current.duration)) {
      setDuration(mediaRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (mediaRef.current) {
      mediaRef.current.currentTime = newTime;
    }
    onTimeUpdate(newTime);
  };

  const toggleMute = () => {
    if (mediaRef.current) {
      mediaRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const formatSeconds = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // User requirement: Once meeting ends it should NOT retain the user's image.
  // Any recorded meeting (with id starting with 'rec-' or audio) never shows webcam images.
  // Only external stock sample videos (like sample-1) have a raw video file.
  const isSampleVideo = recording.mediaType === 'video' && !recording.id.startsWith('rec-');
  const translatedText = activeSegment?.translations?.[selectedLanguage] || '';

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm"
    >
      {/* Player Display */}
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
        {isSampleVideo && recording.mediaUrl ? (
          <video
            ref={mediaRef as any}
            src={recording.mediaUrl}
            onTimeUpdate={handleMediaTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            playsInline
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlay}
          />
        ) : (
          /* Privacy-safe Audio Meeting View: user's webcam image is never retained after meeting ends */
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 select-none relative">
            {recording.mediaUrl && (
              <audio
                ref={mediaRef as any}
                src={recording.mediaUrl}
                onTimeUpdate={handleMediaTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
              />
            )}

            {/* Meeting Session Badge */}
            <div className="flex items-center gap-2 mb-3 bg-slate-900/90 px-3 py-1 rounded-full border border-slate-800 text-xs">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-300 font-semibold">{recording.title}</span>
            </div>

            {/* Audio Waveform visualization */}
            <div className="flex items-center gap-1.5 h-12 mb-3">
              {[35, 60, 25, 75, 45, 90, 65, 30, 80, 40, 55, 85, 30, 70, 50, 95].map((h, idx) => (
                <div
                  key={idx}
                  className="w-1.5 rounded-full bg-cyan-500 transition-all duration-200"
                  style={{
                    height: isPlaying
                      ? `${Math.max(18, (h * (Math.sin(currentTime * 3 + idx) + 1.2)) / 2.2)}%`
                      : '20%',
                    opacity: isPlaying ? 0.9 : 0.4,
                  }}
                />
              ))}
            </div>

            {/* Active Speaker Tag */}
            {activeSegment && (
              <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 text-xs">
                <span className="text-slate-400">Speaker:</span>
                <span className="text-white font-semibold">{activeSegment.speaker}</span>
                {activeSegment.speaker.toLowerCase().includes('admin') && (
                  <span className="inline-flex items-center gap-0.5 bg-cyan-950 text-cyan-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-cyan-800">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span>Admin</span>
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="p-2.5 bg-slate-900 border-t border-slate-800 flex flex-col gap-1.5">
        {/* Timeline Scrubber */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 w-9 text-right">
            {formatSeconds(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 60}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
          />
          <span className="text-[11px] font-mono text-slate-400 w-9">
            {formatSeconds(duration || 60)}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-slate-950" /> : <Play className="w-3.5 h-3.5 fill-slate-950" />}
            </button>

            <button
              onClick={() => {
                if (mediaRef.current) mediaRef.current.currentTime = 0;
                onTimeUpdate(0);
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Restart"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={toggleMute}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {activeSegment && (
              <span className="text-[11px] text-slate-400 pl-1 font-medium">
                {activeSegment.speaker}
              </span>
            )}
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
