import React, {useEffect, useState} from 'react';
import {Bar, Pie} from 'react-chartjs-2';
import api from '../api/api';
import '../styles/Dashboard.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const Dashboard = () => {
  const [patientData,
    setPatientData] = useState([]);
  const [appointmentData,
    setAppointmentData] = useState([]);
  const [inventoryData,
    setInventoryData] = useState([]);
  //  const [alerts, setAlerts] = useState([]);
  const [loading,
    setLoading] = useState(true);
  const [error,
    setError] = useState('');
  const [todayAppointments,
    setTodayAppointments] = useState([]);
  const [selectedDoctor,
    setSelectedDoctor] = useState('all');
  const [doctors,
    setDoctors] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // جلب إحصائيات المرضى
        const patientResponse = await api.get('/patients.php');
        if (patientResponse.data.success && Array.isArray(patientResponse.data.data)) {
          setPatientData(patientResponse.data.data);
        }

        // جلب إحصائيات المواعيد
        const appointmentResponse = await api.get('/appointments.php', {params: {action: 'getAllAppointments'}});
        if (appointmentResponse.data.success && Array.isArray(appointmentResponse.data.data)) {
          setAppointmentData(appointmentResponse.data.data);
        }

        // جلب قائمة الأطباء
        const doctorsResponse = await api.get('/doctors.php');
        if (doctorsResponse.data.success) {
          setDoctors(doctorsResponse.data.data);
        }

        // جلب إحصائيات المخزون
        const inventoryResponse = await api.get('/inventory.php');
        if (inventoryResponse.data.success && Array.isArray(inventoryResponse.data.data)) {
          setInventoryData(inventoryResponse.data.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        if (error.response && error.response.status !== 401) {
          setError('حدث خطأ في تحميل البيانات');
        } else if (!error.response) {
          setError('حدث خطأ في الاتصال بالخادم أو تحميل البيانات');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // New useEffect to fetch today's appointments
  useEffect(() => {
    const fetchTodayAppointments = async () => {
      try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const dd = String(today.getDate()).padStart(2, '0');
        const todayDate = `${yyyy}-${mm}-${dd}`;

        const response = await api.get('/appointments.php', {
          params: {action: 'getAppointmentsByDate',
            date: todayDate}
        });

        if (response.data.success && Array.isArray(response.data.data)) {
          setTodayAppointments(response.data.data);
          console.log('Today\'s Appointments Data for', todayDate, ':', response.data.data);
        } else {
          setTodayAppointments([]);
        }
      } catch (error) {
        console.error('Error fetching today\'s appointments:', error);
        setTodayAppointments([]); // Clear appointments on error
      }
    };

    fetchTodayAppointments();
  }, []); // Empty dependency array to run only once on mount

  // معالجة بيانات المرضى للرسم البياني
  const processPatientData = () => {
    if (!Array.isArray(patientData) || patientData.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'المرضى الجدد يوميًا',
          data: [],
          backgroundColor: '#00b894',
          borderColor: '#00b894',
          borderWidth: 1,
          tension: 0.4,
          fill: true
        }]
      };
    }

    // تجميع المرضى حسب اليوم
    const countsByDate = {};
    patientData.forEach(item => {
      // استخدم فقط اليوم (بدون الوقت)
      const date = new Date(item.created_at).toLocaleDateString('en-GB');
      countsByDate[date] = (countsByDate[date] || 0) + 1;
    });

    const dates = Object.keys(countsByDate).sort(
      (a, b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-'))
    );
    const counts = dates.map(date => countsByDate[date]);

    return {
      labels: dates,
      datasets: [{
        label: 'المرضى الجدد يوميًا',
        data: counts,
        backgroundColor: '#00b894',
        borderColor: '#00b894',
        borderWidth: 1,
        tension: 0.4,
        fill: true
      }]
    };
  };

  // معالجة بيانات المواعيد للرسم البياني
  const processAppointmentData = () => {
    const confirmedAppointments = appointmentData.filter(item => item.status === 'confirmed');

    if (!Array.isArray(confirmedAppointments) || confirmedAppointments.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'المواعيد المؤكدة يوميًا',
          data: [],
          backgroundColor: '#0984e3',
          borderColor: '#0984e3',
          borderWidth: 1,
          tension: 0.4,
          fill: true
        }]
      };
    }

    const dates = [...new Set(confirmedAppointments.map(item => item.appointment_date))].sort();
    const counts = dates.map(date =>
      confirmedAppointments.filter(item => item.appointment_date === date).length
    );

    return {
      labels: dates.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-GB');
      }),
      datasets: [{
        label: 'المواعيد المؤكدة يوميًا',
        data: counts,
        backgroundColor: '#0984e3',
        borderColor: '#0984e3',
        borderWidth: 1,
        tension: 0.4,
        fill: true
      }]
    };
  };

  // معالجة بيانات المخزون للرسم البياني
  const processInventoryData = () => {
    // Ensure inventoryData is an array before mapping
    if (!Array.isArray(inventoryData)) return {labels: [],
      datasets: []};

    const items = [...new Set(inventoryData.map(item => item.item_name))];
    const quantities = items.map(name => {
      const latestEntry = inventoryData
        .filter(item => item.item_name === name)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      return parseInt(latestEntry.quantity);
    });

    return {
      labels: items,
      datasets: [{
        label: 'المخزون',
        data: quantities,
        backgroundColor: [
          '#fdcb6e',
          '#00cec9',
          '#e17055',
          '#6c5ce7',
          '#00b894',
          '#0984e3',
          '#d63031',
          '#e84393'
        ]
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: 'Cairo'
          }
        }
      },
      title: {
        display: true,
        text: 'إحصائيات العيادة',
        font: {
          family: 'Cairo',
          size: 16
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          min: 0
        }
      }
    }
  };

  return (
    <div className="dashboard">
      <h1>لوحة التحكم</h1>
      {loading ? (
        <div className="loading">جارٍ تحميل البيانات...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          <div className="chart-container">
            <div className="chart-card">
              <h2>إحصائيات المرضى</h2>
              {patientData.length > 0 ? (
                <Bar data={processPatientData()} options={chartOptions} />
              ) : (
                <p className="no-data">لا توجد بيانات متاحة</p>
              )}
            </div>
            <div className="chart-card">
              <h2>إحصائيات المواعيد</h2>
              {appointmentData.length > 0 ? (
                <Bar data={processAppointmentData()} options={chartOptions} />
              ) : (
                <p className="no-data">لا توجد بيانات متاحة</p>
              )}
            </div>
            <div className="chart-card">
              <h2>إحصائيات المخزون</h2>
              {inventoryData.length > 0 ? (
                <Pie data={processInventoryData()} options={chartOptions} />
              ) : (
                <p className="no-data">لا توجد بيانات متاحة</p>
              )}
            </div>
          </div>

          <div className="card notifications-card">
            <div className="card-header">
              <h2>مواعيد اليوم</h2>
              <select
                className="doctor-filter"
                onChange={(e) => setSelectedDoctor(e.target.value)}
                value={selectedDoctor}
              >
                <option value="all">جميع الأطباء</option>
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </div>
            {todayAppointments.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>اسم الطبيب</th>
                    <th>اسم المريض</th>
                    <th>الوقت</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {todayAppointments
                    .filter(appointment =>
                      selectedDoctor === 'all' ||
                      appointment.doctor_id === parseInt(selectedDoctor)
                    )
                    .map((appointment) => (
                      <tr key={appointment.id}>
                        <td>{appointment.doctor_name}</td>
                        <td>{`${appointment.first_name} ${appointment.last_name}`}</td>
                        <td>{appointment.appointment_time}</td>
                        <td>
                          <span className={`status ${appointment.status}`}>
                            {appointment.status === 'pending' ? 'قيد الانتظار' :
                              appointment.status === 'completed' ? 'مكتمل' :
                                appointment.status === 'cancelled' ? 'ملغي' : appointment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">لا توجد مواعيد لهذا اليوم.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
