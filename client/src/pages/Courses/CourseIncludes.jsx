// src/pages/Courses/CourseIncludes.jsx
//
// Renders the "This course includes:" section in Udemy-style layout with live lecture data.
// Total duration, downloadable resources, coding exercises / labs, and captions are
// computed dynamically from real MongoDB course and lecture data.

import React from 'react';
import { Award, Captions, Code, Download, FileText, Smartphone, Video } from 'lucide-react';
import PropTypes from 'prop-types';

// ── helpers ──────────────────────────────────────────────────────────────────
function formatVideoHours(totalSeconds = 0) {
  if (!totalSeconds || totalSeconds <= 0) return null;
  const hours = totalSeconds / 3600;
  if (hours < 1) {
    return `${Math.round(totalSeconds / 60)} mins on-demand video`;
  }
  const rounded = Math.round(hours * 2) / 2; // nearest 0.5 h
  return `${rounded} hour${rounded !== 1 ? 's' : ''} on-demand video`;
}

function plural(n, singular, pluralForm) {
  if (n === 1) return `1 ${singular}`;
  return `${n} ${pluralForm || `${singular}s`}`;
}

// ── build the ordered items list ──────────────────────────────────────────────
function buildItems(course) {
  const ci = course?.courseIncludes || {};

  // Extract from courseIncludes (persisted from updateCourseStats)
  let totalDuration = course?.totalDurationInSeconds || 0;
  let codingExercises = ci.codingExercises ?? 0;
  let downloadableResources = ci.downloadableResources ?? 0;
  let articles = ci.articles ?? 0;
  let hasCaptions = ci.hasCaptions ?? false;

  // Fallback: If sections and lectures are present in course object, live-compute to guarantee 100% freshness
  if (Array.isArray(course?.sections) && course.sections.length > 0) {
    let liveRes = 0;
    let liveLabs = 0;
    let liveArticles = 0;
    let liveCaps = false;
    let liveDur = 0;

    for (const sec of course.sections) {
      for (const lec of (sec.lectures || [])) {
        if (!lec) continue;
        liveDur += (lec.durationInSeconds || 0);
        if (Array.isArray(lec.resources)) liveRes += lec.resources.length;
        if (lec.lab && (lec.lab.isActive || lec.lab.title || lec.lab.url || lec.lab.pdfUrl)) {
          liveLabs += 1;
        }
        if (Array.isArray(lec.captions) && lec.captions.length > 0 && !lec.captionsDisabled) {
          liveCaps = true;
        }
        if ((!lec.videoUrl || lec.videoUrl === "") && (lec.description || lec.transcript)) {
          liveArticles += 1;
        }
      }
    }

    // Always prefer the live populated count if available
    downloadableResources = liveRes;
    codingExercises = liveLabs;
    hasCaptions = liveCaps;
    if (liveArticles > articles) articles = liveArticles;
    if (liveDur > 0) totalDuration = liveDur;
  }

  const left = [];
  const right = [];

  // Left Column (Udemy order: Video duration -> Coding exercises -> Articles -> Downloadable resources)
  const videoLabel = formatVideoHours(totalDuration);
  if (videoLabel) {
    left.push({ Icon: Video, label: videoLabel });
  }

  if (codingExercises > 0) {
    left.push({ Icon: Code, label: plural(codingExercises, 'coding exercise') });
  }

  if (articles > 0) {
    left.push({ Icon: FileText, label: plural(articles, 'article') });
  }

  if (downloadableResources > 0) {
    left.push({ Icon: Download, label: plural(downloadableResources, 'downloadable resource') });
  }

  // Right Column (Udemy order: Mobile access -> Closed captions -> Certificate)
  if (ci.hasMobileAccess !== false) {
    right.push({ Icon: Smartphone, label: 'Access on mobile and TV' });
  }

  if (hasCaptions) {
    right.push({ Icon: Captions, label: 'Closed captions' });
  }

  if (ci.hasCertificate !== false) {
    right.push({ Icon: Award, label: 'Certificate of completion' });
  }

  return { left, right, codingExercises };
}

