import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import './Quizzes.css';

// Componente de carga mejorado
const LoadingSpinner = () => (
  <div className="loading-container">
    <div className="spinner" aria-label="Cargando quizzes"></div>
    <p>Cargando quizzes...</p>
  </div>
);

// Componente de error con capacidad de reintento
const ErrorDisplay = ({ error, onRetry }) => (
  <div className="error-container">
    <p className="error-message">Error: {error}</p>
    <button 
      onClick={onRetry}
      className="retry-button"
      aria-label="Reintentar carga de quizzes"
    >
      Reintentar
    </button>
  </div>
);

ErrorDisplay.propTypes = {
  error: PropTypes.string.isRequired,
  onRetry: PropTypes.func.isRequired
};

const Quizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Función para obtener quizzes con manejo de errores
  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('http://localhost:5000/api/quizzes', {
        withCredentials: true,
        timeout: 10000 // 10 segundos de timeout
      });
      
      if (response.data?.success) {
        setQuizzes(response.data.data || []);
      } else {
        throw new Error(response.data?.error || "Respuesta inválida del servidor");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                         err.message || 
                         "Error al conectar con el servidor";
      setError(errorMessage);
      
      // Redirigir si no está autorizado
      if (err.response?.status === 401) {
        navigate('/login', { replace: true });
      }
      
      // Log del error para debugging (solo en desarrollo)
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching quizzes:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const handleStartQuiz = (quizId) => {
    // Validación básica del quizId
    if (!quizId || !quizzes.some(quiz => quiz.id === quizId)) {
      setError('Quiz seleccionado no válido');
      return;
    }
    navigate(`/quiz/${quizId}`);
  };

  // Renderizado condicional
  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={fetchQuizzes} />;
  }

  if (quizzes.length === 0) {
    return (
      <div className="empty-container">
        <p>No hay quizzes disponibles en este momento.</p>
        <button onClick={fetchQuizzes} className="retry-button">
          Actualizar lista
        </button>
      </div>
    );
  }

  return (
    <div className="quizzes-container">
      <header className="quizzes-header">
        <h1>Simulacros por Área</h1>
        <p className="quizzes-description">
          Selecciona el área para la que deseas practicar. Cada simulacro contiene 60 preguntas
          con ponderación específica para el área seleccionada y tiene un tiempo límite de 2 horas.
        </p>
      </header>
      
      <div className="quizzes-grid">
        {quizzes.map(quiz => {
          // Validación de datos del quiz
          const quizData = {
            id: quiz.id || 'unknown',
            titulo: quiz.titulo || 'Simulacro sin título',
            materia: quiz.materia || 'General',
            dificultad: quiz.dificultad?.toLowerCase() || 'medium',
            preguntas: quiz.preguntas || 60,
            tiempo_limite: quiz.tiempo_limite || 120,
            descripcion: quiz.descripcion || 'Simulacro de práctica para el área seleccionada'
          };

          return (
            <article key={quizData.id} className="quiz-card">
              <div className="quiz-header">
                <h2>{quizData.titulo}</h2>
                <span 
                  className={`quiz-tag ${quizData.dificultad}`}
                  aria-label={`Dificultad: ${quizData.dificultad}`}
                >
                  {quizData.materia}
                </span>
              </div>
              
              <div className="quiz-meta">
                <span><strong>Preguntas:</strong> {quizData.preguntas}</span>
                <span><strong>Tiempo:</strong> {quizData.tiempo_limite} minutos</span>
              </div>
              
              <p className="quiz-description">
                {quizData.descripcion}
              </p>
              
              <button 
                onClick={() => handleStartQuiz(quizData.id)}
                className="quiz-start-button"
                aria-label={`Comenzar simulacro de ${quizData.materia}`}
              >
                Comenzar simulacro
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default Quizzes;