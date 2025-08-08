import { Award, Code, Download, FileText, Smartphone, Youtube } from 'lucide-react';
import PropTypes from 'prop-types';
const icons = { Youtube, Code, FileText, Download, Smartphone, Award };

const CourseIncludes = ({ includes }) => (
    <div>
        <h2 className="text-2xl font-bold mb-4">This course includes:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            {includes.map((item) => {
                const Icon = icons[item.icon];
                return (
                    <div key={item.text} className="flex items-center gap-3">
                        {Icon && <Icon className="h-5 w-5 text-gray-700"/>}
                        <span>{item.text}</span>
                    </div>
                );
            })}
        </div>
    </div>
);


CourseIncludes.propTypes = {
    includes: PropTypes.arrayOf(
        PropTypes.shape({
            icon: PropTypes.string,
            text: PropTypes.string.isRequired,
        })
        ).isRequired,
        };
export default CourseIncludes;