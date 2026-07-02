// src/components/NotificationBell.jsx

import { Button } from "@/components/ui/button";
import { Bell, BellRing, Loader2, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from 'react';
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useSocket } from '../context/SocketContext';
import {
    useClearAllNotificationsMutation,
    useDeleteNotificationMutation,
    useGetNotificationsQuery,
    useMarkAsReadMutation
} from '../features/api/notificationApi';

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

const NotificationBell = () => {
    const {
        data: notifications = [],
        refetch,
        isLoading: isFetching
    } = useGetNotificationsQuery(undefined, {
        refetchOnMountOrArgChange: true,
    });

    const [markAsRead] = useMarkAsReadMutation();
    const [deleteNotification, { isLoading: isDeleting }] = useDeleteNotificationMutation();
    const [clearAllNotifications, { isLoading: isClearing }] = useClearAllNotificationsMutation();

    const socket = useSocket();
    const [isOpen, setIsOpen] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    
    const dropdownRef = useRef(null);
    const hoverTimerRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => {
            console.log("[NotificationBell] Socket reconnected — refetching notifications");
            refetch();
        };

        const handleNewNotification = (notification) => {
            console.log("[NotificationBell] Real-time notification received:", notification);
            toast.info(notification.message, {
                description: "Click the bell to view.",
                duration: 5000,
            });
            refetch();
        };

        socket.on('connect', handleConnect);
        socket.on('new_notification', handleNewNotification);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('new_notification', handleNewNotification);
        };
    }, [socket, refetch]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleMouseEnter = () => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        setIsOpen(true);
        if (unreadCount > 0) {
            markAsRead();
        }
    };

    const handleMouseLeave = () => {
        hoverTimerRef.current = setTimeout(() => {
            setIsOpen(false);
            setShowClearConfirm(false);
        }, 150);
    };

    const handleDelete = async (e, notificationId) => {
        e.preventDefault();
        e.stopPropagation();
        await deleteNotification(notificationId);
        toast.success("Notification removed.");
    };

    const handleConfirmClearAll = async (e) => {
        e.stopPropagation();
        try {
            await clearAllNotifications().unwrap();
            setShowClearConfirm(false);
            toast.success("All notifications cleared.");
        } catch (err) {
            toast.error("Failed to clear notifications.");
        }
    };

    return (
        <div 
            className="relative py-5 -my-5" 
            ref={dropdownRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <Link 
                to="/home/my-courses/learning" // Link to a general workspace page as primary action
                className="w-10 h-10 flex items-center justify-center rounded-full relative hover:bg-slate-50 transition-colors"
                onClick={(e) => e.preventDefault()} // prevent navigation to keep it focused on hover dropdown
            >
                {isFetching ? (
                    <Loader2 className="h-[22px] w-[22px] animate-spin text-gray-500" />
                ) : unreadCount > 0 ? (
                    <BellRing className="h-[22px] w-[22px] text-yellow-500 animate-pulse" />
                ) : (
                    <Bell className="h-[22px] w-[22px] text-gray-700" />
                )}
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#6d28d2] text-[10px] font-extrabold text-white border border-white">
                        {unreadCount}
                    </span>
                )}
            </Link>

            {isOpen && (
                <div 
                    className="absolute right-0 top-full w-80 sm:w-96 origin-top-right bg-white border border-gray-200 shadow-2xl z-[200] rounded-sm"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {showClearConfirm ? (
                        <div className="flex items-center justify-between p-3 bg-red-50/50 border-b border-red-100 animate-in fade-in duration-200">
                            <span className="text-xs font-bold text-red-700">Clear all notifications?</span>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    className="text-xs px-3 h-7 bg-[#6d28d2] hover:bg-[#892de1] text-white font-bold rounded-sm"
                                    onClick={handleConfirmClearAll}
                                    disabled={isClearing}
                                >
                                    {isClearing ? "Clearing..." : "Yes"}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs px-3 h-7 border-slate-300 hover:bg-slate-100 font-bold rounded-sm text-slate-700 bg-white"
                                    onClick={() => setShowClearConfirm(false)}
                                >
                                    No
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-3 border-b">
                            <h3 className="font-bold text-sm text-[#1c1d1f]">Notifications</h3>
                            {notifications.length > 0 && (
                                <button
                                    className="text-xs font-bold text-[#6d28d2] hover:text-[#892de1] hover:underline flex items-center gap-1 focus:outline-none"
                                    onClick={() => setShowClearConfirm(true)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Clear All
                                </button>
                            )}
                        </div>
                    )}
                    
                    <ul className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length > 0 ? (
                            notifications.map(n => (
                                <li key={n._id} className={`group relative ${!n.read ? 'bg-slate-50/60' : 'bg-white'}`}>
                                    <Link 
                                        to={n.link || "#"} 
                                        onClick={() => setIsOpen(false)} 
                                        className="block p-4 hover:bg-slate-50 transition-colors"
                                    >
                                        <p className="text-xs font-medium text-slate-700 pr-6 leading-relaxed">{n.message}</p>
                                        <p className="text-[10px] text-slate-400 font-bold mt-1.5">{timeAgo(n.createdAt)}</p>
                                    </Link>
                                    <button
                                        onClick={(e) => handleDelete(e, n._id)}
                                        disabled={isDeleting}
                                        className="absolute top-1/2 right-3 -translate-y-1/2 p-1.5 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
                                        aria-label="Delete notification"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </li>
                            ))
                        ) : (
                            <li className="p-8 text-center text-xs font-bold text-slate-400">
                                {isFetching ? "Loading..." : "You're all caught up!"}
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
