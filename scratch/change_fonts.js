const fs = require('fs');
const path = require('path');

const files = [
  'c:/Users/user/Desktop/Samriddhi Gyan/client/src/pages/admin/CourseCurriculumTab.jsx',
  'c:/Users/user/Desktop/Samriddhi Gyan/client/src/pages/admin/SectionManager.jsx',
  'c:/Users/user/Desktop/Samriddhi Gyan/client/src/pages/admin/lecture/LectureItem.jsx',
  'c:/Users/user/Desktop/Samriddhi Gyan/client/src/pages/admin/course/AddCourse.jsx',
  'c:/Users/user/Desktop/Samriddhi Gyan/client/src/pages/admin/course/EditCourse.jsx',
  'c:/Users/user/Desktop/Samriddhi Gyan/client/src/pages/admin/course/CourseLandingPageTab.jsx',
  'c:/Users/user/Desktop/Samriddhi Gyan/client/src/pages/admin/course/CourseTab.jsx',
  'c:/Users/user/Desktop/Samriddhi Gyan/client/src/pages/admin/course/CourseTable.jsx',
  'c:/Users/user/Desktop/Samriddhi Gyan/client/src/pages/admin/course/CourseAnalytics.jsx',
  'c:/Users/user/Desktop/Samriddhi Gyan/client/src/pages/admin/course/CourseReviews.jsx',
  'c:/Users/user/Desktop/Samriddhi Gyan/client/src/pages/admin/course/CourseStudent.jsx',
  'c:/Users/user/Desktop/Samriddhi Gyan/client/src/pages/admin/course/CoursePayout.jsx'
];

function processFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace text size classes from largest to smallest to avoid double transformation
  const sizeReplacements = [
    [/text-4xl/g, 'text-5xl'],
    [/text-3xl/g, 'text-4xl'],
    [/text-2xl/g, 'text-3xl'],
    [/text-xl/g, 'text-2xl'],
    [/text-lg/g, 'text-xl'],
    [/text-base/g, 'text-lg'],
    [/text-sm/g, 'text-base'],
    [/text-xs/g, 'text-sm']
  ];

  for (const [regex, replacement] of sizeReplacements) {
    content = content.replace(regex, replacement);
  }

  // Replace font weight classes
  const weightReplacements = [
    [/font-extrabold/g, 'font-normal'],
    [/font-bold/g, 'font-normal'],
    [/font-semibold/g, 'font-normal'],
    [/font-medium/g, 'font-light']
  ];

  for (const [regex, replacement] of weightReplacements) {
    content = content.replace(regex, replacement);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed: ${filePath}`);
}

files.forEach(processFile);
console.log('All files processed successfully.');