// ── component ─────────────────────────────────────────────────────────────────
const CourseIncludes = ({ course }) => {
  const { left, right, codingExercises } = buildItems(course);

  const hasAnyItem = left.length > 0 || right.length > 0;
  if (!hasAnyItem) return null;

  const maxRows = Math.max(left.length, right.length);

  return (
    <section className="font-sans space-y-6">
      <div>
        <h2 className="text-[20px] font-bold text-[#1c1d1f] mb-4">This course includes:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5 text-[14px]">
          {Array.from({ length: maxRows }).map((_, i) => (
            <React.Fragment key={`row-${i}`}>
              {left[i] ? (
                <IncludeRow Icon={left[i].Icon} label={left[i].label} />
              ) : (
                <div />
              )}
              {right[i] ? (
                <IncludeRow Icon={right[i].Icon} label={right[i].label} />
              ) : (
                <div />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Udemy-Style Coding Exercises Showcase Banner ── */}
      {codingExercises > 0 && (
        <div className="border border-[#d1d7dc] p-6 bg-[#f7f9fa] flex flex-col md:flex-row items-center justify-between gap-6 transition-all">
          <div className="space-y-2 max-w-md">
            <h3 className="text-[19px] font-bold text-[#1c1d1f]">Coding Exercises</h3>
            <p className="text-[14px] text-[#2d2f31] font-light leading-relaxed">
              This course includes our updated coding exercises and hands-on labs so you can practice your skills as you learn.
            </p>
          </div>

          {/* Interactive Code Editor Graphic */}
          <div className="w-full md:w-[320px] shrink-0 rounded-sm border border-[#3e4143] bg-[#1e1e1e] text-white shadow-sm overflow-hidden text-[12px] font-mono select-none">
            <div className="bg-[#2d2d2d] px-3 py-2 flex items-center justify-between border-b border-[#3e4143]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
              </div>
              <div className="flex gap-2 text-[11px] text-gray-400">
                <span className="bg-[#1e1e1e] px-2 py-0.5 text-gray-200 rounded-t">index.js</span>
                <span className="px-1.5 py-0.5 text-gray-400">preview</span>
              </div>
            </div>
            <div className="p-3.5 space-y-1.5 text-[11.5px] leading-relaxed bg-[#1e1e1e]">
              <div>
                <span className="text-[#569cd6]">const</span> <span className="text-[#9cdcfe]">exercise</span> = <span className="text-[#ce9178]">&apos;Hands-on Lab&apos;</span>;
              </div>
              <div>
                <span className="text-[#569cd6]">function</span> <span className="text-[#dcdcaa]">solveTask</span>() &#123;
              </div>
              <div className="pl-4">
                <span className="text-[#c586c0]">return</span> <span className="text-[#ce9178]">&apos;Code verified!&apos;</span>;
              </div>
              <div>&#125;</div>
            </div>
            <div className="bg-[#252526] px-3 py-2 flex items-center justify-between text-[11px] border-t border-[#3e4143]">
              <span className="text-gray-400">⚡ Interactive Lab Workspace</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                ● Live Ready
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const IncludeRow = ({ Icon, label }) => (
  <div className="flex items-center gap-3">
    <Icon className="h-4 w-4 shrink-0 text-[#1c1d1f]" />
    <span className="text-[#2d2f31] font-light text-[14px]">{label}</span>
  </div>
);

CourseIncludes.propTypes = {
  course: PropTypes.shape({
    totalDurationInSeconds: PropTypes.number,
    courseIncludes: PropTypes.shape({
      codingExercises:       PropTypes.number,
      articles:              PropTypes.number,
      downloadableResources: PropTypes.number,
      hasMobileAccess:       PropTypes.bool,
      hasCertificate:        PropTypes.bool,
      hasCaptions:           PropTypes.bool,
    }),
    sections: PropTypes.arrayOf(
      PropTypes.shape({
        lectures: PropTypes.arrayOf(PropTypes.object),
      })
    ),
  }),
};

export default CourseIncludes;

