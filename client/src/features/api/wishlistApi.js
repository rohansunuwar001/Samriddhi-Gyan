// features/api/wishlistApi.js

import { apiSlice } from "./apiSlice";

export const wishlistApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Best practice: Provide tags to invalidate cache for automatic refetching.
    getWishlist: builder.query({
      query: () => "/wishlist",
      providesTags: ["Wishlist"], // Tag the data with "Wishlist"
    }),
    addToWishlist: builder.mutation({
      query: (courseId) => ({
        url: "/wishlist/add",
        method: "POST",
        body: { courseId },
      }),
      // When this mutation runs, invalidate the "Wishlist" tag.
      invalidatesTags: ["Wishlist"], 
    }),
    removeFromWishlist: builder.mutation({
      query: (courseId) => ({
        url: "/wishlist/remove",
        method: "POST",
        body: { courseId },
      }),
      // When this mutation runs, invalidate the "Wishlist" tag.
      invalidatesTags: ["Wishlist"],
    }),
  }),
});

export const {
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
} = wishlistApi;