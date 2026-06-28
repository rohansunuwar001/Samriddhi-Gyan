// src/components/NotificationBell.jsx
//
// FIXES:
// 1. Added refetchOnMountOrArgChange: true to always fetch fresh on mount.
//    This means when the user returns from eSewa payment and the page loads,
//    the bell immediately fetches new notifications from the server.
//
// 2. Added socket 'connect' event listener — when the socket reconnects
//    after the eSewa redirect, we immediately refetch notifications.
//    This catches the case where the notification was saved to DB during
//    the payment but couldn't be emitted because the socket was disconnected.

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
    // FIX 1: refetchOnMountOrArgChange: true — always fetch fresh on mount.
    // This means every time the navbar renders (e.g. after returning from eSewa),
    // the bell fetches the latest notifications from the server instead of
    // returning the 304 cached empty response.
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
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        // FIX 2: Listen for socket reconnect.
        // When the user returns from eSewa payment, a new socket connection
        // is established. At that point we immediately refetch notifications
        // so the bell shows any notification that was saved to DB during payment.
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

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleToggleDropdown = () => {
        const newIsOpenState = !isOpen;
        setIsOpen(newIsOpenState);
        if (newIsOpenState && unreadCount > 0) {
            markAsRead();
        }
    };

    const handleDelete = async (e, notificationId) => {
        e.preventDefault();
        e.stopPropagation();
        await deleteNotification(notificationId);
        toast.success("Notification removed.");
    };

    const handleClearAll = async (e) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to clear all notifications?")) {
            await clearAllNotifications();
            toast.success("All notifications cleared.");
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <Button variant="ghost" size="icon" onClick={handleToggleDropdown} className="relative">
                {isFetching ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                ) : unreadCount > 0 ? (
                    <BellRing className="h-6 w-6 text-yellow-500 animate-pulse" />
                ) : (
                    <Bell className="h-6 w-6" />
                )}
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                        {unreadCount}
                    </span>
                )}
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="flex items-center justify-between p-3 border-b">
                        <h3 className="font-semibold text-gray-800">Notifications</h3>
                        {notifications.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-blue-600 hover:bg-blue-50"
                                onClick={handleClearAll}
                                disabled={isClearing}
                            >
                                {isClearing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Trash2 className="mr-1 h-3 w-3" />}
                                Clear All
                            </Button>
                        )}
                    </div>
                    <ul className="max-h-96 overflow-y-auto divide-y">
                        {notifications.length > 0 ? (
                            notifications.map(n => (
                                <li key={n._id} className={`group relative ${!n.read ? 'bg-blue-50' : 'bg-white'}`}>
                                    <Link to={n.link} onClick={() => setIsOpen(false)} className="block p-3 hover:bg-gray-100">
                                        <p className="text-sm text-gray-700 pr-5">{n.message}</p>
                                        <p className="text-xs text-gray-500 mt-1">{timeAgo(n.createdAt)}</p>
                                    </Link>
                                    <button
                                        onClick={(e) => handleDelete(e, n._id)}
                                        disabled={isDeleting}
                                        className="absolute top-1/2 right-2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        aria-label="Delete notification"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </li>
                            ))
                        ) : (
                            <li className="p-8 text-center text-sm text-gray-500">
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
