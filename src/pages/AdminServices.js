import React, { useEffect, useState } from 'react';
import { servicesAPI } from '../api/api';
import '../styles/AdminServices.css';
import { useNavigate } from 'react-router-dom';

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // إضافة
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', description: '', price: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // تعديل
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', name: '', description: '', price: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // حذف
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = () => {
    setLoading(true);
    servicesAPI.getAll()
      .then(res => {
        setServices(res.data.data || []);
        setError('');
      })
      .catch(() => setError('فشل في جلب الخدمات'))
      .finally(() => setLoading(false));
  };

  // إضافة خدمة
  const handleAddService = (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');
    servicesAPI.add(addForm)
      .then(res => {
        if (res.data.success) {
          setShowAddModal(false);
          setAddForm({ name: '', description: '', price: '' });
          fetchServices();
        } else {
          setAddError(res.data.message || 'فشل في إضافة الخدمة');
        }
      })
      .catch(() => setAddError('فشل في إضافة الخدمة'))
      .finally(() => setAddLoading(false));
  };

  // فتح نافذة التعديل
  const openEditModal = (service) => {
    setEditForm({
      id: service.id,
      name: service.name,
      description: service.description,
      price: service.price,
    });
    setEditError('');
    setShowEditModal(true);
  };

  // تعديل الخدمة
  const handleEditService = (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    servicesAPI.update(editForm)
      .then(res => {
        if (res.data.success) {
          setShowEditModal(false);
          fetchServices();
        } else {
          setEditError(res.data.message || 'فشل في تعديل الخدمة');
        }
      })
      .catch(() => setEditError('فشل في تعديل الخدمة'))
      .finally(() => setEditLoading(false));
  };

  // حذف الخدمة
  const handleDeleteService = () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    setDeleteError('');
    servicesAPI.delete(deleteId)
      .then(res => {
        if (res.data.success) {
          setDeleteId(null);
          fetchServices();
        } else {
          setDeleteError(res.data.message || 'فشل في حذف الخدمة');
        }
      })
      .catch(() => setDeleteError('فشل في حذف الخدمة'))
      .finally(() => setDeleteLoading(false));
  };

  return (
    <div className="admin-services">
      <button className="back-btn" onClick={() => navigate('/admin-dashboard')}>
        ← عودة للوحة الأدمن
      </button>
      <div className="admin-services-header">
        <h2>إدارة الخدمات</h2>
        <button className="add-service-btn" onClick={() => setShowAddModal(true)}>إضافة خدمة جديدة</button>
      </div>
      {loading ? (
        <div className="loading">جاري التحميل...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <table className="admin-services-table">
          <thead>
            <tr>
              <th>اسم الخدمة</th>
              <th>الوصف</th>
              <th>السعر</th>
              <th>تاريخ الإضافة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {services.map(service => (
              <tr key={service.id}>
                <td>{service.name}</td>
                <td>{service.description}</td>
                <td>{service.price}</td>
                <td>{service.created_at}</td>
                <td>
                  <button className="edit-btn" onClick={() => openEditModal(service)}>تعديل</button>
                  <button className="delete-btn" onClick={() => setDeleteId(service.id)}>حذف</button>
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
            <h3>إضافة خدمة جديدة</h3>
            <form onSubmit={handleAddService} className="add-service-form">
              <div className="form-row">
                <label>اسم الخدمة:</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-row">
                <label>الوصف:</label>
                <textarea
                  value={addForm.description}
                  onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
                  required
                />
              </div>
              <div className="form-row">
                <label>السعر:</label>
                <input
                  type="number"
                  value={addForm.price}
                  onChange={e => setAddForm(f => ({ ...f, price: e.target.value }))}
                  min="0"
                  required
                />
              </div>
              {addError && <div className="error-message">{addError}</div>}
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowAddModal(false)}>إلغاء</button>
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
            <h3>تعديل الخدمة</h3>
            <form onSubmit={handleEditService} className="add-service-form">
              <div className="form-row">
                <label>اسم الخدمة:</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-row">
                <label>الوصف:</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  required
                />
              </div>
              <div className="form-row">
                <label>السعر:</label>
                <input
                  type="number"
                  value={editForm.price}
                  onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                  min="0"
                  required
                />
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
            <h3>تأكيد حذف الخدمة</h3>
            <p>هل أنت متأكد أنك تريد حذف هذه الخدمة؟ لا يمكن التراجع عن هذه العملية.</p>
            {deleteError && <div className="error-message">{deleteError}</div>}
            <div className="form-actions">
              <button className="cancel-btn" onClick={() => setDeleteId(null)}>إلغاء</button>
              <button className="delete-btn" onClick={handleDeleteService} disabled={deleteLoading}>
                {deleteLoading ? 'جاري الحذف...' : 'حذف'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServices; 