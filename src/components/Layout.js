import React, {useState} from 'react';
import Sidebar from './Sidebar';
// import { Container, Button } from 'react-bootstrap'; // لم نعد نستخدم Container هنا
import '../styles/App.css'; // قد تحتاج إلى تعديل هذا المسار حسب هيكل مشروعك

const Layout = ({children}) => {
  const [sidebarCollapsed,
    setSidebarCollapsed] = useState(false);

  const handleSidebarCollapse = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  // نحتاج لزر تبديل السايدبار في الشاشات الصغيرة فقط إذا كان السايدبار يختفي تمامًا
  // في التصميم الحالي، السايدبار ثابت على اليمين، لذا زر التبديل غير ضروري هنا

  return (
    <div className="app">
      <Sidebar
        onCollapse={handleSidebarCollapse}
      />
      {/* زر تبديل السايدبار للشاشات الصغيرة، موجود في السايدبار نفسه الآن */}
      {/* <Button
        variant="primary"
        className="sidebar-toggle d-md-none"
        onClick={() => setShowSidebar(!showSidebar)}
      >
        ☰
      </Button> */}
      <div
        className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
      >
        {children}
      </div>
    </div>
  );
};

export default Layout;
