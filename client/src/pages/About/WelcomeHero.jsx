// File Path: app/components/WelcomeHero.jsx

// Import Link from react-router-dom instead of next/link
import { Link } from 'react-router-dom';

const WelcomeHero = () => {
  return (
    <div className=" bg-white">
      <section className="relative w-full">
        {/* Main content area */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center min-h-[50vh] lg:min-h-[60vh] py-12">

            {/* Left Column: Text Content */}
            <div className="relative z-10 w-full lg:w-1/2 text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-gray-900 leading-tight">
                Welcome to where
                <br />
                possibilities begin
              </h1>
            </div>

            {/* Right Column: Image Graphic */}
            <div className="w-full lg:w-1/2 h-64 lg:h-auto mt-8 lg:mt-0 flex items-center justify-center">
              {/* The parent div needs to be relative for the absolute positioned image */}
              <div className="relative w-[400px] h-[350px] sm:w-[500px] sm:h-[450px]">
                  {/* Replaced next/image with a standard <img> tag */}
                  <img
                    src="/about-homepage.png" // This path points to your `public` folder
                    alt="A smiling woman with a purple geometric shape behind her"
                    // These classes replicate the behavior of layout="fill" and objectFit="contain"
                    className="absolute inset-0 w-full h-full object-contain"
                    // This attribute is the standard equivalent of the 'priority' prop
                    loading="eager"
                  />
              </div>
            </div>

          </div>
        </div>

        {/* 
          Bottom Clickable Banner
          - Uses <Link> from react-router-dom
          - 'href' is changed to 'to'
          - 'passHref' is removed
        */}
        <Link 
          to="/news" 
          className="
            absolute
            bottom-0
            left-0
            right-0
            w-full
            bg-gray-900
            text-white
            font-bold
            text-center
            py-4
            hover:bg-gray-800
            transition-colors
            duration-300
            z-20
          ">
            Check out our latest company news!
        </Link>
      </section>
    </div>
  );
};

export default WelcomeHero;