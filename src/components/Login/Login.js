import React, { useState } from 'react';
import axios from 'axios';
import './Login.css'; // Usa tu CSS y los extras que te añado

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/login`, {
                email,
                password
            }, {
                withCredentials: true
            });

            if (response.data.success) {
                onLogin();
            } else {
                setError(response.data.error || "Credenciales incorrectas");
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error || 
                               err.message || 
                               "Error de conexión con el servidor";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="text-center">
                        <img src="/logo.png" alt="Logo" className="login-logo" />
                        <h2 className="login-title">CEPREUNA APP</h2>
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email Institucional:</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="usuario@cepreuna.edu.pe"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contraseña:</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Ingresa tu contraseña"
                            disabled={isLoading}
                        />
                    </div>

                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
                    </button>

                    {error && <p className="error-message">{error}</p>}

                    <p className="login-footer">
                        ¿No tienes una cuenta aún? <span className="signup-text">Regístrate</span>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;
