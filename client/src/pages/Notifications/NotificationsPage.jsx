// src/pages/NotificationsPage.jsx

import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2, Trash2, Bell, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
    useClearAllNotificationsMutation,
    useDeleteNotificationMutation,
    useGetNotificationsQuery,
    useMarkAsReadMutation
} from '@/features/api/notificationApi';

const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
};

const NotificationsPage = () => {
    const { t } = useTranslation();
    const { user } = useSelector((store) => store.auth);
    const userRole = user?.role || 'student';

    const {
        data: notifications = [],
        isLoading: isFetching,
        refetch
    } = useGetNotificationsQuery(undefined, {
        refetchOnMountOrArgChange: true,
    });

    const [markAsRead] = useMarkAsReadMutation();
    const [deleteNotification, { isLoading: isDeleting }] = useDeleteNotificationMutation();
    const [clearAllNotifications, { isLoading: isClearing }] = useClearAllNotificationsMutation();

    // Define tabs based on user role
    const tabs = useMemo(() => {
        return [userRole];
    }, [userRole]);

    // Active tab state - default to first available tab
    const [activeTab, setActiveTab] = useState(tabs[0]);

    // Update active tab if user role changes/loads
    useEffect(() => {
        if (tabs.length > 0) {
            setActiveTab(tabs[0]);
        }
    }, [tabs]);

    // Mark as read on load
    useEffect(() => {
        const unreadCount = notifications.filter(n => !n.read).length;
        if (unreadCount > 0) {
            markAsRead();
        }
    }, [notifications, markAsRead]);

    // Filter notifications based on tab
    const filteredNotifications = useMemo(() => {
        if (!notifications || !Array.isArray(notifications)) return [];

        if (activeTab === 'instructor') {
            return notifications.filter(n => 
                n.type === 'new_review' || 
                n.type === 'payout_processed'
            );
        } else if (activeTab === 'admin') {
            // Admin gets system alerts or specific admin type notices
            return notifications.filter(n => 
                n.type === 'system_alert' && userRole === 'admin'
            );
        } else {
            // Student notifications
            return notifications.filter(n => 
                n.type === 'course_enrollment' || 
                n.type === 'password_update' || 
                n.type === 'course_completion' ||
                n.type === 'exam_registration' ||
                (n.type === 'system_alert' && userRole !== 'admin')
            );
        }
    }, [notifications, activeTab, userRole]);

    const handleDelete = async (notificationId) => {
        try {
            await deleteNotification(notificationId).unwrap();
            toast.success("Notification removed.");
        } catch {
            toast.error("Failed to remove notification.");
        }
    };

    const handleClearAll = async () => {
        try {
            await clearAllNotifications().unwrap();
            toast.success("All notifications cleared.");
        } catch {
            toast.error("Failed to clear notifications.");
        }
    };

    if (isFetching) {
        return <LoadingSpinner />;
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-12 min-h-screen text-left font-sans">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-[#1c1d1f] tracking-tight">Notifications</h1>
                    <p className="text-base text-slate-500 mt-1">Stay updated with course announcements, reviews, and account updates.</p>
                </div>
                {filteredNotifications.length > 0 && (
                    <Button 
                        variant="outline" 
                        onClick={handleClearAll}
                        disabled={isClearing}
                        className="text-sm font-semibold border-slate-300 hover:bg-slate-50 text-slate-700 h-10 px-4 rounded-md shrink-0 transition-colors"
                    >
                        {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Clear All
                    </Button>
                )}
            </div>

            {/* Tab Headers */}
            {tabs.length > 1 && (
                <div className="flex border-b border-gray-200 mb-6 gap-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 text-base font-semibold capitalize transition-all border-b-2 ${
                                activeTab === tab
                                    ? "border-[#1c1d1f] text-[#1c1d1f]"
                                    : "border-transparent text-slate-400 hover:text-slate-600"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            )}

            {/* Notifications Content */}
            <div className="bg-white border border-[#d1d7dc] rounded-none divide-y divide-[#d1d7dc] overflow-hidden shadow-sm">
                {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((n) => (
                        <div 
                            key={n._id} 
                            className={`group relative p-5 transition-all hover:bg-slate-50/60 flex items-start gap-4 ${
                                !n.read ? 'bg-slate-50/30 font-medium' : ''
                            }`}
                        >
                            {/* Icon Indicator */}
                            <div className="p-2 bg-purple-50 text-[#a435f0] rounded-full shrink-0">
                                <Bell className="h-5 w-5" />
                            </div>

                            {/* Message & Time */}
                            <div className="flex-1 min-w-0 pr-10">
                                {n.link ? (
                                    <Link 
                                        to={n.link} 
                                        className="text-base text-slate-800 hover:text-[#5624d0] leading-relaxed transition-colors hover:underline"
                                    >
                                        {n.message}
                                    </Link>
                                ) : (
                                    <p className="text-base text-slate-800 leading-relaxed">{n.message}</p>
                                )}
                                <p className="text-sm text-slate-400 font-semibold mt-2">{timeAgo(n.createdAt)}</p>
                            </div>

                            {/* Delete Action */}
                            <button
                                onClick={() => handleDelete(n._id)}
                                disabled={isDeleting}
                                className="absolute right-5 top-1/2 -translate-y-1/2 p-2 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-650 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
                                aria-label="Delete notification"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                        <p className="text-[14px] text-slate-500 font-light">No notifications.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
