import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaDownload, FaCalendarAlt, FaClock, FaYoutube } from 'react-icons/fa';
import './Seminarios.css';

const Seminarios = () => {
    const [seminarios, setSeminarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSeminarios = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/seminarios', {
                    withCredentials: true
                });

                if (response.data.success) {
                    setSeminarios(response.data.data);
                } else {
                    setError(response.data.error || "Error al obtener seminarios");
                }
            } catch (err) {
                setError(err.response?.data?.error ||
                    err.message ||
                    "Error de conexión");
            } finally {
                setLoading(false);
            }
        };

        fetchSeminarios();
    }, []);

    if (loading) return <div className="loading">Cargando seminarios...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="seminarios-container">
            <h2>Seminarios Disponibles</h2>

            <div className="calendar-section">
                <h3>Calendario de Seminarios</h3>
                <div className="calendar-grid">
                    {seminarios.map((seminario, index) => (
                        <div key={index} className="calendar-item">
                            <div className="calendar-date">
                                <FaCalendarAlt /> {seminario.fecha}
                            </div>
                            <div className="calendar-time">
                                <FaClock /> {seminario.hora}
                            </div>
                            <div className="calendar-title">
                                {seminario.titulo}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="seminarios-grid">
                {seminarios.map((seminario, index) => (
                    <div key={index} className="seminario-card">
                        <h3>{seminario.titulo}</h3>
                        <p>{seminario.descripcion}</p>

                        <div className="seminario-meta">
                            <span><FaCalendarAlt /> {seminario.fecha}</span>
                            <span><FaClock /> {seminario.hora}</span>
                        </div>

                        <div className="pdfs-container">
                            <h4>Materiales descargables:</h4>
                            <div className="pdfs-grid">
                                {seminario.pdfs.map((pdf, pdfIndex) => (
                                    <a
                                        key={pdfIndex}
                                        href={pdf.url}
                                        className="download-btn"
                                        download
                                    >
                                        <FaDownload /> {pdf.nombre}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {seminario.videoId && (
                            <>
                                <div className="seminario-actions">
                                    <a
                                        href={`https://youtube.com/watch?v=${seminario.videoId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="youtube-btn"
                                    >
                                        <FaYoutube /> Ver en YouTube
                                    </a>
                                </div>

                                <div className="video-container">
                                    <iframe
                                        width="100%"
                                        height="315"
                                        src={`https://www.youtube.com/embed/${seminario.videoId}`}
                                        title={`Video del seminario: ${seminario.titulo}`}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Seminarios;