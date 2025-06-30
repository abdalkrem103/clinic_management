import React, { useEffect, useState } from 'react';
import { usersAPI } from '../api/api';
import '../styles/AdminUsers.css';
import { useNavigate } from 'react-router-dom';

const roleLabels = {
  'admin': 'مدير',
  'doctor': 'طبيب',
  'receptionist': 'موظف استقبال',
  'patient': 'مريض',
};
const roleOptions = [
  { value: 'admin', label: 'مدير' },
  { value: 'doctor', label: 'طبيب' },
  { value: 'receptionist', label: 'موظف استقبال' },
  { value: 'patient', label: 'مريض' },
];

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ username: '', password: '', role: 'receptionist' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // تعديل
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', username: '', password: '', role: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // حذف
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    usersAPI.getAll()
      .then(res => {
        setUsers(res.data.data || []);
        setError('');
      })
      .catch(() => {
        setError('فشل في جلب المستخدمين');
      })
      .finally(() => setLoading(false));
  };

  // إضافة
  const handleAddUser = (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');
    usersAPI.add(addForm)
      .then(res => {
        if (res.data.success) {
          setShowAddModal(false);
          setAddForm({ username: '', password: '', role: 'receptionist' });
          fetchUsers();
        } else {
          setAddError(res.data.message || 'فشل في إضافة المستخدم');
        }
      })
      .catch(() => setAddError('فشل في إضافة المستخدم'))
      .finally(() => setAddLoading(false));
  };

  // فتح نافذة التعديل
  const openEditModal = (user) => {
    setEditForm({ id: user.id, username: user.username, password: '', role: user.role });
    setEditError('');
    setShowEditModal(true);
  };

  // تعديل المستخدم
  const handleEditUser = (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    // إذا لم يتم إدخال كلمة مرور جديدة، لا ترسلها
    const data = { id: editForm.id, username: editForm.username, role: editForm.role };
    if (editForm.password) data.password = editForm.password;
    usersAPI.update(data)
      .then(res => {
        if (res.data.success) {
          setShowEditModal(false);
          fetchUsers();
        } else {
          setEditError(res.data.message || 'فشل في تعديل المستخدم');
        }
      })
      .catch(() => setEditError('فشل في تعديل المستخدم'))
      .finally(() => setEditLoading(false));
  };

  // حذف المستخدم
  const handleDeleteUser = () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    setDeleteError('');
    usersAPI.delete(deleteId)
      .then(res => {
        if (res.data.success) {
          setDeleteId(null);
          fetchUsers();
        } else {
          setDeleteError(res.data.message || 'فشل في حذف المستخدم');
        }
      })
      .catch(() => setDeleteError('فشل في حذف المستخدم'))
      .finally(() => setDeleteLoading(false));
  };

  return (
    <div className="admin-users">
      <button className="back-btn" onClick={() => navigate('/admin-dashboard')}>
        ← عودة للوحة الأدمن
      </button>
      <div className="admin-users-header">
        <h2>إدارة المستخدمين</h2>
        <button className="add-user-btn" onClick={() => setShowAddModal(true)}>إضافة مستخدم جديد</button>
      </div>
      {loading ? (
        <div className="loading">جاري التحميل...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <table className="admin-users-table">
          <thead>
            <tr>
              <th>اسم المستخدم</th>
              <th>الدور</th>
              <th>آخر تسجيل دخول</th>
              <th>تاريخ الإنشاء</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{roleLabels[user.role] || user.role}</td>
                <td>{user.last_login || '-'}</td>
                <td>{user.created_at}</td>
                <td>
                  <button className="edit-btn" onClick={() => openEditModal(user)}>تعديل</button>
                  <button className="delete-btn" onClick={() => setDeleteId(user.id)}>حذف</button>
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
            <h3>إضافة مستخدم جديد</h3>
            <form onSubmit={handleAddUser} className="add-user-form">
              <div className="form-row">
                <label>اسم المستخدم:</label>
                <input
                  type="text"
                  value={addForm.username}
                  onChange={e => setAddForm(f => ({ ...f, username: e.target.value }))}
                  required
                />
              </div>
              <div className="form-row">
                <label>كلمة المرور:</label>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>
              <div className="form-row">
                <label>الدور:</label>
                <select
                  value={addForm.role}
                  onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}
                  required
                >
                  {roleOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
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
            <h3>تعديل المستخدم</h3>
            <form onSubmit={handleEditUser} className="add-user-form">
              <div className="form-row">
                <label>اسم المستخدم:</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))}
                  required
                />
              </div>
              <div className="form-row">
                <label>كلمة المرور الجديدة (اختياري):</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="اتركها فارغة للإبقاء على كلمة المرور الحالية"
                />
              </div>
              <div className="form-row">
                <label>الدور:</label>
                <select
                  value={editForm.role}
                  onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                  required
                >
                  {roleOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
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
            <h3>تأكيد حذف المستخدم</h3>
            <p>هل أنت متأكد أنك تريد حذف هذا المستخدم؟ لا يمكن التراجع عن هذه العملية.</p>
            {deleteError && <div className="error-message">{deleteError}</div>}
            <div className="form-actions">
              <button className="cancel-btn" onClick={() => setDeleteId(null)}>إلغاء</button>
              <button className="delete-btn" onClick={handleDeleteUser} disabled={deleteLoading}>
                {deleteLoading ? 'جاري الحذف...' : 'حذف'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers; 