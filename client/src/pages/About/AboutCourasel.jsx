import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom'; // <-- Import ReactDOM for portals

// --- UI Icons ---
import { VolumeX } from 'lucide-react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

//================================================================================
// 1. Reusable Helper Components
//================================================================================

const PlayIcon = () => (
  <svg
    className="w-16 h-16 sm:w-20 sm:h-20 text-white group-hover:scale-110 transition-transform duration-300"
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="40" cy="40" r="39" stroke="currentColor" strokeWidth="2" />
    <path d="M53.5 39.9999L33.25 51.5549V28.445L53.5 39.9999Z" fill="currentColor" />
  </svg>
);

const VideoThumbnail = ({ thumbnailSrc, onOpen }) => {
  return (
    <div
      onClick={onOpen}
      className="relative w-full aspect-video cursor-pointer group rounded-lg overflow-hidden shadow-lg"
      aria-label="Play video"
    >
      <img
        src={thumbnailSrc}
        alt="Video thumbnail"
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 
                     group-hover:bg-opacity-40 transition-all duration-300">
        <PlayIcon />
      </div>
    </div>
  );
};

VideoThumbnail.propTypes = {
  thumbnailSrc: PropTypes.string.isRequired,  
  onOpen: PropTypes.func.isRequired,
};

// --- UPDATED VideoModal with Portal and Mute Logic ---
const VideoModal = ({ isOpen, onClose, videoUrl }) => {
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsMuted(true);
    }
  }, [isOpen]);

  // Use an early return if the modal is not open
  if (!isOpen) {
    return null;
  }

  const modalContent = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl aspect-video bg-black rounded-lg shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-[60] w-10 h-10 bg-white rounded-full text-black flex items-center justify-center text-2xl font-bold hover:scale-110 transition-transform"
          aria-label="Close video player"
        >
          &times;
        </button>
        
        {isMuted && (
          <div 
            className="absolute inset-0 z-50 flex items-center justify-center cursor-pointer bg-black bg-opacity-30"
            onClick={() => setIsMuted(false)}
          >
            <div className="flex items-center gap-3 py-2 px-4 bg-black/60 rounded-full backdrop-blur-sm">
              <VolumeX className="h-6 w-6 text-white" />
              <span className="text-white font-semibold">Click to unmute</span>
            </div>
          </div>
        )}

        <iframe
          src={isMuted ? videoUrl : videoUrl.replace('&mute=1', '')}
          title="Video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full rounded-lg"
        ></iframe>
      </div>
    </div>
  );

  // Render the modal into the 'modal-root' div using a portal
  return ReactDOM.createPortal(
    modalContent,
    document.getElementById('modal-root')
  );
};

VideoModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  videoUrl: PropTypes.string.isRequired,
};

// --- UPDATED Data with '&mute=1' in URLs ---
const slides = [
  {
    video: {
      thumbnail: '/it4.jpg',
      source: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&controls=1"
    },
    title: 'Our Mission & Vision',
    description: 'Learn about our commitment to making education accessible to everyone, everywhere. We believe in the power of knowledge to transform lives.'
  },
  {
    video: {
      thumbnail: '/r5.jpg',
      source: "https://www.youtube.com/embed/9bZkp7q19f0?autoplay=1&mute=1&controls=1"
    },
    title: 'A Community of Learners',
    description: 'Join millions of students and instructors in a vibrant community dedicated to sharing skills and achieving personal and professional goals.'
  },
  {
    video: {
      thumbnail: '/r1.jpg',
      source: "https://www.youtube.com/embed/3JZ_D3ELwOQ?autoplay=1&mute=1&controls=1"
    },
    title: 'Innovation in Learning',
    description: 'We are constantly exploring new ways to deliver engaging and effective learning experiences through technology and expert-led content.'
  }
];


//================================================================================
// 2. Main Carousel Component
//================================================================================
const AboutCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setModalOpen] = useState(false);

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? slides.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === slides.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  if (!slides || slides.length === 0) {
    return <div>No slides to display.</div>;
  }

  const { video, title, description } = slides[currentIndex];

  return (
    <>
      <div className="relative w-full max-w-5xl mx-auto my-12 px-4">
        <div className="relative flex flex-col md:flex-row items-center justify-center gap-8 px-8 md:px-12 py-8 bg-white rounded-lg shadow-xl">

          <button
            onClick={goToPrevious}
            className="absolute top-1/2 left-0 md:-left-4 transform -translate-y-1/2 text-4xl text-gray-400 hover:text-gray-800 transition-colors duration-300 z-10 p-2 bg-white/50 rounded-full"
            aria-label="Previous Slide"
          >
            <FiChevronLeft />
          </button>

          <div className="w-full md:w-1/2">
            <VideoThumbnail
              thumbnailSrc={video.thumbnail}
              onOpen={openModal}
            />
          </div>

          <div className="w-full md:w-1/2 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">{title}</h2>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed">{description}</p>
          </div>

          <button
            onClick={goToNext}
            className="absolute top-1/2 right-0 md:-right-4 transform -translate-y-1/2 text-4xl text-gray-400 hover:text-gray-800 transition-colors duration-300 z-10 p-2 bg-white/50 rounded-full"
            aria-label="Next Slide"
          >
            <FiChevronRight />
          </button>
        </div>
      </div>

      <VideoModal
        isOpen={isModalOpen}
        onClose={closeModal}
        videoUrl={video.source}
      />
    </>
  );
};

export default AboutCarousel;