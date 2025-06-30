import React, { useEffect, useState } from 'react';
import { doctorsAPI } from '../api/api';
import '../styles/AdminDoctors.css';
import { useNavigate } from 'react-router-dom';

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // إضافة
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', specialty: '', experience: '', working_hours: '', image: null });
  const [addImagePreview, setAddImagePreview] = useState(null);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // تعديل
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', name: '', specialty: '', experience: '', working_hours: '', image: null, oldImage: '' });
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // حذف
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = () => {
    setLoading(true);
    doctorsAPI.getAll()
      .then(res => {
        setDoctors(res.data.data || []);
        setError('');
      })
      .catch(() => setError('فشل في جلب الأطباء'))
      .finally(() => setLoading(false));
  };

  // إضافة طبيب
  const handleAddDoctor = (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');
    const formData = new FormData();
    formData.append('name', addForm.name);
    formData.append('specialty', addForm.specialty);
    formData.append('experience', addForm.experience);
    formData.append('working_hours', addForm.working_hours);
    if (addForm.image) formData.append('image', addForm.image);
    doctorsAPI.add(formData)
      .then(res => {
        if (res.data.success) {
          setShowAddModal(false);
          setAddForm({ name: '', specialty: '', experience: '', working_hours: '', image: null });
          setAddImagePreview(null);
          fetchDoctors();
        } else {
          setAddError(res.data.message || 'فشل في إضافة الطبيب');
        }
      })
      .catch(() => setAddError('فشل في إضافة الطبيب'))
      .finally(() => setAddLoading(false));
  };

  // معاينة الصورة (إضافة)
  const handleAddImageChange = (e) => {
    const file = e.target.files[0];
    setAddForm(f => ({ ...f, image: file }));
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAddImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setAddImagePreview(null);
    }
  };

  // فتح نافذة التعديل
  const openEditModal = (doctor) => {
    setEditForm({
      id: doctor.id,
      name: doctor.name,
      specialty: doctor.specialty,
      experience: doctor.experience,
      working_hours: doctor.working_hours,
      image: null,
      oldImage: doctor.image || '',
    });
    setEditImagePreview(doctor.image ? (doctor.image.startsWith('http') ? doctor.image : `/images/${doctor.image}`) : null);
    setEditError('');
    setShowEditModal(true);
  };

  // معاينة الصورة (تعديل)
  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    setEditForm(f => ({ ...f, image: file }));
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setEditImagePreview(editForm.oldImage ? (editForm.oldImage.startsWith('http') ? editForm.oldImage : `/images/${editForm.oldImage}`) : null);
    }
  };

  // تعديل الطبيب
  const handleEditDoctor = (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    const formData = new FormData();
    formData.append('id', editForm.id);
    formData.append('name', editForm.name);
    formData.append('specialty', editForm.specialty);
    formData.append('experience', editForm.experience);
    formData.append('working_hours', editForm.working_hours);
    if (editForm.image) formData.append('image', editForm.image);
    doctorsAPI.update(formData)
      .then(res => {
        if (res.data.success) {
          setShowEditModal(false);
          setEditImagePreview(null);
          fetchDoctors();
        } else {
          setEditError(res.data.message || 'فشل في تعديل الطبيب');
        }
      })
      .catch(() => setEditError('فشل في تعديل الطبيب'))
      .finally(() => setEditLoading(false));
  };

  // حذف الطبيب
  const handleDeleteDoctor = () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    setDeleteError('');
    doctorsAPI.delete(deleteId)
      .then(res => {
        if (res.data.success) {
          setDeleteId(null);
          fetchDoctors();
        } else {
          setDeleteError(res.data.message || 'فشل في حذف الطبيب');
        }
      })
      .catch(() => setDeleteError('فشل في حذف الطبيب'))
      .finally(() => setDeleteLoading(false));
  };

  return (
    <div className="admin-doctors">
      <button className="back-btn" onClick={() => navigate('/admin-dashboard')}>
        ← عودة للوحة الأدمن
      </button>
      <div className="admin-doctors-header">
        <h2>إدارة الأطباء</h2>
        <button className="add-doctor-btn" onClick={() => setShowAddModal(true)}>إضافة طبيب جديد</button>
      </div>
      {loading ? (
        <div className="loading">جاري التحميل...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <table className="admin-doctors-table">
          <thead>
            <tr>
              <th>الصورة</th>
              <th>الاسم</th>
              <th>التخصص</th>
              <th>الخبرة (سنة)</th>
              <th>ساعات العمل</th>
              <th>تاريخ الإضافة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map(doctor => (
              <tr key={doctor.id}>
                <td>
                  {doctor.image ? (
                    <img src={doctor.image.startsWith('http') ? doctor.image : `/images/${doctor.image}`} alt={doctor.name} className="doctor-thumb" />
                  ) : (
                    <span className="no-image">لا يوجد</span>
                  )}
                </td>
                <td>{doctor.name}</td>
                <td>{doctor.specialty}</td>
                <td>{doctor.experience}</td>
                <td>{doctor.working_hours}</td>
                <td>{doctor.created_at}</td>
                <td>
                  <button className="edit-btn" onClick={() => openEditModal(doctor)}>تعديل</button>
                  <button className="delete-btn" onClick={() => setDeleteId(doctor.id)}>حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal إضافة */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>إضافة طبيب جديد</h3>
            <form onSubmit={handleAddDoctor} className="add-doctor-form">
              <div className="form-row">
                <label>الاسم:</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-row">
                <label>التخصص:</label>
                <input
                  type="text"
                  value={addForm.specialty}
                  onChange={e => setAddForm(f => ({ ...f, specialty: e.target.value }))}
                  required
                />
              </div>
              <div className="form-row">
                <label>الخبرة (سنة):</label>
                <input
                  type="number"
                  value={addForm.experience}
                  onChange={e => setAddForm(f => ({ ...f, experience: e.target.value }))}
                  min="0"
                  required
                />
              </div>
              <div className="form-row">
                <label>ساعات العمل:</label>
                <input
                  type="text"
                  value={addForm.working_hours}
                  onChange={e => setAddForm(f => ({ ...f, working_hours: e.target.value }))}
                  required
                />
              </div>
              <div className="form-row">
                <label>الصورة:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAddImageChange}
                />
                {addImagePreview && (
                  <img src={addImagePreview} alt="معاينة" className="doctor-thumb preview" />
                )}
              </div>
              {addError && <div className="error-message">{addError}</div>}
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => { setShowAddModal(false); setAddImagePreview(null); }}>إلغاء</button>
                <button type="submit" className="submit-btn" disabled={addLoading}>{addLoading ? 'جاري الإضافة...' : 'إضافة'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal تعديل */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>تعديل الطبيب</h3>
            <form onSubmit={handleEditDoctor} className="add-doctor-form">
              <div className="form-row">
                <label>الاسم:</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-row">
                <label>التخصص:</label>
                <input
                  type="text"
                  value={editForm.specialty}
                  onChange={e => setEditForm(f => ({ ...f, specialty: e.target.value }))}
                  required
                />
              </div>
              <div className="form-row">
                <label>الخبرة (سنة):</label>
                <input
                  type="number"
                  value={editForm.experience}
                  onChange={e => setEditForm(f => ({ ...f, experience: e.target.value }))}
                  min="0"
                  required
                />
              </div>
              <div className="form-row">
                <label>ساعات العمل:</label>
                <input
                  type="text"
                  value={editForm.working_hours}
                  onChange={e => setEditForm(f => ({ ...f, working_hours: e.target.value }))}
                  required
                />
              </div>
              <div className="form-row">
                <label>الصورة:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageChange}
                />
                {editImagePreview && (
                  <img src={editImagePreview} alt="معاينة" className="doctor-thumb preview" />
                )}
              </div>
              {editError && <div className="error-message">{editError}</div>}
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowEditModal(false)}>إلغاء</button>
                <button type="submit" className="submit-btn" disabled={editLoading}>{editLoading ? 'جاري التعديل...' : 'حفظ التعديلات'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* تأكيد الحذف */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>تأكيد حذف الطبيب</h3>
            <p>هل أنت متأكد أنك تريد حذف هذا الطبيب؟ لا يمكن التراجع عن هذه العملية.</p>
            {deleteError && <div className="error-message">{deleteError}</div>}
            <div className="form-actions">
              <button className="cancel-btn" onClick={() => setDeleteId(null)}>إلغاء</button>
              <button className="delete-btn" onClick={handleDeleteDoctor} disabled={deleteLoading}>
                {deleteLoading ? 'جاري الحذف...' : 'حذف'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDoctors; 