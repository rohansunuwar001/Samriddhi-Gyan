import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { BolaController } from "@/lib/bolaController";

const SEGMENT_DURATION_SECONDS = 6;  // must match ffmpeg -hls_time value
const MAX_BUFFER_SECONDS = 30;       // must match hls.js maxBufferLength below

const BolaVideoPlayer = ({ src, onPlay }) => {
  const videoRef = useRef(null);
  const hlsRef   = useRef(null);
  const bolaRef  = useRef(null);
  
  // Use a ref for the selected quality to read instantly inside Hls listeners without lag
  const userSelectionRef = useRef(-1); 

  const [currentLevelLabel, setCurrentLevelLabel] = useState("");
  const [bufferSeconds, setBufferSeconds]         = useState(0);
  const [showDebug, setShowDebug]                 = useState(false);
  const [bolaScores, setBolaScores]               = useState([]);
  const [levels, setLevels]                       = useState([]);
  const [qualitySelection, setQualitySelection]   = useState(-1); // For UI binding

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
        MAX_BUFFER_SECONDS
      );

      setLevels(data.levels);
      hls.currentLevel = 0;
      setCurrentLevelLabel(`${data.levels[0].height}p`);
      
      // Reset choices
      userSelectionRef.current = -1;
      setQualitySelection(-1);
    });

    // Unified quality management logic on fragment loading
    hls.on(Hls.Events.FRAG_LOADING, () => {
      if (!bolaRef.current || !videoRef.current) return;

      // 1. Calculate buffer metrics
      const buffered    = videoRef.current.buffered;
      const currentTime = videoRef.current.currentTime;
      let bufSecs = 0;

      for (let i = 0; i < buffered.length; i++) {
        if (buffered.start(i) <= currentTime && currentTime <= buffered.end(i)) {
          bufSecs = buffered.end(i) - currentTime;
          break;
        }
      }
      setBufferSeconds(parseFloat(bufSecs.toFixed(1)));

      // 2. Generate BOLA choice
      const bolaChosenLevel = bolaRef.current.chooseLevel(bufSecs);
      if (bolaRef.current.lastScores) {
        setBolaScores(bolaRef.current.lastScores);
      }

      // 3. Make Quality Decision based on mutable ref pointer
      if (userSelectionRef.current === -1) {
        hls.nextLevel = bolaChosenLevel;
      } else {
        hls.nextLevel = userSelectionRef.current;
      }
    });

    // Smoothly track active rendering resolution switches
    hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
      if (hls.levels[data.level]) {
        setCurrentLevelLabel(`${hls.levels[data.level].height}p`);
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
      hlsRef.current = null;
      bolaRef.current = null;
    };
  }, [src]);

  // Handle dropdown interactions smoothly
  const handleQualityChange = (e) => {
    const value = parseInt(e.target.value, 10);
    
    // 1. Update the UI state
    setQualitySelection(value);
    
    // 2. Instantly update the Engine reference pointer
    userSelectionRef.current = value;

    // 3. Force instant shift switch on player stream context
    if (hlsRef.current) {
      if (value === -1 && bolaRef.current) {
        hlsRef.current.nextLevel = bolaRef.current.chooseLevel(bufferSeconds);
      } else {
        hlsRef.current.nextLevel = value;
      }
    }
  };

  return (
    <div className="relative w-full group">
      <video ref={videoRef} controls className="w-full rounded-lg bg-black" onPlay={onPlay} />

      {/* Selector badge */}
      <div className="absolute top-2 right-2 flex items-center space-x-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-semibold z-10">
        <span>{currentLevelLabel}</span>
        <select 
          value={qualitySelection} 
          onChange={handleQualityChange}
          className="bg-transparent border-0 text-white text-xs font-semibold focus:ring-0 cursor-pointer outline-none"
        >
          <option value={-1} className="bg-neutral-950 text-white">Auto (BOLA)</option>
          {levels.map((level, index) => (
            <option key={index} value={index} className="bg-neutral-950 text-white">
              {level.height}p
            </option>
          ))}
        </select>
      </div>

      {/* Debug toggle button */}
      <button
        onClick={() => setShowDebug((d) => !d)}
        className="absolute top-2 left-2 text-[10px] bg-black/60 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        {showDebug ? "Hide debug" : "BOLA debug"}
      </button>

      {/* BOLA debug overlay */}
      {showDebug && (
        <div className="absolute top-8 left-2 bg-black/80 text-green-400 font-mono text-[10px] p-3 rounded-lg max-w-xs space-y-0.5 z-10">
          <div className="text-green-300 font-semibold mb-1">BOLA-BASIC Debug</div>
          <div className="text-yellow-400">Mode: {qualitySelection === -1 ? "AUTO" : "MANUAL"}</div>
          <div>Buffer Q(t) = {bufferSeconds}s</div>
          {bolaRef.current && (
            <>
              <div>V = {bolaRef.current.V?.toFixed(4)}</div>
              <div>γ = {bolaRef.current.gamma}, p = {SEGMENT_DURATION_SECONDS}s</div>
              <div className="mt-1 text-green-300">Scores:</div>
              {bolaScores.map((s, i) => (
                <div
                  key={i}
                  className={levels[i] && currentLevelLabel === `${levels[i].height}p` ? "text-yellow-400 font-bold" : ""}
                >
                  {levels[i]?.height}p: {s.toFixed(6)}
                  {levels[i] && currentLevelLabel === `${levels[i].height}p` ? " ← current" : ""}
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