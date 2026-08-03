import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markAllAsRead: () => {}
});

export function NotificationProvider({ children }) {
  // Starts empty. The seeded alerts described entities that do not exist in the
  // store, and an unread badge on a fabricated alert is worse than no badge.
  const [notifications, setNotifications] = useState([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (notif) => {
    setNotifications(prev => [{ id: Date.now(), read: false, time: new Date().toLocaleTimeString(), ...notif }, ...prev]);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
