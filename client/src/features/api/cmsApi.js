import { apiSlice } from "./apiSlice";

export const cmsApi = apiSlice.injectEndpoints({
  reducerPath: "cmsApi",
  endpoints: (builder) => ({
    // ------------------------------------------
    // 1. DISCOUNT BANNER ENDPOINTS
    // ------------------------------------------
    getDiscountBanners: builder.query({
      query: () => "/cms/discount-banners",
      providesTags: ["DiscountBanner"],
    }),
    getActiveDiscountBanner: builder.query({
      query: () => "/cms/active-discount-banner",
      providesTags: ["DiscountBanner"],
    }),
    createDiscountBanner: builder.mutation({
      query: (data) => ({
        url: "/cms/discount-banners",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["DiscountBanner"],
    }),
    updateDiscountBanner: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/cms/discount-banners/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["DiscountBanner"],
    }),
    deleteDiscountBanner: builder.mutation({
      query: (id) => ({
        url: `/cms/discount-banners/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["DiscountBanner"],
    }),

    // ------------------------------------------
    // 2. GET OFFER PROMO ENDPOINTS
    // ------------------------------------------
    getGetOfferPromos: builder.query({
      query: () => "/cms/get-offer-promos",
      providesTags: ["GetOfferPromo"],
    }),
    getActiveGetOfferPromo: builder.query({
      query: () => "/cms/active-get-offer-promo",
      providesTags: ["GetOfferPromo"],
    }),
    createGetOfferPromo: builder.mutation({
      query: (data) => ({
        url: "/cms/get-offer-promos",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["GetOfferPromo"],
    }),
    updateGetOfferPromo: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/cms/get-offer-promos/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["GetOfferPromo"],
    }),
    deleteGetOfferPromo: builder.mutation({
      query: (id) => ({
        url: `/cms/get-offer-promos/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["GetOfferPromo"],
    }),

    // ------------------------------------------
    // 3. SUBSCRIPTION NAVBAR ENDPOINTS
    // ------------------------------------------
    getSubscriptionNavbars: builder.query({
      query: () => "/cms/subscription-navbars",
      providesTags: ["SubscriptionNavbar"],
    }),
    getActiveSubscriptionNavbar: builder.query({
      query: () => "/cms/active-subscription-navbar",
      providesTags: ["SubscriptionNavbar"],
    }),
    createSubscriptionNavbar: builder.mutation({
      query: (data) => ({
        url: "/cms/subscription-navbars",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["SubscriptionNavbar"],
    }),
    updateSubscriptionNavbar: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/cms/subscription-navbars/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["SubscriptionNavbar"],
    }),
    deleteSubscriptionNavbar: builder.mutation({
      query: (id) => ({
        url: `/cms/subscription-navbars/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SubscriptionNavbar"],
    }),
  }),
});

export const {
  // Discount Banner hooks
  useGetDiscountBannersQuery,
  useGetActiveDiscountBannerQuery,
  useCreateDiscountBannerMutation,
  useUpdateDiscountBannerMutation,
  useDeleteDiscountBannerMutation,

  // Get Offer Promo hooks
  useGetGetOfferPromosQuery,
  useGetActiveGetOfferPromoQuery,
  useCreateGetOfferPromoMutation,
  useUpdateGetOfferPromoMutation,
  useDeleteGetOfferPromoMutation,

  // Subscription Navbar hooks
  useGetSubscriptionNavbarsQuery,
  useGetActiveSubscriptionNavbarQuery,
  useCreateSubscriptionNavbarMutation,
  useUpdateSubscriptionNavbarMutation,
  useDeleteSubscriptionNavbarMutation,
} = cmsApi;
