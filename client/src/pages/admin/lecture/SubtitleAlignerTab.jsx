import React, { useState } from "react";
import { Play, RotateCcw, AlertCircle, Sparkles, Check, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { alignSubtitlesDTW } from "@/utils/dtwAligner";
import { toast } from "sonner";

const DEFAULT_DRIFTED_CUES = [
  { id: 1, start: 0.0, end: 3.0, text: "Hi everyone" },
  { id: 2, start: 3.0, end: 7.0, text: "Today we will learn React" },
  { id: 3, start: 7.0, end: 12.0, text: "It is a popular frontend library" },
];

const ACCURATE_AUDIO_WORDS = [
  { word: "Hi", start: 1.0, end: 1.5 },
  { word: "everyone", start: 1.6, end: 2.5 },
  { word: "Today", start: 4.0, end: 4.4 },
  { word: "we", start: 4.5, end: 4.8 },
  { word: "will", start: 4.9, end: 5.2 },
  { word: "learn", start: 5.3, end: 5.7 },
  { word: "React", start: 5.8, end: 6.5 },
  { word: "It", start: 8.5, end: 8.8 },
  { word: "is", start: 8.9, end: 9.1 },
  { word: "a", start: 9.2, end: 9.4 },
  { word: "popular", start: 9.5, end: 10.1 },
  { word: "frontend", start: 10.2, end: 10.8 },
  { word: "library", start: 10.9, end: 11.8 },
];

const SubtitleAlignerTab = () => {
  const [cues, setCues] = useState(DEFAULT_DRIFTED_CUES);
  const [isAligned, setIsAligned] = useState(false);
  const [aligning, setAligning] = useState(false);

  const handleRunDTW = () => {
    setAligning(true);
    setTimeout(() => {
      try {
        const aligned = alignSubtitlesDTW(cues, ACCURATE_AUDIO_WORDS);
        setCues(aligned);
        setIsAligned(true);
        toast.success("DTW Subtitle alignment completed successfully!");
      } catch (err) {
        toast.error("Failed to run DTW alignment: " + err.message);
      } finally {
        setAligning(false);
      }
    }, 800);
  };

  const handleReset = () => {
    setCues(DEFAULT_DRIFTED_CUES);
    setIsAligned(false);
    toast.info("Reset to drifted timeline values.");
  };

  return (
    <Card className="rounded-none border-[#d1d7dc] shadow-sm">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-slate-800 tracking-tight">
            Subtitle Aligner
          </CardTitle>
          <div className="flex gap-2">
            {isAligned ? (
              <Button
                variant="outline"
                onClick={handleReset}
                className="h-9 text-xs rounded-none border-[#1c1d1f]"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
              </Button>
            ) : (
              <Button
                onClick={handleRunDTW}
                disabled={aligning}
                className="h-9 text-xs rounded-none bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {aligning ? "Aligning..." : "Auto-Align using DTW"}
              </Button>
            )}
          </div>
        </div>
        <CardDescription className="text-xs text-slate-500">
          Correct sync errors and audio drifts automatically by matching cues against raw vocal transcriptions.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status Alert */}
        <div className={`p-4 border flex items-start gap-3 rounded-none ${
          isAligned
            ? "bg-green-50/60 border-green-200 text-green-800"
            : "bg-amber-50/60 border-amber-200 text-amber-800"
        }`}>
          <AlertCircle className={`w-5 h-5 shrink-0 ${isAligned ? "text-green-600" : "text-amber-600"}`} />
          <div className="text-xs space-y-1">
            <p className="font-bold">
              {isAligned
                ? "Subtitles Correctly Aligned!"
                : "Timeline Drift Detected!"}
            </p>
            <p className="leading-relaxed">
              {isAligned
                ? "Optimal warping path calculated. Subtitle timestamps stretched and aligned to actual voice timestamps."
                : "Subtitle cue boundaries do not match accurate audio transcript positions. Use DTW matching to recalibrate."}
            </p>
          </div>
        </div>

        {/* Cues List & Timelines */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Subtitle Cues Timeline
          </h4>
          <div className="space-y-3">
            {cues.map((cue) => {
              // Calculate width / offsets to render a mock timeline track bar
              const durationMax = 12.0;
              const leftPercent = (cue.start / durationMax) * 100;
              const widthPercent = ((cue.end - cue.start) / durationMax) * 100;

              return (
                <div
                  key={cue.id}
                  className="bg-slate-50 border border-slate-200 p-4 rounded-none space-y-3 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-800">
                      "{cue.text}"
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-white border px-2 py-0.5 text-slate-600">
                        {cue.start.toFixed(1)}s
                      </span>
                      <span className="text-xs text-slate-400">to</span>
                      <span className="text-xs font-mono bg-white border px-2 py-0.5 text-slate-600">
                        {cue.end.toFixed(1)}s
                      </span>
                      {isAligned && (
                        <span className="text-[10px] text-green-600 font-bold bg-green-50 border border-green-100 px-1.5 py-0.5 uppercase tracking-wide">
                          Synced
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Horizontal visual track block */}
                  <div className="relative h-6 bg-slate-200 border border-slate-300 w-full overflow-hidden">
                    {/* Visual cue bar */}
                    <div
                      className="absolute top-0 bottom-0 bg-purple-600/20 border-x-2 border-purple-600 h-full flex items-center justify-center transition-all duration-500 ease-out"
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                    >
                      <span className="text-[10px] text-purple-800 font-bold px-1 truncate select-none">
                        Cue {cue.id}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Word alignment reference list */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Vocal Transcription Reference Cues
            </h4>
            <div className="relative group">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
              <div className="absolute left-6 bottom-0 hidden group-hover:block bg-slate-800 text-white text-[10px] p-2 rounded w-44 z-10 leading-normal">
                These are highly accurate word bounds generated by our speech recognition audio model.
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {ACCURATE_AUDIO_WORDS.map((w, idx) => (
              <div
                key={idx}
                className="bg-white border text-xs px-2.5 py-1 rounded-none flex items-center gap-1.5 shadow-2xs"
              >
                <span className="font-semibold text-slate-700">{w.word}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {w.start.toFixed(1)}s
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubtitleAlignerTab;
