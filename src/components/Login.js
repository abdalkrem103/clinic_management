import React, {useState, useEffect} from 'react';
import {authAPI} from '../api/api';
import '../styles/Login.css';

const Login = () => {
  const [credentials,
    setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error,
    setError] = useState('');
  const [loading,
    setLoading] = useState(false);

  useEffect(() => {
    // التحقق من وجود جلسة نشطة فقط من localStorage
    if (localStorage.getItem('token')) {
      window.location.href = '/dashboard';
    }
  }, []);

  const handleInputChange = (e) => {
    const {name, value} = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', credentials);
      const response = await authAPI.login(credentials);
      console.log('Login response:', response);

      if (response.data.success) {
        // حفظ التوكن ومعلومات المستخدم
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        console.log('Login successful, redirecting to dashboard...');
        window.location.href = '/dashboard';
      } else {
        console.error('Login failed:', response.data);
        setError(response.data.message || 'فشل تسجيل الدخول');
      }
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      if (error.response) {
        // الخادم استجاب مع حالة خطأ
        setError(error.response.data.message || 'فشل تسجيل الدخول');
      } else if (error.request) {
        // تم إرسال الطلب ولكن لم يتم استلام استجابة
        setError('لا يمكن الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت');
      } else {
        // حدث خطأ أثناء إعداد الطلب
        setError('حدث خطأ أثناء تسجيل الدخول');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>تسجيل الدخول</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">اسم المستخدم</label>
            <input
              id="username"
              name="username"
              onChange={handleInputChange}
              placeholder="أدخل اسم المستخدم"
              required
              type="text"
              value={credentials.username}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">كلمة المرور</label>
            <input
              id="password"
              name="password"
              onChange={handleInputChange}
              placeholder="أدخل كلمة المرور"
              required
              type="password"
              value={credentials.password}
            />
          </div>
          <button
            className="login-btn"
            disabled={loading}
            type="submit"
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
