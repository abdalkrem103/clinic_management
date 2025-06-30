import axios from 'axios';

const API_BASE_URL = "https://clinic-backend-production-24bc.up.railway.app/api";

// تكوين axios
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true
});

// إضافة التوكن لكل الطلبات
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// إضافة معالج للاستجابات
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response) {
            console.error('Server Error:', error.response.data);
            // إذا كان الخطأ 401، قم بتسجيل الخروج تلقائياً
            if (error.response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error:', error.message);
        }
        return Promise.reject(error);
    }
);

// API للمصادقة
export const authAPI = {
    login: (credentials) => api.post('/login.php', credentials),
    register: (data) => api.post('/register.php', data),
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },
    checkAuth: () => {
        const token = localStorage.getItem('token');
        if (!token) {
            return Promise.resolve({ data: { success: false } });
        }
        return api.get('/check_auth.php');
    },
    getCurrentUser: () => {
        const user = localStorage.getItem('user');
        try {
            return user ? JSON.parse(user) : null;
        } catch (e) {
            console.error('Failed to parse user from localStorage:', e);
            localStorage.removeItem('user');
            return null;
        }
    },
    // إعدادات الأدمن
    updateProfile: (data) => api.post('/update_profile.php', data),
    changePassword: (data) => api.post('/change_password.php', data),
    forgotPassword: (data) => api.post('/forgot_password.php', data)
};

// API للأطباء
export const doctorsAPI = {
    getAll: () => api.get('/doctors.php'),
    getById: (id) => api.get(`/get_doctor.php?id=${id}`),
    add: (data) => api.post('/add_doctor.php', data),
    update: (data) => api.post('/update_doctor.php', data),
    delete: (id) => api.delete('/delete_doctor.php', { data: { id } }),
};

// API لجدولة المواعيد
export const doctorSchedulesAPI = {
    getAll: (params) => api.get('/get_doctor_schedules.php', { params }),
    getById: (id) => api.get(`/get_doctor_schedule.php?id=${id}`),
    add: (data) => api.post('/add_doctor_schedule.php', data),
    update: (data) => api.post('/update_doctor_schedule.php', data),
    delete: (id) => api.delete('/delete_doctor_schedule.php', { data: { id } }),
};

// API للمواعيد
export const appointmentsAPI = {
    getAll: (params) => api.get('/appointments.php', { params }),
    getById: (id) => api.get(`/appointments.php?id=${id}`),
    add: (data) => api.post('/appointments.php', { ...data, action: 'addAppointment' }),
    update: (data) => api.put('/appointments.php', data),
    delete: (id) => api.delete('/appointments.php', { data: { action: 'cancelAppointment', appointment_id: id } }),
    getDoctorSlotsAndStatus: (doctorId, date) => api.get('/appointments.php', { params: { action: 'getDoctorSlotsAndStatus', doctor_id: doctorId, date: date } }),
    getBookedDates: (doctorId) => api.get('/appointments.php', { params: { action: 'getBookedDates', doctor_id: doctorId } }),
    getAppointmentsByPatient: (patientId) => api.get('/appointments.php', { params: { action: 'getAppointmentsByPatient', patient_id: patientId } }),
    cancelAppointment: (appointmentId) => api.delete('/appointments.php', { data: { action: 'cancelAppointment', appointment_id: appointmentId } }),
    updateStatus: (id, status) => api.put('/appointments.php', { action: 'updateAppointmentStatus', appointment_id: id, status: status }),
};

// API للمرضى
export const patientsAPI = {
    getAll: () => api.get('/patients.php'),
    getById: (id) => api.get(`/patients.php?id=${id}`),
    add: (data) => api.post('/patients.php', data),
    update: (id, data) => api.put('/patients.php', { id, ...data }),
    delete: (id) => api.delete('/patients.php', { data: { id } }),
    search: (params) => api.get('/patients.php', { params })
};

