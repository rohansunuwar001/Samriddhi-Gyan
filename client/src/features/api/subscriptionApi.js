import { apiSlice } from "./apiSlice";

export const subscriptionApi = apiSlice.injectEndpoints({
  reducerPath: "subscriptionApi",
  endpoints: (builder) => ({
    buySubscription: builder.mutation({
      query: (data) => ({
        url: "/subscription/buy",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const { useBuySubscriptionMutation } = subscriptionApi;
