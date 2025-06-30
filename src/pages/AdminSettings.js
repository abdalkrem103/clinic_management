import React, { useState, useEffect } from 'react';
import { authAPI } from '../api/api';
import '../styles/AdminSettings.css';
import { useNavigate } from 'react-router-dom';

const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // البيانات الأساسية
  const [basicForm, setBasicForm] = useState({
    username: '',
    email: ''
  });
  const [basicLoading, setBasicLoading] = useState(false);
  const [basicError, setBasicError] = useState('');

  // تغيير كلمة المرور
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // نسيان كلمة المرور
  const [forgotForm, setForgotForm] = useState({ email: '' });
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [showForgotForm, setShowForgotForm] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = () => {
    setLoading(true);
    // جلب بيانات الأدمن الحالي من localStorage أو API
    const adminData = JSON.parse(localStorage.getItem('user') || '{}');
    setBasicForm({
      username: adminData.username || '',
      email: adminData.email || ''
    });
    setLoading(false);
  };

  // تحديث البيانات الأساسية
  const handleUpdateBasic = (e) => {
    e.preventDefault();
    setBasicLoading(true);
    setBasicError('');
    setSuccess('');

    authAPI.updateProfile(basicForm)
      .then(res => {
        if (res.data.success) {
          setSuccess('تم تحديث البيانات بنجاح');
          // تحديث localStorage
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          const updatedUser = { ...currentUser, ...basicForm };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } else {
          setBasicError(res.data.message || 'فشل في تحديث البيانات');
        }
      })
      .catch(() => setBasicError('فشل في تحديث البيانات'))
      .finally(() => setBasicLoading(false));
  };

  // تغيير كلمة المرور
  const handleChangePassword = (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');
    setSuccess('');

    // التحقق من تطابق كلمة المرور الجديدة
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('كلمة المرور الجديدة غير متطابقة');
      setPasswordLoading(false);
      return;
    }

    // التحقق من طول كلمة المرور
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
      setPasswordLoading(false);
      return;
    }

    authAPI.changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    })
      .then(res => {
        if (res.data.success) {
          setSuccess('تم تغيير كلمة المرور بنجاح');
          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setShowPasswordForm(false);
        } else {
          setPasswordError(res.data.message || 'فشل في تغيير كلمة المرور');
        }
      })
      .catch(() => setPasswordError('فشل في تغيير كلمة المرور'))
      .finally(() => setPasswordLoading(false));
  };

  // نسيان كلمة المرور
  const handleForgotPassword = (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setSuccess('');

    authAPI.forgotPassword(forgotForm)
      .then(res => {
        if (res.data.success) {
          setSuccess('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
          setForgotForm({ email: '' });
          setShowForgotForm(false);
        } else {
          setForgotError(res.data.message || 'فشل في إرسال رابط إعادة التعيين');
        }
      })
      .catch(() => setForgotError('فشل في إرسال رابط إعادة التعيين'))
      .finally(() => setForgotLoading(false));
  };

  if (loading) {
    return <div className="loading">جاري التحميل...</div>;
  }

  return (
    <div className="admin-settings">
      <button className="back-btn" onClick={() => navigate('/admin-dashboard')}>
        ← عودة للوحة الأدمن
      </button>
      <div className="admin-settings-header">
        <h2>إعدادات الأدمن</h2>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* البيانات الأساسية */}
      <div className="settings-section">
        <h3>البيانات الأساسية</h3>
        <form onSubmit={handleUpdateBasic} className="settings-form">
          <div className="form-row">
            <label>اسم المستخدم:</label>
            <input
              type="text"
              value={basicForm.username}
              onChange={e => setBasicForm(f => ({ ...f, username: e.target.value }))}
              required
            />
          </div>
          <div className="form-row">
            <label>البريد الإلكتروني:</label>
            <input
              type="email"
              value={basicForm.email}
              onChange={e => setBasicForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          {basicError && <div className="error-message">{basicError}</div>}
          <button type="submit" className="submit-btn" disabled={basicLoading}>
            {basicLoading ? 'جاري التحديث...' : 'تحديث البيانات'}
          </button>
        </form>
      </div>

      {/* تغيير كلمة المرور */}
      <div className="settings-section">
        <h3>تغيير كلمة المرور</h3>
        {!showPasswordForm ? (
          <button 
            className="action-btn" 
            onClick={() => setShowPasswordForm(true)}
          >
            تغيير كلمة المرور
          </button>
        ) : (
          <form onSubmit={handleChangePassword} className="settings-form">
            <div className="form-row">
              <label>كلمة المرور الحالية:</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                required
              />
            </div>
            <div className="form-row">
              <label>كلمة المرور الجديدة:</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                required
                minLength="6"
              />
            </div>
            <div className="form-row">
              <label>تأكيد كلمة المرور الجديدة:</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                required
                minLength="6"
              />
            </div>
            {passwordError && <div className="error-message">{passwordError}</div>}
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordError('');
                }}
              >
                إلغاء
              </button>
              <button type="submit" className="submit-btn" disabled={passwordLoading}>
                {passwordLoading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* نسيان كلمة المرور */}
      <div className="settings-section">
        <h3>نسيان كلمة المرور</h3>
        <p className="section-description">
          إذا نسيت كلمة المرور، يمكنك إرسال رابط إعادة تعيين إلى بريدك الإلكتروني
        </p>
        {!showForgotForm ? (
          <button 
            className="action-btn" 
            onClick={() => setShowForgotForm(true)}
          >
            إرسال رابط إعادة التعيين
          </button>
        ) : (
          <form onSubmit={handleForgotPassword} className="settings-form">
            <div className="form-row">
              <label>البريد الإلكتروني:</label>
              <input
                type="email"
                value={forgotForm.email}
                onChange={e => setForgotForm(f => ({ ...f, email: e.target.value }))}
                required
                placeholder="أدخل بريدك الإلكتروني"
              />
            </div>
            {forgotError && <div className="error-message">{forgotError}</div>}
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={() => {
                  setShowForgotForm(false);
                  setForgotForm({ email: '' });
                  setForgotError('');
                }}
              >
                إلغاء
              </button>
              <button type="submit" className="submit-btn" disabled={forgotLoading}>
                {forgotLoading ? 'جاري الإرسال...' : 'إرسال الرابط'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminSettings; 