import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SessionTimeout = ({ logout }) => {
  const navigate = useNavigate();
  let inactivityTimer;

  const resetTimer = () => {
    clearTimeout(inactivityTimer);
    // 30 minutos de inactividad (ajusta según necesites)
    inactivityTimer = setTimeout(() => {
      logout();
      navigate('/login');
    }, 30 * 60 * 1000);
  };

  useEffect(() => {
    // Eventos que resetearán el timer
    const events = ['mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer(); // Inicia el timer

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      clearTimeout(inactivityTimer);
    };
  }, []);

  return null;
};

export default SessionTimeout;