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

    // ------------------------------------------
    // 4. CAROUSEL SLIDE ENDPOINTS
    // ------------------------------------------
    getCarouselSlides: builder.query({
      query: (params) => ({
        url: "/cms/carousel",
        params
      }),
      providesTags: ["CarouselSlide"],
    }),
    createCarouselSlide: builder.mutation({
      query: (data) => ({
        url: "/cms/carousel",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["CarouselSlide"],
    }),
    updateCarouselSlide: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/cms/carousel/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["CarouselSlide"],
    }),
    deleteCarouselSlide: builder.mutation({
      query: (id) => ({
        url: `/cms/carousel/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CarouselSlide"],
    }),

    // ------------------------------------------
    // 5. COMPANY LOGO ENDPOINTS
    // ------------------------------------------
    getCompanyLogos: builder.query({
      query: (params) => ({
        url: "/cms/logos",
        params
      }),
      providesTags: ["CompanyLogo"],
    }),
    createCompanyLogo: builder.mutation({
      query: (data) => ({
        url: "/cms/logos",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["CompanyLogo"],
    }),
    updateCompanyLogo: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/cms/logos/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["CompanyLogo"],
    }),
    deleteCompanyLogo: builder.mutation({
      query: (id) => ({
        url: `/cms/logos/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CompanyLogo"],
    }),

    // ------------------------------------------
    // 6. PROMO BANNER ENDPOINTS
    // ------------------------------------------
    getPromoBanners: builder.query({
      query: (params) => ({
        url: "/cms/promo",
        params
      }),
      providesTags: ["PromoBanner"],
    }),
    createPromoBanner: builder.mutation({
      query: (data) => ({
        url: "/cms/promo",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["PromoBanner"],
    }),
    updatePromoBanner: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/cms/promo/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["PromoBanner"],
    }),
    deletePromoBanner: builder.mutation({
      query: (id) => ({
        url: `/cms/promo/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PromoBanner"],
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

  // Carousel Slide hooks
  useGetCarouselSlidesQuery,
  useCreateCarouselSlideMutation,
  useUpdateCarouselSlideMutation,
  useDeleteCarouselSlideMutation,

  // Company Logo hooks
  useGetCompanyLogosQuery,
  useCreateCompanyLogoMutation,
  useUpdateCompanyLogoMutation,
  useDeleteCompanyLogoMutation,

  // Promo Banner hooks
  useGetPromoBannersQuery,
  useCreatePromoBannerMutation,
  useUpdatePromoBannerMutation,
  useDeletePromoBannerMutation,
} = cmsApi;
