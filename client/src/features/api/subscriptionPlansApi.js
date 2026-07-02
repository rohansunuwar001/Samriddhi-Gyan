import { apiSlice } from "./apiSlice";

export const subscriptionPlansApi = apiSlice.injectEndpoints({
  reducerPath: "subscriptionPlansApi",
  endpoints: (builder) => ({
    getSubscriptionPlans: builder.query({
      query: () => "/subscription/plans",
      providesTags: ["subscriptionPlans"],
    }),
    updateSubscriptionPlans: builder.mutation({
      query: (data) => ({
        url: "/subscription/plans",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["subscriptionPlans"],
    }),
    getAllSubscriptions: builder.query({
      query: (params) => ({
        url: "/subscription/all",
        method: "GET",
        params,
      }),
      providesTags: ["subscriptions"],
    }),
  }),
});

export const {
  useGetSubscriptionPlansQuery,
  useUpdateSubscriptionPlansMutation,
  useGetAllSubscriptionsQuery,
} = subscriptionPlansApi;
