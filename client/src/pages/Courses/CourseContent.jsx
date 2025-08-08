import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { PlayCircle } from 'lucide-react';
import PropTypes from 'prop-types';

const CourseContent = ({ sections, totalLectures, totalLength }) => (
    console.log("Course Content Sections:", sections),
    <div>
        <h2 className="text-2xl font-bold">Course content</h2>
        <div className="text-sm text-gray-600 flex items-center gap-3 mt-1 mb-4">
            <span>{sections.length} sections</span>
            <span>•</span>
            <span>{totalLectures} lectures</span>
             <span>•</span>
            <span>{totalLength} total length</span>
        </div>
        <Accordion type="single" collapsible className="w-full">
            {sections.map((section, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger className="font-bold bg-gray-50 hover:bg-gray-100 px-4">
                       <div className="flex justify-between w-full pr-4">
                            <span>{section.title}</span>
                            <span className="text-gray-600 font-normal text-sm">{section.lectureCount} lectures • {section.duration}</span>
                       </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <ul className="divide-y divide-gray-200">
                           {section.lectures.map((lecture, lecIndex) => (
                               <li key={lecIndex} className="px-4 py-3 flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                        <PlayCircle className="h-5 w-5 text-gray-500"/>
                                        <span className={lecture.isPreview ? "text-blue-500 underline" : ""}>{lecture.title}</span>
                                   </div>
                                   <div className="flex items-center gap-3">
                                       {lecture.isPreview && <span className="text-blue-500 text-sm underline cursor-pointer">Preview</span>}
                                       <span className="text-gray-500 text-sm">{lecture.duration}</span>
                                   </div>
                               </li>
                           ))}
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
            title: PropTypes.string.isRequired,
            lectureCount: PropTypes.number.isRequired,
            duration: PropTypes.string.isRequired,
            lectures: PropTypes.arrayOf(
                PropTypes.shape({
                    title: PropTypes.string.isRequired,
                    duration: PropTypes.string.isRequired,
                    isPreview: PropTypes.bool,
                })
            ).isRequired,
        })
    ).isRequired,
    totalLectures: PropTypes.number.isRequired,
    totalLength: PropTypes.string.isRequired,
};


export default CourseContent;