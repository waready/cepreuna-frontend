import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // 1. Intento de login
            const loginResponse = await axios.post('http://localhost:5000/api/login', {
                email,
                password
            }, {
                withCredentials: true // Importante para las cookies de sesión
            });

            if (!loginResponse.data.success) {
                throw new Error(loginResponse.data.error || 'Credenciales incorrectas');
            }

            // 2. Verificación de sesión
            const sessionResponse = await axios.get('http://localhost:5000/api/nombre-estudiante', {
                withCredentials: true
            });

            if (!sessionResponse.data.success) {
                throw new Error('La sesión no se inició correctamente');
            }

            // 3. Persistencia en localStorage
            localStorage.setItem('sessionActive', 'true');
            
            // 4. Notificar éxito
            onLogin();

        } catch (err) {
            // Manejo detallado de errores
            let errorMessage = 'Error de conexión';
            
            if (err.response) {
                errorMessage = err.response.data.error || err.message;
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            
            // Intento de limpieza en caso de error
            try {
                await axios.post('http://localhost:5000/api/logout', {}, {
                    withCredentials: true
                });
            } catch (logoutError) {
                console.error('Error al limpiar sesión:', logoutError);
            }
            
            localStorage.removeItem('sessionActive');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container">
            <h2>Iniciar Sesión</h2>
            <form onSubmit={handleLogin}>
                <div className="form-group">
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="username"
                        className={error ? 'error-input' : ''}
                    />
                </div>
                <div className="form-group">
                    <label>Contraseña:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className={error ? 'error-input' : ''}
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={isLoading}
                >
                    {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </button>
                {error && (
                    <p className="error-message">
                        {error}
                        <br />
                        <small>Por favor, inténtalo nuevamente.</small>
                    </p>
                )}
            </form>
        </div>
    );
};

export default Login;