import React, { useState, useCallback, memo, useEffect } from 'react';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { patientAPI } from '../api/api';
import '../styles/PatientLoginModal.css';

const ForgotPasswordModal = memo(({ onClose }) => {
  const [step, setStep] = useState(1); // 1: إدخال البريد، 2: إدخال الكود وكلمة السر
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // تنظيف الحالة عند إغلاق الموديل
  useEffect(() => {
    return () => {
      setStep(1);
      setEmail('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setLoading(false);
      setError('');
      setSuccess('');
    };
  }, []);

  function isStrongPassword(password) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}\[\]:;"'<>,.?/]).{8,}$/.test(password);
  }

  const handleSendOtp = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const response = await patientAPI.sendResetOtp({ email });
      if (response.data.success) {
        setStep(2);
        setSuccess('تم إرسال كود التحقق إلى بريدك الإلكتروني.');
      } else {
        setError(response.data.message || 'فشل في إرسال الكود');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء إرسال الكود');
    } finally {
      setLoading(false);
    }
  }, [email]);

  const handleResetPassword = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== confirmPassword) {
      setError('كلمتا السر غير متطابقتين');
      return;
    }
    if (!isStrongPassword(newPassword)) {
      setError('كلمة السر ضعيفة. يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير وصغير، رقم، ورمز خاص.');
      return;
    }
    setLoading(true);
    try {
      const response = await patientAPI.resetPassword({ email, otp, newPassword });
      if (response.data.success) {
        setSuccess('تم تغيير كلمة السر بنجاح! يمكنك الآن تسجيل الدخول.');
        setStep(3);
      } else {
        setError(response.data.message || 'فشل في تغيير كلمة السر');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء تغيير كلمة السر');
    } finally {
      setLoading(false);
    }
  }, [email, otp, newPassword, confirmPassword]);

  const handleEmailChange = useCallback((e) => {
    setEmail(e.target.value);
  }, []);

  const handleOtpChange = useCallback((e) => {
    setOtp(e.target.value);
  }, []);

  const handleNewPasswordChange = useCallback((e) => {
    setNewPassword(e.target.value);
  }, []);

  const handleConfirmPasswordChange = useCallback((e) => {
    setConfirmPassword(e.target.value);
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(v => !v);
  }, []);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(v => !v);
  }, []);

  return (
    <div className="modal-overlay">
      <div className="modal-content forgot-password-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>استعادة كلمة السر</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="login-form">
            <div className="form-row">
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="أدخل بريدك الإلكتروني"
                required
              />
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>{loading ? 'جاري الإرسال...' : 'إرسال كود التحقق'}</button>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="login-form">
            <div className="form-row">
              <input
                type="text"
                value={otp}
                onChange={handleOtpChange}
                placeholder="كود التحقق"
                required
              />
            </div>
            <div className="form-row">
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={handleNewPasswordChange}
                  placeholder="كلمة السر الجديدة"
                  required
                  style={{ paddingRight: '36px' }}
                />
                <span className="eye-icon" onClick={togglePasswordVisibility} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}>
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </span>
              </div>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  placeholder="تأكيد كلمة السر الجديدة"
                  required
                  style={{ paddingRight: '36px' }}
                />
                <span className="eye-icon" onClick={toggleConfirmPasswordVisibility} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}>
                  <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                </span>
              </div>
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>{loading ? 'جاري التغيير...' : 'تغيير كلمة السر'}</button>
          </form>
        )}
        {step === 3 && (
          <div style={{ textAlign: 'center', margin: '24px 0' }}>
            <p>تم تغيير كلمة السر بنجاح! يمكنك الآن تسجيل الدخول.</p>
            <button className="submit-btn" onClick={onClose}>العودة لتسجيل الدخول</button>
          </div>
        )}
      </div>
    </div>
  );
});

ForgotPasswordModal.displayName = 'ForgotPasswordModal';

export default ForgotPasswordModal; 