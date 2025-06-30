import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ClinicPublic.css';
import AppointmentSystem from '../components/AppointmentSystem';
import { doctorsAPI, servicesAPI } from '../api/api';
import PatientRegisterModal from '../components/PatientRegisterModal';
import PatientLoginModal from '../components/PatientLoginModal';

const ClinicPublic = () => {
  const [showBooking, setShowBooking] = useState(false);
  const [services, setServices] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [patient, setPatient] = useState(null);
  const navigate = useNavigate();
  const modalRef = useRef(null);

  // تحميل بيانات المريض من localStorage عند بدء التطبيق
  useEffect(() => {
    try {
      const patientData = localStorage.getItem('patient');
      if (patientData) {
        const parsedPatient = JSON.parse(patientData);
        setPatient(parsedPatient);
      }
    } catch (error) {
      console.error('Error parsing patient data from localStorage:', error);
      localStorage.removeItem('patient');
    }
  }, []);

  // مراقبة تغييرات الموديلات لضمان عدم وجود تضارب في DOM
  useEffect(() => {
    if (showLogin && showRegister) {
      // إذا كان كلا الموديلين مفتوحين، أغلق واحد منهما
      setShowRegister(false);
    }
  }, [showLogin, showRegister]);

  // تنظيف الموديلات عند إغلاقها
  useEffect(() => {
    return () => {
      setShowLogin(false);
      setShowRegister(false);
      setShowBooking(false);
    };
  }, []);

  // مراقبة تغييرات المريض وإغلاق الموديلات عند تسجيل الدخول
  useEffect(() => {
    if (patient) {
      setShowLogin(false);
      setShowRegister(false);
    }
  }, [patient]);

  // مراقبة تغييرات الموديلات وإغلاقها بشكل صحيح
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowLogin(false);
        setShowRegister(false);
      }
    };

    if (showLogin || showRegister) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showLogin, showRegister]);

  // مراقبة تغييرات الموديلات وإغلاقها بشكل صحيح
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        if (showLogin) setShowLogin(false);
        if (showRegister) setShowRegister(false);
      }
    };

    if (showLogin || showRegister) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLogin, showRegister]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const [servicesResult, doctorsResult] = await Promise.allSettled([
        servicesAPI.getAll(),
        doctorsAPI.getAll()
      ]);

      if (servicesResult.status === 'fulfilled') {
        const servicesData = servicesResult.value.data;
        if (servicesData.success) {
          setServices(servicesData.data || []);
        } else {
          throw new Error(servicesData.message || 'فشل في جلب الخدمات');
        }
      } else {
        throw new Error('فشل في الاتصال بخدمة الخدمات');
      }

      if (doctorsResult.status === 'fulfilled') {
        const doctorsData = doctorsResult.value.data;
        if (doctorsData.success) {
          setDoctors(doctorsData.data || []);
        } else {
          throw new Error(doctorsData.message || 'فشل في جلب بيانات الأطباء');
        }
      } else {
        throw new Error('فشل في الاتصال بخدمة الأطباء');
      }

      setRetryCount(0);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'حدث خطأ في تحميل البيانات');
      
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  }, [retryCount, MAX_RETRIES]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRetry = useCallback(() => {
    setRetryCount(0); // إعادة تعيين عداد المحاولات
    fetchData(); // إعادة محاولة جلب البيانات
  }, [fetchData]);

  const handleLogin = useCallback((data) => {
    console.log("ClinicPublic: Received patient data in handleLogin:", data);
    localStorage.setItem('patient', JSON.stringify(data));
    setPatient(data);
    setShowLogin(false);
  }, []);

  const handleRegister = useCallback((data) => {
    console.log("ClinicPublic: Received patient data in handleRegister:", data);
    localStorage.setItem('patient', JSON.stringify(data));
    setPatient(data);
    setShowRegister(false);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('patient');
    setPatient(null);
    navigate('/clinic'); // العودة للصفحة الرئيسية بعد الخروج
  }, [navigate]);

  const goToPatientDashboard = useCallback(() => {
    navigate('/patient-dashboard');
  }, [navigate]);

  const closeRegisterModal = useCallback(() => {
    setShowRegister(false);
  }, []);

  const closeLoginModal = useCallback(() => {
    setShowLogin(false);
  }, []);

  const openLoginModal = useCallback(() => {
    setShowLogin(true);
  }, []);

  return (
    <div className="clinic-public" ref={modalRef}>
      <header className="clinic-header">
        <div className="header-top">
          {!patient ? (
            <div className="auth-buttons">
              <button className="login-btn" onClick={openLoginModal}>
                <i className="fas fa-sign-in-alt"></i> تسجيل الدخول
              </button>
              <button className="register-btn" onClick={() => setShowRegister(true)}>
                <i className="fas fa-user-plus"></i> تسجيل جديد
              </button>
            </div>
          ) : (
            <div className="patient-info">
              <button className="logout-btn" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i> تسجيل الخروج
              </button>
              <button className="patient-dashboard-btn" onClick={goToPatientDashboard}>
                <i className="fas fa-user-circle"></i>
                <span>حسابي</span>
              </button>
            </div>
          )}
        </div>
        <div className="header-content">
            <h1>عيادة الأسنان المتخصصة</h1>
            <p>نقدم أفضل رعاية طبية لأسنانكم</p>
        </div>
      </header>
      <div className="divider"></div>

      {showRegister && <PatientRegisterModal key="register-modal" onClose={closeRegisterModal} onRegister={handleRegister} />}
      {showLogin && <PatientLoginModal key="login-modal" onClose={closeLoginModal} onLogin={handleLogin} />}

      {loading ? (
        <div className="loading-container">
          <div className="loading">جاري تحميل البيانات...</div>
          {retryCount > 0 && (
            <p className="retry-message">محاولة {retryCount} من {MAX_RETRIES}</p>
          )}
        </div>
      ) : error ? (
        <div className="error-container">
          <div className="error-message">{error}</div>
          {retryCount < MAX_RETRIES ? (
            <p className="retry-message">سيتم إعادة المحاولة تلقائياً...</p>
          ) : (
            <button className="retry-button" onClick={handleRetry}>
              إعادة المحاولة
            </button>
          )}
        </div>
      ) : (
        <>
          <section className="services-section">
            <h2>خدماتنا</h2>
            <div className="services-grid">
              {services.map(service => (
                <div key={service.id} className="service-card">
                  <i className="fas fa-tooth"></i>
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="doctors-section">
            <h2>أطباؤنا المتخصصون</h2>
            <div className="doctors-grid">
              {doctors.map(doctor => (
                <div key={doctor.id} className="doctor-card">
                  <img src={'/images/doctor.jpg'} alt={doctor.name} className="doctor-image" />
                  <h3>{doctor.name}</h3>
                  <p className="specialty">{doctor.specialty}</p>
                  <p className="experience">خبرة: {doctor.experience} سنوات</p>
                  <p className="working-hours">ساعات العمل: {doctor.working_hours}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="booking-section">
            <h2>حجز موعد</h2>
            {!showBooking ? (
              <div className="booking-intro">
                <p>للحجز، اضغط على الزر أدناه:</p>
                <div className="booking-options">
                  <button
                    className="book-btn pulse-button"
                    onClick={() => {
                      if (!patient) setShowLogin(true);
                      else setShowBooking(true);
                    }}
                  >
                    احجز موعدا الآن
                  </button>
                </div>
              </div>
            ) : (
              <AppointmentSystem
                services={services}
                doctors={doctors}
                patient={patient}
                onClose={() => setShowBooking(false)}
              />
            )}
          </section>

          <section className="contact-section">
            <h2>تواصل معنا</h2>
            <div className="contact-info">
              <div className="contact-card">
                <i className="fas fa-phone"></i>
                <h3>اتصل بنا</h3>
                <p>123-456-789</p>
              </div>
              <div className="contact-card">
                <i className="fas fa-envelope"></i>
                <h3>راسلنا</h3>
                <p>clinic@example.com</p>
              </div>
              <div className="contact-card">
                <i className="fas fa-location-dot"></i>
                <h3>موقعنا</h3>
                <p>شارع الرئيسي، المدينة</p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default ClinicPublic; 