// API للمستخدمين
export const usersAPI = {
    getAll: () => api.get('/get_users.php'),
    getById: (id) => api.get(`/get_user.php?id=${id}`),
    add: (data) => api.post('/add_user.php', data),
    update: (data) => api.post('/update_user.php', data),
    delete: (id) => api.post('/delete_user.php', { id }),
    updateProfile: (data) => api.post('/update_profile.php', data),
    changePassword: (data) => api.post('/change_password.php', data),
};

// API للخدمات
export const servicesAPI = {
    getAll: () => api.get('/get_services.php'),
    getById: (id) => api.get(`/get_service.php?id=${id}`),
    add: (data) => api.post('/add_service.php', data),
    update: (data) => api.post('/update_service.php', data),
    delete: (id) => api.post('/delete_service.php', { id })
};

// API للمخزون
export const inventoryAPI = {
    getAll: () => api.get('/get_inventory.php'),
    getById: (id) => api.get(`/get_inventory_item.php?id=${id}`),
    add: (data) => api.post('/add_inventory_item.php', data),
    update: (data) => api.post('/update_inventory_item.php', data),
    delete: (id) => api.post('/delete_inventory_item.php', { id })
};

// API للمدفوعات
export const paymentsAPI = {
    getAll: (params) => api.get('/payments.php', { params }),
    getById: (id) => api.get(`/payments.php?id=${id}`),
    getByPatientId: (patientId) => api.get('/payments.php', { params: { patient_id: patientId } }),
    create: (data) => api.post('/payments.php', data),
    update: (data) => api.put('/payments.php', data),
    delete: (id) => api.delete('/payments.php', { data: { id } })
};

// API للأشعة
export const xraysAPI = {
  // جلب قائمة الأشعة كمعلومات JSON (وليس كصورة)
  getAll: (params) => api.get('/xrays.php', { params }),

  // جلب صورة الأشعة عبر ID (لعرضها في <img>)
  getById: (id) => api.get(`/get_xray.php?id=${id}`, { responseType: 'blob' }),

  // رفع ملف الأشعة
  upload: (formData) =>
    api.post('/xrays.php', formData, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': undefined, // للسماح بـ multipart/form-data
      },
    }),

  // تحديث معلومات الأشعة (غير مستخدم حالياً)
  update: (id, data) => api.put('/xrays.php', { id, ...data }),

  // حذف صورة الأشعة
  delete: (id) => api.delete('/xrays.php', { data: { id } }),

  // تحليل صورة الأشعة
  analyze: (xrayId) =>
    api.post('/analyze_xray.php', { xray_id: xrayId }, {
      headers: {
        'Content-Type': 'application/json',
      },
    }),
};

// API للإشعارات
export const notificationsAPI = {
    getAll: (userId) => api.get('/notifications.php', { params: { user_id: userId } }),
    markAsRead: (id) => api.put('/notifications.php', { action: 'markAsRead', notification_id: id }),
    saveSettings: (data) => api.post('/notifications.php', { action: 'saveSettings', ...data }),
    delete: (id) => api.delete('/notifications.php', { data: { action: 'deleteNotification', notification_id: id } })
};

export const patientAPI = {
    register: (data) => api.post('/register_patient.php', data),
    login: (data) => api.post('/login_patient.php', data),
    sendResetOtp: ({ email }) => api.post('/patients.php', { action: 'sendResetOtp', email }),
    resetPassword: ({ email, otp, newPassword }) => api.post('/patients.php', { action: 'resetPassword', email, otp, newPassword }),
};

// API لخريطة الأسنان
export const dentalChartAPI = {
  getByPatient: (patientId) => api.get(`/dental_chart.php?patient_id=${patientId}`),
  add: (data) => api.post('/dental_chart.php', data),
  update: (data) => api.put('/dental_chart.php', data),
  delete: (id) => api.delete('/dental_chart.php', { data: { id } }),
  addOrUpdate: (data) => {
    // إذا كان هناك id، فهذا تحديث، وإلا إضافة جديدة
    if (data.id) {
      return api.put('/dental_chart.php', data);
    } else {
      return api.post('/dental_chart.php', data);
    }
  }
};

export default api; 