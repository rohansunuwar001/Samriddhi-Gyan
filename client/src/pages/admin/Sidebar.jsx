import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

// Icons for each navigation link
import { 
    LayoutDashboard, 
    BookCopy,
    Users,
    MessageSquare,
    DollarSign,
    BarChart3
} from 'lucide-react';

// Reusable NavLink component to avoid code repetition
const AdminNavLink = ({ to, icon, label }) => {
    // NavLink from react-router-dom automatically gets an `isActive` prop
    return (
        <NavLink
            to={to}
            end // Use 'end' to prevent parent routes from staying active
            className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-muted/50 dark:hover:bg-muted/20 ${
                isActive
                    ? 'bg-muted dark:bg-muted/30 font-semibold text-primary'
                    : 'text-muted-foreground'
                }`
            }
        >
            {icon}
            {label}
        </NavLink>
    );
};

const Sidebar = () => {
    return (
        <div className="flex h-screen bg-background">
            {/* --- Sidebar Navigation --- */}
            <aside className="hidden lg:block w-[250px] flex-shrink-0 border-r dark:border-gray-800 p-4">
                <div className="flex flex-col h-full">
                    <nav className="flex-grow space-y-2">
                        <AdminNavLink to="dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />
                        <AdminNavLink to="course" icon={<BookCopy size={20} />} label="My Courses" />
                        <AdminNavLink to="students" icon={<Users size={20} />} label="Students" />
                        <AdminNavLink to="reviews" icon={<MessageSquare size={20} />} label="Reviews" />
                        <AdminNavLink to="payouts" icon={<DollarSign size={20} />} label="Payouts" />
                        <AdminNavLink to="analytics" icon={<BarChart3 size={20} />} label="Analytics" />
                    </nav>
                </div>
            </aside>
            
            {/* --- Main Content Area --- */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                {/* The Outlet component renders the currently active child route */}
                <Outlet />
            </div>
        </div>
    );
};

export default Sidebar;