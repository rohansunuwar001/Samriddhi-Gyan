// features/api/cartApi.js

import { apiSlice } from "./apiSlice";


export const cartApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCart: builder.query({
      query: () => "/cart",
      providesTags: ["Cart"], // Use "Cart" tag for automatic refetching
    }),
    addToCart: builder.mutation({
      query: (courseId) => ({
        url: "/cart/add",
        method: "POST",
        body: { courseId },
      }),
      invalidatesTags: ["Cart"], // When we add, invalidate the cart to trigger a refetch
    }),
    removeFromCart: builder.mutation({
      query: (courseId) => ({
        url: "/cart/remove",
        method: "POST",
        body: { courseId },
      }),
      invalidatesTags: ["Cart"], // When we remove, invalidate the cart
    }),
  }),
});

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useRemoveFromCartMutation,
} = cartApi;