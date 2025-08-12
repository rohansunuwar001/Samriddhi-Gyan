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

/**
 * A utility function to format a date into a human-readable "time ago" string.
 * @param {string | Date} date - The date to format.
 * @returns {string} The formatted time ago string.
 */
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
    // Hooks for API interaction
    const { data: notifications = [], refetch, isLoading: isFetching } = useGetNotificationsQuery();
    const [markAsRead] = useMarkAsReadMutation();
    const [deleteNotification, { isLoading: isDeleting }] = useDeleteNotificationMutation();
    const [clearAllNotifications, { isLoading: isClearing }] = useClearAllNotificationsMutation();

    // State for UI and real-time connection
    const socket = useSocket();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Effect for listening to real-time notifications from the server
    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (notification) => {
            console.log("Real-time notification received:", notification);
            toast.info(notification.message, {
                description: `Received just now. Click to view.`,
                duration: 5000,
            });
            // Automatically refetch the notification list to include the new one
            refetch();
        };

        socket.on('new_notification', handleNewNotification);
        console.log("Socket is connected. Listening for 'new_notification' event.");

        // Cleanup: remove the event listener when the component unmounts
        return () => {
            socket.off('new_notification', handleNewNotification);
        };
    }, [socket, refetch]);

    // Effect for handling clicks outside the dropdown to close it
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
        // If opening the dropdown and there are unread items, mark them as read
        if (newIsOpenState && unreadCount > 0) {
            markAsRead();
        }
    };

    const handleDelete = async (e, notificationId) => {
        e.preventDefault();   // Prevent link navigation
        e.stopPropagation();  // Prevent dropdown from closing
        await deleteNotification(notificationId);
        toast.success("Notification removed.");
    };

    const handleClearAll = async (e) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to clear all notifications? This cannot be undone.")) {
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
                <div className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="flex items-center justify-between p-3 border-b">
                        <h3 className="font-semibold text-gray-800">Notifications</h3>
                        {notifications.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700"
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
                                        className="absolute top-1/2 right-2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
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