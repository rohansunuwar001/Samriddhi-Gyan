import PropTypes from 'prop-types';



const VideoModal = ({ isOpen, onClose, videoUrl }) => {
  if (!isOpen) {
    return null;
  }

  return (
    // Full-screen overlay
    <div 
      onClick={onClose} 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()} // Prevents modal from closing when clicking inside the video container
        className="relative w-full max-w-4xl aspect-video bg-black rounded-lg shadow-2xl"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute -top-4 -right-4 z-10 w-10 h-10 bg-white rounded-full text-black flex items-center justify-center text-2xl font-bold"
          aria-label="Close video player"
        >
          ×
        </button>

        {/* Video Iframe */}
        <iframe
          src={videoUrl}
          title="Video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full rounded-lg"
        ></iframe>
      </div>
    </div>
  );
};

VideoModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  videoUrl: PropTypes.string.isRequired,
};

export default VideoModal;