import React, {useState} from 'react';
import {Navbar, Nav, Container, Button, Badge} from 'react-bootstrap';
import {Link, useNavigate} from 'react-router-dom';
import {useNotifications} from '../contexts/NotificationContext';

const NavigationBar = () => {
  const [expanded,
    setExpanded] = useState(false);
  const navigate = useNavigate();
  const {unreadCount} = useNotifications();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <Navbar
      bg="primary"
      className="mb-4"
      expand="lg"
      expanded={expanded}
      onToggle={(expanded) => setExpanded(expanded)}
      variant="dark"
    >
      <Container>
        <Navbar.Brand as={Link} to="/dashboard">نظام إدارة العيادة</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} onClick={() => setExpanded(false)} to="/dashboard">
                            لوحة التحكم
            </Nav.Link>
            {user?.role === 'admin' && (
              <Nav.Link as={Link} onClick={() => setExpanded(false)} to="/admin-dashboard">
                            لوحة تحكم الأدمن
              </Nav.Link>
            )}
            <Nav.Link as={Link} onClick={() => setExpanded(false)} to="/patients">
                            المرضى
            </Nav.Link>
            <Nav.Link as={Link} onClick={() => setExpanded(false)} to="/appointments">
                            المواعيد
            </Nav.Link>
            {user?.role === 'doctor' && (
              <Nav.Link as={Link} onClick={() => setExpanded(false)} to="/doctor-schedule">
                                جدول العمل
              </Nav.Link>
            )}
            <Nav.Link as={Link} onClick={() => setExpanded(false)} to="/xray-analysis">
                            الأشعة
            </Nav.Link>
            <Nav.Link as={Link} onClick={() => setExpanded(false)} to="/inventory">
                            المخزون
            </Nav.Link>
            <Nav.Link as={Link} onClick={() => setExpanded(false)} to="/payments">
                            المدفوعات
            </Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link as={Link} onClick={() => setExpanded(false)} to="/notifications">
                            الإشعارات
              {unreadCount > 0 && (
                <Badge bg="danger" className="ms-1">
                  {unreadCount}
                </Badge>
              )}
            </Nav.Link>
            <Nav.Link as={Link} onClick={() => setExpanded(false)} to="/profile">
                            الملف الشخصي
            </Nav.Link>
            <Button
              className="ms-2"
              onClick={handleLogout}
              variant="outline-light"
            >
                            تسجيل الخروج
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;
