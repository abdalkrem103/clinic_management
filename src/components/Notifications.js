import React, {useState, useEffect} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faBell, faCog, faCheckCircle, faExclamationTriangle, faExclamationCircle} from '@fortawesome/free-solid-svg-icons';
import {notificationsAPI, authAPI} from '../api/api';
import '../styles/Notifications.css';
import {
  Spinner,
  Alert,
  Button,
  ListGroup,
  Badge,
  Modal,
  Form
} from 'react-bootstrap';

const Notifications = () => {
  const [notifications,
    setNotifications] = useState([]);
  const [alerts,
    setAlerts] = useState([]);
  const [loading,
    setLoading] = useState(true);
  const [error,
    setError] = useState(null);
  const [showSettingsModal,
    setShowSettingsModal] = useState(false);
  const [settings,
    setSettings] = useState({
    email_notifications: true,
    sms_notifications: false,
    appointment_reminders: true,
    inventory_alerts: true,
    payment_reminders: true
  });

  // جلب الإشعارات والتنبيهات
  const fetchData = async () => {
    console.log('Fetching notifications data...');
    try {
      setLoading(true);
      const currentUser = authAPI.getCurrentUser();
      if (!currentUser || !currentUser.id) {
        setError('معرف المستخدم غير متوفر. الرجاء تسجيل الدخول.');
        setLoading(false);
        return;
      }
      const notificationsRes = await notificationsAPI.getAll(currentUser.id);
      console.log('Notifications API response:', notificationsRes);

      if (notificationsRes.data.success) {
        const fetchedNotifications = notificationsRes.data.data.notifications.filter(item => item.type !== 'inventory_alert');
        const fetchedAlerts = notificationsRes.data.data.notifications.filter(item => item.type === 'inventory_alert');
        const fetchedSettings = notificationsRes.data.data.settings;

        setNotifications(fetchedNotifications);
        setAlerts(fetchedAlerts);
        setSettings(fetchedSettings);

        console.log('Notifications data set:', fetchedNotifications);
        console.log('Alerts data set:', fetchedAlerts);
        console.log('Settings data set:', fetchedSettings);
      } else {
        setError(notificationsRes.data.message);
        console.error('Error fetching notifications:', notificationsRes.data.message);
      }
    } catch (err) {
      console.error('Fetch Data Error:', err);
      setError('حدث خطأ أثناء جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // تحديث البيانات كل دقيقة
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  // تحديث حالة الإشعارات
  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await notificationsAPI.markAsRead(notificationId);
      if (response.data.success) {
        setNotifications(notifications.map(notification =>
          notification.id === notificationId
            ? {...notification,
              is_read: true}
            : notification
        ));
      }
    } catch (err) {
      setError('حدث خطأ أثناء تحديث حالة الإشعار');
    }
  };

  // حفظ إعدادات الإشعارات
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    console.log('Saving settings:', settings);
    try {
      const currentUser = authAPI.getCurrentUser();
      if (!currentUser || !currentUser.id) {
        setError('معرف المستخدم غير متوفر لحفظ الإعدادات.');
        return;
      }
      // Send settings to the backend using the correct API method
      const response = await notificationsAPI.saveSettings({
        user_id: currentUser.id,
        settings
      });
      if (response.data.success) {
        setShowSettingsModal(false);
        console.log('Settings saved successfully', response.data);
      } else {
        setError(response.data.message);
        console.error('Error saving settings:', response.data.message);
      }
    } catch (err) {
      console.error('Save Settings Error:', err);
      setError('حدث خطأ أثناء حفظ الإعدادات');
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">جاري التحميل...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {error && (
        <Alert dismissible onClose={() => setError(null)} variant="danger">
          {error}
        </Alert>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>الإشعارات والتنبيهات</h3>
        <Button onClick={() => setShowSettingsModal(true)} variant="outline-primary">
                    إعدادات الإشعارات
        </Button>
      </div>

      {/* التنبيهات */}
      {alerts.length > 0 && (
        <div className="mb-4">
          <h4>التنبيهات</h4>
          <ListGroup>
            {alerts.map(alert => (
              <ListGroup.Item
                key={alert.id}
                variant={alert.severity === 'high' ? 'danger' : 'warning'}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1">{alert.title}</h5>
                    <p className="mb-1">{alert.message}</p>
                    <small>{new Date(alert.created_at).toLocaleString('ar-SA')}</small>
                  </div>
                  <Badge bg={alert.severity === 'high' ? 'danger' : 'warning'}>
                    {alert.severity === 'high' ? 'عاجل' : 'تنبيه'}
                  </Badge>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </div>
      )}

      {/* الإشعارات */}
      <div>
        <h4>الإشعارات</h4>
        <ListGroup>
          {notifications.map(notification => (
            <ListGroup.Item
              className={!notification.is_read ? 'fw-bold' : ''}
              key={notification.id}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">{notification.title}</h5>
                  <p className="mb-1">{notification.message}</p>
                  <small>{new Date(notification.created_at).toLocaleString('ar-SA')}</small>
                </div>
                {!notification.is_read && (
                  <Button
                    onClick={() => handleMarkAsRead(notification.id)}
                    size="sm"
                    variant="outline-primary"
                  >
                                        تحديد كمقروء
                  </Button>
                )}
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </div>

      {/* Modal إعدادات الإشعارات */}
      <Modal onHide={() => setShowSettingsModal(false)} show={showSettingsModal}>
        <Modal.Header closeButton>
          <Modal.Title>إعدادات الإشعارات</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSaveSettings}>
            <Form.Group className="mb-3">
              <Form.Check
                checked={settings.email_notifications}
                id="email_notifications"
                label="إشعارات البريد الإلكتروني"
                onChange={(e) => setSettings({
                  ...settings,
                  email_notifications: e.target.checked
                })}
                type="switch"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                checked={settings.sms_notifications}
                id="sms_notifications"
                label="إشعارات الرسائل النصية"
                onChange={(e) => setSettings({
                  ...settings,
                  sms_notifications: e.target.checked
                })}
                type="switch"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                checked={settings.appointment_reminders}
                id="appointment_reminders"
                label="تذكيرات المواعيد"
                onChange={(e) => setSettings({
                  ...settings,
                  appointment_reminders: e.target.checked
                })}
                type="switch"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                checked={settings.inventory_alerts}
                id="inventory_alerts"
                label="تنبيهات المخزون"
                onChange={(e) => setSettings({
                  ...settings,
                  inventory_alerts: e.target.checked
                })}
                type="switch"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                checked={settings.payment_reminders}
                id="payment_reminders"
                label="تذكيرات المدفوعات"
                onChange={(e) => setSettings({
                  ...settings,
                  payment_reminders: e.target.checked
                })}
                type="switch"
              />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button className="me-2" onClick={() => setShowSettingsModal(false)} variant="secondary">
                                إلغاء
              </Button>
              <Button type="submit" variant="primary">
                                حفظ
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Notifications;
