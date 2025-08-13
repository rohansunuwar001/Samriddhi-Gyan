// src/features/api/orderApi.js

import { apiSlice } from "./apiSlice";

 // Assuming you have a central api setup file for RTK Query

export const orderApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Creates a new order and initiates the payment process (multi-course, Stripe/eSewa).
     */
    createOrder: builder.mutation({
      query: (orderData) => ({
        url: '/orders/create',
        method: 'POST',
        body: orderData, // { courseIds: [...], paymentMethod: 'Stripe' | 'eSewa' }
      }),
    }),
    
    /**
     * Creates a new eSewa order and gets hash (if using separate endpoint).
     */
    createEsewaOrder: builder.mutation({
      query: (orderData) => ({
        url: '/orders/create-esewa',
        method: 'POST',
        body: orderData, // { userId, courses, totalAmount }
      }),
    }),
    
    /**
     * Verifies eSewa payment (public, called after payment).
     */
    verifyEsewaOrder: builder.mutation({
      query: (payload) => ({
        url: '/orders/verify-esewa',
        method: 'POST',
        body: payload, // { encodedData }
      }),
    }),
    
    /**
     * Updates order status (e.g., from webhook or admin panel).
     */
    updateOrderStatus: builder.mutation({
      query: ({ orderId, ...body }) => ({
        url: `/orders/update-status/${orderId}`,
        method: 'PATCH',
        body,
      }),
    }),

    // Example: Fetch order history (if you add this endpoint in your backend)
    // getMyOrderHistory: builder.query({
    //   query: () => '/orders/my-history',
    //   providesTags: ['Order'],
    //   transformResponse: (response) => response.data,
    // }),
  }),
});

// Export the auto-generated hooks for use in components
export const {
  useCreateOrderMutation,
  useCreateEsewaOrderMutation,
  useVerifyEsewaOrderMutation,
  useUpdateOrderStatusMutation,
  // useGetMyOrderHistoryQuery, // Uncomment if you add this endpoint
} = orderApi;