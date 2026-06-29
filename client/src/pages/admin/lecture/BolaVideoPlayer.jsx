import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { BolaController } from "@/lib/bolaController";
import {
  FaPlay,
  FaPause,
  FaVolumeHigh,
  FaVolumeXmark,
  FaGear,
  FaExpand,
  FaCompress,
  FaBackwardStep,
  FaForwardStep,
} from "react-icons/fa6";

const SEGMENT_DURATION_SECONDS = 6; // must match ffmpeg -hls_time value
const MAX_BUFFER_SECONDS = 30; // must match hls.js maxBufferLength below

const BolaVideoPlayer = ({ src, onPlay }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const bolaRef = useRef(null);

  const userSelectionRef = useRef(-1);

  // Player UI states
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // BOLA & HLS states
  const [currentLevelLabel, setCurrentLevelLabel] = useState("");
  const [bufferSeconds, setBufferSeconds] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [bolaScores, setBolaScores] = useState([]);
  const [levels, setLevels] = useState([]);
  const [qualitySelection, setQualitySelection] = useState(-1);

  // Global YouTube-style Quality Labeling System
  const getQualityLabel = (height) => {
    if (!height) return "";
    if (height >= 2160) return `${height}p (4K)`;
    if (height >= 1440) return `${height}p (2K)`;
    if (height >= 720) return `${height}p (HD)`;
    return `${height}p`;
  };

  useEffect(() => {
    if (!src || !videoRef.current) return;

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

      // Find and start at the highest resolution index available
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
        else if (data.type === Hls.ErrorTypes.MEDIA_ERROR)
          hls.recoverMediaError();
        else hls.destroy();
      }
    });

    return () => {
      hls.destroy();
      if (hlsRef.current) hlsRef.current = null;
      bolaRef.current = null;
    };
  }, [src]);

  // Video Progress Events
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Playback Controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
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

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
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
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen)
        containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      setIsFullscreen(false);
    }
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
    if (isNaN(timeInSeconds)) return "0:00";
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full group bg-black rounded-lg overflow-hidden select-none aspect-video text-white"
    >
      {/* Video Stream Element */}
      <video
        ref={videoRef}
        className="w-full h-full cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* YouTube Style Overlay UI Control Strip */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
        {/* Playback Progress Scrubber Track */}
        <div className="flex items-center w-full mb-3 group/track relative">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full accent-red-600 h-1 hover:h-1.5 transition-all cursor-pointer bg-gray-600 rounded-lg appearance-none"
          />
        </div>

        {/* Dynamic Action Buttons Layout */}
        <div className="flex items-center justify-between text-sm font-medium">
          <div className="flex items-center space-x-4">
            <button
              onClick={togglePlay}
              className="hover:text-red-500 transition-colors"
            >
              {isPlaying ? (
                <FaPause className="text-base" />
              ) : (
                <FaPlay className="text-base" />
              )}
            </button>
            <button className="hover:text-gray-300 transition-colors hidden sm:block">
              <FaBackwardStep />
            </button>
            <button className="hover:text-gray-300 transition-colors hidden sm:block">
              <FaForwardStep />
            </button>

            <div className="flex items-center space-x-2 group/volume">
              <button onClick={toggleMute} className="hover:text-gray-300">
                {isMuted ? (
                  <FaVolumeXmark className="text-base" />
                ) : (
                  <FaVolumeHigh className="text-base" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/volume:w-16 transition-all duration-200 accent-white h-1 bg-gray-500 appearance-none rounded-lg cursor-pointer"
              />
            </div>

            <div className="text-xs text-gray-200 tracking-wide">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center space-x-4 relative">
            {/* Gear Configuration Button (Stable, No Rotation) */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`hover:text-red-500 transition-colors flex items-center space-x-1.5 ${showSettings ? "text-red-500" : ""}`}
            >
              <FaGear className="text-lg" />

              {/* Dynamic Badge: Only shows if the ACTIVE playing quality is HD, 2K, or 4K */}
              {currentLevelLabel.includes("(HD)") && (
                <span className="text-[9px] bg-red-600 px-1 rounded text-white font-bold tracking-tighter">
                  HD
                </span>
              )}
              {currentLevelLabel.includes("(2K)") && (
                <span className="text-[9px] bg-cyan-600 px-1 rounded text-white font-bold tracking-tighter">
                  2K
                </span>
              )}
              {currentLevelLabel.includes("(4K)") && (
                <span className="text-[9px] bg-amber-500 px-1 rounded text-white font-bold tracking-tighter">
                  4K
                </span>
              )}
            </button>

            {/* Quality Modal Panel Overlay Menu */}
            {showSettings && (
              <div className="absolute bottom-8 right-0 bg-neutral-900/95 border border-neutral-800 text-white p-2 rounded-lg shadow-xl w-44 flex flex-col z-30 font-sans text-xs">
                <div className="px-2 py-1 text-gray-400 border-b border-neutral-800 font-semibold mb-1">
                  Quality
                </div>
                <button
                  onClick={() => changeQuality(-1)}
                  className={`w-full text-left px-2 py-1.5 rounded hover:bg-neutral-800 transition ${qualitySelection === -1 ? "text-red-500 font-bold bg-neutral-800/50" : ""}`}
                >
                  Auto (BOLA){" "}
                  {qualitySelection === -1 && `[${currentLevelLabel}]`}
                </button>
                {levels.map((level, index) => (
                  <button
                    key={index}
                    onClick={() => changeQuality(index)}
                    className={`w-full text-left px-2 py-1.5 rounded hover:bg-neutral-800 transition ${
                      // Checks if manual selection is active OR if Auto (BOLA) is currently playing this specific level
                      qualitySelection === index ||
                      (qualitySelection === -1 &&
                        currentLevelLabel === getQualityLabel(level.height))
                        ? "text-red-500 font-bold bg-neutral-800/50"
                        : ""
                    }`}
                  >
                    {getQualityLabel(level.height)}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={toggleFullscreen}
              className="hover:text-red-500 transition-colors"
            >
              {isFullscreen ? (
                <FaCompress className="text-base" />
              ) : (
                <FaExpand className="text-base" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Engine Debug Panel Toggle Button */}
      <button
        onClick={() => setShowDebug((d) => !d)}
        className="absolute top-2 left-2 text-[10px] bg-black/60 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        {showDebug ? "Hide debug" : "BOLA debug"}
      </button>

      {/* Diagnostic Stream Layer Display */}
      {showDebug && (
        <div className="absolute top-8 left-2 bg-black/80 text-green-400 font-mono text-[10px] p-3 rounded-lg max-w-xs space-y-0.5 z-10 pointer-events-none">
          <div className="text-green-300 font-semibold mb-1">
            BOLA-BASIC Debug
          </div>
          <div className="text-yellow-400">
            Mode: {qualitySelection === -1 ? "AUTO" : "MANUAL"}
          </div>
          <div>Buffer Q(t) = {bufferSeconds}s</div>
          {bolaRef.current && (
            <>
              <div>V = {bolaRef.current.V?.toFixed(4)}</div>
              <div>
                γ = {bolaRef.current.gamma}, p = {SEGMENT_DURATION_SECONDS}s
              </div>
              <div className="mt-1 text-green-300">Scores:</div>
              {bolaScores.map((s, i) => (
                <div
                  key={i}
                  className={
                    levels[i] &&
                    currentLevelLabel === getQualityLabel(levels[i].height)
                      ? "text-yellow-400 font-bold"
                      : ""
                  }
                >
                  {levels[i]?.height}p: {s.toFixed(6)}
                  {levels[i] &&
                  currentLevelLabel === getQualityLabel(levels[i].height)
                    ? " ← current"
                    : ""}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BolaVideoPlayer;
