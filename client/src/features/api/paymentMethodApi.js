// client/src/features/api/paymentMethodApi.js

import { apiSlice } from "./apiSlice";

export const paymentMethodApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentMethods: builder.query({
      query: () => "/payment-methods",
      providesTags: ["PaymentMethods"],
    }),
    addPaymentMethod: builder.mutation({
      query: (data) => ({
        url: "/payment-methods",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["PaymentMethods"],
    }),
    deletePaymentMethod: builder.mutation({
      query: (id) => ({
        url: `/payment-methods/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PaymentMethods"],
    }),
  }),
});

export const {
  useGetPaymentMethodsQuery,
  useAddPaymentMethodMutation,
  useDeletePaymentMethodMutation,
} = paymentMethodApi;
