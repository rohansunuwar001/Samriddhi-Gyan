import TitleandHeader from '@/components/common/TitleandHeader'
import Courses from '../student/Courses'

const HomeCourse = () => {
  return (
    <div className="container mx-auto px-10 py-16">
       <TitleandHeader first="Ready to reimaginate your career?" second="Get the skills and real-world experience employers want with Career Accelerators" />
       <Courses />
    </div>
  )
}

export default HomeCourse
