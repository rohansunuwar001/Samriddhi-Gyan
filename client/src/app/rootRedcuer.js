import { combineReducers } from "@reduxjs/toolkit";



// --- Import your standard client-side state reducers ---
import authReducer from "@/features/authSlice"; 
import { apiSlice } from "@/features/api/apiSlice";
// You might have others here in the future, like themeReducer, etc.

const rootReducer = combineReducers({
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer, 
});

export default rootReducer; 