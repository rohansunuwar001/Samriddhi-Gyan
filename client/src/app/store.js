// file: src/app/store.js

import { configureStore } from "@reduxjs/toolkit";

import rootReducer from "./rootRedcuer";
import { apiSlice } from "@/features/api/apiSlice";
import { authApi } from "@/features/api/authApi";


export const appStore = configureStore({
    reducer: rootReducer,
    middleware: (defaultMiddleware) =>
        defaultMiddleware().concat(apiSlice.middleware),
});


const initializeApp = () => {
    appStore.dispatch(
        authApi.endpoints.loadUser.initiate() 
    );
};

// Execute the app initialization logic as soon as the store is configured.
initializeApp();