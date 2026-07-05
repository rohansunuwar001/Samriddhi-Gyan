// features/api/cartApi.js

import { apiSlice } from "./apiSlice";


export const cartApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCart: builder.query({
      query: () => "/cart",
      providesTags: ["Cart"], // Use "Cart" tag for automatic refetching
    }),
    addToCart: builder.mutation({
      query: (arg) => {
        const body = typeof arg === "string" ? { courseId: arg } : arg;
        return {
          url: "/cart/add",
          method: "POST",
          body,
        };
      },
      invalidatesTags: ["Cart"],
    }),
    removeFromCart: builder.mutation({
      query: (arg) => {
        const body = typeof arg === "string" ? { courseId: arg } : arg;
        return {
          url: "/cart/remove",
          method: "POST",
          body,
        };
      },
      invalidatesTags: ["Cart"],
    }),
  }),
});

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useRemoveFromCartMutation,
} = cartApi;