import { useSelector } from "react-redux";
import GuestHome from "./Home/GuestHome";
import TrustedBySection from '@/components/home/TrustedBySction'
import LmsShowcase from '@/components/LmsShowcase'
import HomeCourse from './Home/HomeCourse'
import HomeRecommendation from './Home/HomeRecommendation'
import HeroSection from './student/HeroSection'

const Home = () => {
  const { isAuthenticated } = useSelector((store) => store.auth);

  if (!isAuthenticated) {
    return <GuestHome />;
  }

  return (
    <div>
       <HeroSection />
            <TrustedBySection />
            <HomeCourse />
            <HomeRecommendation />
            <LmsShowcase />
            
    </div>
  ) 
}

export default Home;
