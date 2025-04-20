import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './QuizSession.css';

const QuizSession = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [respuestas, setRespuestas] = useState([]);
  const [timeLeft, setTimeLeft] = useState(120 * 60); // 120 minutos en segundos
  const [quizCompleted, setQuizCompleted] = useState({
    completed: false,
    rawScore: 0,
    weightedScore: 0,
    percentage: 0,
    resultsBySubject: {},
    area: '',
    timeUsed: '00:00:00'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quizInfo, setQuizInfo] = useState(null);
  const [startTime, setStartTime] = useState(null);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateWeightedScore = useCallback(() => {
    if (!quizInfo || !questions.length) {
      return {
        rawScore: 0,
        weightedScore: 0,
        percentage: 0,
        resultsBySubject: {}
      };
    }

    let rawScore = 0;
    let weightedScore = 0;
    const resultsBySubject = {};

    // Inicializar resultados por materia
    Object.keys(quizInfo.ponderaciones).forEach(subject => {
      resultsBySubject[subject] = {
        correct: 0,
        total: 0,
        weightedPoints: 0,
        maxPossible: 0
      };
    });

    // Calcular puntajes
    respuestas.forEach(resp => {
      const question = questions.find(q => q.id === resp.preguntaId);
      if (!question) return;

      const subject = question.materia;
      const weight = quizInfo.ponderaciones[subject] || 1;
      
      resultsBySubject[subject].total++;
      resultsBySubject[subject].maxPossible += 10 * weight;

      if (resp.respuesta === null) {
        // No respondió - 2 puntos
        rawScore += 2;
        resultsBySubject[subject].weightedPoints += 2 * weight;
      } else if (resp.respuesta === question.respuesta_correcta) {
        // Correcta - 10 puntos
        rawScore += 10;
        resultsBySubject[subject].correct++;
        resultsBySubject[subject].weightedPoints += 10 * weight;
      }
      // Incorrecta - 0 puntos (no se suma nada)
    });

    // Calcular puntaje ponderado total
    weightedScore = Object.values(resultsBySubject).reduce(
      (sum, subject) => sum + subject.weightedPoints, 0
    );

    // Normalizar a 3000 si excede (por posibles redondeos)
    weightedScore = Math.min(Math.round(weightedScore), 3000);

    return {
      rawScore: Math.round(rawScore),
      weightedScore,
      percentage: Math.round((weightedScore / 3000) * 100),
      resultsBySubject
    };
  }, [questions, quizInfo, respuestas]);

  const handleQuizCompletion = useCallback(async () => {
    if (quizCompleted.completed) return;
    
    const { rawScore, weightedScore, percentage, resultsBySubject } = calculateWeightedScore();
    
    try {
      const endTime = new Date();
      const tiempoUtilizado = Math.round((endTime - startTime) / 1000);
      
      await axios.post(
        'http://localhost:5000/api/quizzes/save-result',
        {
          quizId,
          rawScore,
          weightedScore,
          percentage,
          tiempoUtilizado,
          resultsBySubject
        },
        { withCredentials: true }
      );
      
      setQuizCompleted({
        completed: true,
        rawScore,
        weightedScore,
        percentage,
        resultsBySubject,
        area: quizInfo?.materia || '',
        timeUsed: formatTime(120 * 60 - timeLeft)
      });
      
    } catch (err) {
      console.error('Error al guardar resultado:', err);
      // Mostrar resultados aunque falle el guardado
      setQuizCompleted({
        completed: true,
        rawScore,
        weightedScore,
        percentage,
        resultsBySubject,
        area: quizInfo?.materia || '',
        timeUsed: formatTime(120 * 60 - timeLeft)
      });
    }
  }, [quizCompleted.completed, quizId, startTime, timeLeft, quizInfo, calculateWeightedScore]);

  // Obtener información del quiz y preguntas
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quizResponse, questionsResponse] = await Promise.all([
          axios.get(`http://localhost:5000/api/quizzes`, { withCredentials: true }),
          axios.get(`http://localhost:5000/api/quizzes/${quizId}/questions`, {
            withCredentials: true
          })
        ]);
        
        if (questionsResponse.data.success) {
          setQuestions(questionsResponse.data.data);
          setRespuestas(questionsResponse.data.data.map(q => ({
            preguntaId: q.id,
            respuesta: null,
            materia: q.materia
          })));
        } else {
          setError(questionsResponse.data.error || "Error al obtener preguntas");
        }

        if (quizResponse.data.success) {
          const quiz = quizResponse.data.data.find(q => q.id === parseInt(quizId));
          setQuizInfo(quiz);
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message || "Error de conexión");
      } finally {
        setLoading(false);
        setStartTime(new Date());
      }
    };

    fetchData();
  }, [quizId]);

  // Temporizador
  useEffect(() => {
    if (timeLeft <= 0 || quizCompleted.completed) {
      if (timeLeft <= 0 && !quizCompleted.completed) {
        handleQuizCompletion();
      }
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, quizCompleted.completed, handleQuizCompletion]);

  const handleOptionSelect = (optionIndex) => {
    const currentRespuesta = respuestas.find(
      r => r.preguntaId === questions[currentQuestionIndex].id
    );
  
    const newRespuestas = [...respuestas];
    const respuestaIndex = newRespuestas.findIndex(
      r => r.preguntaId === questions[currentQuestionIndex].id
    );
  
    if (respuestaIndex !== -1) {
      // Si ya estaba seleccionada, deselecciona (pon en null)
      if (currentRespuesta.respuesta === optionIndex) {
        newRespuestas[respuestaIndex].respuesta = null;
        setSelectedOption(null);
      } else {
        // Selecciona normalmente
        newRespuestas[respuestaIndex].respuesta = optionIndex;
        setSelectedOption(optionIndex);
      }
  
      setRespuestas(newRespuestas);
    }
  };
  

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(
        respuestas.find(r => r.preguntaId === questions[currentQuestionIndex + 1].id)?.respuesta ?? null
      );
    } else {
      handleQuizCompletion();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedOption(
        respuestas.find(r => r.preguntaId === questions[currentQuestionIndex - 1].id)?.respuesta ?? null
      );
    }
  };

  if (loading) {
    return <div className="quiz-loading">Cargando preguntas...</div>;
  }

  if (error) {
    return (
      <div className="quiz-error">
        <p>Error: {error}</p>
        <button onClick={() => navigate('/dashboard')}>Volver al Dashboard</button>
      </div>
    );
  }

  if (questions.length === 0) {
    return <div className="quiz-error">No se encontraron preguntas para este quiz</div>;
  }

  if (quizCompleted.completed) {
    return (
      <div className="quiz-completed-container">
        <h2>¡Simulacro Completado!</h2>
        <div className="quiz-result">
          <h3>Área: {quizCompleted.area}</h3>
          
          <div className="score-summary">
            <div className="main-score">
              <div className="score-circle">
                <span className="score-percentage">{quizCompleted.percentage}%</span>
                <span className="score-total">
  {Object.values(quizCompleted.resultsBySubject)
    .reduce((sum, subj) => sum + subj.weightedPoints, 0)
    .toFixed(3)
  }
</span>
              </div>
            </div>
            
            <div className="score-details">
              <h4>Desglose por Materia: Puntaje en base a 3000</h4>
              <div className="subjects-grid">
                {Object.entries(quizCompleted.resultsBySubject)
                  .sort((a, b) => b[1].weightedPoints - a[1].weightedPoints)
                  .map(([subject, data]) => (
                    <div key={subject} className="subject-card">
                      <h5>{subject}</h5>
                      <div className="subject-stats">
                        <span>Ponderación: {quizInfo?.ponderaciones[subject]?.toFixed(3) || '1.000'}</span>
                        <span>Correctas: {data.total === 0 ? '0/0' : `${data.correct}/${data.total}`}</span>
                        <span>Puntos: {data.total === 0 
                                       ? '0/0' 
                                       : `${data.weightedPoints.toFixed(3)}/${data.maxPossible.toFixed(3)}`}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="time-used">
            <p>Tiempo utilizado: <strong>{quizCompleted.timeUsed}</strong></p>
          </div>

          <div className="result-actions">
            <button 
              onClick={() => navigate('/dashboard?tab=quizzes')}
              className="quiz-return-button"
            >
              Volver a Simulacros
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="quiz-retry-button"
            >
              Intentar nuevamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="quiz-session-container">
      <div className="quiz-header">
        <div className="quiz-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <span>Pregunta {currentQuestionIndex + 1} de {questions.length}</span>
        </div>
        <div className="quiz-timer">
          Tiempo restante: {formatTime(timeLeft)}
        </div>
        <div className="quiz-area">
          Área: {quizInfo?.materia}
        </div>
      </div>
  
      <div className="quiz-question-container">
        <div className="quiz-question-meta">
          <span className="quiz-category">{currentQuestion.materia}</span>
          <span className="quiz-weight">
            Ponderación: {quizInfo?.ponderaciones[currentQuestion.materia]?.toFixed(3) || '1.000'}
          </span>
        </div>
  
        <h3 className="quiz-question">
          {currentQuestion.pregunta}
          {currentQuestion.tiene_imagen && (
            <div className="quiz-image-container">
              <img 
                src={currentQuestion.imagen_url} 
                alt="Ilustración de la pregunta" 
                className="quiz-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
        </h3>
  
        <div className="quiz-options">
          {currentQuestion.opciones.map((opcion, index) => (
            <button
              key={index}
              className={`quiz-option ${
                selectedOption === index ? 'selected' : ''
              } ${
                respuestas.find(r => r.preguntaId === currentQuestion.id)?.respuesta === index 
                  ? 'answered' 
                  : ''
              }`}
              onClick={() => handleOptionSelect(index)}
            >
              <span className="option-letter">
                {String.fromCharCode(65 + index)})
              </span>
              <span className="option-text">{opcion}</span>
            </button>
          ))}
        </div>
      </div>
  
      <div className="quiz-navigation">
        <button
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="quiz-nav-button prev-button"
        >
          Anterior
        </button>
        
        <div className="quiz-progress-mobile">
          {currentQuestionIndex + 1}/{questions.length}
        </div>
  
        {currentQuestionIndex < questions.length - 1 ? (
          <button
            onClick={handleNextQuestion}
            className="quiz-nav-button next-button"
          >
            Siguiente
          </button>
        ) : (
          <button
            onClick={handleQuizCompletion}
            className="quiz-nav-button finish-button"
          >
            Finalizar
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizSession;