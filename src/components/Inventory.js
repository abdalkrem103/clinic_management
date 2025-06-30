import React, {useState, useEffect} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faPlus, faTrash} from '@fortawesome/free-solid-svg-icons';
import '../styles/Inventory.css';
import api from '../api/api';

const Inventory = () => {
  const [inventory,
    setInventory] = useState([]);
  const [formData,
    setFormData] = useState({
    item_name: '',
    quantity: '',
    min_threshold: ''
  });
  const [isFormVisible,
    setIsFormVisible] = useState(false);

  const fetchInventory = async () => {
    try {
      const response = await api.get('/inventory.php');
      if (response.data.success) {
        setInventory(response.data.data);
      }
    } catch (error) {
      console.error('خطأ في جلب بيانات المخزون:', error);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleInputChange = (e) => {
    const {name, value} = e.target;
    if (name === 'quantity' || name === 'min_threshold') {
      const numValue = Math.max(0, parseInt(value) || 0);
      setFormData({...formData,
        [name]: numValue});
    } else {
      setFormData({...formData,
        [name]: value});
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/inventory.php', formData);
      if (response.data.success) {
        alert(response.data.message);
        fetchInventory();
        setFormData({item_name: '',
          quantity: '',
          min_threshold: ''});
        setIsFormVisible(false);
      } else {
        alert(`خطأ في إضافة العنصر: ${response.data.message}`);
      }
    } catch (error) {
      console.error('خطأ في إضافة العنصر:', error);
      alert('حدث خطأ أثناء إضافة العنصر');
    }
  };

  const handleUpdateQuantity = async (id, newQuantity) => {
    if (isNaN(newQuantity) || newQuantity < 0) return;
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    try {
      const response = await api.put('/inventory.php', {
        id,
        item_name: item.item_name,
        min_threshold: item.min_threshold,
        quantity: newQuantity
      });
      if (!response.data.success) {
        alert(`خطأ في تحديث الكمية: ${response.data.message}`);
      }
      fetchInventory();
    } catch (error) {
      console.error('خطأ في تحديث الكمية:', error);
      alert('حدث خطأ أثناء تحديث الكمية');
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا العنصر؟')) {
      try {
        const response = await api.delete(`/inventory.php?id=${id}`);
        if (response.data.success) {
          alert(response.data.message);
          fetchInventory();
        } else {
          alert(`خطأ في حذف العنصر: ${response.data.message}`);
        }
      } catch (error) {
        console.error('خطأ في حذف العنصر:', error);
        alert('حدث خطأ أثناء حذف العنصر');
      }
    }
  };

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <h1>إدارة المخزون</h1>
        <button className="add-item-btn" onClick={() => setIsFormVisible(!isFormVisible)}>
          <FontAwesomeIcon icon={faPlus} />
          <span>{isFormVisible ? 'إلغاء' : 'إضافة عنصر جديد'}</span>
        </button>
      </div>

      {isFormVisible && (
        <form className="add-item-form" onSubmit={handleAddItem}>
          <input
            name="item_name"
            onChange={handleInputChange}
            placeholder="اسم العنصر"
            required
            type="text"
            value={formData.item_name}
          />
          <input
            min="0"
            name="quantity"
            onChange={handleInputChange}
            placeholder="الكمية"
            required
            type="number"
            value={formData.quantity}
          />
          <input
            min="0"
            name="min_threshold"
            onChange={handleInputChange}
            placeholder="الحد الأدنى للتنبيه"
            required
            type="number"
            value={formData.min_threshold}
          />
          <button type="submit">إضافة العنصر</button>
        </form>
      )}

      <div className="inventory-table-wrapper">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>اسم العنصر</th>
              <th>الكمية الحالية</th>
              <th>الحد الأدنى</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr className={item.quantity < item.min_threshold ? 'low-stock' : ''} key={item.id}>
                <td>{item.item_name}</td>
                <td>
                  <div className="quantity-controls">
                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}>+</button>
                    <span>{item.quantity}</span>
                    <button disabled={item.quantity <= 0} onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}>-</button>
                  </div>
                </td>
                <td>{item.min_threshold}</td>
                <td>
                  <span className={`status-badge ${item.quantity < item.min_threshold ? 'status-low' : 'status-ok'}`}>
                    {item.quantity < item.min_threshold ? 'منخفض' : 'متوفر'}
                  </span>
                </td>
                <td className="actions-cell">
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDeleteItem(item.id)}
                    title="حذف"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
