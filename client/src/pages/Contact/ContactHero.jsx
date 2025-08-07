
const ContactHero = () => {
  return (
    <div className="bg-[#F7F9FA] font-sans">
      <div className="container mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12 lg:gap-16 min-h-[60vh] py-16 lg:py-0">
          
          {/* Left Column: Text Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight font-serif">
              Connecting people <br /> with knowledge
            </h1>
          </div>

          {/* Right Column: Image with Decorative Background */}
          <div className="relative flex items-center justify-center h-[400px] lg:h-[500px]">
            {/* The orange background shape */}
            <div className="absolute w-2/3 h-2/3 bg-orange-500 rounded-2xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
            
            {/* The person's image container */}
            <div className="absolute bottom-0 h-full w-full z-10">
              {/* Replaced next/image with a standard <img> tag */}
              <img
                src="/company.png" // Path should point to an image in your `public` folder
                alt="A man smiling, representing connection through knowledge"
                // These classes replicate the behavior of the original component
                className="w-full h-full object-contain object-bottom"
                // This is the standard HTML equivalent of the 'priority' prop
                loading="eager"
              />
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ContactHero;