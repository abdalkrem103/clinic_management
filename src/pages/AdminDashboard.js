import React from 'react';
import Layout from '../components/Layout';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const location = useLocation();
  const isHome = location.pathname === '/admin-dashboard';

  // صفحة البداية للوحة تحكم الأدمن
  const AdminHome = () => (
    <div className="admin-home">
      <div className="admin-welcome">
        <h1>مرحباً بك في لوحة الأدمن</h1>
        <p>اختر القسم الذي ترغب في إدارته من البطاقات أدناه</p>
      </div>
      <div className="admin-cards">
        <NavLink to="users" className="admin-card">
          <div className="card-icon">👥</div>
          <h3>إدارة المستخدمين</h3>
          <p>إضافة وتعديل وحذف المستخدمين</p>
        </NavLink>
        <NavLink to="doctors" className="admin-card">
          <div className="card-icon">🩺</div>
          <h3>إدارة الأطباء</h3>
          <p>إدارة بيانات الأطباء وساعات العمل</p>
        </NavLink>
        <NavLink to="services" className="admin-card">
          <div className="card-icon">🏥</div>
          <h3>إدارة الخدمات</h3>
          <p>إدارة الخدمات الطبية وأسعارها</p>
        </NavLink>
        <NavLink to="settings" className="admin-card">
          <div className="card-icon">⚙️</div>
          <h3>إعدادات الأدمن</h3>
          <p>تعديل بيانات الأدمن وكلمة المرور</p>
        </NavLink>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="admin-dashboard admin-dashboard-no-sidebar">
        <main className="admin-main">
          {isHome ? <AdminHome /> : <Outlet />}
        </main>
      </div>
    </Layout>
  );
};

export default AdminDashboard; 