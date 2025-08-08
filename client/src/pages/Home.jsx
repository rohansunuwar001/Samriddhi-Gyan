import TrustedBySection from '@/components/home/TrustedBySction'
import LmsShowcase from '@/components/LmsShowcase'
import HomeCourse from './Home/HomeCourse'
import HeroSection from './student/HeroSection'
import RecommendedCourse from './student/RecommendedCourse'

const Home = () => {
  return (
    <div>
       <HeroSection />
            <TrustedBySection />
            <HomeCourse />
            <RecommendedCourse />
            <LmsShowcase />
    </div>
  )
}

export default Home
