import React, { useState, useCallback, memo, useEffect } from 'react';
import '../styles/PatientRegisterModal.css';
import { patientAPI } from '../api/api';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const initialState = {
  first_name: '',
  last_name: '',
  national_id: '',
  phone_number: '',
  email: '',
  date_of_birth: '',
  gender: '',
  address: '',
  blood_type: '',
  allergies: '',
  password: '',
  confirm_password: ''
};

function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}\[\]:;"'<>,.?/]).{8,}$/.test(password);
}

const PatientRegisterModal = memo(({ onClose, onRegister }) => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');

  useEffect(() => {
    return () => {
      setForm(initialState);
      setLoading(false);
      setError('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setPasswordStrength('');
    };
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'password') {
      setPasswordStrength(isStrongPassword(value) ? 'strong' : 'weak');
    }
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm_password) {
      setError('كلمتا السر غير متطابقتين');
      return;
    }

    if (!isStrongPassword(form.password)) {
      setError('كلمة السر ضعيفة. يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير وصغير، رقم، ورمز خاص.');
      return;
    }

    setLoading(true);
    try {
      const response = await patientAPI.register(form);
      if (response.data.success) {
        if (onRegister) {
          onRegister(response.data.patient);
        }
        setTimeout(() => {
          if (onClose) onClose();
        }, 100);
      } else {
        setError(response.data.message || 'فشل التسجيل');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'حدث خطأ أثناء التسجيل');
    } finally {
      setLoading(false);
    }
  }, [form, onRegister, onClose]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(v => !v);
  }, []);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(v => !v);
  }, []);

  return (
    <div className="modal-overlay">
      <div className="modal-content patient-register-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>تسجيل مريض جديد</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="الاسم الأول" required />
            <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="الاسم الأخير" required />
          </div>
          <div className="form-row">
            <input name="national_id" value={form.national_id} onChange={handleChange} placeholder="الرقم الوطني" required />
            <input name="phone_number" value={form.phone_number} onChange={handleChange} placeholder="رقم الهاتف" required />
          </div>
          <div className="form-row">
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="البريد الإلكتروني" required />
            <input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} placeholder="تاريخ الميلاد" required />
          </div>
          <div className="form-row">
            <select name="gender" value={form.gender} onChange={handleChange} required>
              <option value="">الجنس</option>
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
            <input name="address" value={form.address} onChange={handleChange} placeholder="العنوان" />
          </div>
          <div className="form-row">
            <input name="blood_type" value={form.blood_type} onChange={handleChange} placeholder="فصيلة الدم (اختياري)" />
            <input name="allergies" value={form.allergies} onChange={handleChange} placeholder="الحساسية (اختياري)" />
          </div>
          <div className="form-row">
            <div style={{ position: 'relative', width: '100%' }}>
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
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                name="confirm_password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={form.confirm_password}
                onChange={handleChange}
                placeholder="تأكيد كلمة السر"
                required
                style={{ paddingRight: '36px' }}
              />
              <span className="eye-icon" onClick={toggleConfirmPasswordVisibility} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}>
                <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
              </span>
            </div>
          </div>
          {form.password && (
            <div className={passwordStrength === 'strong' ? 'password-strong' : 'password-weak'} style={{ fontSize: '0.9em', marginBottom: '8px', color: passwordStrength === 'strong' ? 'green' : 'red' }}>
              {passwordStrength === 'strong' ? 'كلمة السر قوية' : 'كلمة السر ضعيفة'}
            </div>
          )}
          <button type="submit" className="submit-btn" disabled={loading}>{loading ? 'جاري التسجيل...' : 'تسجيل'}</button>
        </form>
        <div style={{ textAlign: 'left', marginTop: '8px' }}>
          <button type="button" className="forgot-password-btn" style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', padding: 0 }}>نسيت كلمة السر؟</button>
        </div>
      </div>
    </div>
  );
});

PatientRegisterModal.displayName = 'PatientRegisterModal';

export default PatientRegisterModal; 