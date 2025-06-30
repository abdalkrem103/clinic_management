import React, {useState, useEffect} from 'react';
import {appointmentsAPI, doctorsAPI, patientsAPI} from '../api/api';
import '../styles/Appointments.css';

const Appointments = () => {
  const [appointments,
    setAppointments] = useState([]);
  const [loading,
    setLoading] = useState(true);
  const [error,
    setError] = useState('');
  const [showAddForm,
    setShowAddForm] = useState(false);
  const [editingAppointment,
    setEditingAppointment] = useState(null);
  const [searchQuery,
    setSearchQuery] = useState('');
  const [filterDate,
    setFilterDate] = useState('');
  const [filterStatus,
    setFilterStatus] = useState('confirmed');
  const [doctors,
    setDoctors] = useState([]);

  const [patientSearchInput,
    setPatientSearchInput] = useState('');
  const [patientSearchResults,
    setPatientSearchResults] = useState([]);
  const [selectedPatient,
    setSelectedPatient] = useState(null);

  const [selectedAppointmentDate,
    setSelectedAppointmentDate] = useState('');

  const [availableSlots,
    setAvailableSlots] = useState([]);
  const [selectedSlot,
    setSelectedSlot] = useState(null);

  const [newAppointment,
    setNewAppointment] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    status: 'pending',
    notes: '',
    patient_first_name: '',
    patient_last_name: '',
    patient_phone: '',
    birth_date: '',
    gender: ''
  });

  const [showEditModal,
    setShowEditModal] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await appointmentsAPI.getAll({action: 'getAllAppointments'});
      console.log('Appointments API Response:', response.data);
      if (response.data.success) {
        setAppointments(response.data.data);
      } else {
        setError(response.data.message || 'حدث خطأ في تحميل المواعيد');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError(error.response?.data?.message || 'حدث خطأ في تحميل المواعيد');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await doctorsAPI.getAll();
      if (response.data.success) {
        console.log('API Response Data:', response.data);
        console.log('Fetched doctors data:', response.data.data);
        setDoctors(response.data.data);
      } else {
        console.error('Failed to fetch doctors:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchAvailableSlots = async (doctorId, date) => {
    if (!doctorId || !date) {
      console.log('fetchAvailableSlots: Doctor ID or Date missing.', {doctorId,
        date});
      setAvailableSlots([]);
      setSelectedSlot(null);
      return;
    }
    try {
      console.log('fetchAvailableSlots: Fetching for doctor', doctorId, 'on date', date);
      const response = await appointmentsAPI.getDoctorSlotsAndStatus(doctorId, date);
      if (response.data.success) {
        console.log('fetchAvailableSlots: API call successful.', response.data.data);
        setAvailableSlots(response.data.data || []);
        setError('');
      } else {
        console.error('fetchAvailableSlots: API call failed.', response.data);
        console.error('Failed to fetch available slots:', response.data.message);
        setAvailableSlots([]);
        setSelectedSlot(null);
        setError(response.data.message || 'فشل في جلب المواعيد المتاحة');
      }
    } catch (error) {
      console.error('fetchAvailableSlots: Error during API call.', error);
      console.error('Error fetching available slots:', error);
      setAvailableSlots([]);
      setSelectedSlot(null);
      setError(error.response?.data?.message || 'حدث خطأ أثناء جلب المواعيد المتاحة');
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (showAddForm || showEditModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showAddForm,
    showEditModal]);

  const handlePatientSearch = async () => {
    if (!patientSearchInput.trim()) {
      setPatientSearchResults([]);
      setSelectedPatient(null);
      setNewAppointment(prev => ({
        ...prev,
        patient_first_name: '',
        patient_last_name: '',
        patient_phone: '',
        birth_date: '',
        gender: ''
      }));
      return;
    }
    try {
      setLoading(true);
      console.log('handlePatientSearch: Searching for', patientSearchInput);
      const response = await patientsAPI.search({
        name: patientSearchInput,
        phone_number: patientSearchInput
      });
      if (response.data.success) {
        console.log('handlePatientSearch: Search successful.', response.data.data);
        setPatientSearchResults(response.data.data || []);
        setSelectedPatient(null);

        if (response.data.data.length === 0) {
          setNewAppointment(prev => ({
            ...prev,
            patient_phone: patientSearchInput.match(/^\d+$/) ? patientSearchInput : '',
            patient_first_name: '',
            patient_last_name: '',
            birth_date: '',
            gender: ''
          }));
        }
      } else {
        console.error('handlePatientSearch: Search failed.', response.data);
        console.error('Patient search failed:', response.data.message);
        setPatientSearchResults([]);
        setSelectedPatient(null);
        setError(response.data.message || 'فشل البحث عن المريض');

        setNewAppointment(prev => ({
          ...prev,
          patient_phone: patientSearchInput.match(/^\d+$/) ? patientSearchInput : '',
          patient_first_name: '',
          patient_last_name: '',
          birth_date: '',
          gender: ''
        }));
      }
    } catch (error) {
      console.error('handlePatientSearch: Error during search API call.', error);
      console.error('Error searching patient:', error);
      setPatientSearchResults([]);
      setSelectedPatient(null);
      setError('حدث خطأ أثناء البحث عن المريض');
      setNewAppointment(prev => ({
        ...prev,
        patient_phone: patientSearchInput.match(/^\d+$/) ? patientSearchInput : '',
        patient_first_name: '',
        patient_last_name: '',
        birth_date: '',
        gender: ''
      }));
    } finally {
      setLoading(false);
    }
  };

  const selectPatient = (patient) => {
    console.log('selectPatient: Selecting patient', patient);
    setSelectedPatient(patient);
    setNewAppointment(prev => ({
      ...prev,
      patient_id: patient.id,
      patient_first_name: patient.first_name,
      patient_last_name: patient.last_name,
      patient_phone: patient.phone_number,
      birth_date: patient.date_of_birth,
      gender: patient.gender
    }));
    setPatientSearchResults([]);
    setPatientSearchInput(`${patient.first_name} ${patient.last_name || ''}`);
    console.log('selectPatient: selectedPatient state set to', patient);
  };

  const handleSlotSelect = (slot) => {
    console.log('handleSlotSelect: Selected slot data:', slot);
    setSelectedSlot(slot);
    setNewAppointment(prev => ({
      ...prev,
      appointment_id: slot.schedule_slot_id,
      appointment_time: slot.appointment_time,
      doctor_id: slot.doctor_id
    }));
  };

  const handleAddAppointment = async (e) => {
    e.preventDefault();
    console.log('handleAddAppointment: Attempting to add appointment.');
    console.log('handleAddAppointment: selectedPatient =', selectedPatient);
    console.log('handleAddAppointment: selectedSlot =', selectedSlot);
    console.log('handleAddAppointment: newAppointment =', newAppointment);

    let currentPatientId = selectedPatient ? selectedPatient.id : null;

    if (!selectedPatient) {
      if (!newAppointment.patient_first_name || !newAppointment.patient_last_name || !newAppointment.patient_phone || !newAppointment.birth_date || !newAppointment.gender) {
        alert('الرجاء إدخال جميع بيانات المريض الجديد المطلوبة');
        return;
      }

      try {
        const patientData = {
          first_name: newAppointment.patient_first_name,
          last_name: newAppointment.patient_last_name,
          phone_number: newAppointment.patient_phone,
          date_of_birth: newAppointment.birth_date,
          gender: newAppointment.gender
        };
        const addPatientResponse = await patientsAPI.add(patientData);
        if (addPatientResponse.data.success) {
          currentPatientId = addPatientResponse.data.data.id;
          console.log('New patient added with ID:', currentPatientId);
        } else {
          if (addPatientResponse.response && addPatientResponse.response.status === 409) {
            alert(addPatientResponse.response.data.message || 'مريض بنفس رقم الهاتف موجود بالفعل.');
          } else {
            alert(addPatientResponse.data.message || 'فشل في إضافة المريض الجديد');
          }
          return;
        }
      } catch (error) {
        console.error('Error adding new patient:', error);
        alert(error.response?.data?.message || 'حدث خطأ أثناء إضافة المريض الجديد');
        return;
      }
    }

    if (!selectedSlot) {
      alert('الرجاء اختيار موعد متاح من القائمة');
      return;
    }

    try {
      const appointmentData = {
        patient_id: currentPatientId,
        appointment_id: selectedSlot.schedule_slot_id,
        doctor_id: selectedSlot.doctor_id,
        appointment_date: selectedAppointmentDate,
        appointment_time: selectedSlot.appointment_time,
        status: 'confirmed',
        notes: newAppointment.notes,
        action: 'addAppointment'
      };
      console.log('handleAddAppointment: Sending appointmentData:', appointmentData);

      const response = await appointmentsAPI.add(appointmentData);
      if (response.data.success) {
        await fetchAppointments();
        setNewAppointment({
          patient_id: '',
          doctor_id: '',
          appointment_date: '',
          appointment_time: '',
          status: 'pending',
          notes: '',
          patient_first_name: '',
          patient_last_name: '',
          patient_phone: '',
          birth_date: '',
          gender: ''
        });
        setShowAddForm(false);
        setSelectedPatient(null);
        setAvailableSlots([]);
        setSelectedSlot(null);
        setPatientSearchInput('');
        alert('تم إضافة الموعد بنجاح');
      } else {
        alert(response.data.message || 'فشل في إضافة الموعد');
      }
    } catch (error) {
      console.error('Error adding appointment:', error);
      alert(error.response?.data?.message || 'حدث خطأ أثناء إضافة الموعد');
    }
  };

  const handleUpdateAppointment = async (e) => {
    e.preventDefault();
    if (!editingAppointment) return;

    try {
      const response = await appointmentsAPI.update(editingAppointment);
      if (response.data.success) {
        await fetchAppointments();
        setEditingAppointment(null);
        alert('تم تحديث الموعد بنجاح');
      } else {
        alert(response.data.message || 'فشل في تحديث الموعد');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert(error.response?.data?.message || 'حدث خطأ أثناء تحديث الموعد');
    }
  };

  const handleCancelAppointment = async (id) => {
    if (window.confirm('هل أنت متأكد من رغبتك في إلغاء هذا الموعد؟ سيتم إرسال بريد إلكتروني للمريض.')) {
      try {
        const response = await appointmentsAPI.updateStatus(id, 'cancelled');
        if (response.data.success) {
          setAppointments(
            appointments.map((app) =>
              app.id === id ? {...app,
                status: 'cancelled'} : app
            )
          );
          alert('تم إلغاء الموعد بنجاح وإعلام المريض.');
        } else {
          alert(response.data.message || 'فشل في إلغاء الموعد.');
        }
      } catch (error) {
        console.error('Error cancelling appointment:', error);
        alert(error.response?.data?.message || 'فشل في إلغاء الموعد');
      }
    }
  };

  const handleInputChange = (e) => {
    const {name, value} = e.target;
    if (editingAppointment) {
      setEditingAppointment(prev => ({...prev,
        [name]: value}));
    } else {
      setNewAppointment(prev => ({...prev,
        [name]: value}));
      if (name === 'doctor_id') {
        if (value && newAppointment.appointment_date) {
          fetchAvailableSlots(value, newAppointment.appointment_date);
        }
      } else if (name === 'appointment_date') {
        setSelectedAppointmentDate(value);
        if (newAppointment.doctor_id && value) {
          fetchAvailableSlots(newAppointment.doctor_id, value);
        }
      }
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch =
      appointment.patient_first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.patient_last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.doctor_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate = !filterDate || appointment.appointment_date === filterDate;
    const matchesStatus = !filterStatus || appointment.status === filterStatus;

    return matchesSearch && matchesDate && matchesStatus;
  });

  const formatTime = (time) => {
    if (!time) return '';
    const [hour,
      minute] = time.split(':');
    let ampm = 'ص';
    let h = parseInt(hour, 10);
    if (h >= 12) {
      ampm = 'م';
      if (h > 12) {
        h -= 12;
      }
    }
    if (h === 0) {
      h = 12;
    }
    return `${h}:${minute} ${ampm}`;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
    case 'pending': return 'status-pending';
    case 'confirmed': return 'status-confirmed';
    case 'completed': return 'status-completed';
    case 'cancelled': return 'status-cancelled';
    default: return '';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
    case 'pending': return 'قيد الانتظار';
    case 'confirmed': return 'مؤكد';
    case 'completed': return 'مكتمل';
    case 'cancelled': return 'ملغي';
    default: return status;
    }
  };

  const handleCloseEditModal = () => {
    setEditingAppointment(null);
    setShowEditModal(false);
    const modal = document.querySelector('.modal');
    if (modal) {
      modal.classList.remove('show');
    }
  };

  return (
    <div className="appointments-container">
      <div className="appointments-header">
        <h2>إدارة المواعيد</h2>
        <button
          className="add-appointment-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'إلغاء' : 'إضافة موعد جديد'}
        </button>
      </div>

      <div className="filters-container">
        <input
          className="search-input"
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="بحث عن موعد..."
          type="text"
          value={searchQuery}
        />
        <input
          className="date-filter"
          onChange={(e) => setFilterDate(e.target.value)}
          type="date"
          value={filterDate}
        />
        <select
          className="status-filter"
          onChange={(e) => setFilterStatus(e.target.value)}
          value={filterStatus}
        >
          <option value="">جميع الحالات</option>
          <option value="pending">قيد الانتظار</option>
          <option value="confirmed">مؤكد</option>
          <option value="completed">مكتمل</option>
          <option value="cancelled">ملغي</option>
        </select>
      </div>

      {showAddForm && (
        <div className="modal show modal-animate full-screen-modal">
          <div className="modal-content">
            <button
              aria-label="إغلاق"
              className="modal-close-btn"
              onClick={() => setShowAddForm(false)}
              type="button"
            >
              ×
            </button>
            <form className="add-appointment-form" onSubmit={handleAddAppointment}>
              <h3>إضافة موعد جديد</h3>
              <div className="form-row">
                <div className="patient-input-section">
                  <div className="patient-search-area">
                    <input
                      onChange={(e) => setPatientSearchInput(e.target.value)}
                      onKeyPress={(e) => { if (e.key === 'Enter') handlePatientSearch(); }}
                      placeholder="ابحث عن مريض بالاسم أو الهاتف أو ادخل بيانات مريض جديد..."
                      type="text"
                      value={patientSearchInput}
                    />
                    <button disabled={loading} onClick={handlePatientSearch} type="button">
                      بحث
                    </button>
                    {patientSearchResults.length > 0 && (
                      <ul className="patient-search-results">
                        {patientSearchResults.map(patient => (
                          <li key={patient.id} onClick={() => selectPatient(patient)}>
                            {patient.first_name} {patient.last_name} ({patient.phone_number})
                          </li>
                        ))}
                      </ul>
                    )}
                    {error && patientSearchResults.length === 0 && patientSearchInput.trim() && !loading && (
                      <div className="error-message">{error}</div>
                    )}
                  </div>
                  {selectedPatient ? (
                    <div className="selected-patient-info">
                      <p>المريض المختار: <strong>{selectedPatient.first_name} {selectedPatient.last_name}</strong> ({selectedPatient.phone_number})</p>
                    </div>
                  ) : (
                    <div className="new-patient-details">
                      <div className="form-grid">
                        <div className="form-group">
                          <label>الاسم الأول *</label>
                          <input name="patient_first_name" onChange={handleInputChange} placeholder="الاسم الأول" required={!selectedPatient} type="text" value={newAppointment.patient_first_name} />
                        </div>
                        <div className="form-group">
                          <label>اسم العائلة</label>
                          <input name="patient_last_name" onChange={handleInputChange} placeholder="اسم العائلة" type="text" value={newAppointment.patient_last_name} />
                        </div>
                        <div className="form-group">
                          <label>رقم الهاتف *</label>
                          <input name="patient_phone" onChange={handleInputChange} placeholder="رقم الهاتف" required={!selectedPatient} type="tel" value={newAppointment.patient_phone} />
                        </div>
                        <div className="form-group">
                          <label>البريد الإلكتروني</label>
                          <input name="email" onChange={handleInputChange} placeholder="البريد الإلكتروني" type="email" value={newAppointment.email || ''} />
                        </div>
                        <div className="form-group">
                          <label>تاريخ الميلاد</label>
                          <input name="birth_date" onChange={handleInputChange} placeholder="تاريخ الميلاد" required={!selectedPatient} type="date" value={newAppointment.birth_date} />
                        </div>
                        <div className="form-group">
                          <label>الجنس</label>
                          <select name="gender" onChange={handleInputChange} required={!selectedPatient} value={newAppointment.gender}>
                            <option value="">اختر الجنس</option>
                            <option value="male">ذكر</option>
                            <option value="female">أنثى</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>العنوان</label>
                          <input name="address" onChange={handleInputChange} placeholder="العنوان" type="text" value={newAppointment.address || ''} />
                        </div>
                        <div className="form-group">
                          <label>فصيلة الدم</label>
                          <select name="blood_type" onChange={handleInputChange} value={newAppointment.blood_type || ''}>
                            <option value="">اختر فصيلة الدم</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>الحساسية</label>
                          <textarea name="allergies" onChange={handleInputChange} placeholder="الحساسية (اختياري)" rows="2" value={newAppointment.allergies || ''} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="form-field">
                  <label>اختر الطبيب:</label>
                  <select name="doctor_id" onChange={handleInputChange} required value={newAppointment.doctor_id}>
                    <option value="">اختر طبيب...</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>اختر تاريخ الموعد:</label>
                  <input name="appointment_date" onChange={handleInputChange} required type="date" value={newAppointment.appointment_date} />
                </div>
              </div>
              {newAppointment.doctor_id && newAppointment.appointment_date && (
                <div className="available-slots">
                  <h3>المواعيد المتاحة لـ {newAppointment.appointment_date}</h3>
                  {error && !loading && (<div className="error-message">{error}</div>)}
                  {loading ? (
                    <div className="loading">جاري تحميل المواعيد...</div>
                  ) : (
                    availableSlots.length > 0 ? (
                      <div className="slots-grid">
                        {availableSlots.map((slot) => (
                          <div
                            className={`slot-button ${selectedSlot && selectedSlot.schedule_slot_id === slot.schedule_slot_id ? 'selected' : ''} ${slot.status === 'booked' ? 'booked-slot' : 'available-slot'}`}
                            disabled={slot.status === 'booked'}
                            key={`${slot.schedule_slot_id}-${slot.appointment_time}`}
                            onClick={() => handleSlotSelect(slot)}
                          >
                            {formatTime(slot.appointment_time)}
                            {slot.status === 'booked' && <span className="booked-tag">(محجوز)</span>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-slots-message">لا توجد مواعيد متاحة في هذا التاريخ.</div>
                    )
                  )}
                </div>
              )}
              <div className="form-field">
                <label>ملاحظات:</label>
                <textarea name="notes" onChange={handleInputChange} placeholder="ملاحظات إضافية (اختياري)" value={newAppointment.notes} />
              </div>
              <button className="submit-btn" disabled={loading || !selectedSlot || (!selectedPatient && (!newAppointment.patient_first_name || !newAppointment.patient_phone))} type="submit">
                {loading ? 'جاري الإضافة...' : 'تأكيد حجز الموعد'}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">جاري تحميل البيانات...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="appointments-table-container">
          <table className="appointments-table">
            <thead>
              <tr>
                <th>المريض</th>
                <th>الطبيب</th>
                <th>التاريخ</th>
                <th>الوقت</th>
                <th>الحالة</th>
                <th>ملاحظات</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>{`${appointment.patient_first_name} ${appointment.patient_last_name}`}</td>
                    <td>{appointment.doctor_name}</td>
                    <td>{new Date(appointment.appointment_date).toLocaleDateString('en-GB')}</td>
                    <td>{formatTime(appointment.appointment_time)}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(appointment.status)}`}>
                        {getStatusText(appointment.status)}
                      </span>
                    </td>
                    <td>{appointment.notes || '-'}</td>
                    <td className="actions">
                      {appointment.status !== 'cancelled' && (
                        <button
                          className="btn btn-danger"
                          onClick={() => handleCancelAppointment(appointment.id)}
                        >
                          إلغاء
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="no-data" colSpan="7">
                    لا توجد مواعيد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showEditModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>تعديل الموعد</h3>
            <form onSubmit={handleUpdateAppointment}>
              <div className="form-row">
                <input
                  disabled
                  key={`${editingAppointment.id}patient_id`}
                  name="patient_id"
                  onChange={handleInputChange}
                  placeholder="معرف المريض"
                  required
                  type="text"
                  value={editingAppointment.patient_id}
                />
                <select
                  key={`${editingAppointment.id}doctor_id_edit`}
                  name="doctor_id"
                  onChange={handleInputChange}
                  required
                  value={editingAppointment.doctor_id}
                >
                  <option value="">اختر طبيب...</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <input
                  key={`${editingAppointment.id}appointment_date`}
                  name="appointment_date"
                  onChange={handleInputChange}
                  required
                  type="date"
                  value={editingAppointment.appointment_date}
                />
                <input
                  key={`${editingAppointment.id}appointment_time`}
                  name="appointment_time"
                  onChange={handleInputChange}
                  required
                  type="time"
                  value={editingAppointment.appointment_time}
                />
              </div>
              <select
                key={`${editingAppointment.id}status`}
                name="status"
                onChange={handleInputChange}
                required
                value={editingAppointment.status}
              >
                <option value="pending">قيد الانتظار</option>
                <option value="confirmed">مؤكد</option>
                <option value="completed">مكتمل</option>
                <option value="cancelled">ملغي</option>
              </select>
              <textarea
                key={`${editingAppointment.id}notes`}
                name="notes"
                onChange={handleInputChange}
                placeholder="ملاحظات (اختياري)"
                value={editingAppointment.notes}
              />
              <div className="modal-actions">
                <button className="submit-btn" type="submit">حفظ التغييرات</button>
                <button
                  className="cancel-btn"
                  onClick={handleCloseEditModal}
                  type="button"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
