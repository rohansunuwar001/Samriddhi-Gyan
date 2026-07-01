// src/pages/Courses/CourseIncludes.jsx
//
// Renders the "This course includes:" section in Udemy-style two-column layout.
// Video hours are auto-computed from course.totalDurationInSeconds.
// All other stats come from course.courseIncludes (set by instructor).

import React from 'react';
import { Award, Code, Download, FileText, Smartphone, Video } from 'lucide-react';
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

function plural(n, word) {
  return `${n} ${word}${n !== 1 ? 's' : ''}`;
}

// ── build the ordered items list ──────────────────────────────────────────────
function buildItems(totalDurationInSeconds, courseIncludes) {
  const ci = courseIncludes || {};
  const left  = [];
  const right = [];

  // Left column
  const videoLabel = formatVideoHours(totalDurationInSeconds);
  if (videoLabel)
    left.push({ Icon: Video, label: videoLabel });

  if (ci.codingExercises > 0)
    left.push({ Icon: Code, label: plural(ci.codingExercises, 'coding exercise') });

  if (ci.articles > 0)
    left.push({ Icon: FileText, label: plural(ci.articles, 'article') });

  // Right column
  if (ci.downloadableResources > 0)
    right.push({ Icon: Download, label: plural(ci.downloadableResources, 'downloadable resource') });

  if (ci.hasMobileAccess !== false)
    right.push({ Icon: Smartphone, label: 'Access on mobile and TV' });

  if (ci.hasCertificate !== false)
    right.push({ Icon: Award, label: 'Certificate of completion' });

  return { left, right };
}

// ── component ─────────────────────────────────────────────────────────────────
const CourseIncludes = ({ course }) => {
  const { left, right } = buildItems(
    course?.totalDurationInSeconds,
    course?.courseIncludes,
  );

  const hasAnyItem = left.length > 0 || right.length > 0;

  if (!hasAnyItem) return null;

  const maxRows = Math.max(left.length, right.length);

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">This course includes:</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
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
    </section>
  );
};

const IncludeRow = ({ Icon, label }) => (
  <div className="flex items-center gap-3">
    <Icon className="h-5 w-5 flex-shrink-0 text-gray-600" />
    <span className="text-violet-700 font-medium">{label}</span>
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
    }),
  }),
};

export default CourseIncludes;
