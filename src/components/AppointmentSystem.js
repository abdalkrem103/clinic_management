import React, {useState, useCallback, useEffect} from 'react';
import '../styles/AppointmentSystem.css';
import {appointmentsAPI, patientsAPI} from '../api/api';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

// إضافة دالة مساعدة لتنسيق الوقت
const formatTime = (timeString) => {
  const [hours,
    minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'م' : 'ص';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
};

const AppointmentSystem = ({isAdmin = false, services = [], doctors = [], onClose = null, patient = null}) => {
  console.log('AppointmentSystem: Received patient prop:', patient);
  const [formData,
    setFormData] = useState({
    patient_first_name: '',
    patient_last_name: '',
    patient_phone: '',
    doctor_id: '',
    appointment_id: '',
    birth_date: '',
    gender: '',
    appointment_date: ''
  });

  const [availableAppointments,
    setAvailableAppointments] = useState([]);
  const [loading,
    setLoading] = useState(false);
  const [error,
    setError] = useState('');
  const [selectedSlot,
    setSelectedSlot] = useState(null); // This now represents the schedule_slot_id
  const [selectedDoctor,
    setSelectedDoctor] = useState(null);
  const [showCalendar,
    setShowCalendar] = useState(false);
  const [selectedDate,
    setSelectedDate] = useState(new Date());
  const [bookedDates,
    setBookedDates] = useState([]);
  const [isNewPatient,
    setIsNewPatient] = useState(true);
  const [selectedPatient,
    setSelectedPatient] = useState(null);
  const [patientSearchQuery,
    setPatientSearchQuery] = useState(''); // New state for patient search input
  const [patientSearchResults,
    setPatientSearchResults] = useState([]); // New state for search results
  const [showPatientSearchResults,
    setShowPatientSearchResults] = useState(false); // Control visibility of search results
  const [successMessage,
    setSuccessMessage] = useState('');

  useEffect(() => {
    console.log('AppointmentSystem useEffect: patient prop changed to:', patient);
    if (patient) {
      setFormData(prev => ({
        ...prev,
        patient_first_name: patient.first_name || '',
        patient_last_name: patient.last_name || '',
        patient_phone: patient.phone_number || '',
        birth_date: patient.date_of_birth || '',
        gender: patient.gender || ''
      }));
      setSelectedPatient(patient);
      setIsNewPatient(false); // المريض مسجل الدخول، لذا ليس مريضًا جديدًا
    } else {
      setIsNewPatient(true);
    }
  }, [patient]);

  // جلب المواعيد المحجوزة للطبيب
  const fetchBookedDates = useCallback(async (doctorId) => {
    if (!doctorId) return;

    try {
      const response = await appointmentsAPI.getBookedDates(doctorId);
      if (response.data.success) {
        setBookedDates(response.data.data.map(date => new Date(date)));
      }
    } catch (error) {
      console.error('Error fetching booked dates:', error);
    }
  }, []);

  // جلب المواعيد المتاحة للطبيب والتاريخ المحددين (والآن يشمل الحالة)
  const fetchAvailableAppointments = useCallback(async (doctorId, date) => {
    if (!doctorId || !date) {
      console.log('fetchAvailableAppointments: Missing doctorId or date.', {doctorId,
        date});
      setAvailableAppointments([]);
      setSelectedSlot(null);
      return;
    }
    try {
      setLoading(true);
      setError('');

      const response = await appointmentsAPI.getDoctorSlotsAndStatus(doctorId, date);

      if (response.data.success) {
        console.log('Raw backend response data:', response.data.data); // سجل البيانات الخام المستلمة
        const slotsWithDate = response.data.data.map(slot => ({
          ...slot,
          appointment_date: date, // إضافة تاريخ الموعد إلى كل slot
          appointment_time: slot.appointment_time // تصحيح: استخدام slot.appointment_time
        }));
        console.log('Available appointments (after map):', slotsWithDate);
        setAvailableAppointments(slotsWithDate || []);
      } else {
        setError(response.data.message || 'فشل في جلب المواعيد المتاحة');
        setAvailableAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching available appointments:', error);
      setError('فشل في الاتصال بالخادم أو جلب المواعيد المتاحة.');
      setAvailableAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDoctorSelect = (doctorId) => {
    setSelectedDoctor(doctorId);
    setFormData(prev => ({...prev,
      doctor_id: doctorId}));
    setSelectedSlot(null);
    fetchBookedDates(doctorId);
  };

  const handleDateSelect = (date) => {
    const formattedDate = date.toISOString().split('T')[0];
    setSelectedDate(date);
    setFormData(prev => ({...prev,
      appointment_date: formattedDate}));
    setShowCalendar(false);
    if (selectedDoctor) {
      fetchAvailableAppointments(selectedDoctor, formattedDate);
    }
  };

  const handleSlotSelect = (slot) => {
    // فقط قم بتحديد الموعد المختار في الحالة
    setSelectedSlot(slot);
    // مسح أي رسائل خطأ أو نجاح سابقة
    setError('');
    setSuccessMessage('');
  };

  const handlePatientSearchInputChange = async (e) => {
    const query = e.target.value;
    setPatientSearchQuery(query);

    if (query.length > 2) { // بحث بعد 2 حرف على الأقل
      try {
        const response = await patientsAPI.search({name: query}); // البحث بالاسم
        if (response.data.success) {
          setPatientSearchResults(response.data.data || []);
          setShowPatientSearchResults(true);
        } else {
          setPatientSearchResults([]);
          setShowPatientSearchResults(false);
        }
      } catch (error) {
        console.error('Error searching patients:', error);
        setPatientSearchResults([]);
        setShowPatientSearchResults(false);
      }
    } else {
      setPatientSearchResults([]);
      setShowPatientSearchResults(false);
    }
  };

  const handleSelectPatientFromSearch = (patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({
      ...prev,
      patient_first_name: patient.first_name || '',
      patient_last_name: patient.last_name || '',
      patient_phone: patient.phone_number || '',
      birth_date: patient.date_of_birth || '',
      gender: patient.gender || ''
    }));
    setIsNewPatient(false); // المريض موجود
    setPatientSearchQuery(''); // مسح حقل البحث
    setPatientSearchResults([]); // مسح النتائج
    setShowPatientSearchResults(false); // إخفاء النتائج
  };

  const handleClearSelectedPatient = () => {
    setSelectedPatient(null);
    setIsNewPatient(true);
    setFormData(prev => ({
      ...prev,
      patient_first_name: '',
      patient_last_name: '',
      patient_phone: '',
      birth_date: '',
      gender: ''
    }));
  };

  const handleBookingConfirmation = async () => {
    if (!selectedSlot) {
      setError('يرجى اختيار موعد أولاً.');
      return;
    }

    // استدعاء دالة الحجز الفعلية
    await handleSubmit();
  };

  const handleSubmit = async () => {
    console.log('handleSubmit called.');
    console.log('Selected patient:', patient || selectedPatient);
    console.log('Selected slot:', selectedSlot);

    if (!selectedSlot || !patient) {
      setError('يرجى اختيار الموعد والمريض أولاً');
      return;
    }

    // التحقق من بيانات المريض
    if (!selectedPatient && (!formData.patient_first_name || !formData.patient_last_name || !formData.patient_phone || !formData.birth_date || !formData.gender)) {
      setError('يرجى إدخال جميع بيانات المريض المطلوبة أو اختيار مريض مسجل.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let currentPatientId = null;

      // 1. تحديد معرف المريض: إذا كان المريض مسجل دخول (online) أو تم اختياره (admin)
      if (patient) {
        currentPatientId = patient.id;
        console.log('Logged in patient ID:', currentPatientId);
      } else if (selectedPatient && isAdmin) { // إذا تم اختيار مريض من البحث في وضع الإدارة
        currentPatientId = selectedPatient.id;
        console.log('Selected existing patient ID (Admin mode):', currentPatientId);
      } else { // إذا كان مريض جديد (في وضع Admin) أو لم يتم اختيار مريض مسجل الدخول
        // التحقق من وجود مريض بنفس رقم الهاتف قبل الإضافة
        try {
          const searchResponse = await patientsAPI.search({phone_number: formData.patient_phone.trim()});
          if (searchResponse.data.success && searchResponse.data.data && searchResponse.data.data.length > 0) {
            const foundPatient = searchResponse.data.data.find(p => p.phone_number === formData.patient_phone.trim());
            if (foundPatient) {
              currentPatientId = foundPatient.id;
              console.log('Existing patient found via phone search (New Patient mode):', currentPatientId);
            } else {
              console.log('Patient not found by exact phone number in search results. Proceeding with new patient creation.');
            }
          }
        } catch (searchError) {
          console.error('Error during patient search (for new patient check):', searchError);
        }

        // 2. إضافة مريض جديد إذا لم يتم العثور عليه
        if (currentPatientId === null) {
          const patientData = {
            first_name: formData.patient_first_name.trim(),
            last_name: formData.patient_last_name.trim(),
            phone_number: formData.patient_phone.trim(),
            date_of_birth: formData.birth_date,
            gender: formData.gender
          };
          const addPatientResponse = await patientsAPI.add(patientData);
          if (addPatientResponse.data.success) {
            currentPatientId = addPatientResponse.data.data.id;
          } else {
            throw new Error(addPatientResponse.data.message || 'فشل في إضافة المريض.');
          }
        }
      }

      // التأكد من وجود patient_id قبل المتابعة للحجز
      if (!currentPatientId) {
        setError('فشل في تحديد معرف المريض.');
        setLoading(false);
        return;
      }

      // 3. حجز الموعد
      const appointmentData = {
        patient_id: currentPatientId,
        appointment_id: selectedSlot.schedule_slot_id, // هذا هو doctor_schedule_slot_id
        doctor_id: selectedSlot.doctor_id,
        appointment_date: selectedSlot.appointment_date, // استخدام التاريخ من selectedSlot
        appointment_time: selectedSlot.appointment_time, // استخدام الوقت من selectedSlot
        status: 'confirmed',
        notes: ''
      };

      const response = await appointmentsAPI.add(appointmentData);
      console.log('AppointmentSystem: Data sent to backend:', appointmentData);

      if (response.data.success) {
        // إظهار رسالة نجاح مع تفاصيل الحجز
        const successMessage = `\n          تم حجز الموعد بنجاح!\n          التاريخ: ${selectedSlot.appointment_date}\n          الوقت: ${selectedSlot.appointment_time}\n          الطبيب: ${doctors.find(d => d.id === selectedSlot.doctor_id)?.name}\n        `;
        alert(successMessage);

        // إعادة تعيين النموذج
        setFormData({
          patient_first_name: '',
          patient_last_name: '',
          patient_phone: '',
          doctor_id: '',
          appointment_id: '',
          birth_date: '',
          gender: '',
          appointment_date: ''
        });
        setSelectedSlot(null);
        setSelectedDoctor(null);
        setAvailableAppointments([]);
        setSelectedPatient(null); // مسح المريض المختار
        setIsNewPatient(true);
        setPatientSearchQuery('');
        setPatientSearchResults([]);
        setShowPatientSearchResults(false);

        if (onClose) {
          onClose();
        }
        setSuccessMessage('تم تأكيد حجز الموعد بنجاح!');
      } else {
        throw new Error(response.data.message || 'فشل في حجز الموعد.');
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError(`فشل في تأكيد الحجز. ${error.response?.data?.message || error.message}`);
      setSuccessMessage('');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const {name, value} = e.target;
    setFormData(prev => ({...prev,
      [name]: value}));
  };

  // تحديث المواعيد المتاحة عند تغيير الطبيب أو التاريخ
  useEffect(() => {
    if (formData.doctor_id && formData.appointment_date) {
      fetchAvailableAppointments(formData.doctor_id, formData.appointment_date);
    }
  }, [formData.doctor_id,
    formData.appointment_date,
    fetchAvailableAppointments]);

  // تعديل طريقة عرض المواعيد المتاحة في الواجهة
  const renderAvailableSlots = () => {
    if (loading) return <div className="loading">جاري تحميل المواعيد المتاحة...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!availableAppointments.length) return <div className="no-slots">لا توجد مواعيد متاحة في هذا اليوم</div>;

    return (
      <div className="time-slots">
        {availableAppointments.map((slot, index) => {
          const isBooked = slot.status === 'booked';
          const slotKey = `${slot.schedule_slot_id}_${slot.appointment_time}_${index}`;

          return (
            <button
              className={`time-slot ${selectedSlot?.schedule_slot_id === slot.schedule_slot_id ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
              disabled={isBooked}
              key={slotKey}
              onClick={() => !isBooked && handleSlotSelect(slot)}
            >
              {formatTime(slot.appointment_time)}
              {isBooked && <span className="booked-label">محجوز</span>}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="online-appointments-container">
      <h1>حجز موعد عبر الإنترنت</h1>

      {/* قسم معلومات الأطباء */}
      <div className="doctors-section">
        <h2>أطباؤنا المتخصصون</h2>
        <div className="doctors-grid">
          {doctors.map((doctor) => (
            <div className="doctor-card" key={doctor.id}>
              <img alt={doctor.name} className="doctor-image" src={'/images/doctor.jpg'} />
              <h3>{doctor.name}</h3>
              <p className="specialty">{doctor.specialty}</p>
              <p className="experience">خبرة: {doctor.experience} سنوات</p>
              <p className="working-hours">
                ساعات العمل: {doctor.working_hours}
              </p>
              <button
                className={`select-doctor-btn ${formData.doctor_id === doctor.id ? 'selected' : ''}`}
                onClick={() => handleDoctorSelect(doctor.id)}
              >
                {formData.doctor_id === doctor.id ? 'تم الاختيار' : 'اختر هذا الطبيب'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* نموذج الحجز */}
      <form className="appointment-form" onSubmit={handleSubmit}>
        {selectedDoctor && (
          <div className="date-selection">
            <h3>اختر التاريخ</h3>
            <div className="calendar-container">
              <button
                className="date-picker-button"
                onClick={() => setShowCalendar(!showCalendar)}
                type="button"
              >
                {formData.appointment_date || 'اختر التاريخ'}
              </button>
              {showCalendar && (
                <div className="calendar-popup">
                  <Calendar
                    minDate={new Date()}
                    onChange={handleDateSelect}
                    tileDisabled={({date}) => bookedDates.some(bookedDate =>
                      bookedDate.toDateString() === date.toDateString()
                    )}
                    value={selectedDate}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {selectedDoctor && selectedDate && (
          <div className="confirmation-section">
            {renderAvailableSlots()}
            {selectedSlot && (
              <button
                className="confirm-booking-btn"
                disabled={loading}
                onClick={handleBookingConfirmation}
              >
                {loading ? 'جاري التأكيد...' : 'تأكيد الحجز'}
              </button>
            )}
            {successMessage && <div className="success-message">{successMessage}</div>}
          </div>
        )}

        {/* بيانات المريض */}
        <div className="patient-details">
          <h3>بيانات المريض</h3>
          {isAdmin && (
            <div className="patient-search-area">
              <input
                onChange={handlePatientSearchInputChange}
                placeholder="ابحث عن مريض بالاسم أو رقم الهاتف"
                type="text"
                value={patientSearchQuery}
              />
              {showPatientSearchResults && patientSearchResults.length > 0 && (
                <ul className="patient-search-results">
                  {patientSearchResults.map(p => (
                    <li key={p.id} onClick={() => handleSelectPatientFromSearch(p)}>
                      {p.first_name} {p.last_name} ({p.phone_number})
                    </li>
                  ))}
                </ul>
              )}
              {selectedPatient && (
                <div className="selected-patient-info">
                  <p>المريض المختار: <strong>{selectedPatient.first_name} {selectedPatient.last_name} ({selectedPatient.phone_number})</strong></p>
                  <button className="clear-selected-patient-btn" onClick={handleClearSelectedPatient} type="button">مسح الاختيار</button>
                </div>
              )}
              {!selectedPatient && <p className="search-instructions">أو أدخل بيانات مريض جديد أدناه:</p>}
            </div>
          )}

          <div className="patient-input-section">
            <div className="form-group">
              <label>الاسم الأول</label>
              <input
                disabled={!!patient || (isAdmin && !!selectedPatient)} // تعطيل إذا كان المريض مسجل الدخول أو تم اختياره من البحث
                name="patient_first_name"
                onChange={handleInputChange}
                placeholder="الاسم الأول للمريض"
                required={isNewPatient} // مطلوب فقط إذا كان مريض جديد
                type="text"
                value={formData.patient_first_name}
              />
            </div>
            <div className="form-group">
              <label>الاسم الأخير</label>
              <input
                disabled={!!patient || (isAdmin && !!selectedPatient)} // تعطيل إذا كان المريض مسجل الدخول أو تم اختياره من البحث
                name="patient_last_name"
                onChange={handleInputChange}
                placeholder="الاسم الأخير للمريض"
                required={isNewPatient} // مطلوب فقط إذا كان مريض جديد
                type="text"
                value={formData.patient_last_name}
              />
            </div>
            <div className="form-group">
              <label>رقم الهاتف</label>
              <input
                disabled={!!patient || (isAdmin && !!selectedPatient)} // تعطيل إذا كان المريض مسجل الدخول أو تم اختياره من البحث
                name="patient_phone"
                onChange={handleInputChange}
                placeholder="رقم هاتف المريض"
                required={isNewPatient} // مطلوب فقط إذا كان مريض جديد
                type="text"
                value={formData.patient_phone}
              />
            </div>
            <div className="form-group">
              <label>تاريخ الميلاد</label>
              <input
                disabled={!!patient || (isAdmin && !!selectedPatient)} // تعطيل إذا كان المريض مسجل الدخول أو تم اختياره من البحث
                name="birth_date"
                onChange={handleInputChange}
                required={isNewPatient} // مطلوب فقط إذا كان مريض جديد
                type="date"
                value={formData.birth_date}
              />
            </div>
            <div className="form-group">
              <label>الجنس</label>
              <select
                disabled={!!patient || (isAdmin && !!selectedPatient)} // تعطيل إذا كان المريض مسجل الدخول أو تم اختياره من البحث
                name="gender"
                onChange={handleInputChange}
                required={isNewPatient} // مطلوب فقط إذا كان مريض جديد
                value={formData.gender}
              >
                <option value="">اختر الجنس</option>
                <option value="ذكر">ذكر</option>
                <option value="أنثى">أنثى</option>
              </select>
            </div>
          </div>
        </div>

        <button
          className="submit-button"
          disabled={loading || !selectedSlot || !formData.patient_first_name || !formData.patient_last_name || !formData.patient_phone || !formData.birth_date || !formData.gender}
          type="submit"
        >
          {loading ? 'جاري الحجز...' : 'حجز الموعد'}
        </button>

        {error && <div className="error-message">{error}</div>}
      </form>
    </div>
  );
};

export default AppointmentSystem;
