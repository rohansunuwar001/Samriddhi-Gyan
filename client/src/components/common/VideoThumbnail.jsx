import PropTypes from 'prop-types';

import Image from 'next/image';

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

const VideoThumbnail = ({ thumbnailSrc, onOpen }) => {
  return (
    <div 
      onClick={onOpen}
      className="relative w-full aspect-video cursor-pointer group"
      aria-label="Play video"
    >
      {/* Thumbnail Image */}
      <Image
        src={thumbnailSrc}
        alt="Video thumbnail"
        layout="fill"
        objectFit="cover"
        className="rounded-lg shadow-lg"
      />
      
      {/* Play Button Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 
                     group-hover:bg-opacity-40 transition-all duration-300 rounded-lg">
        <PlayIcon />
      </div>
    </div>
  );
};

VideoThumbnail.propTypes = {
  thumbnailSrc: PropTypes.string.isRequired,
  onOpen: PropTypes.func.isRequired,
};

export default VideoThumbnail;