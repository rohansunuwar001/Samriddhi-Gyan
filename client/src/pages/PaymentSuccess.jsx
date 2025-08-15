import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { CheckCircle2, Loader2 } from 'lucide-react';

// Import your central API slice, which has the cache invalidation utilities
import { apiSlice } from '@/features/api/apiSlice';
import { Button } from '@/components/ui/button';

const PaymentSuccess = () => {
  const dispatch = useDispatch();
  // We use useSearchParams to get the session_id from the URL if needed in the future
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  // --- THIS IS THE CRITICAL FIX ---
  useEffect(() => {
    // This effect runs once when the component mounts.
    // It dispatches a special action from RTK Query that invalidates any
    // data tagged with 'User', 'Cart', or 'Wishlist'.
    // Your `useLoadUserQuery` provides the 'User' tag, so it will be forced
    // to refetch the next time it's needed, getting the fresh enrolledCourses list.
    dispatch(apiSlice.util.invalidateTags(['User', 'Cart', 'Wishlist']));
  }, [dispatch]);

  // While this happens in the background, we can show a success message.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center px-4">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl max-w-lg">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-8">
                Thank you for your purchase. Your new courses are now available in your learning dashboard.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/my-learning">
                    <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                        Go to My Learning
                    </Button>
                </Link>
                <Link to="/courses">
                     <Button size="lg" variant="outline" className="w-full sm:w-auto">
                        Explore More Courses
                    </Button>
                </Link>
            </div>
            {sessionId && (
                <p className="text-xs text-gray-400 mt-8">
                    Ref ID: {sessionId}
                </p>
            )}
        </div>
    </div>
  );
};

export default PaymentSuccess;