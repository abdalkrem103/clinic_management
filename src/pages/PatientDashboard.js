import React, {useState, useEffect, useCallback} from 'react';
import {appointmentsAPI, paymentsAPI} from '../api/api';
import '../styles/PatientDashboard.css';

const PatientDashboard = () => {
  const [patient,
    setPatient] = useState(null);
  const [appointments,
    setAppointments] = useState([]);
  const [payments,
    setPayments] = useState([]);
  const [loading,
    setLoading] = useState(true);
  const [error,
    setError] = useState('');

  const patientData = JSON.parse(localStorage.getItem('patient'));

  const fetchData = useCallback(async () => {
    if (!patientData?.id) {
      setError('لا يمكن العثور على بيانات المريض.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [appointmentsRes,
        paymentsRes] = await Promise.all([
        appointmentsAPI.getAppointmentsByPatient(patientData.id),
        paymentsAPI.getByPatientId(patientData.id)
      ]);

      if (appointmentsRes.data.success) {
        setAppointments(appointmentsRes.data.data);
      } else {
        throw new Error('فشل في جلب المواعيد');
      }

      if (paymentsRes.data.success) {
        setPayments(paymentsRes.data.data);
      } else {
        throw new Error('فشل في جلب المدفوعات');
      }

      setPatient(patientData);
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء تحميل البيانات.');
    } finally {
      setLoading(false);
    }
  }, [patientData?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancelAppointment = async (appointmentId) => {
    if (window.confirm('هل أنت متأكد من رغبتك في إلغاء هذا الموعد؟')) {
      try {
        // ملاحظة: نفترض أن `cancelAppointment` هو الإجراء الصحيح في الواجهة الخلفية
        await appointmentsAPI.cancelAppointment(appointmentId);
        setAppointments(prev => prev.filter(app => app.id !== appointmentId));
        alert('تم إلغاء الموعد بنجاح.');
      } catch (err) {
        setError('فشل في إلغاء الموعد. يرجى المحاولة مرة أخرى.');
      }
    }
  };

  if (loading) return <div className="loading-container">جاري تحميل البيانات...</div>;
  if (error) return <div className="error-container">{error}</div>;
  if (!patient) return <div className="error-container">لم يتم العثور على بيانات المريض.</div>;

  return (
    <div className="patient-dashboard">
      <header className="dashboard-header">
        <h1>مرحباً, {patient.first_name} {patient.last_name}</h1>
        <p>هنا يمكنك إدارة معلوماتك الصحية في عيادتنا.</p>
      </header>

      <div className="dashboard-content">
        <section className="profile-section card">
          <h2>ملفي الشخصي</h2>
          <div className="profile-details">
            <p><strong>الاسم:</strong> {patient.first_name} {patient.last_name}</p>
            <p><strong>البريد الإلكتروني:</strong> {patient.email}</p>
            <p><strong>رقم الهاتف:</strong> {patient.phone_number}</p>
            <p><strong>تاريخ الميلاد:</strong> {patient.date_of_birth}</p>
            <p><strong>الجنس:</strong> {patient.gender === 'male' ? 'ذكر' : 'أنثى'}</p>
          </div>
        </section>

        <section className="appointments-section card">
          <h2>مواعيــدي</h2>
          <div className="table-responsive">
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>الطبيب</th>
                  <th>التاريخ</th>
                  <th>الوقت</th>
                  <th>الحالة</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length > 0 ? appointments.map(app => (
                  <tr key={app.id}>
                    <td>{app.doctor_name}</td>
                    <td>{new Date(app.appointment_date).toLocaleDateString('ar-EG')}</td>
                    <td>{new Date(`1970-01-01T${app.appointment_time}`).toLocaleTimeString('ar-EG', {hour: 'numeric',
                      minute: 'numeric',
                      hour12: true})}</td>
                    <td><span className={`status-badge status-${app.status}`}>{app.status}</span></td>
                    <td>
                      { (app.status === 'confirmed' || app.status === 'pending') &&
                                                <button className="btn-cancel" onClick={() => handleCancelAppointment(app.id)}>
                                                    إلغاء
                                                </button>
                      }
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5">لا توجد مواعيد حالياً.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="payments-section card">
          <h2>مدفوعاتي</h2>
          <div className="table-responsive">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>المبلغ الإجمالي</th>
                  <th>المبلغ المدفوع</th>
                  <th>المتبقي</th>
                  <th>طريقة الدفع</th>
                </tr>
              </thead>
              <tbody>
                {payments.length > 0 ? payments.map(p => (
                  <tr key={p.id}>
                    <td>{new Date(p.created_at).toLocaleDateString('ar-EG')}</td>
                    <td>{p.total_amount}</td>
                    <td>{p.paid_amount}</td>
                    <td>{p.total_amount - p.paid_amount}</td>
                    <td>{p.payment_method}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5">لا توجد سجلات دفع.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PatientDashboard;
