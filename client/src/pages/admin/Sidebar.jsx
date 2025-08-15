import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Icons for all possible navigation links
import {
    LayoutDashboard,
    BookCopy,
    Users,
    MessageSquare,
    DollarSign,
    BarChart3,
    FilePenLine // Icon for CMS
} from 'lucide-react';

// A single, reusable NavLink component for the dashboard.
// This avoids code duplication.
const DashboardNavLink = ({ to, icon, label }) => {
    return (
        <NavLink
            to={to}
            end // 'end' prop ensures the link is only 'active' on its exact path
            className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-muted/50 dark:hover:bg-muted/20 ${
                isActive
                    ? 'bg-muted dark:bg-muted/30 font-semibold text-primary' // Style for active link
                    : 'text-muted-foreground' // Style for inactive link
                }`
            }
        >
            {icon}
            {label}
        </NavLink>
    );
};

// --- Define the navigation links for each role ---

// Links for the Instructor role
const instructorLinks = [
    { to: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: 'course/analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
    { to: 'course', icon: <BookCopy size={20} />, label: 'My Courses' },
    { to: 'course/students', icon: <Users size={20} />, label: 'Students' },
    { to: 'course/reviews', icon: <MessageSquare size={20} />, label: 'Reviews' },
    { to: 'course/payouts', icon: <DollarSign size={20} />, label: 'Payouts' },
];

// Links for the Admin role, as per your request
const adminLinks = [
    { to: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: 'analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
    { to: 'users', icon: <Users size={20} />, label: 'Users' },
    { to: 'revenue', icon: <DollarSign size={20} />, label: 'Revenue' },
    { to: 'cms', icon: <FilePenLine size={20} />, label: 'CMS' },
];


const Sidebar = () => {
    // Get the current user from the Redux store
    const { user } = useSelector(store => store.auth);

    // Determine which set of links to render based on the user's role.
    // This defaults to instructor links if the role is not 'admin' or is undefined.
    const navLinks = user?.role === 'admin' ? adminLinks : instructorLinks;

    return (
        <div className="flex h-screen bg-background">
            {/* --- Sidebar Navigation --- */}
            <aside className="hidden lg:block w-[250px] flex-shrink-0 border-r dark:border-gray-800 p-4">
                <div className="flex flex-col h-full">
                    <nav className="flex-grow space-y-2">
                        {/* Map over the chosen set of links and render them */}
                        {navLinks.map((link) => (
                            <DashboardNavLink
                                key={link.to}
                                to={link.to}
                                icon={link.icon}
                                label={link.label}
                            />
                        ))}
                    </nav>
                </div>
            </aside>

            {/* --- Main Content Area --- */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                {/* The Outlet component renders the currently active child route's component */}
                <Outlet />
            </div>
        </div>
    );
};

export default Sidebar;