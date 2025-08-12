import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { PlayCircle } from 'lucide-react';
import PropTypes from 'prop-types';

// Helper to format seconds to "hh:mm:ss"
const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [
        h > 0 ? `${h}h` : null,
        m > 0 ? `${m}m` : null,
        s > 0 && h === 0 ? `${s}s` : null,
    ].filter(Boolean).join(" ");
};

const CourseContent = ({ sections = [], totalLectures = 0, totalLength = 0 }) => (
    <div>
        <h2 className="text-2xl font-bold">Course content</h2>
        <div className="text-sm text-gray-600 flex items-center gap-3 mt-1 mb-4">
            <span>{sections.length} sections</span>
            <span>•</span>
            <span>{totalLectures} lectures</span>
            <span>•</span>
            <span>{formatDuration(totalLength)} total length</span>
        </div>
        <Accordion type="single" collapsible className="w-full">
            {sections.map((section, index) => (
                <AccordionItem value={`item-${index}`} key={section._id || index}>
                    <AccordionTrigger className="font-bold bg-gray-50 hover:bg-gray-100 px-4">
                        <div className="flex justify-between w-full pr-4">
                            <span>{section.title}</span>
                            <span className="text-gray-600 font-normal text-sm">
                                {(section.lectures?.length || 0)} lectures • {formatDuration(section.totalDurationInSeconds)}
                            </span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <ul className="divide-y divide-gray-200">
                            {Array.isArray(section.lectures) && section.lectures.length > 0 ? (
                                section.lectures.map((lecture, lecIndex) => (
                                    <li key={lecture._id || lecIndex} className="px-4 py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <PlayCircle className="h-5 w-5 text-gray-500" />
                                            <span className={lecture.isPreview ? "text-blue-500 underline" : ""}>
                                                {lecture.title}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {lecture.isPreview && (
                                                <span className="text-blue-500 text-sm underline cursor-pointer">Preview</span>
                                            )}
                                            <span className="text-gray-500 text-sm">
                                                {formatDuration(lecture.duration)}
                                            </span>
                                        </div>
                                    </li>
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
                    duration: PropTypes.number, // in seconds
                    isPreview: PropTypes.bool,
                })
            ),
        })
    ),
    totalLectures: PropTypes.number,
    totalLength: PropTypes.number, // in seconds
};


export default CourseContent;