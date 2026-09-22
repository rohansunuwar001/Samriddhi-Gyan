import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronDown, ChevronUp, FileText, PlayCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import { useState } from 'react';

// ── Duration formatting ─────────────────────────────────────────────────────
// Short form for section/course summary line: "61h 53m"
const formatDurationShort = (seconds) => {
    if (!seconds || isNaN(seconds) || seconds <= 0) return "0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
};

// Per-lecture form, Samriddhi Gyan style: "3:08", "0:12", "1:05:33"
const formatDurationClock = (seconds) => {
    if (!seconds || isNaN(seconds) || seconds <= 0) return "0:00";
    const total = Math.round(seconds);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) {
        return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${m}:${String(s).padStart(2, "0")}`;
};

// ── Single lecture row ───────────────────────────────────────────────────────
const LectureRow = ({ lecture }) => {
    const [showDescription, setShowDescription] = useState(false);
    const hasDescription = Boolean(lecture.description?.trim());
    const isDownload = lecture.type === "article" || lecture.type === "resource";

    return (
        <li className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    {isDownload ? (
                        <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    ) : (
                        <PlayCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                    <span className={`truncate ${lecture.isPreview ? "text-purple-700" : "text-gray-700"}`}>
                        {lecture.title}
                    </span>
                    {hasDescription && (
                        <button
                            type="button"
                            onClick={() => setShowDescription((v) => !v)}
                            className="text-gray-400 hover:text-gray-700 flex-shrink-0"
                            aria-label={showDescription ? "Hide description" : "Show description"}
                        >
                            {showDescription ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    {lecture.isPreview && (
                        <span className="flex items-center gap-1 text-purple-700 text-base font-normal">
                            <PlayCircle className="h-3.5 w-3.5 fill-current" />
                            Preview
                        </span>
                    )}
                    <span className="text-gray-500 text-base tabular-nums">
                        {formatDurationClock(lecture.durationInSeconds)}
                    </span>
                </div>
            </div>
            {hasDescription && showDescription && (
                <p className="mt-2 ml-7 text-base text-gray-600 leading-relaxed">
                    {lecture.description}
                </p>
            )}
        </li>
    );
};

LectureRow.propTypes = {
    lecture: PropTypes.shape({
        _id: PropTypes.string,
        title: PropTypes.string.isRequired,
        description: PropTypes.string,
        durationInSeconds: PropTypes.number,
        isPreview: PropTypes.bool,
        type: PropTypes.string,
    }).isRequired,
};

// ── Main component ───────────────────────────────────────────────────────────
const CourseContent = ({ sections = [], totalLectures = 0, totalLength = 0 }) => {
    const totalSections = sections.length;

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <h2 className="text-3xl font-semibold">Course content</h2>
            </div>
            <div className="text-base text-gray-600 mb-4">
                {totalSections} section{totalSections !== 1 ? "s" : ""} • {totalLectures} lecture{totalLectures !== 1 ? "s" : ""} • {formatDurationShort(totalLength)} total length
            </div>
            <Accordion type="multiple" className="w-full border border-gray-200 rounded-md overflow-hidden divide-y divide-gray-200">
                {sections.map((section, index) => (
                    <AccordionItem value={`item-${index}`} key={section._id || index} className="border-0">
                        <AccordionTrigger className="font-semibold bg-gray-50 hover:bg-gray-100 px-4 py-3 hover:no-underline">
                            <div className="flex justify-between w-full pr-4 items-center">
                                <span className="text-left">{section.title}</span>
                                <span className="text-gray-600 font-light text-base flex-shrink-0 ml-4">
                                    {(section.lectures?.length || 0)} lecture{(section.lectures?.length || 0) !== 1 ? "s" : ""} • {formatDurationShort(section.totalDurationInSeconds)}
                                </span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-0">
                            <ul className="divide-y divide-gray-100">
                                {Array.isArray(section.lectures) && section.lectures.length > 0 ? (
                                    section.lectures.map((lecture, lecIndex) => (
                                        <LectureRow key={lecture._id || lecIndex} lecture={lecture} />
                                    ))
                                ) : (
                                    <li className="px-4 py-3 text-gray-400">No lectures in this section.</li>
                                )}
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
};

CourseContent.propTypes = {
    sections: PropTypes.arrayOf(
        PropTypes.shape({
            _id: PropTypes.string,
            title: PropTypes.string.isRequired,
            totalDurationInSeconds: PropTypes.number,
            lectures: PropTypes.arrayOf(
                PropTypes.shape({
                    _id: PropTypes.string,
                    title: PropTypes.string.isRequired,
                    description: PropTypes.string,
                    durationInSeconds: PropTypes.number,
                    isPreview: PropTypes.bool,
                })
            ),
        })
    ),
    totalLectures: PropTypes.number,
    totalLength: PropTypes.number, // in seconds
};

export default CourseContent;
