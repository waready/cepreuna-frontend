import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Dashboard = ({ onLogout }) => {
    const [horario, setHorario] = useState(null);

    useEffect(() => {
        const fetchHorario = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/horario');
                if (response.data.success) {
                    setHorario(response.data.data);
                }
            } catch (error) {
                console.error("Error al obtener el horario:", error);
            }
        };

        fetchHorario();
    }, []);

    return (
        <div className="container">
            <h2>Dashboard</h2>
            <button onClick={onLogout}>Cerrar Sesión</button>
            {horario ? (
                <div>
                    <h3>Horario</h3>
                    <pre>{JSON.stringify(horario, null, 2)}</pre>
                </div>
            ) : (
                <p>Cargando horario...</p>
            )}
        </div>
    );
};

export default Dashboard;