import { combineReducers } from "@reduxjs/toolkit";

// --- Import the NEW central API slice ---
import { apiSlice } from "@/features/api/apiSlice";

// --- Import your standard client-side state reducers ---
import authReducer from "@/features/authSlice"; 
// You might have others here in the future, like themeReducer, etc.

const rootReducer = combineReducers({
    // A. This ONE LINE now handles all of your API-related state.
    // The reducerPath 'api' comes from the apiSlice file.
    [apiSlice.reducerPath]: apiSlice.reducer,

    // B. You still include your other client-side state reducers as before.
    // This handles state like the user object, isAuthenticated status, etc.
    auth: authReducer, 
});

export default rootReducer;