import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./rootRedcuer";
import { apiSlice } from "@/features/api/apiSlice";
import { authApi } from "@/features/api/authApi";

export const appStore = configureStore({
    reducer: rootReducer,
    middleware: (defaultMiddleware) =>
        defaultMiddleware().concat(apiSlice.middleware),
});

const initializeApp = async () => {
    await appStore.dispatch(
        authApi.endpoints.loadUser.initiate({}, { forceRefetch: true })
    );
};

initializeApp();