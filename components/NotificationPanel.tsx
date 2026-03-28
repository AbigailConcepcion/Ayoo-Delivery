import React from 'react';
import { AyooNotification } from '../src/utils/notifications';

interface NotificationPanelProps {
    notifications: AyooNotification[];
    onClose: () => void;
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
    notifications,
    onClose,
    onMarkAsRead,
    onMarkAllAsRead,
}) => {
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'ORDER_PLACED': return '📦';
            case 'ORDER_ACCEPTED': return '✅';
            case 'ORDER_PREPARING': return '👨‍🍳';
            case 'ORDER_READY': return '🍔';
            case 'ORDER_PICKED_UP': return '🚴';
            case 'ORDER_DELIVERED': return '🎉';
            case 'ORDER_CANCELLED': return '❌';
            case 'NEW_ORDER': return '🔔';
            case 'STATUS_UPDATE': return '📋';
            case 'ALERT': return '⚠️';
            default: return '📌';
        }
    };

    const getNotificationColor = (type: string, isRead: boolean) => {
        if (isRead) return 'bg-gray-50 border-gray-100';

        switch (type) {
            case 'ORDER_DELIVERED':
                return 'bg-green-50 border-green-200';
            case 'ORDER_CANCELLED':
                return 'bg-red-50 border-red-200';
            case 'ORDER_PICKED_UP':
            case 'OUT_FOR_DELIVERY':
                return 'bg-blue-50 border-blue-200';
            default:
                return 'bg-purple-50 border-purple-200';
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xl flex items-end justify-center">
            <div className="bg-white w-full max-w-md h-[85vh] rounded-t-[50px] animate-in slide-in-from-bottom-10 duration-300 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 pb-4 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#C084FC] to-[#A78BFA] rounded-2xl flex items-center justify-center text-white text-xl shadow-lg">
                                🔔
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900">Notifications</h2>
                                {unreadCount > 0 && (
                                    <p className="text-xs font-bold text-[#C084FC]">{unreadCount} unread</p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={onMarkAllAsRead}
                            className="text-xs font-bold text-[#C084FC] hover:underline"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Notification List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {notifications.length === 0 ? (
                        <div className="text-center py-12 opacity-40">
                            <div className="text-5xl mb-4">🔕</div>
                            <p className="font-black text-sm uppercase tracking-wider">No notifications yet</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => onMarkAsRead(notification.id)}
                                className={`
                  p-4 rounded-3xl border-2 cursor-pointer transition-all hover:scale-[1.01]
                  ${getNotificationColor(notification.type, notification.read)}
                `}
                            >
                                <div className="flex gap-3">
                                    <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className={`font-black text-sm ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                                                {notification.title}
                                            </h4>
{!notification.read && (
                                                <div className="w-2 h-2 bg-[#C084FC] rounded-full flex-shrink-0 mt-1 ml-auto"></div>
                                            )}
                                        </div>
                                        <p className="text-xs font-medium text-gray-600 mt-1 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-wider">
                                            {formatTime(notification.timestamp)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationPanel;

