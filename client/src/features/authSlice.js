// file: src/features/authSlice.js

import { createSlice } from '@reduxjs/toolkit';
import { authApi } from './api/authApi';

const initialState = {
    user: null,
    // The token is primarily managed by the cookie now, but we keep it
    // in the state for the initial login response.
    token: null, 
    isAuthenticated: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
       userLoggedIn: (state, action) => {
           state.token = action.payload.token;
           state.user = action.payload.user;
           state.isAuthenticated = true;
       },
    },
    extraReducers: (builder) => {
        builder
            // This is correct: on login, store the token AND user from the response.
            .addMatcher(
                authApi.endpoints.loginUser.matchFulfilled,
                (state, { payload }) => {
                    state.token = payload.token;
                    state.user = payload.user;
                    state.isAuthenticated = true;
                }
            )
            // --- CRITICAL CHANGE ---
            // On loadUser, the backend ONLY sends the user object. The token
            // is already secure in the browser's cookie.
            .addMatcher(
                authApi.endpoints.loadUser.matchFulfilled,
                (state, { payload }) => {
                    // DO NOT touch the token here. Doing so was setting it to undefined.
                    state.user = payload.user; // Set the user from the payload.
                    state.isAuthenticated = true; // The user is authenticated.
                }
            )
            // This is correct: clear everything on logout.
            .addMatcher(
                authApi.endpoints.logoutUser.matchFulfilled,
                (state) => {
                    state.token = null;
                    state.user = null;
                    state.isAuthenticated = false;
                }
            );
    },
});

export const { userLoggedIn } = authSlice.actions;
export default authSlice.reducer;