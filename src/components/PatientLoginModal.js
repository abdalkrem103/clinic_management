import React, { useState, useCallback, memo, useEffect } from 'react';
import '../styles/PatientLoginModal.css';
import { patientAPI } from '../api/api'; // Import patientAPI
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ForgotPasswordModal from './ForgotPasswordModal';

const initialState = {
  national_id: '',
  password: ''
};

const PatientLoginModal = memo(({ onClose, onLogin }) => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  useEffect(() => {
    return () => {
      setForm(initialState);
      setLoading(false);
      setError('');
      setShowPassword(false);
      setShowForgotPasswordModal(false);
    };
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await patientAPI.login(form); // Call the API
      if (response.data.success) {
        if (onLogin) {
          onLogin(response.data.patient); // Pass the full patient object
        }
        setTimeout(() => {
          if (onClose) onClose();
        }, 100);
      } else {
        setError(response.data.message || 'فشل تسجيل الدخول');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  }, [form, onLogin, onClose]);

  const handleClose = useCallback(() => {
    if (showForgotPasswordModal) {
      setShowForgotPasswordModal(false);
    } else {
      if (onClose) onClose();
    }
  }, [showForgotPasswordModal, onClose]);

  const handleForgotPasswordClose = useCallback(() => {
    setShowForgotPasswordModal(false);
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(v => !v);
  }, []);

  const openForgotPasswordModal = useCallback(() => {
    setShowForgotPasswordModal(true);
  }, []);

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-content patient-login-modal">
          <button className="close-btn" onClick={handleClose}>×</button>
          <h2>تسجيل الدخول</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-row">
              <input name="national_id" value={form.national_id} onChange={handleChange} placeholder="الرقم الوطني" required />
            </div>
            <div className="form-row" style={{ position: 'relative' }}>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="كلمة السر"
                required
                style={{ paddingRight: '36px' }}
              />
              <span className="eye-icon" onClick={togglePasswordVisibility} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}>
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </span>
            </div>
            <div style={{ textAlign: 'left', marginTop: '8px' }}>
              <button type="button" className="forgot-password-btn" style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', padding: 0 }} onClick={openForgotPasswordModal}>
                نسيت كلمة السر؟
              </button>
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>{loading ? 'جاري الدخول...' : 'تسجيل الدخول'}</button>
          </form>
        </div>
      </div>
      {showForgotPasswordModal && (
        <ForgotPasswordModal key="forgot-password-modal" onClose={handleForgotPasswordClose} />
      )}
    </>
  );
});

PatientLoginModal.displayName = 'PatientLoginModal';

export default PatientLoginModal; 