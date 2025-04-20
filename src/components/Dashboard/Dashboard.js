import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FaBars, FaTimes, FaSignOutAlt, FaBook, FaHome,
  FaUser, FaChalkboardTeacher, FaQuestionCircle
} from 'react-icons/fa';
import './Dashboard.css';
import Seminarios from '../Seminarios/Seminarios';
import Quizzes from '../Quizzes/Quizzes';

const Dashboard = ({ onLogout, userData }) => {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('inicio');

  const location = useLocation();
  const navigate = useNavigate();

  const api = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL,
    withCredentials: true
  });

  const handleLogout = useCallback(async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    } finally {
      localStorage.removeItem('sessionActive');
      onLogout();
      navigate('/login');
    }
  }, [api, onLogout, navigate]);

  useEffect(() => {
    const resetInactivityTimer = () => {
      clearTimeout(window.inactivityTimer);
      window.inactivityTimer = setTimeout(handleLogout, 30 * 60 * 1000);
    };

    ['mousedown', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    resetInactivityTimer();

    return () => {
      ['mousedown', 'keypress', 'scroll', 'touchstart'].forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
      clearTimeout(window.inactivityTimer);
    };
  }, [handleLogout]);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const { data } = await api.get('/verify-session');
        if (!data.success) throw new Error();
      } catch {
        handleLogout();
      }
    };

    verifySession();
  }, [api, handleLogout]);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab && tab !== activeTab) setActiveTab(tab);
  }, [location.search, activeTab]);

  // Controlar carga solo cuando userData esté listo
  useEffect(() => {
    if (userData && userData.nombre) {
      setLoading(false);
    }
  }, [userData]);

  const changeTab = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    navigate(`/dashboard?tab=${tab}`);
  };

  const renderCursos = () => {
    if (loading) return <p>Cargando datos...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (!cursos.length) return <p>No tienes cursos asignados</p>;

    return (
      <div className="cursos-grid">
        {cursos.map((curso, i) => (
          <div key={i} className="curso-card">
            <h3>{curso.denominacion}</h3>
            <ul>
              {curso.cuadernillos?.map((cuad, j) => (
                <li key={j}>{cuad.nombre}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'perfil':
        return <section><h2>Perfil del Estudiante</h2></section>;
      case 'seminarios':
        return <Seminarios />;
      case 'quizzes':
        return <Quizzes />;
      case 'cursos':
        return renderCursos();
      default:
        return <section><h2>Inicio</h2></section>;
    }
  };

  // Bloquear render mientras no haya userData cargado
  if (!userData || !userData.nombre) {
    return (
      <div className="dashboard-loading">
        <p>Cargando usuario...</p>
      </div>
    );
  }

  const nombreEstudiante = userData.nombre;

  return (
    <div className="dashboard-container">
      <button className="mobile-menu-button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        {mobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <nav className="sidebar-nav">
          {[['inicio', FaHome], ['perfil', FaUser], ['seminarios', FaChalkboardTeacher], ['quizzes', FaQuestionCircle], ['cursos', FaBook]].map(([tab, Icon]) => (
            <button key={tab} className={`nav-item ${activeTab === tab ? 'active' : ''}`} onClick={() => changeTab(tab)}>
              <Icon className="nav-icon" /><span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
            </button>
          ))}
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <FaSignOutAlt className="nav-icon" /><span>Cerrar Sesión</span>
          </button>
        </nav>
      </aside>

      {mobileMenuOpen && <div className="menu-overlay" onClick={() => setMobileMenuOpen(false)} />}

      <main className="main-content">
        <header>
          <h1>Bienvenido, {nombreEstudiante}</h1>
          <p className="text-sm">Correo: {userData?.email}</p>
          <p className="text-sm">ID: {userData?.id_user}</p>
        </header>
        <section className="content-section">{renderContent()}</section>
      </main>
    </div>
  );
};

export default Dashboard;
