import { Outlet } from 'react-router-dom';

// --- Your Original Imports ---
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

// --- NEW: Import the necessary hook and spinner component ---
import { useLoadUserQuery } from '@/features/api/authApi'; // Adjust path if needed
import LoadingSpinner from '@/components/LoadingSpinner'; // Adjust path if needed

const MainLayout = () => {
  // Call the hook to check for a logged-in user on initial app load.
  // We only need the `isLoading` state for this component's logic.
  const { isLoading } = useLoadUserQuery();

  return (
    <div className='flex flex-col min-h-screen'>
      <Navbar />
      
      <main className='flex-grow'>
       
        {isLoading ? <LoadingSpinner /> : <Outlet />}
      </main>
      
      <Footer />
    </div>
  );
};

export default MainLayout;