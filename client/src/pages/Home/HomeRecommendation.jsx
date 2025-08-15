import TitleandHeader from '@/components/common/TitleandHeader'
import RecommendedCourse from '../student/RecommendedCourse'

const HomeRecommendation = () => {
  return (
    <div className="container mx-auto px-10 py-16">
          <TitleandHeader first="Recommended For You" second="Courses tailored to your learning preferences and history" />
          <RecommendedCourse />
       </div>
  )
}

export default HomeRecommendation
