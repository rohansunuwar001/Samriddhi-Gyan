import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

// --- UI Icons ---
import { VolumeX } from 'lucide-react';

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
    <circle cx="40" cy="40" r="39" stroke="currentColor" strokeWidth="2"/>
    <path d="M53.5 39.9999L33.25 51.5549V28.445L53.5 39.9999Z" fill="currentColor"/>
  </svg>
);

const VideoThumbnail = ({ thumbnailSrc, onOpen }) => (
  <motion.div 
    onClick={onOpen}
    className="relative w-full aspect-video cursor-pointer group rounded-lg overflow-hidden shadow-lg"
    aria-label="Play video"
    whileHover={{ y: -10, scale: 1.03 }} 
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
  >
    <img
      src={thumbnailSrc}
      alt="Video thumbnail"
      className="absolute inset-0 w-full h-full object-cover"
    />
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 
                    group-hover:bg-opacity-40 transition-all duration-300">
      <PlayIcon />
    </div>
  </motion.div>
);

VideoThumbnail.propTypes = {
  thumbnailSrc: PropTypes.string.isRequired,
  onOpen: PropTypes.func.isRequired,
};

const VideoModal = ({ isOpen, onClose, videoUrl }) => {
  const [isMuted, setIsMuted] = useState(true);

  // Reset the muted state every time the modal opens.
  useEffect(() => {
    if (isOpen) {
      setIsMuted(true);
    }
  }, [isOpen]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          onClick={onClose} 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl aspect-video bg-black rounded-lg shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
          >
            <button 
              onClick={onClose}
              className="absolute -top-3 -right-3 z-[60] w-10 h-10 bg-white rounded-full text-black flex items-center justify-center text-2xl font-bold hover:scale-110 transition-transform"
              aria-label="Close video player"
            >
              &times;
            </button>

            {/* --- Unmute Overlay --- */}
            {isMuted && (
              <div 
                className="absolute inset-0 z-50 flex flex-col items-center justify-center cursor-pointer bg-black bg-opacity-30"
                onClick={() => setIsMuted(false)}
              >
                <div className="flex items-center gap-3 py-2 px-4 bg-black/60 rounded-full backdrop-blur-sm">
                  <VolumeX className="h-6 w-6 text-white" />
                  <span className="text-white font-semibold">Click to unmute</span>
                </div>
              </div>
            )}
            
            <iframe
              // Dynamically add or remove the mute parameter based on state
              src={isMuted ? videoUrl : videoUrl.replace('&mute=1', '')}
              title="Video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded-lg"
            ></iframe>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Use the portal to render the modal into the 'modal-root' div in your public/index.html
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

//================================================================================
// 2. Main HowWeStartedSection Component
//================================================================================
const HowWeStartedSection = ({
  title,
  description,
  thumbnailSrc,
  videoUrl,
}) => {
  const [isModalOpen, setModalOpen] = useState(false);

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  // Animation variants for the text content
  const textContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const textItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' }
    },
  };

  return (
    <>
      <section className="bg-white py-20 sm:py-28 overflow-hidden">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
            
            <div className="w-full">
              <VideoThumbnail 
                thumbnailSrc={thumbnailSrc} 
                onOpen={openModal} 
              />
            </div>

            <motion.div 
              className="text-left"
              variants={textContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }} 
            >
              <motion.h2 
                className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6"
                variants={textItemVariants}
              >
                {title}
              </motion.h2>
              <motion.p 
                className="text-xl text-gray-700 leading-relaxed"
                variants={textItemVariants}
              >
                {description}
              </motion.p>
            </motion.div>
          </div>
        </div>
      </section>

      <VideoModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        videoUrl={videoUrl} 
      />
    </>
  );
};

HowWeStartedSection.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  thumbnailSrc: PropTypes.string,
  videoUrl: PropTypes.string,
};

// --- IMPORTANT: Default props now include the '&mute=1' parameter in the URL ---
HowWeStartedSection.defaultProps = {
  title: "How we started",
  description: "From an early age, Udemy founder Eren Bali knew learning was the key to unlocking opportunity.",
  thumbnailSrc: "/r4.jpg", // Make sure this image exists in your `public` folder
  videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&controls=1",
};

export default HowWeStartedSection;