// pages/cart/Cart.jsx

import { useGetCartQuery, useRemoveFromCartMutation } from "../../features/api/cartApi";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Cart = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetCartQuery();
  const [removeFromCart, { isLoading: isRemoving }] = useRemoveFromCartMutation();

  const handleRemove = async (courseId) => {
    try {
      await removeFromCart(courseId).unwrap();
      toast.success("Course removed from cart.");
    } catch (error) {
      toast.error("Failed to remove course.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="animate-spin h-12 w-12 text-gray-500" />
      </div>
    );
  }

  if (isError || !data) {
    return <div className="text-center py-10">Error loading cart. Please try again later.</div>;
  }
  
  const { cart } = data;
  const subtotal = cart.reduce((acc, course) => acc + (course.price || 0), 0);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>
      
      {cart.length === 0 ? (
        <div className="text-center min-h-[400px] flex flex-col justify-center items-center bg-gray-50 rounded-lg">
            <ShoppingCart className="h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
            <Link to="/courses">
                <Button>Explore Courses</Button>
            </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <ul className="lg:col-span-2 space-y-4">
            {cart.map((course) => (
              <li key={course._id} className="flex items-start justify-between border rounded-lg p-4">
                <div className="flex items-start space-x-4">
                  <img src={course.thumbnail || '/placeholder.jpg'} alt={course.title} className="w-28 h-20 object-cover rounded-md" />
                  <div>
                    <Link to={`/course-detail/${course._id}`} className="font-semibold text-lg hover:text-blue-600">{course.title}</Link>
                    <p className="text-sm text-gray-500">By {course.instructor?.name || 'Instructor'}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:bg-red-50 px-0"
                      disabled={isRemoving}
                      onClick={() => handleRemove(course._id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
                <p className="font-semibold text-lg">${course.price.toFixed(2)}</p>
              </li>
            ))}
          </ul>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
             <div className="border rounded-lg p-6 sticky top-24">
                <h2 className="text-xl font-semibold mb-4">Summary</h2>
                <div className="flex justify-between mb-2">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-4 text-gray-500">
                    <span>Discount</span>
                    <span>$0.00</span>
                </div>
                <hr className="my-4"/>
                <div className="flex justify-between font-bold text-lg mb-6">
                    <span>Total</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                <Button className="w-full" size="lg" onClick={() => navigate('/checkout')}>
                    Proceed to Checkout
                </Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;