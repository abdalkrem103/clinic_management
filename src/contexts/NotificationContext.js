import React, {createContext, useContext, useState, useEffect} from 'react';
import {notificationsAPI} from '../api/api';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({children}) => {
  const [notifications,
    setNotifications] = useState([]);
  const [alerts,
    setAlerts] = useState([]);
  const [unreadCount,
    setUnreadCount] = useState(0);
  const [loading,
    setLoading] = useState(true);
  const [error,
    setError] = useState(null);

  // جلب الإشعارات والتنبيهات
  const fetchData = async () => {
    const isAuthenticated = localStorage.getItem('token') !== null;
    const user = localStorage.getItem('user');
    let userId = null;

    if (user) {
      try {
        userId = JSON.parse(user).id;
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e);
        localStorage.removeItem('user');
      }
    }

    if (!isAuthenticated || !userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [notificationsRes,
        alertsRes] = await Promise.all([
        notificationsAPI.getAll(userId)
        // ملاحظة: getAlerts() لم يتم تنفيذه بعد في الواجهة الخلفية
        //notificationsAPI.getAlerts()
      ]);

      if (notificationsRes.data.success) {
        setNotifications(notificationsRes.data.data);
        setUnreadCount(notificationsRes.data.data.filter(n => !n.is_read).length);
      }
      // إذا كانت getAlerts() موجودة ومعتمدة، قم بإلغاء التعليق عليها هنا
      /*
            if (alertsRes.data.success) {
                setAlerts(alertsRes.data.data);
            }
            */
    } catch (err) {
      // تجاهل أخطاء 401 هنا حيث يتم التعامل معها في api.js interceptor
      if (err.response && err.response.status === 401) {
        console.log('Authentication required for notifications.');
      } else {
        setError('حدث خطأ أثناء جلب البيانات');
      }
    } finally {
      setLoading(false);
    }
  };

  // تحديث حالة الإشعارات
  const markAsRead = async (notificationId) => {
    const isAuthenticated = localStorage.getItem('token') !== null;
    if (!isAuthenticated) {
      console.log('Authentication required to mark as read.');
      return;
    }

    try {
      const response = await notificationsAPI.markAsRead(notificationId);
      if (response.data.success) {
        setNotifications(notifications.map(notification =>
          notification.id === notificationId
            ? {...notification,
              is_read: true}
            : notification
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      // تجاهل أخطاء 401 هنا حيث يتم التعامل معها في api.js interceptor
      if (err.response && err.response.status === 401) {
        console.log('Authentication required to mark as read.');
      } else {
        setError('حدث خطأ أثناء تحديث حالة الإشعار');
      }
    }
  };

  // جلب البيانات عند تحميل المكون وتغيير حالة المصادقة
  // وتحديث البيانات كل دقيقة إذا كان المستخدم مصادق عليه
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('token') !== null;
    if (isAuthenticated) {
      fetchData();
      const interval = setInterval(fetchData, 60000);
      return () => clearInterval(interval);
    }
    // إذا لم يكن مصادقاً عليه، قم بإيقاف أي مؤقتات سابقة وتنظيف البيانات
    setNotifications([]);
    setAlerts([]);
    setUnreadCount(0);
    setLoading(false);
    setError(null);
  }, [localStorage.getItem('token')]); // إعادة تشغيل التأثير عند تغير حالة المصادقة

  const value = {
    notifications,
    alerts,
    unreadCount,
    loading,
    error,
    fetchData,
    markAsRead
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
