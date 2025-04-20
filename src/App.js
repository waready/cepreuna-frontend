import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import QuizSession from './components/Quizzes/QuizSession';
import SessionTimeout from './components/SessionTimeout';
import './App.css';

// Configuración de axios para reutilización
const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_BASE_URL}`,
  withCredentials: true,
  timeout: 10000 // 10 segundos de timeout
});

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Función de logout estabilizada con useCallback
    const handleCleanLogout = useCallback(async () => {
        try {
            await api.post('/logout');
            localStorage.removeItem('sessionActive');
            setIsLoggedIn(false);
            setUserData(null);
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            // Forzar limpieza incluso si falla el logout en el backend
            localStorage.removeItem('sessionActive');
            setIsLoggedIn(false);
            setUserData(null);
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    // Verificar estado de autenticación
    const checkAuthStatus = useCallback(async () => {
        try {
            setError(null);
            const sessionActive = localStorage.getItem('sessionActive');
            
            if (!sessionActive) {
                await handleCleanLogout();
                return;
            }

            const [sessionResponse, userResponse] = await Promise.all([
                api.get('/verify-session'),
                api.get('/page/dashboard'),
            ]);

            if (sessionResponse.data.success && userResponse.data) {
                setIsLoggedIn(true);
                setUserData({
                    nombre: userResponse.data?.props?.usuario?.nombres,
                    email: userResponse.data?.props?.usuario?.email,
                    avatar: userResponse.data?.props?.usuario?.profile_photo_path,
                    id_user: userResponse.data?.props?.user?.id,
                });
            } else {
                await handleCleanLogout();
            }
        } catch (error) {
            console.error('Error de autenticación:', error);
            setError('Error al verificar la sesión');
            await handleCleanLogout();
        } finally {
            setLoading(false);
        }
    }, [handleCleanLogout]);

    // Efecto para verificar autenticación al cargar
    useEffect(() => {
        checkAuthStatus();

        // Limpieza al desmontar el componente
        return () => {
            // Cancela peticiones pendientes si es necesario
        };
    }, [checkAuthStatus]);

    // Manejo de login exitoso
    const handleLoginSuccess = useCallback(async () => {
        try {
            const response = await api.get('/horario');
            
            if (response.data) {
                localStorage.setItem('sessionActive', 'true');
                setIsLoggedIn(true);
                setUserData({
                    nombre: response.data.area
                });
                navigate('/dashboard', { replace: true });
            } else {
                throw new Error('No se pudo obtener información del usuario');
            }
        } catch (error) {
            console.error('Error después de login:', error);
            setError('Error al iniciar sesión');
            await handleCleanLogout();
        }
    }, [navigate, handleCleanLogout]);

    // Pantalla de carga
    if (loading) {
        return (
            <div className="app-loading">
                <div className="loading-spinner" aria-label="Cargando"></div>
                <p>Cargando aplicación...</p>
            </div>
        );
    }

    // Manejo de errores globales
    if (error) {
        return (
            <div className="app-error">
                <h2>Error</h2>
                <p>{error}</p>
                <button onClick={handleCleanLogout}>Volver al login</button>
            </div>
        );
    }

    return (
        <div className="App">
            <SessionTimeout logout={handleCleanLogout} />
            
            <Routes>
                <Route 
                    path="/login" 
                    element={
                        !isLoggedIn ? (
                            <Login onLogin={handleLoginSuccess} />
                        ) : (
                            <Navigate to="/dashboard" replace />
                        )
                    } 
                />
                
                <Route 
                    path="/dashboard/*" 
                    element={
                        isLoggedIn ? (
                            <Dashboard 
                                onLogout={handleCleanLogout} 
                                userData={userData} 
                            />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    } 
                />
                
                <Route 
                    path="/quiz/:quizId" 
                    element={
                        isLoggedIn ? (
                            <QuizSession 
                                onLogout={handleCleanLogout} 
                                userData={userData} 
                            />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    } 
                />
                
                <Route 
                    path="/" 
                    element={
                        <Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />
                    } 
                />

                <Route 
                    path="*" 
                    element={
                        <Navigate to="/" replace />
                    } 
                />
            </Routes>
        </div>
    );
}

export default App;