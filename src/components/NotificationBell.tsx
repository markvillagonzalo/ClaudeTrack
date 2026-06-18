import React, { useState, useEffect } from "react";
import { Bell, Check, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Notification, User } from "../types.js";

interface NotificationBellProps {
  currentUser: User;
  refreshTrigger: number;
}

export default function NotificationBell({ currentUser, refreshTrigger }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications", {
        headers: {
          "x-user-id": currentUser.id,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentUser, refreshTrigger]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    try {
      const response = await fetch("/api/notifications/read", {
        method: "POST",
        headers: {
          "x-user-id": currentUser.id,
        },
      });
      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div id="notification-bell-container" className="relative">
      <button
        id="notif-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-300 hover:text-white focus:outline-none hover:bg-slate-850 rounded-md transition-colors"
        title="View Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span
            id="notif-badge"
            className="absolute top-1 right-1 flex h-2 w-2 items-center justify-center rounded-full bg-indigo-500 ring-2 ring-[#0f172a]"
          />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop click-shield */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              id="notif-dropdown"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden"
            >
              <div id="notif-header" className="p-4 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-800 text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-mono">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    id="mark-all-read-btn"
                    onClick={markAllRead}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div id="notif-body-list" className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No notifications yet. Legal status shifts will appear here.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      id={`notif-item-${notif.id}`}
                      key={notif.id}
                      className={`p-4 transition-colors ${
                        notif.read ? "bg-white" : "bg-indigo-50/20"
                      }`}
                    >
                      <div className="flex gap-2.5 items-start">
                        {/* Star symbol for premium synthesized notification microcopy */}
                        <div className="mt-0.5 p-1 bg-indigo-50 rounded text-indigo-600">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-700 leading-relaxed font-sans">
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                            {new Date(notif.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
