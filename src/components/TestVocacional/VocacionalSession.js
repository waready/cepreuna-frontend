import React, { useEffect, useState, useMemo, useRef } from 'react';
import axios from 'axios';
import { Stepper, Step } from 'react-form-stepper';
import { FaBrain, FaUserCheck, FaPuzzlePiece, FaChartBar, FaFlagCheckered, FaSpinner } from 'react-icons/fa';
import './VocacionalSession.css';

const iconos = [
    { icon: <FaBrain />, label: "Etapa 1: Habilidades" },
    { icon: <FaUserCheck />, label: "Etapa 2: Intereses" },
    { icon: <FaPuzzlePiece />, label: "Etapa 3: Personalidad" },
    { icon: <FaChartBar />, label: "Etapa 4: Valores" },
    { icon: <FaFlagCheckered />, label: "Resumen" }
];

const dividirEnEtapas = (preguntas, porEtapa = 15) => {
    const grupos = [];
    for (let i = 0; i < preguntas.length; i += porEtapa) {
        grupos.push(preguntas.slice(i, i + porEtapa));
    }
    return grupos;
};

const VocacionalWizard = ({ estudiante }) => {
    const [preguntas, setPreguntas] = useState([]);
    const [respuestas, setRespuestas] = useState({});
    const [etapas, setEtapas] = useState([]);
    const [pasoActual, setPasoActual] = useState(0);
    const [finalizado, setFinalizado] = useState(false);
    const [resultado, setResultado] = useState(null);
    const [yaRespondido, setYaRespondido] = useState(false);
    const [loading, setLoading] = useState(true);

    const containerRef = useRef(null);

    const api = useMemo(() =>
        axios.create({
            baseURL: process.env.REACT_APP_API_BASE_URL,
            withCredentials: true
        }), []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const form = new URLSearchParams();
                form.append("dni", estudiante.dni);

                const comprobacion = await api.post('/respuestas/comprobar', form);
                if (comprobacion.data.existe) {
                    setYaRespondido(true);
                    setLoading(false);
                    return;
                }

                const res = await api.get('/preguntas');
                setPreguntas(res.data);
                setEtapas(dividirEnEtapas(res.data, 15));
            } catch (error) {
                console.error("Error cargando test:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [estudiante.dni, api]);

    const handleRespuesta = (id, valor) => {
        setRespuestas(prev => ({ ...prev, [id]: valor }));
    };

    const calcularPuntajes = () => {
        const puntajes = {};
        preguntas.forEach(p => {
            const tipo = p.tipo || 'otros';
            if (!puntajes[tipo]) puntajes[tipo] = 0;
            puntajes[tipo] += parseInt(respuestas[p.id] || 0);
        });
        return puntajes;
    };

    const pasoEsAccesible = (indiceDestino) => {
        if (!etapas.length) return false;
        const preguntasPrevias = etapas.slice(0, indiceDestino).flat();
        return preguntasPrevias.every(p => respuestas[p.id] !== undefined);
    };

    const handleFinalizar = async () => {
        const puntajes = calcularPuntajes();
        const detalles = preguntas.map(p => ({
            nro_documento: estudiante.dni,
            puntaje: respuestas[p.id],
            tipo: p.tipo || 'otros',
            preguntas_id: p.id,
            respuesta_id: respuestas[p.id] > 0 ? 1 : 0
        }));

        try {
            await api.post('/respuestasAll', {
                estudiante_id: estudiante.id,
                estudiante_nombre: estudiante.nombre,
                estudiante_dni: estudiante.dni,
                puntaje_ingeneria: puntajes['ingenieria'] || 0,
                puntaje_biologia: puntajes['biologia'] || 0,
                puntaje_sociales: puntajes['sociales'] || 0,
                detalles
            });

            const total = Object.values(respuestas).reduce((a, b) => a + parseInt(b), 0);
            let interpretacion = "";
            if (total >= 45) interpretacion = "Alta afinidad por actividades reflexivas y analíticas.";
            else if (total >= 30) interpretacion = "Balance entre creatividad y acción.";
            else interpretacion = "Afinidad con áreas prácticas o técnicas.";

            setResultado({ total, interpretacion });
            setFinalizado(true);
        } catch {
            console.error("Error al guardar respuestas");
        }
    };

    if (loading) {
        return (
            <div className="loading-spinner">
                <FaSpinner className="spinner-icon" spin="true" />
                <p>Cargando test vocacional...</p>
            </div>
        );
    }

    if (yaRespondido) {
        return (
            <div className="vocacional-result">
                <h2>Ya completaste el test vocacional</h2>
                <p>Gracias por participar. Ya registramos tus respuestas previamente.</p>
            </div>
        );
    }

    if (finalizado && resultado) {
        return (
            <div className="vocacional-result">
                <h2>Test Completado</h2>
                <p><strong>Puntaje:</strong> {resultado.total}</p>
                <p><strong>Interpretación:</strong> {resultado.interpretacion}</p>
            </div>
        );
    }

    const pasosCompletos = [
        ...etapas.map((grupo, i) => ({
            index: i,
            icono: iconos[i],
            grupo,
            esResumen: false
        })),
        {
            index: etapas.length,
            icono: iconos[4],
            esResumen: true
        }
    ];

    const irAlPaso = (nuevoPaso) => {
        setPasoActual(nuevoPaso);
        setTimeout(() => {
            containerRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 0);
    };

    return (
        <div className="wizard-container" ref={containerRef}>
            <h2>Test Vocacional</h2>

            {etapas.length > 0 && (
                <Stepper activeStep={pasoActual} style={{ pointerEvents: 'auto' }}>
                    {pasosCompletos.map(({ index, icono, esResumen }) => {
                        const accesible = esResumen
                            ? preguntas.every(p => respuestas[p.id] !== undefined)
                            : pasoEsAccesible(index);

                        return (
                            <Step
                                key={index}
                                className={accesible ? "step-clickable" : "step-disabled"}
                                label={
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                        <div style={{ fontSize: "1.2rem" }}>{icono.icon}</div>
                                        <span style={{ fontSize: "0.8rem", marginTop: 4 }}>{icono.label}</span>
                                    </div>
                                }
                                onClick={() => {
                                    if (accesible) irAlPaso(index);
                                }}
                            />
                        );
                    })}
                </Stepper>
            )}

            {pasoActual < etapas.length ? (
                <div className="pregunta-bloque">
                    {etapas[pasoActual].map((p, idx) => (
                        <div className="pregunta" key={p.id}>
                            <label>{idx + 1 + pasoActual * 15} - {p.denominacion}</label>
                            <div className="opciones">
                                <label>
                                    <input
                                        type="radio"
                                        name={`respuesta_${p.id}`}
                                        checked={respuestas[p.id] === p.puntaje}
                                        onChange={() => handleRespuesta(p.id, p.puntaje)}
                                    />
                                    Sí
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name={`respuesta_${p.id}`}
                                        checked={respuestas[p.id] === 0}
                                        onChange={() => handleRespuesta(p.id, 0)}
                                    />
                                    No
                                </label>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="resumen">
                    <h3>¿Deseas enviar tus respuestas?</h3>
                    <button className="btn btn-enviar" onClick={handleFinalizar}>Finalizar Test</button>
                </div>
            )}

            <div className="wizard-navegacion">
                {pasoActual > 0 && (
                    <button onClick={() => irAlPaso(pasoActual - 1)}>Anterior</button>
                )}
                {pasoActual < etapas.length && (
                    <button
                        onClick={() => irAlPaso(pasoActual + 1)}
                        disabled={etapas[pasoActual].some(p => respuestas[p.id] === undefined)}
                    >
                        Siguiente
                    </button>
                )}
            </div>
        </div>
    );
};

export default VocacionalWizard;
