// your-backend/routes/admin.routes.js

import { Router } from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/isAuthenticated.js";
import { deleteCourseByAdmin, deleteUser, getAllUsers, getPlatformAnalytics, getRevenueDetails, getSuperAdminDashboardAnalytics, updateCourseByAdmin, updateUserRoleAndDetails } from "../controllers/admin.controller.js";

const adminRouter = Router();

// --- Dashboard Routes ---
adminRouter.route('/dashboard-stats').get(
    isAuthenticated,
    authorizeRoles('admin'),
    getSuperAdminDashboardAnalytics
);

// --- User Management CRUD Routes ---

// GET All Users (with search, filter, pagination)
adminRouter.route('/users').get(
    isAuthenticated,
    authorizeRoles('admin'),
    getAllUsers
);

// UPDATE a user by ID & DELETE a user by ID
adminRouter.route('/users/:id')
    .put( // For updating
        isAuthenticated,
        authorizeRoles('admin'),
        updateUserRoleAndDetails
    )
    .delete( // For deleting
        isAuthenticated,
        authorizeRoles('admin'),
        deleteUser
    );
adminRouter.route('/platform-analytics').get(
    isAuthenticated,
    authorizeRoles('admin'),
    getPlatformAnalytics
);

// UPDATE and DELETE a course by its ID
adminRouter.route('/courses/:id')
    .put(
        isAuthenticated,
        authorizeRoles('admin'),
        updateCourseByAdmin
    )
    .delete(
        isAuthenticated,
        authorizeRoles('admin'),
        deleteCourseByAdmin
    );

    adminRouter.route('/revenue').get(
    isAuthenticated,
    authorizeRoles('admin'),
    getRevenueDetails
);


export default adminRouter;