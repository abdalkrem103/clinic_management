import React, {useState} from 'react';
import {Nav, Button} from 'react-bootstrap';
import {Link, useLocation} from 'react-router-dom';
import {FaHome, FaUsers, FaCalendarAlt, FaUserMd,  FaBoxes, FaMoneyBillWave, FaBell, FaSignOutAlt, FaAngleLeft, FaAngleRight, FaTools} from 'react-icons/fa';
import {authAPI} from '../api/api';
import '../styles/Sidebar.css';

const Sidebar = ({onCollapse}) => {
  const location = useLocation();
  const [collapsed,
    setCollapsed] = useState(false);

  const handleLogout = () => {
    authAPI.logout();
  };

  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    if (onCollapse) {
      onCollapse(newState);
    }
  };

  const user = JSON.parse(localStorage.getItem('user'));

  const menuItems = [
    {path: '/dashboard',
      icon: <FaHome />,
      text: 'لوحة التحكم'},
    {path: '/patients',
      icon: <FaUsers />,
      text: 'المرضى'},
    {path: '/appointments',
      icon: <FaCalendarAlt />,
      text: 'المواعيد'},
    {path: '/doctor-schedule',
      icon: <FaUserMd />,
      text: 'جدول الأطباء'},
    //        { path: '/xray-analysis', icon: <FaXRay />, text: 'تحليل الأشعة' },
    {path: '/inventory',
      icon: <FaBoxes />,
      text: 'المخزون'},
    {path: '/payments',
      icon: <FaMoneyBillWave />,
      text: 'المدفوعات'},
    {path: '/notifications',
      icon: <FaBell />,
      text: 'الإشعارات'}
  ];

  // إضافة عنصر إدارة النظام للأدمن فقط
  if (user?.role === 'admin') {
    menuItems.push({
      path: '/admin-dashboard',
      icon: <FaTools />,
      text: 'إدارة النظام'
    });
  }

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && <h3>العيادة</h3>}
        <Button
          aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className="toggle-btn"
          onClick={toggleSidebar}
          variant="link"
        >
          {collapsed ? <FaAngleRight /> : <FaAngleLeft />}
        </Button>
      </div>
      <Nav className="flex-column sidebar-menu">
        {menuItems.map((item) => (
          <Nav.Item key={item.path}>
            <Nav.Link
              as={Link}
              className={location.pathname === item.path ? 'active' : ''}
              to={item.path}
            >
              {item.icon}
              {!collapsed && <span>{item.text}</span>}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>
      <div className="sidebar-footer">
        <Button
          className="logout-btn"
          onClick={handleLogout}
          variant="danger"
        >
          <FaSignOutAlt />
          {!collapsed && <span>تسجيل الخروج</span>}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
