import { apiSlice } from "./apiSlice";

export const couponApi = apiSlice.injectEndpoints({
  reducerPath: "couponApi",
  endpoints: (builder) => ({
    getCoupons: builder.query({
      query: () => "/coupon",
      providesTags: ["Coupon"],
    }),
    getCouponById: builder.query({
      query: (id) => `/coupon/${id}`,
      providesTags: ["Coupon"],
    }),
    createCoupon: builder.mutation({
      query: (data) => ({
        url: "/coupon",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Coupon"],
    }),
    updateCoupon: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/coupon/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Coupon"],
    }),
    deleteCoupon: builder.mutation({
      query: (id) => ({
        url: `/coupon/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Coupon"],
    }),
    validateCoupon: builder.mutation({
      query: (data) => ({
        url: "/coupon/validate",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useGetCouponsQuery,
  useGetCouponByIdQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
  useValidateCouponMutation,
} = couponApi;
