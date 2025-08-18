// file: src/features/authSlice.js

import { createSlice } from '@reduxjs/toolkit';
import { authApi } from './api/authApi';

// On app start, initialize the state from localStorage.
// This is the key to persisting the user session.
const initialState = {
    user: null,
    token: localStorage.getItem('authToken') || null,
    isAuthenticated: !!localStorage.getItem('authToken'), // true if token exists
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // This is a manual reducer for our GoogleSuccess component to use.
        userLoggedIn: (state, action) => {
            state.token = action.payload.token;
            state.isAuthenticated = true;
            // Also save to localStorage when this is called
            localStorage.setItem('authToken', action.payload.token);
        },
    },
    extraReducers: (builder) => {
        builder
            // On successful standard login, update state AND save the token
            .addMatcher(
                authApi.endpoints.loginUser.matchFulfilled,
                (state, { payload }) => {
                    state.token = payload.token;
                    state.user = payload.user;
                    state.isAuthenticated = true;
                    localStorage.setItem('authToken', payload.token);
                }
            )
            // On successful session load, just update the user data
            .addMatcher(
                authApi.endpoints.loadUser.matchFulfilled,
                (state, { payload }) => {
                    state.user = payload.user;
                    state.isAuthenticated = true;
                }
            )
            // On logout, clear state AND REMOVE the token from localStorage
            .addMatcher(
                authApi.endpoints.logoutUser.matchFulfilled,
                (state) => {
                    state.token = null;
                    state.user = null;
                    state.isAuthenticated = false;
                    localStorage.removeItem('authToken');
                }
            )
            // If the token is invalid and loading the user fails, log out
            .addMatcher(
                authApi.endpoints.loadUser.matchRejected,
                (state) => {
                    state.token = null;
                    state.user = null;
                    state.isAuthenticated = false;
                    localStorage.removeItem('authToken');
                }
            );
    },
});

export const { userLoggedIn } = authSlice.actions;
export default authSlice.reducer;