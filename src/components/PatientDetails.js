import React, {useState, useEffect} from 'react';
import {useParams} from 'react-router-dom';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faUser, faFileMedicalAlt, faTooth, faStethoscope} from '@fortawesome/free-solid-svg-icons';
import XRayAnalysis from './XRayAnalysis';
import {patientsAPI, appointmentsAPI} from '../api/api';
import '../styles/PatientDetails.css';
import DentalChart from './DentalChart';

const PatientDetails = () => {
  const {id} = useParams();
  const [patient,
    setPatient] = useState(null);
  const [loading,
    setLoading] = useState(true);
  const [error,
    setError] = useState(null);
  const [activeTab,
    setActiveTab] = useState('info');
  const [medicalHistory,
    setMedicalHistory] = useState([]);

  useEffect(() => {
    const fetchPatientData = async () => {
      setLoading(true);
      try {
        const [patientResponse,
          appointmentResponse] = await Promise.all([
          patientsAPI.getById(id),
          appointmentsAPI.getAll({action: 'getAppointmentsByPatient',
            patient_id: id})
        ]);

        if (patientResponse.data.success) {
          const patientData = patientResponse.data.data;
          const appointmentData = appointmentResponse.data.data || [];

          const sortedAppointments = appointmentData.sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));

          const history = sortedAppointments.map(appointment => ({
            id: appointment.id,
            date: appointment.appointment_date,
            type: 'appointment',
            data: {
              time: appointment.appointment_time || '-',
              doctor: appointment.doctor_name || 'غير محدد',
              status: appointment.status || 'pending',
              diagnosis: appointment.diagnosis || null,
              notes: appointment.notes || null,
              prescription: appointment.prescription || null
            }
          }));

          history.sort((a, b) => new Date(b.date) - new Date(a.date));

          setPatient({
            ...patientData,
            next_appointment: sortedAppointments.find(a => new Date(a.appointment_date) >= new Date()) || null
          });
          setMedicalHistory(history);
        } else {
          throw new Error(patientResponse.data.message || 'فشل في جلب بيانات المريض');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching patient data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [id]);

  const renderInfoTab = () => (
    <div className="info-grid">
      <div className="info-card">
        <h4>المعلومات الشخصية</h4>
        <p><strong>الاسم:</strong> {patient.first_name} {patient.last_name}</p>
        <p><strong>رقم الهاتف:</strong> {patient.phone_number}</p>
        <p><strong>البريد الإلكتروني:</strong> {patient.email || '-'}</p>
        <p><strong>العنوان:</strong> {patient.address || '-'}</p>
      </div>
      <div className="info-card">
        <h4>المعلومات الطبية</h4>
        <p><strong>تاريخ الميلاد:</strong> {patient.date_of_birth || '-'}</p>
        <p><strong>الجنس:</strong> {patient.gender || '-'}</p>
        <p><strong>فصيلة الدم:</strong> {patient.blood_type || '-'}</p>
        <p><strong>الحساسية:</strong> {patient.allergies || 'لا يوجد'}</p>
      </div>
      {patient.next_appointment && (
        <div className="info-card">
          <h4>الموعد القادم</h4>
          <p><strong>التاريخ:</strong> {patient.next_appointment.appointment_date}</p>
          <p><strong>الوقت:</strong> {patient.next_appointment.appointment_time}</p>
          <p><strong>الحالة:</strong> <span className={`status ${patient.next_appointment.status}`}>{patient.next_appointment.status}</span></p>
        </div>
      )}
      <div className="info-card">
        <h4>الرصيد المالي</h4>
        <p><strong>الإجمالي:</strong> {patient.total_amount || 0} SAR</p>
        <p><strong>المدفوع:</strong> {patient.paid_amount || 0} SAR</p>
        <p><strong>المتبقي:</strong> <span className="remaining-balance">{patient.remaining_amount || 0}</span> SAR</p>
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="history-timeline">
      {medicalHistory.length > 0 ? medicalHistory.map((item) => (
        <div className="timeline-item" key={item.id}>
          <div className="timeline-dot" />
          <div className="timeline-content">
            <div className="timeline-header">
              <span className="timeline-date">{new Date(item.date).toLocaleDateString('ar-SA', {day: 'numeric',
                month: 'long',
                year: 'numeric'})}</span>
              <span className={`status ${item.data.status}`}>{item.data.status}</span>
            </div>
            <div className="timeline-body">
              <h5>موعد مع الطبيب: {item.data.doctor}</h5>
              <p><strong>التشخيص:</strong> {item.data.diagnosis || 'لم يتم التشخيص بعد'}</p>
              <p><strong>الملاحظات:</strong> {item.data.notes || 'لا توجد'}</p>
              {item.data.prescription && <p><strong>الوصفة الطبية:</strong> {item.data.prescription}</p>}
            </div>
          </div>
        </div>
      )) : <p>لا يوجد سجل طبي لعرضه.</p>}
    </div>
  );

  if (loading) return <div className="loading">جاري تحميل البيانات...</div>;
  if (error) return <div className="error">خطأ: {error}</div>;
  if (!patient) return <div className="no-data">لم يتم العثور على بيانات المريض</div>;

  const tabs = [
    {id: 'info',
      label: 'المعلومات الأساسية',
      icon: faUser},
    {id: 'history',
      label: 'السجل الطبي',
      icon: faStethoscope},
    {id: 'xray',
      label: 'تحليل الأشعة',
      icon: faFileMedicalAlt},
    {id: 'dental',
      label: 'خريطة الأسنان',
      icon: faTooth}
  ];

  return (
    <div className="patient-details-container">
      <div className="patient-details-header">
        <h1>{patient.first_name} {patient.last_name}</h1>
      </div>

      <div className="details-tabs">
        {tabs.map(tab => (
          <button className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} key={tab.id} onClick={() => setActiveTab(tab.id)}>
            <FontAwesomeIcon icon={tab.icon} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="tab-content-area">
        {activeTab === 'info' && renderInfoTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'xray' && <XRayAnalysis patientId={id} />}
        {activeTab === 'dental' && <DentalChart patientId={id} />}
      </div>
    </div>
  );
};

export default PatientDetails;
