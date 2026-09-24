import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import Hls from "hls.js";
import { BolaController } from "@/lib/bolaController";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Captions,
  Settings,
  Maximize,
  Minimize,
  RectangleHorizontal,
  ChevronLeft,
  ChevronRight,
  StickyNote,
  FileText,
  Check,
} from "lucide-react";

const SEGMENT_DURATION_SECONDS = 6; // must match ffmpeg -hls_time value
const MAX_BUFFER_SECONDS = 30; // must match hls.js maxBufferLength below

const DEFAULT_SUBTITLES = [
  { start: 1.0, end: 2.5, text: "Hi everyone" },
  { start: 4.0, end: 6.5, text: "Today we will learn React" },
  { start: 8.5, end: 11.8, text: "It is a popular frontend library" },
];

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const BolaVideoPlayer = forwardRef(({
  src,
  subtitles,
  onPlay,
  onEnded,
  onTimeProgress,
  offlineMode = false,
  onPrevLecture,
  onNextLecture,
  hasPrev = false,
  hasNext = false,
  onAddNote,
  onToggleTranscript,
  onToggleTheater,
  isTheaterMode = false,
}, ref) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const bolaRef = useRef(null);

  const userSelectionRef = useRef(-1);
  const hasEndedRef = useRef(false);
  const controlsTimeoutRef = useRef(null);

  useImperativeHandle(ref, () => ({
    seekTo: (timeInSeconds) => {
      if (videoRef.current) {
        videoRef.current.currentTime = timeInSeconds;
        setCurrentTime(timeInSeconds);
        videoRef.current.play?.();
        setIsPlaying(true);
      }
    },
    getCurrentTime: () => {
      return videoRef.current ? videoRef.current.currentTime : 0;
    },
    pause: () => {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    },
    play: () => {
      if (videoRef.current) {
        videoRef.current.play?.();
        setIsPlaying(true);
      }
    },
  }));

  // Player UI states
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [areControlsVisible, setAreControlsVisible] = useState(true);

  // BOLA & HLS states
  const [currentLevelLabel, setCurrentLevelLabel] = useState("");
  const [bufferSeconds, setBufferSeconds] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [bolaScores, setBolaScores] = useState([]);
  const [levels, setLevels] = useState([]);
  const [qualitySelection, setQualitySelection] = useState(-1);

  // Global YouTube/Udemy Quality Labeling System
  const getQualityLabel = (height) => {
    if (!height) return "";
    if (height >= 2160) return `${height}p (4K)`;
    if (height >= 1440) return `${height}p (2K)`;
    if (height >= 720) return `${height}p (HD)`;
    return `${height}p`;
  };

  // Reset inactive controls timer
  const resetControlsTimer = useCallback(() => {
    setAreControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setAreControlsVisible(false);
        setShowSettings(false);
        setShowSpeedMenu(false);
      }, 2600);
    }
  }, [isPlaying]);

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [resetControlsTimer]);

  useEffect(() => {
    hasEndedRef.current = false;
    if (!src || !videoRef.current) return;

    const isHls = src.toLowerCase().includes(".m3u8") || (offlineMode && src.startsWith("blob:"));

    if (!isHls) {
      videoRef.current.src = src;
      setCurrentLevelLabel("1080p (Full Quality)");
      return;
    }

    if (!Hls.isSupported()) {
      if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
        videoRef.current.src = src;
      }
      return;
    }

    const hls = new Hls({
      maxBufferLength: MAX_BUFFER_SECONDS,
      autoLevelEnabled: false,
    });
    hlsRef.current = hls;

    hls.loadSource(src);
    hls.attachMedia(videoRef.current);

    hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
      const bitrates = data.levels.map((l) => l.bitrate);

      bolaRef.current = new BolaController(
        bitrates,
        SEGMENT_DURATION_SECONDS,
        MAX_BUFFER_SECONDS,
      );

      setLevels(data.levels);

      // Default to highest resolution available
      let maxIndex = 0;
      data.levels.forEach((level, idx) => {
        if (level.height > data.levels[maxIndex].height) {
          maxIndex = idx;
        }
      });

      hls.currentLevel = maxIndex;
      setCurrentLevelLabel(getQualityLabel(data.levels[maxIndex].height));

      userSelectionRef.current = -1;
      setQualitySelection(-1);
    });

    hls.on(Hls.Events.FRAG_LOADING, () => {
      if (!bolaRef.current || !videoRef.current) return;

      const buffered = videoRef.current.buffered;
      const time = videoRef.current.currentTime;
      let bufSecs = 0;

      for (let i = 0; i < buffered.length; i++) {
        if (buffered.start(i) <= time && time <= buffered.end(i)) {
          bufSecs = buffered.end(i) - time;
          break;
        }
      }
      setBufferSeconds(parseFloat(bufSecs.toFixed(1)));

      const bolaChosenLevel = bolaRef.current.chooseLevel(bufSecs);
      if (bolaRef.current.lastScores) {
        setBolaScores(bolaRef.current.lastScores);
      }

      if (userSelectionRef.current === -1) {
        hls.nextLevel = bolaChosenLevel;
      } else {
        hls.nextLevel = userSelectionRef.current;
      }
    });

    hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
      if (hls.levels[data.level]) {
        setCurrentLevelLabel(getQualityLabel(hls.levels[data.level].height));
      }
    });

    hls.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) {
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
        else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
        else hls.destroy();
      }
    });

    return () => {
      hls.destroy();
      if (hlsRef.current) hlsRef.current = null;
      bolaRef.current = null;
    };
  }, [src]);

  const updateBufferedAmount = () => {
    if (!videoRef.current || !videoRef.current.duration) return;
    const dur = videoRef.current.duration;
    const current = videoRef.current.currentTime;
    const buffered = videoRef.current.buffered;
    if (buffered && buffered.length > 0) {
      for (let i = buffered.length - 1; i >= 0; i--) {
        if (buffered.start(i) <= current) {
          const end = buffered.end(i);
          setBufferedPercent(Math.min(100, (end / dur) * 100));
          return;
        }
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      setCurrentTime(current);
      if (onTimeProgress) {
        onTimeProgress(current);
      }
      updateBufferedAmount();
      if (dur > 0 && dur - current <= 1 && !hasEndedRef.current) {
        hasEndedRef.current = true;
        if (onEnded) onEnded();
      } else if (dur > 0 && dur - current > 1 && hasEndedRef.current) {
        hasEndedRef.current = false;
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      updateBufferedAmount();
    }
  };

  const handleScrubberMouseMove = (e) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition(pos * 100);
    setHoverTime(pos * duration);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      setAreControlsVisible(true);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
      resetControlsTimer();
      if (onPlay) onPlay();
    }
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const seekDelta = (seconds) => {
    if (!videoRef.current) return;
    const nextTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    videoRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
    resetControlsTimer();
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMute = !isMuted;
    videoRef.current.muted = nextMute;
    setIsMuted(nextMute);
    if (!nextMute && volume === 0) {
      setVolume(0.5);
      videoRef.current.volume = 0.5;
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const changeSpeed = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSpeedMenu(false);
  };

  const changeQuality = (index) => {
    const value = parseInt(index, 10);
    setQualitySelection(value);
    userSelectionRef.current = value;

    if (hlsRef.current) {
      if (value === -1 && bolaRef.current) {
        hlsRef.current.nextLevel = bolaRef.current.chooseLevel(bufferSeconds);
      } else {
        hlsRef.current.nextLevel = value;
      }
    }
    setShowSettings(false);
  };

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return "0:00";
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const playedPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimer}
      onMouseLeave={() => isPlaying && setAreControlsVisible(false)}
      className="relative w-full group bg-black overflow-hidden select-none aspect-video text-white rounded-none"
    >
      {/* ── Video Element ── */}
      <video
        ref={videoRef}
        className="w-full h-full cursor-pointer object-contain bg-black"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          setAreControlsVisible(true);
          if (onEnded && !hasEndedRef.current) {
            hasEndedRef.current = true;
            onEnded();
          }
        }}
      />

      {/* ── Big Center Play / Pause Button (Shown on Pause or Hover) ── */}
      {(!isPlaying || areControlsVisible) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className={`pointer-events-auto h-20 w-20 rounded-full bg-black/60 hover:bg-black/85 flex items-center justify-center text-white transition-all transform hover:scale-105 shadow-2xl backdrop-blur-xs border border-white/15 ${
              isPlaying ? "opacity-0 hover:opacity-100" : "opacity-100"
            }`}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-9 w-9 fill-white text-white" />
            ) : (
              <Play className="h-9 w-9 fill-white text-white translate-x-0.5" />
            )}
          </button>
        </div>
      )}

      {/* ── Left Edge Previous Lecture Chevron Button ── */}
      {(hasPrev || onPrevLecture) && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onPrevLecture) onPrevLecture();
            else seekDelta(-10);
          }}
          className={`absolute left-0 top-1/2 -translate-y-1/2 bg-[#a435f0] hover:bg-[#8710d8] text-white p-2.5 py-3.5 rounded-r-md cursor-pointer shadow-xl transition-all duration-200 z-30 ${
            areControlsVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
          }`}
          title="Previous lecture"
          aria-label="Previous lecture"
        >
          <ChevronLeft className="w-5 h-5 text-white stroke-[2.5]" />
        </button>
      )}

      {/* ── Right Edge Next Lecture Chevron Button ── */}
      {(hasNext || onNextLecture) && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onNextLecture) onNextLecture();
            else seekDelta(10);
          }}
          className={`absolute right-0 top-1/2 -translate-y-1/2 bg-[#a435f0] hover:bg-[#8710d8] text-white p-2.5 py-3.5 rounded-l-md cursor-pointer shadow-xl transition-all duration-200 z-30 ${
            areControlsVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
          }`}
          title="Next lecture"
          aria-label="Next lecture"
        >
          <ChevronRight className="w-5 h-5 text-white stroke-[2.5]" />
        </button>
      )}

      {/* ── Subtitles Overlay ── */}
      {subtitlesEnabled && (() => {
        const active = (subtitles || DEFAULT_SUBTITLES).find(
          (s) => currentTime >= s.start && currentTime <= s.end
        );
        return active ? (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/85 px-4 py-1.5 rounded-xs text-[15px] font-sans tracking-wide text-white text-center pointer-events-none select-none max-w-[80%] z-20 transition-all font-medium border border-white/10 shadow-lg">
            {active.text}
          </div>
        ) : null;
      })()}

      {/* ── Udemy Style Bottom Overlay Controls ── */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-8 pb-2.5 px-4 transition-opacity duration-200 z-30 ${
          areControlsVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Full-width Scrubber Progress Bar (Udemy Purple) */}
        <div className="flex items-center w-full mb-2.5 group/track relative py-1 cursor-pointer">
          {/* Hover Time Tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-7 transform -translate-x-1/2 bg-black/95 text-white text-[11px] px-2 py-0.5 rounded shadow pointer-events-none font-mono z-40 border border-white/15"
              style={{ left: `${hoverPosition}%` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}

          {/* Visual Track Bar */}
          <div className="relative w-full h-1 group-hover/track:h-1.5 transition-all duration-150 bg-white/25 rounded-none overflow-hidden">
            {/* Buffered Track */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-white/45 transition-all duration-200"
              style={{ width: `${bufferedPercent}%` }}
            />
            {/* Played Progress Track (Udemy Purple #a435f0) */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-[#a435f0]"
              style={{ width: `${playedPercent}%` }}
            />
          </div>

          {/* Invisible Interactive Range Input */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            onMouseMove={handleScrubberMouseMove}
            onMouseLeave={() => setHoverTime(null)}
            className="absolute inset-0 w-full opacity-0 cursor-pointer accent-[#a435f0] z-20"
          />

          {/* Scrubber Knob (Purple with white border) */}
          <div
            className="absolute h-3.5 w-3.5 bg-[#a435f0] border-2 border-white rounded-full shadow-md transform -translate-x-1/2 pointer-events-none scale-0 group-hover/track:scale-100 transition-transform duration-150 z-30"
            style={{ left: `${playedPercent}%` }}
          />
        </div>

        {/* Action Controls Row */}
        <div className="flex items-center justify-between text-[13.5px]">
          {/* Left Action Buttons */}
          <div className="flex items-center space-x-3.5">
            {/* Play/Pause */}
            <button
              type="button"
              onClick={togglePlay}
              className="text-white hover:text-[#a435f0] transition-colors p-1"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current" />
              )}
            </button>

            {/* Rewind 5s */}
            <button
              type="button"
              onClick={() => seekDelta(-5)}
              className="relative text-white hover:text-[#a435f0] transition-colors p-1 flex items-center justify-center"
              title="Rewind 5s"
            >
              <RotateCcw className="w-5 h-5" />
              <span className="absolute inset-0 flex items-center justify-center text-[8.5px] font-bold mt-0.5 pointer-events-none">
                5
              </span>
            </button>

            {/* Speed Selector Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowSpeedMenu(!showSpeedMenu);
                  setShowSettings(false);
                }}
                className="px-2 py-0.5 rounded border border-white/40 hover:border-white text-white font-medium text-[12px] hover:text-[#c084fc] transition-colors flex items-center gap-0.5"
                title="Playback rate"
              >
                {playbackRate}x
              </button>

              {/* Speed Popover Menu */}
              {showSpeedMenu && (
                <div className="absolute bottom-9 left-0 bg-[#1c1d1f] border border-[#3e4143] text-white py-1 rounded-sm shadow-2xl w-28 flex flex-col z-40 text-[13px]">
                  <div className="px-3 py-1 text-gray-400 font-semibold border-b border-[#3e4143] text-[11px] uppercase tracking-wider">
                    Playback Speed
                  </div>
                  {PLAYBACK_SPEEDS.map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => changeSpeed(speed)}
                      className={`w-full text-left px-3 py-1.5 hover:bg-white/10 transition flex items-center justify-between ${
                        playbackRate === speed ? "text-[#a435f0] font-semibold bg-white/5" : "text-gray-200"
                      }`}
                    >
                      <span>{speed}x</span>
                      {playbackRate === speed && <Check className="w-3.5 h-3.5 text-[#a435f0]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Forward 5s */}
            <button
              type="button"
              onClick={() => seekDelta(5)}
              className="relative text-white hover:text-[#a435f0] transition-colors p-1 flex items-center justify-center"
              title="Forward 5s"
            >
              <RotateCw className="w-5 h-5" />
              <span className="absolute inset-0 flex items-center justify-center text-[8.5px] font-bold mt-0.5 pointer-events-none">
                5
              </span>
            </button>

            {/* Time Counter */}
            <div className="text-[13px] text-white/90 tracking-wide font-sans font-medium pl-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            {/* Add Note Button */}
            {onAddNote && (
              <button
                type="button"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.pause();
                    setIsPlaying(false);
                    setAreControlsVisible(true);
                  }
                  onAddNote(currentTime);
                }}
                className="text-white hover:text-[#a435f0] transition-colors p-1"
                title="Add note at current time"
              >
                <StickyNote className="w-4.5 h-4.5" />
              </button>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-3.5 relative">
            {/* Volume & Hover Slider */}
            <div className="flex items-center gap-1.5 group/volume">
              <button
                type="button"
                onClick={toggleMute}
                className="text-white hover:text-[#a435f0] transition-colors p-1"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/volume:w-16 transition-all duration-200 accent-[#a435f0] h-1 bg-white/30 rounded cursor-pointer"
              />
            </div>

            {/* Transcript Icon */}
            {onToggleTranscript && (
              <button
                type="button"
                onClick={onToggleTranscript}
                className="text-white hover:text-[#a435f0] transition-colors p-1"
                title="Transcript"
              >
                <FileText className="w-4.5 h-4.5" />
              </button>
            )}

            {/* Captions CC Toggle */}
            <button
              type="button"
              onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
              className={`p-1 transition-colors ${
                subtitlesEnabled ? "text-[#a435f0]" : "text-white/70 hover:text-white"
              }`}
              title="Toggle Subtitles / Captions"
            >
              <Captions className="w-5 h-5" />
            </button>

            {/* Settings / Quality Gear Icon */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowSettings(!showSettings);
                  setShowSpeedMenu(false);
                }}
                className={`text-white hover:text-[#a435f0] transition-colors p-1 relative ${
                  showSettings ? "text-[#a435f0]" : ""
                }`}
                title="Settings & Quality"
              >
                <Settings className="w-5 h-5" />
                {currentLevelLabel.includes("(HD)") && (
                  <span className="absolute -top-1 -right-1 text-[8px] bg-[#a435f0] text-white px-1 py-0.2 rounded font-bold">
                    HD
                  </span>
                )}
              </button>

              {/* Quality Settings Popover Menu */}
              {showSettings && (
                <div className="absolute bottom-9 right-0 bg-[#1c1d1f] border border-[#3e4143] text-white py-1 rounded-sm shadow-2xl w-48 flex flex-col z-40 font-sans text-[13px]">
                  <div className="px-3 py-1 text-gray-400 font-semibold border-b border-[#3e4143] text-[11px] uppercase tracking-wider">
                    Resolution Quality
                  </div>
                  <button
                    type="button"
                    onClick={() => changeQuality(-1)}
                    className={`w-full text-left px-3 py-1.5 hover:bg-white/10 transition flex items-center justify-between ${
                      qualitySelection === -1 ? "text-[#a435f0] font-semibold bg-white/5" : "text-gray-200"
                    }`}
                  >
                    <span>
                      Auto (BOLA) {qualitySelection === -1 && `[${currentLevelLabel}]`}
                    </span>
                    {qualitySelection === -1 && <Check className="w-3.5 h-3.5 text-[#a435f0]" />}
                  </button>
                  {levels.map((level, index) => {
                    const isChosen =
                      qualitySelection === index ||
                      (qualitySelection === -1 && currentLevelLabel === getQualityLabel(level.height));
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => changeQuality(index)}
                        className={`w-full text-left px-3 py-1.5 hover:bg-white/10 transition flex items-center justify-between ${
                          isChosen ? "text-[#a435f0] font-semibold bg-white/5" : "text-gray-200"
                        }`}
                      >
                        <span>{getQualityLabel(level.height)}</span>
                        {isChosen && <Check className="w-3.5 h-3.5 text-[#a435f0]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Theater / Wide Screen Mode */}
            {onToggleTheater && (
              <button
                type="button"
                onClick={onToggleTheater}
                className={`text-white hover:text-[#a435f0] transition-colors p-1 ${
                  isTheaterMode ? "text-[#a435f0]" : ""
                }`}
                title="Theater mode"
              >
                <RectangleHorizontal className="w-5 h-5" />
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="text-white hover:text-[#a435f0] transition-colors p-1"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── BOLA Engine Diagnostic Debug Toggle Button (Top-Left) ── */}
      <button
        type="button"
        onClick={() => setShowDebug((d) => !d)}
        className="absolute top-3 left-3 text-[11px] font-mono bg-black/75 hover:bg-black/90 text-white px-2.5 py-1 rounded border border-white/20 transition-all z-40 cursor-pointer shadow"
      >
        {showDebug ? "Hide debug" : "BOLA debug"}
      </button>

      {/* ── BOLA Diagnostic Stream Layer Display (Matches Reference Image Exactly) ── */}
      {showDebug && (
        <div className="absolute top-10 left-3 bg-black/90 text-green-400 font-mono text-[11px] p-3 rounded-lg border border-neutral-800 shadow-2xl max-w-[240px] space-y-1 z-40 select-none pointer-events-none">
          <div className="text-green-300 font-semibold text-[12px] mb-1">
            BOLA-BASIC Debug
          </div>
          <div className="text-yellow-400 font-medium">
            Mode: {qualitySelection === -1 ? "AUTO" : "MANUAL"}
          </div>
          <div>Buffer Q(t) = {bufferSeconds}s</div>
          {bolaRef.current && (
            <>
              <div>V = {bolaRef.current.V?.toFixed(4)}</div>
              <div>
                γ = {bolaRef.current.gamma}, p = {SEGMENT_DURATION_SECONDS}s
              </div>
              <div className="mt-1 text-green-300 font-semibold">Scores:</div>
              {bolaScores.map((s, i) => {
                const isCurrent =
                  levels[i] && currentLevelLabel === getQualityLabel(levels[i].height);
                return (
                  <div
                    key={i}
                    className={isCurrent ? "text-yellow-400 font-bold" : "text-green-400"}
                  >
                    {levels[i]?.height}p: {s.toFixed(6)} {isCurrent && "← current"}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
});

BolaVideoPlayer.displayName = "BolaVideoPlayer";

export default BolaVideoPlayer;
