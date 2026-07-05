// src/pages/PurchaseHistoryPage.jsx

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useGetPurchaseHistoryQuery } from '@/features/api/purchaseApi';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Receipt, Calendar, CreditCard, ShoppingBag } from 'lucide-react';

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const PurchaseHistoryPage = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useGetPurchaseHistoryQuery();
  const purchases = data?.purchases || [];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 min-h-screen text-left font-sans">
      <div className="mb-8">
        <h1 className="text-4xl font-normal text-[#1c1d1f] tracking-tight">Purchase History</h1>
        <p className="text-base text-slate-500 mt-1">View and manage all your course receipts and transactions.</p>
      </div>

      {purchases.length > 0 ? (
        <div className="bg-white border border-[#d1d7dc] rounded-none overflow-hidden shadow-sm">
          {/* Table Header for medium/large screens */}
          <div className="hidden md:grid grid-cols-12 gap-4 bg-slate-50 border-b border-[#d1d7dc] p-4 text-sm font-normal text-slate-500 uppercase tracking-wider">
            <div className="col-span-4">Courses</div>
            <div className="col-span-2">Date Purchased</div>
            <div className="col-span-2">Order ID</div>
            <div className="col-span-2">Payment Method</div>
            <div className="col-span-2 text-right">Total Price</div>
          </div>

          <div className="divide-y divide-[#d1d7dc]">
            {purchases.map((purchase) => (
              <div 
                key={purchase._id} 
                className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 items-center hover:bg-slate-50/50 transition-colors"
              >
                {/* Courses Column */}
                <div className="col-span-1 md:col-span-4 flex flex-col gap-3">
                  {purchase.courses.map((item, index) => {
                    const course = item.courseId;
                    if (!course) return null;
                    return (
                      <div key={index} className="flex gap-3 items-center">
                        <img 
                          src={course.thumbnail || "/placeholder-course.png"} 
                          alt={course.title} 
                          className="w-16 h-10 object-cover border border-slate-200"
                        />
                        <div className="min-w-0">
                          <Link 
                            to={`/course-detail/${course._id}`} 
                            className="text-base font-normal text-slate-800 hover:text-[#5624d0] hover:underline line-clamp-1"
                          >
                            {course.title}
                          </Link>
                          <p className="text-sm text-slate-400 font-normal mt-0.5">Price: NPR {item.priceAtPurchase}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Date Purchased */}
                <div className="col-span-1 md:col-span-2 flex items-center gap-2 text-base text-slate-650">
                  <Calendar className="w-4 h-4 text-slate-400 md:hidden" />
                  <span className="font-normal text-sm md:text-base">
                    {formatDate(purchase.createdAt)}
                  </span>
                </div>

                {/* Order ID */}
                <div className="col-span-1 md:col-span-2 flex items-center gap-2 text-sm md:text-base text-slate-600 font-mono">
                  <span className="text-slate-400 md:hidden font-sans font-normal">Order ID: </span>
                  {purchase.orderId}
                </div>

                {/* Payment Method */}
                <div className="col-span-1 md:col-span-2 flex items-center gap-2 text-base text-slate-655 capitalize">
                  <CreditCard className="w-4 h-4 text-slate-400 md:hidden" />
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-sm font-normal text-slate-700">
                    {purchase.paymentMethod}
                  </span>
                </div>

                {/* Total Price */}
                <div className="col-span-1 md:col-span-2 text-left md:text-right font-normal text-base md:text-lg text-[#1c1d1f]">
                  <span className="text-slate-400 md:hidden font-normal text-sm mr-1">Total:</span>
                  NPR {purchase.totalAmount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#d1d7dc] text-center px-4 shadow-sm">
          <ShoppingBag className="w-12 h-12 text-slate-350 mb-4" />
          <h3 className="text-xl font-normal text-slate-800 mb-1">No Purchases Found</h3>
          <p className="text-base text-slate-500 font-normal max-w-sm mb-6">
            You haven't bought any courses yet. Once you enroll in a course, your purchase history and invoices will show up here.
          </p>
          <Link 
            to="/" 
            className="bg-[#1c1d1f] text-white hover:bg-slate-800 text-base font-normal py-2.5 px-6 transition-colors"
          >
            Explore Courses
          </Link>
        </div>
      )}
    </div>
  );
};

export default PurchaseHistoryPage;
