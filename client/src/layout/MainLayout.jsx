import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

// --- Your Original Imports ---
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import DiscountBannerBar from '@/components/DiscountBannerBar';
import CookieConsentBanner from '@/components/CookieConsentBanner';

// --- NEW: Import the necessary hook and spinner component ---
import { useLoadUserQuery } from '@/features/api/authApi'; // Adjust path if needed
import LoadingSpinner from '@/components/LoadingSpinner'; // Adjust path if needed

const MainLayout = () => {
  const location = useLocation();
  const { user, token } = useSelector((store) => store.auth);
  const hasToken = !!token || !!localStorage.getItem('authToken');
  const { isLoading } = useLoadUserQuery(undefined, { skip: !hasToken });
  const showBanner = (!user || user.role === 'student');

  return (
    <div className='flex flex-col min-h-screen'>
      {showBanner && <DiscountBannerBar />}
      <Navbar />
      
      <main className='flex-grow'>
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <Suspense fallback={<LoadingSpinner />}>
            <Outlet />
          </Suspense>
        )}
      </main>
      
      {showBanner && <Footer />}
      <CookieConsentBanner />
    </div>
  );
};

export default MainLayout;