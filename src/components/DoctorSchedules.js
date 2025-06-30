import React, {useState, useEffect, useCallback} from 'react';
import {doctorsAPI, doctorSchedulesAPI} from '../api/api';
import '../styles/DoctorSchedules.css';

const DoctorSchedules = () => {
  const [schedules,
    setSchedules] = useState([]); // This will now hold individual daily schedule entries
  const [doctors,
    setDoctors] = useState([]);
  const [loading,
    setLoading] = useState(true);
  const [error,
    setError] = useState('');
  const [selectedDoctor,
    setSelectedDoctor] = useState('');
  const [selectedWeek,
    setSelectedWeek] = useState('');
  const [editingSchedule,
    setEditingSchedule] = useState(null);
  const [showAddForm,
    setShowAddForm] = useState(false);
  const [viewMode,
    setViewMode] = useState('weekly'); // weekly or daily

  const [newSchedule,
    setNewSchedule] = useState({
    doctor_id: '',
    week_start: '',
    selected_days: [], // Changed from day_of_week to an array of selected days
    periods: [
      {
        start_time: '08:00',
        end_time: '12:00',
        is_available: true
      },
      {
        start_time: '17:00',
        end_time: '22:00',
        is_available: true
      }
    ],
    slot_duration: 30,
    notes: ''
  });

  const weekDays = [
    'الأحد',
    'الإثنين',
    'الثلاثاء',
    'الأربعاء',
    'الخميس',
    'الجمعة',
    'السبت'
  ];

  // جلب قائمة الأطباء
  const fetchDoctors = useCallback(async () => {
    try {
      const response = await doctorsAPI.getAll();
      if (response.data.success) {
        setDoctors(response.data.data || []);
      } else {
        setError(response.data.message || 'فشل في تحميل قائمة الأطباء');
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError('حدث خطأ في تحميل قائمة الأطباء');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // دالة غير مستخدمة حالياً، تم التعليق عليها لتفادي تحذيرات eslint ويمكن إعادتها عند الحاجة
  // function getWeekDates(startDate) {
  //   const dates = [];
  //   for (let i = 0; i < 7; i++) {
  //     const date = new Date(startDate);
  //     date.setDate(date.getDate() + i);
  //     dates.push(date);
  //   }
  //   return dates;
  // }

  const fetchSchedules = useCallback(async () => {
    if (!selectedDoctor) return;

    setLoading(true);
    setError('');
    try {
      const response = await doctorSchedulesAPI.getAll({
        doctor_id: selectedDoctor,
        week_start: selectedWeek
      });

      if (response.data.success) {
        console.log('Fetched schedules (daily):', response.data.data);
        setSchedules(response.data.data || []);
      } else {
        setError(response.data.message || 'حدث خطأ في تحميل جداول المواعيد');
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setError(error.response?.data?.message || 'حدث خطأ أثناء تحميل جداول المواعيد');
    } finally {
      setLoading(false);
    }
  }, [selectedDoctor,
    selectedWeek]);

  useEffect(() => {
    if (selectedDoctor) {
      // const weekDates = getWeekDates(selectedWeek); // No longer needed for fetching
      fetchSchedules();
    }
  }, [selectedDoctor,
    selectedWeek,
    fetchSchedules]); // Removed getWeekDates

  const handleAddPeriod = () => {
    setNewSchedule(prev => ({
      ...prev,
      periods: [...prev.periods,
        {
          start_time: '09:00',
          end_time: '17:00',
          is_available: true
        }]
    }));
  };

  const handleRemovePeriod = (index) => {
    setNewSchedule(prev => ({
      ...prev,
      periods: prev.periods.filter((_, i) => i !== index)
    }));
  };

  const handlePeriodChange = (index, field, value) => {
    setNewSchedule(prev => ({
      ...prev,
      periods: prev.periods.map((period, i) =>
        i === index ? {...period,
          [field]: value} : period
      )
    }));
  };

  const handleDaySelect = (e) => {
    const day = parseInt(e.target.value);
    setNewSchedule(prev => ({
      ...prev,
      selected_days: e.target.checked
        ? [...prev.selected_days,
          day]
        : prev.selected_days.filter(d => d !== day)
    }));
  };

  function weekStringToDate (weekStr) {
    if (!weekStr) return '';
    const [year,
      week] = weekStr.split('-W');
    // بداية الأسبوع (الأحد)
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const day = simple.getDay();
    const diff = simple.getDate() - day + (day === 0 ? -6 : 1); // الأحد أول يوم
    return new Date(simple.setDate(diff)).toISOString().slice(0, 10);
  }

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (newSchedule.selected_days.length === 0) {
      alert('الرجاء تحديد يوم واحد على الأقل');
      return;
    }

    try {
      const schedulesToSend = newSchedule.selected_days.map(day => ({
        day_of_week: day,
        periods: newSchedule.periods,
        slot_duration: newSchedule.slot_duration,
        notes: newSchedule.notes
      }));

      const weekStartDate = weekStringToDate(newSchedule.week_start);
      const payload = {
        doctor_id: parseInt(newSchedule.doctor_id),
        week_start: weekStartDate,
        schedules: schedulesToSend
      };

      const response = await doctorSchedulesAPI.add(payload);
      if (response.data.success) {
        await fetchSchedules();
        setNewSchedule({
          doctor_id: selectedDoctor,
          week_start: selectedWeek,
          selected_days: [],
          periods: [
            {
              start_time: '08:00',
              end_time: '12:00',
              is_available: true
            },
            {
              start_time: '17:00',
              end_time: '22:00',
              is_available: true
            }
          ],
          slot_duration: 30,
          notes: ''
        });
        setShowAddForm(false);
        alert('تم إضافة جدول المواعيد بنجاح');
      } else {
        alert(response.data.message || 'فشل في إضافة جدول المواعيد');
      }
    } catch (error) {
      console.error('Error adding schedule:', error);
      alert(error.response?.data?.message || 'حدث خطأ أثناء إضافة جدول المواعيد');
    }
  };

  const handleUpdateSchedule = async (e) => {
    e.preventDefault();
    if (!editingSchedule) return;

    try {
      const scheduleToUpdate = {
        ...editingSchedule,
        doctor_id: parseInt(editingSchedule.doctor_id),
        day_of_week: parseInt(editingSchedule.day_of_week)
      };
      const response = await doctorSchedulesAPI.update(scheduleToUpdate);
      if (response.data.success) {
        await fetchSchedules();
        setEditingSchedule(null);
        alert('تم تحديث جدول المواعيد بنجاح');
      } else {
        alert(response.data.message || 'فشل في تحديث جدول المواعيد');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      alert(error.response?.data?.message || 'حدث خطأ أثناء تحديث جدول المواعيد');
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الجدول؟')) return;

    try {
      const response = await doctorSchedulesAPI.delete(id);
      if (response.data.success) {
        await fetchSchedules();
        alert('تم حذف جدول المواعيد بنجاح');
      } else {
        alert(response.data.message || 'فشل في حذف جدول المواعيد');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert(error.response?.data?.message || 'حدث خطأ أثناء حذف جدول المواعيد');
    }
  };

  const handleInputChange = (e) => {
    const {name, value, type, checked} = e.target;

    if (showAddForm) {
      setNewSchedule(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    } else if (editingSchedule) {
      setEditingSchedule(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    // لعرض التاريخ الميلادي بصيغة YYYY-MM-DD
    return new Date(date).toLocaleDateString('en-CA');
  };

  // دالة غير مستخدمة حالياً، تم التعليق عليها لتفادي تحذيرات eslint ويمكن إعادتها عند الحاجة
  // function generateTimeSlots(startTime, endTime, duration) {
  //   const slots = [];
  //   const start = new Date(`2000-01-01T${startTime}`);
  //   const end = new Date(`2000-01-01T${endTime}`);
  //   while (start < end) {
  //     slots.push(start.toTimeString().slice(0, 5));
  //     start.setMinutes(start.getMinutes() + duration);
  //   }
  //   return slots;
  // }

  // دالة لحساب تاريخ اليوم الفعلي بناءً على بداية الأسبوع ورقم اليوم
  function getActualDateOfDay (weekStart, dayOfWeek) {
    // weekStart: تاريخ بداية الأسبوع (YYYY-MM-DD)
    // dayOfWeek: 1=الأحد ... 7=السبت
    if (!weekStart || !dayOfWeek) return '';
    const start = new Date(weekStart);
    start.setDate(start.getDate() + (dayOfWeek - 1));
    return start.toISOString().slice(0, 10);
  }

  // Filter schedules based on selected doctor and week
  const filteredSchedules = schedules.filter(s => {
    const weekStartDate = selectedWeek ? weekStringToDate(selectedWeek) : null;
    return (
      (selectedDoctor ? s.doctor_id === parseInt(selectedDoctor) : true) &&
      (selectedWeek ? s.week_start === weekStartDate : true)
    );
  });

  return (
    <div className="schedules-container">
      <div className="schedules-header">
        <h2>جدولة مواعيد الأطباء</h2>
        <div className="header-actions">
          <select
            className="view-mode-select"
            onChange={(e) => setViewMode(e.target.value)}
            value={viewMode}
          >
            <option value="weekly">عرض أسبوعي</option>
            <option value="daily">عرض يومي</option>
          </select>
          <button
            className="add-schedule-btn"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'إلغاء' : 'إضافة جدول جديد'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button className="close-error" onClick={() => setError('')}>×</button>
        </div>
      )}

      <div className="filters-container">
        <select
          className="doctor-filter"
          onChange={(e) => setSelectedDoctor(e.target.value)}
          value={selectedDoctor}
        >
          <option value="">اختر الطبيب</option>
          {doctors.map(doctor => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.name} - {doctor.specialty}
            </option>
          ))}
        </select>
        <input
          className="week-filter"
          onChange={(e) => setSelectedWeek(e.target.value)}
          type="week"
          value={selectedWeek}
        />
      </div>

      {showAddForm && (
        <form className="add-schedule-form" onSubmit={handleAddSchedule}>
          <h3>إضافة جدول مواعيد جديد</h3>
          <div className="form-row">
            <div className="form-field">
              <label>الطبيب:</label>
              <select
                name="doctor_id"
                onChange={handleInputChange}
                required
                value={newSchedule.doctor_id}
              >
                <option value="">اختر الطبيب</option>
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} - {doctor.specialty}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>بداية الأسبوع:</label>
              <input
                name="week_start"
                onChange={handleInputChange}
                required
                type="week"
                value={newSchedule.week_start}
              />
            </div>
          </div>

          <div className="form-field">
            <label>الأيام المحددة:</label>
            <div className="day-checkboxes">
              {weekDays.map((day, index) => (
                <label className="checkbox-label" key={index + 1}>
                  <input
                    checked={newSchedule.selected_days.includes(index + 1)}
                    onChange={handleDaySelect}
                    type="checkbox"
                    value={index + 1}
                  />
                  {day}
                </label>
              ))}
            </div>
          </div>

          <div className="periods-container">
            <h4>فترات العمل</h4>
            {newSchedule.periods.map((period, index) => (
              <div className="period-row" key={index}>
                <div className="form-field">
                  <label>من:</label>
                  <input
                    onChange={(e) => handlePeriodChange(index, 'start_time', e.target.value)}
                    required
                    type="time"
                    value={period.start_time}
                  />
                </div>
                <div className="form-field">
                  <label>إلى:</label>
                  <input
                    onChange={(e) => handlePeriodChange(index, 'end_time', e.target.value)}
                    required
                    type="time"
                    value={period.end_time}
                  />
                </div>
                <div className="form-field">
                  <label>متاح:</label>
                  <input
                    checked={period.is_available}
                    onChange={(e) => handlePeriodChange(index, 'is_available', e.target.checked)}
                    type="checkbox"
                  />
                </div>
                {index > 0 && (
                  <button
                    className="remove-period-btn"
                    onClick={() => handleRemovePeriod(index)}
                    type="button"
                  >
                    حذف
                  </button>
                )}
              </div>
            ))}
            <button
              className="add-period-btn"
              onClick={handleAddPeriod}
              type="button"
            >
              إضافة فترة عمل
            </button>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>مدة الموعد (بالدقائق):</label>
              <input
                min="15"
                name="slot_duration"
                onChange={handleInputChange}
                required
                step="15"
                type="number"
                value={newSchedule.slot_duration}
              />
            </div>
            <div className="form-field">
              <label>ملاحظات:</label>
              <textarea
                name="notes"
                onChange={handleInputChange}
                value={newSchedule.notes}
              />
            </div>
          </div>

          <div className="form-actions">
            <button className="submit-btn" type="submit">إضافة الجدول</button>
            <button className="cancel-btn" onClick={() => setShowAddForm(false)} type="button">
              إلغاء
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading">جاري تحميل البيانات...</div>
      ) : filteredSchedules.length > 0 ? (
        <div className="schedules-grid">
          {filteredSchedules.map((schedule) => (
            <div className="schedule-card" key={schedule.id}>
              <div className="schedule-header">
                <h3>{doctors.find(d => d.id === schedule.doctor_id)?.name}</h3>
                <p className="week-date">
                  {weekDays[schedule.day_of_week - 1]} - {formatDate(getActualDateOfDay(schedule.week_start, schedule.day_of_week))}
                </p>
              </div>
              <div className="schedule-details">
                <p>
                  <strong>الوقت:</strong> {schedule.start_time} - {schedule.end_time}
                </p>
                <p>
                  <strong>مدة الموعد:</strong> {schedule.slot_duration} دقيقة
                </p>
                <p>
                  <strong>الحالة:</strong>
                  <span className={`status-badge ${schedule.is_available ? 'available' : 'unavailable'}`}>
                    {schedule.is_available ? 'متاح' : 'غير متاح'}
                  </span>
                </p>
                {schedule.notes && (
                  <p>
                    <strong>ملاحظات:</strong> {schedule.notes}
                  </p>
                )}
              </div>
              <div className="schedule-actions">
                <button
                  className="edit-btn"
                  onClick={() => setEditingSchedule(schedule)}
                >
                  تعديل
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteSchedule(schedule.id)}
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-schedules-message">
          لا توجد جداول مواعيد لهذا الطبيب في هذا الأسبوع.
        </div>
      )}

      {editingSchedule && (
        <div className="modal">
          <div className="modal-content">
            <h3>تعديل جدول المواعيد</h3>
            <form onSubmit={handleUpdateSchedule}>
              <div className="form-field">
                <label>الطبيب:</label>
                <select
                  disabled
                  name="doctor_id"
                  onChange={handleInputChange}
                  required
                  value={editingSchedule.doctor_id}
                >
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.specialty}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>بداية الأسبوع:</label>
                <input
                  disabled
                  name="week_start"
                  onChange={handleInputChange}
                  required
                  type="week"
                  value={editingSchedule.week_start}
                />
              </div>
              <div className="form-field">
                <label>اليوم من الأسبوع:</label>
                <select
                  disabled
                  name="day_of_week"
                  onChange={handleInputChange}
                  required
                  value={editingSchedule.day_of_week}
                >
                  {weekDays.map((day, index) => (
                    <option key={index + 1} value={index + 1}>{day}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>وقت البدء:</label>
                <input
                  name="start_time"
                  onChange={handleInputChange}
                  required
                  type="time"
                  value={editingSchedule.start_time}
                />
              </div>
              <div className="form-field">
                <label>وقت الانتهاء:</label>
                <input
                  name="end_time"
                  onChange={handleInputChange}
                  required
                  type="time"
                  value={editingSchedule.end_time}
                />
              </div>
              <div className="form-field">
                <label>مدة الموعد (دقائق):</label>
                <input
                  min="15"
                  name="slot_duration"
                  onChange={handleInputChange}
                  required
                  step="15"
                  type="number"
                  value={editingSchedule.slot_duration}
                />
              </div>
              <div className="form-field checkbox-field">
                <label>
                  <input
                    checked={editingSchedule.is_available}
                    name="is_available"
                    onChange={handleInputChange}
                    type="checkbox"
                  />
                  متاح
                </label>
              </div>
              <div className="form-field">
                <label>ملاحظات (اختياري):</label>
                <textarea
                  name="notes"
                  onChange={handleInputChange}
                  placeholder="ملاحظات (اختياري)"
                  value={editingSchedule.notes}
                />
              </div>
              <div className="modal-actions">
                <button className="submit-btn" type="submit">حفظ التغييرات</button>
                <button
                  className="cancel-btn"
                  onClick={() => setEditingSchedule(null)}
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

export default DoctorSchedules;
