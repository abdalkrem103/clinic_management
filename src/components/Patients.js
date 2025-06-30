import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import {patientsAPI} from '../api/api';
import '../styles/Patients.css';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faPlus, faSearch, faTimes, faEdit, faTrash} from '@fortawesome/free-solid-svg-icons';

// مكون المودال الاحترافي
const Modal = ({isOpen, onClose, title, children, className}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen,
    onClose]);

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${className || ''}`} onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close-button" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

// مكون نموذج المريض
const PatientForm = ({patient, onSubmit, onCancel, submitText = 'حفظ'}) => {
  const [formData,
    setFormData] = useState(patient || {
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    date_of_birth: '',
    gender: 'ذكر',
    address: '',
    blood_type: '',
    allergies: ''
  });

  const handleChange = (e) => {
    const {name, value} = e.target;
    setFormData(prev => ({...prev,
      [name]: value}));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="patient-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="first_name">الاسم الأول *</label>
          <input
            id="first_name"
            name="first_name"
            onChange={handleChange}
            placeholder="أدخل الاسم الأول"
            required
            type="text"
            value={formData.first_name}
          />
        </div>

        <div className="form-group">
          <label htmlFor="last_name">اسم العائلة</label>
          <input
            id="last_name"
            name="last_name"
            onChange={handleChange}
            placeholder="أدخل اسم العائلة"
            type="text"
            value={formData.last_name}
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone_number">رقم الهاتف *</label>
          <input
            id="phone_number"
            name="phone_number"
            onChange={handleChange}
            placeholder="أدخل رقم الهاتف"
            required
            type="tel"
            value={formData.phone_number}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">البريد الإلكتروني</label>
          <input
            id="email"
            name="email"
            onChange={handleChange}
            placeholder="أدخل البريد الإلكتروني"
            type="email"
            value={formData.email}
          />
        </div>

        <div className="form-group">
          <label htmlFor="date_of_birth">تاريخ الميلاد</label>
          <input
            id="date_of_birth"
            name="date_of_birth"
            onChange={handleChange}
            type="date"
            value={formData.date_of_birth}
          />
        </div>

        <div className="form-group">
          <label htmlFor="gender">الجنس</label>
          <select
            id="gender"
            name="gender"
            onChange={handleChange}
            value={formData.gender}
          >
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="address">العنوان</label>
        <input
          id="address"
          name="address"
          onChange={handleChange}
          placeholder="أدخل العنوان"
          type="text"
          value={formData.address}
        />
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="blood_type">فصيلة الدم</label>
          <select
            id="blood_type"
            name="blood_type"
            onChange={handleChange}
            value={formData.blood_type}
          >
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
          <label htmlFor="allergies">الحساسية</label>
          <textarea
            id="allergies"
            name="allergies"
            onChange={handleChange}
            placeholder="أدخل الحساسية إن وجدت"
            rows="3"
            value={formData.allergies}
          />
        </div>
      </div>

      <div className="form-actions">
        <button className="btn-primary" type="submit">
          {submitText}
        </button>
        <button className="btn-secondary" onClick={onCancel} type="button">
          إلغاء
        </button>
      </div>
    </form>
  );
};

const Patients = () => {
  const [patients,
    setPatients] = useState([]);
  const [loading,
    setLoading] = useState(true);
  const [error,
    setError] = useState('');
  const [searchQuery,
    setSearchQuery] = useState('');
  const [showAddModal,
    setShowAddModal] = useState(false);
  const [showEditModal,
    setShowEditModal] = useState(false);
  const [editingPatient,
    setEditingPatient] = useState(null);

  const fetchPatients = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await patientsAPI.getAll();
      if (response.data.success) {
        setPatients(response.data.data);
      } else {
        setError(response.data.message || 'حدث خطأ في تحميل بيانات المرضى');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setError(error.response?.data?.message || 'حدث خطأ في تحميل بيانات المرضى');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const validatePatientData = (data) => {
    const errors = [];

    if (!data.first_name?.trim()) {
      errors.push('الاسم الأول مطلوب');
    }

    if (!data.phone_number?.trim()) {
      errors.push('رقم الهاتف مطلوب');
    } else if (!/^\d{10,15}$/.test(data.phone_number)) {
      errors.push('رقم الهاتف يجب أن يكون صالحاً (10-15 رقم)');
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('البريد الإلكتروني غير صالح');
    }

    return errors;
  };

  const handleAddPatient = async (formData) => {
    const errors = validatePatientData(formData);
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    try {
      const response = await patientsAPI.add(formData);
      if (response.data.success) {
        await fetchPatients();
        setShowAddModal(false);
        alert('تم إضافة المريض بنجاح');
      } else {
        alert(response.data.message || 'فشل في إضافة المريض');
      }
    } catch (error) {
      console.error('Error adding patient:', error);
      const errorMessage = error.response?.data?.message || 'حدث خطأ أثناء إضافة المريض';
      alert(errorMessage);
    }
  };

  const handleUpdatePatient = async (formData) => {
    if (!editingPatient?.id) return;

    const errors = validatePatientData(formData);
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    try {
      const response = await patientsAPI.update(editingPatient.id, formData);
      if (response.data.success) {
        await fetchPatients();
        setShowEditModal(false);
        setEditingPatient(null);
        alert('تم تحديث بيانات المريض بنجاح');
      } else {
        alert(response.data.message || 'فشل في تحديث بيانات المريض');
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      const errorMessage = error.response?.data?.message || 'حدث خطأ أثناء تحديث بيانات المريض';
      alert(errorMessage);
    }
  };

  const handleDeletePatient = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المريض؟\n\nهذا الإجراء لا يمكن التراجع عنه.')) return;

    try {
      const response = await patientsAPI.delete(id);
      if (response.data.success) {
        await fetchPatients();
        alert('تم حذف المريض بنجاح');
      } else {
        alert(response.data.message || 'فشل في حذف المريض');
      }
    } catch (error) {
      console.error('Error deleting patient:', error);
      const errorMessage = error.response?.data?.message || 'حدث خطأ أثناء حذف المريض';
      alert(errorMessage);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const openEditModal = (patient) => {
    setEditingPatient({...patient});
    setShowEditModal(true);
  };

  const filteredPatients = patients.filter((p) => {
    const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
    const phoneNumber = p.phone_number?.toString() ?? '';
    const email = p.email?.toLowerCase() ?? '';

    return fullName.includes(searchQuery) ||
           phoneNumber.includes(searchQuery) ||
           email.includes(searchQuery);
  });

  if (loading) return <div className="loading">جاري تحميل البيانات...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="patients-container">
      <div className="patients-header">
        <h1>قائمة المرضى</h1>
        <button className="add-patient-btn" onClick={() => setShowAddModal(true)}>
          <FontAwesomeIcon icon={faPlus} />
          <span>إضافة مريض جديد</span>
        </button>
      </div>

      <div className="search-filter-container">
        <div className="search-input-wrapper">
          <FontAwesomeIcon icon={faSearch} />
          <input
            className="search-input"
            onChange={handleSearch}
            placeholder="ابحث بالاسم، رقم الهاتف، أو البريد الإلكتروني..."
            type="text"
            value={searchQuery}
          />
        </div>
      </div>

      <div className="patients-table-wrapper">
        <table className="patients-table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>رقم الهاتف</th>
              <th>البريد الإلكتروني</th>
              <th>تاريخ الميلاد</th>
              <th>الجنس</th>
              <th>فصيلة الدم</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <tr key={patient.id}>
                  <td>
                    <Link className="patient-name-link" to={`/patients/${patient.id}`}>
                      {patient.first_name} {patient.last_name}
                    </Link>
                  </td>
                  <td>{patient.phone_number}</td>
                  <td>{patient.email || '-'}</td>
                  <td>{patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('ar-EG') : '-'}</td>
                  <td>
                    {patient.gender === 'male' ? 'ذكر' : patient.gender === 'female' ? 'أنثى' : '-'}
                  </td>
                  <td>{patient.blood_type || '-'}</td>
                  <td className="actions-cell">
                    <button
                      className="action-btn edit-btn"
                      onClick={() => openEditModal(patient)}
                      title="تعديل"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDeletePatient(patient.id)}
                      title="حذف"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="no-data" colSpan="7">
                  {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد بيانات مرضى'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content patient-register-modal">
            <button aria-label="إغلاق" className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
            <h2 style={{textAlign: 'center',
              marginBottom: '24px'}}>إضافة مريض جديد</h2>
            <PatientForm
              onCancel={() => setShowAddModal(false)}
              onSubmit={handleAddPatient}
              submitText="إضافة"
            />
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingPatient(null);
        }}
        title="تعديل بيانات المريض"
      >
        <PatientForm
          onCancel={() => {
            setShowEditModal(false);
            setEditingPatient(null);
          }}
          onSubmit={handleUpdatePatient}
          patient={editingPatient}
          submitText="حفظ التغييرات"
        />
      </Modal>
    </div>
  );
};

export default Patients;
