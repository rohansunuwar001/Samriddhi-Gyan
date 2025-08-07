import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
// --- UI Components & Icons ---
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Pencil } from "lucide-react";

// --- Reusable NavLink Sub-component ---
const NavLink = ({ children, active = false, onClick }) => (
  <button
    onClick={onClick}
    className={`block w-full text-left px-4 py-2 text-sm rounded-md transition-colors ${
      active
        ? 'bg-gray-200 dark:bg-gray-700 font-semibold text-gray-900 dark:text-white'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`}
  >
    {children}
  </button>
);

NavLink.propTypes = {
  children: PropTypes.node.isRequired,
  active: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
};
// --- The Main Sidebar Component ---
const ProfileSidebar = ({ 
    user, 
    previewImage, 
    isAvatarUpdating, 
    fileInputRef, 
    onPhotoChange, 
    activePage 
}) => {
  const navigate = useNavigate();

  return (
    <aside className="w-full md:w-1/4 flex-shrink-0">
      <div className="flex flex-col items-center md:items-start space-y-4">
        
        {/* Avatar Section */}
        <div className="relative group">
          <Avatar className="w-24 h-24 text-3xl">
            <AvatarImage src={previewImage} alt={user?.name} />
            <AvatarFallback>{user?.name?.split(" ").map(n => n[0]).join("")}</AvatarFallback>
          </Avatar>
          {isAvatarUpdating && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-full">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
          <button
            onClick={() => !isAvatarUpdating && fileInputRef.current?.click()}
            disabled={isAvatarUpdating}
            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            aria-label="Change profile photo"
          >
            <Pencil className="w-8 h-8 text-white" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onPhotoChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* User Name Section */}
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{user?.name}</h2>
      </div>

      {/* Navigation Section */}
      <nav className="mt-8 space-y-1">
        <NavLink active={activePage === 'view'} onClick={() => navigate('/profile')}>View public profile</NavLink>
        <NavLink active={activePage === 'edit'} onClick={() => navigate('/profile/edit')}>Profile</NavLink>
        <NavLink active={activePage === 'photo'} onClick={() => navigate('/profile/photo')}>Photo</NavLink>
        <NavLink active={activePage === 'security'} onClick={() => navigate('/profile/security')}>Account Security</NavLink>
      </nav>
    </aside>
  );
};

ProfileSidebar.propTypes = {
  user: PropTypes.object.isRequired,
  activePage: PropTypes.string.isRequired,
    previewImage: PropTypes.string,
    isAvatarUpdating: PropTypes.bool,
    onPhotoChange: PropTypes.func,
    fileInputRef: PropTypes.object.isRequired,
};

export default ProfileSidebar;