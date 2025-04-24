import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaSignOutAlt,
  FaBook,
  FaHome,
  FaUser,
  FaChalkboardTeacher,
  FaQuestionCircle,
  FaArrowLeft,
  FaArrowRight,
  FaBookOpen,
  FaSpinner,
  FaFilePdf,
  FaSync,
} from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import "./Dashboard.css";
import Seminarios from "../Seminarios/Seminarios";
import Quizzes from "../Quizzes/Quizzes";

// Componente para formatear fechas de forma segura
const SafeDateFormatter = ({
  date,
  prefix = "",
  suffix = "",
  defaultValue = "Recién publicado",
}) => {
  try {
    if (!date) return <span>{defaultValue}</span>;

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return <span>{defaultValue}</span>;

    const formatted = formatDistanceToNow(parsedDate, {
      addSuffix: true,
      locale: es,
    });

    return (
      <span>
        {prefix}
        {formatted}
        {suffix}
      </span>
    );
  } catch (error) {
    console.error("Error al formatear fecha:", error);
    return <span>{defaultValue}</span>;
  }
};

const Dashboard = ({ onLogout, userData }) => {
  // Estados
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("inicio");
  const [newComment, setNewComment] = useState("");
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [cuadernillos, setCuadernillos] = useState([]);
  const [cuadernillosLoading, setCuadernillosLoading] = useState(false);
  const [cuadernillosLoaded, setCuadernillosLoaded] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    nextPageUrl: null,
    prevPageUrl: null,
  });

  const location = useLocation();
  const navigate = useNavigate();

  // Configuración de API
  const api = useMemo(
    () =>
      axios.create({
        baseURL: process.env.REACT_APP_API_BASE_URL,
        withCredentials: true,
      }),
    []
  );

  // Función para cerrar sesión
  const handleLogout = useCallback(async () => {
    try {
      await api.post("/logout");
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    } finally {
      localStorage.removeItem("sessionActive");
      onLogout();
      navigate("/login");
    }
  }, [api, onLogout, navigate]);

  // Función para cargar publicaciones con validación de fechas
  const fetchPublicaciones = useCallback(
    async (page = 1) => {
      try {
        setPostsLoading(true);
        const res = await api.get(`/publicaciones?page=${page}&tipo=1`);

        if (res.data?.data) {
          const nuevosPosts = res.data.data.map((item) => {
            // Validar y normalizar la fecha
            let fechaValida = item.created_at;
            if (
              !item.created_at ||
              isNaN(new Date(item.created_at).getTime())
            ) {
              fechaValida = new Date().toISOString();
            }

            return {
              id: item.id,
              nombre: item.datos_usuario?.nombres || `Usuario ${item.user_id}`,
              contenido: item.descripcion,
              rol: item.rol?.name || "Estudiante",
              thumb:
                item.datos_usuario?.path_foto ||
                `https://app.cepreuna.edu.pe/storage/publicaciones/${item.imagen_tumb}`,
              imagen_pub: item.imagen_pub
                ? `https://app.cepreuna.edu.pe/storage/publicaciones/${item.imagen_pub}`
                : null,
              like: item.like,
              created_at: fechaValida,
            };
          });

          setPosts(nuevosPosts);
          setPagination({
            currentPage: res.data.current_page,
            lastPage: res.data.last_page,
            nextPageUrl: res.data.next_page_url,
            prevPageUrl: res.data.prev_page_url,
          });
          setPostsLoaded(true);
        }
      } catch (err) {
        console.error("Error al obtener publicaciones:", err);
        setError("Error al cargar las publicaciones");
      } finally {
        setPostsLoading(false);
      }
    },
    [api]
  );

  // Función para procesar y organizar los cuadernillos con validación de fechas
  const processCuadernillosData = (data) => {
    if (!data?.cuadernillos) return [];
  
    const categoriasMap = new Map();
    const CORRECT_BASE_URL = "https://sistemas.cepreuna.edu.pe/storage/documentos/";
  
    data.cuadernillos.forEach((categoria) => {
      if (!categoria?.cuadernillos?.length) return;
  
      const denominacion = categoria.denominacion || "General";
      const color = categoria.color || "#6c757d";
  
      if (!categoriasMap.has(denominacion)) {
        categoriasMap.set(denominacion, {
          denominacion,
          color,
          semanas: new Map(),
        });
      }
  
      const cuadernillosUnicos = new Map();
  
      categoria.cuadernillos.forEach((cuadernillo) => {
        const claveUnica = `${cuadernillo.semana}_${cuadernillo.nombre}`;
        
        if (cuadernillosUnicos.has(claveUnica)) {
          return;
        }
        cuadernillosUnicos.set(claveUnica, true);
  
        const semana = cuadernillo.semana || 0;
        const categoriaData = categoriasMap.get(denominacion);
  
        if (!categoriaData.semanas.has(semana)) {
          categoriaData.semanas.set(semana, []);
        }
  
        let fechaValida = cuadernillo.created_at;
        if (!cuadernillo.created_at || isNaN(new Date(cuadernillo.created_at).getTime())) {
          fechaValida = new Date().toISOString();
        }
  
        // Corregimos la URL aquí de manera segura
        let archivoPath = cuadernillo.path || cuadernillo.url || "";
        
        // Si la ruta ya contiene la base URL incorrecta, la removemos
        if (archivoPath.startsWith("https://sistemas.cepreuna.edu.pe")) {
          archivoPath = archivoPath.replace("https://sistemas.cepreuna.edu.pe", "");
        }
        
        // Si la ruta comienza con "/storage/documentos/", la dejamos tal cual
        if (!archivoPath.startsWith("/storage/documentos/") && !archivoPath.startsWith("storage/documentos/")) {
          // Si es una ruta relativa como "04-2025/archivo.pdf", le agregamos "/storage/documentos/"
          if (!archivoPath.startsWith("/")) {
            archivoPath = "/" + archivoPath;
          }
          archivoPath = "/storage/documentos" + archivoPath;
        }
  
        // Construimos la URL final
        const archivoUrl = CORRECT_BASE_URL + archivoPath.replace(/^\/storage\/documentos\//, "");
  
        categoriaData.semanas.get(semana).push({
          id: cuadernillo.id || `${denominacion}-${semana}-${Math.random().toString(36).substr(2, 5)}`,
          nombre: cuadernillo.nombre || `${denominacion} - Semana ${semana}`,
          descripcion: cuadernillo.descripcion || "",
          archivo_url: archivoUrl,
          semana,
          fecha: fechaValida,
        });
      });
    });
  
    return Array.from(categoriasMap.values()).map((categoria) => ({
      ...categoria,
      semanas: Array.from(categoria.semanas.entries())
        .sort(([a], [b]) => b - a)
        .map(([semana, cuadernillos]) => ({
          semana,
          cuadernillos: cuadernillos.sort((a, b) => b.semana - a.semana),
        })),
    }));
  };

  // Función optimizada para cargar cuadernillos
  const fetchCuadernillos = useCallback(async () => {
    try {
      setCuadernillosLoading(true);
      const { data } = await api.get("/cuadernillos");
      const processedData = processCuadernillosData(data);
      setCuadernillos(processedData);
      setCuadernillosLoaded(true);
    } catch (err) {
      console.error("Error al obtener cuadernillos:", err);
      setError("Error al cargar los cuadernillos. Intente nuevamente.");
    } finally {
      setCuadernillosLoading(false);
    }
  }, [api]);

  // Efectos secundarios optimizados
  useEffect(() => {
    const verifySession = async () => {
      try {
        const { data } = await api.get("/verify-session");
        if (!data.success) throw new Error("Sesión inválida");
      } catch {
        handleLogout();
      }
    };

    if (userData?.nombre) {
      verifySession();

      if (!postsLoaded) {
        fetchPublicaciones();
      }

      if (activeTab === "cuadernillos" && !cuadernillosLoaded) {
        fetchCuadernillos();
      }
    }
  }, [
    userData,
    activeTab,
    postsLoaded,
    cuadernillosLoaded,
    fetchPublicaciones,
    fetchCuadernillos,
    api,
    handleLogout,
  ]);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    if (tab && tab !== activeTab) setActiveTab(tab);
  }, [location.search, activeTab]);

  // Handlers optimizados
  const changeTab = useCallback(
    (tab) => {
      if (tab === "cuadernillos" && !cuadernillosLoaded) {
        fetchCuadernillos();
      }
      setActiveTab(tab);
      navigate(`/dashboard?tab=${tab}`);
    },
    [navigate, cuadernillosLoaded, fetchCuadernillos]
  );

  const handleCommentSubmit = useCallback(() => {
    if (newComment.trim()) {
      setPosts((prev) => [
        {
          id: prev.length + 1,
          nombre: userData.nombre,
          contenido: newComment,
          rol: "Estudiante",
          created_at: new Date().toISOString(),
          like: 0,
        },
        ...prev,
      ]);
      setNewComment("");
    }
  }, [newComment, userData.nombre]);

  const handleNextPage = useCallback(() => {
    if (pagination.nextPageUrl) {
      fetchPublicaciones(pagination.currentPage + 1);
    }
  }, [pagination.nextPageUrl, pagination.currentPage, fetchPublicaciones]);

  const handlePrevPage = useCallback(() => {
    if (pagination.prevPageUrl) {
      fetchPublicaciones(pagination.currentPage - 1);
    }
  }, [pagination.prevPageUrl, pagination.currentPage, fetchPublicaciones]);

  // Componente PostCard optimizado con SafeDateFormatter
  const PostCard = useCallback(
    ({ post }) => (
      <div className="post-card">
        <div className="post-header">
          <div className="avatar-container">
            {post.thumb ? (
              <img src={post.thumb} className="avatar-sm" alt="avatar" />
            ) : (
              <FaUser size={24} color="gray" />
            )}
          </div>
          <div className="post-user-info">
            <div className="post-user-name">{post.nombre}</div>
            <div className="post-user-role">{post.rol}</div>
          </div>
        </div>
        <div className="post-content">
          <p style={{ whiteSpace: "pre-line" }}>{post.contenido}</p>
          {post.imagen_pub && (
            <img
              src={post.imagen_pub}
              alt="Publicación"
              className="post-image"
            />
          )}
        </div>
        <div className="post-footer">
          <span>{post.like} Me gusta</span>
          <SafeDateFormatter date={post.created_at} />
        </div>
      </div>
    ),
    []
  );

  // Componente CuadernilloCompactCard optimizado
  const CuadernilloCompactCard = ({ categoria }) => {
    const [expanded, setExpanded] = useState(false);
    
    const semanasToShow = expanded 
      ? categoria.semanas 
      : categoria.semanas.slice(0, 2);
  
    return (
      <div className="cuadernillo-compact-card" style={{ 
        borderLeft: `4px solid ${categoria.color}`,
        marginBottom: '20px' // Espacio entre categorías
      }}>
        <div className="compact-card-header">
          <h3 className="compact-card-title">{categoria.denominacion}</h3>
        </div>
        <div className="semanas-container">
          {semanasToShow.map(({ semana, cuadernillos }) => (
            <div key={semana} className="semana-item">
            <a
              href={cuadernillos[0]?.archivo_url} // Tomamos el primer cuadernillo de la semana
              target="_blank"
              rel="noopener noreferrer"
              className="semana-link"
              title={`Descargar semana ${semana}`}
            >
              Semana {semana} <FaFilePdf className="pdf-icon" />
            </a>
          </div>
          ))}
        </div>
        {categoria.semanas.length > 2 && (
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="ver-mas-btn"
          >
            {expanded ? 'Ver menos...' : 'Ver más...'}
          </button>
        )}
      </div>
    );
  };

  // Renderizado de la sección de cuadernillos optimizado
  const renderCuadernillosSection = () => (
    <section className="cuadernillos-section">
      <div className="section-header">
        <h2>Cuadernillos Disponibles</h2>
        <button
          onClick={fetchCuadernillos}
          disabled={cuadernillosLoading}
          className="refresh-btn"
        >
          <FaSync /> {cuadernillosLoading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>
  
      {cuadernillosLoading ? (
        <div className="loading-spinner">
          <FaSpinner className="spinner-icon" />
          <p>Cargando cuadernillos...</p>
        </div>
      ) : cuadernillos.length > 0 ? (
        <div className="cuadernillos-grid-compact">
          {cuadernillos.map((categoria) => (
            <CuadernilloCompactCard
              key={categoria.denominacion}
              categoria={categoria}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <FaBookOpen size={48} />
          <p>No hay cuadernillos disponibles actualmente.</p>
          <button onClick={fetchCuadernillos} className="retry-btn">
            Reintentar
          </button>
        </div>
      )}
    </section>
  );

  // Renderizado condicional optimizado
  const renderContent = useCallback(() => {
    const tabs = {
      perfil: (
        <section className="profile-section">
          <h2>Perfil del Estudiante</h2>
          <div className="profile-info">
            <img
              src={userData.avatar || "https://via.placeholder.com/150"}
              alt="Avatar"
              className="profile-avatar"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/150";
              }}
            />
            <div>
              <p>
                <strong>Nombre:</strong> {userData.nombre}
              </p>
              <p>
                <strong>Email:</strong> {userData.email}
              </p>
              <p>
                <strong>ID:</strong> {userData.id_user}
              </p>
            </div>
          </div>
        </section>
      ),
      seminarios: <Seminarios />,
      quizzes: <Quizzes />,
      cursos: (
        <section className="coming-soon">
          <h2>Próximamente cursos</h2>
          <p>Estamos trabajando en esta sección.</p>
        </section>
      ),
      cuadernillos: renderCuadernillosSection(),
      default: (
        <section className="home-section">
          <div className="post-box">
            <div className="post-header">
              <div className="avatar-container">
                {userData.avatar ? (
                  <img
                    src={userData.avatar}
                    className="avatar-sm"
                    alt="avatar"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/40";
                    }}
                  />
                ) : (
                  <FaUser size={24} color="gray" />
                )}
              </div>
              <div className="post-user-info">
                <div className="post-user-name">{userData.nombre}</div>
                <div className="post-user-role">Estudiante</div>
              </div>
            </div>
            <textarea
              placeholder={`¿Qué estás pensando ${userData.nombre}?`}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength="500"
            />
            <div className="post-actions">
              <button
                onClick={handleCommentSubmit}
                disabled={!newComment.trim()}
                className="post-button"
              >
                Publicar
              </button>
              <span className="char-counter">{newComment.length}/500</span>
            </div>
          </div>

          <div className="posts-list">
            {postsLoading ? (
              <div className="loading-spinner">
                <FaSpinner className="spinner-icon" />
                <p>Cargando publicaciones...</p>
              </div>
            ) : (
              <>
                {posts.length > 0 ? (
                  <>
                    {posts.map((post) => (
                      <PostCard key={`post-${post.id}`} post={post} />
                    ))}
                    <div className="pagination-controls">
                      <button
                        onClick={handlePrevPage}
                        disabled={!pagination.prevPageUrl || postsLoading}
                        className="pagination-btn"
                      >
                        <FaArrowLeft /> Anterior
                      </button>
                      <span className="page-info">
                        Página {pagination.currentPage} de {pagination.lastPage}
                      </span>
                      <button
                        onClick={handleNextPage}
                        disabled={!pagination.nextPageUrl || postsLoading}
                        className="pagination-btn"
                      >
                        Siguiente <FaArrowRight />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="empty-posts">
                    <p>No hay publicaciones para mostrar.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      ),
    };

    return tabs[activeTab] || tabs.default;
  }, [
    activeTab,
    userData,
    newComment,
    posts,
    postsLoading,
    pagination,
    cuadernillos,
    cuadernillosLoading,
    handleCommentSubmit,
    handlePrevPage,
    handleNextPage,
    renderCuadernillosSection,
  ]);

  if (!userData?.nombre) {
    return (
      <div className="dashboard-loading">
        <FaSpinner className="spinner-icon" />
        <p>Cargando usuario...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="profile-box">
          <img
            src={userData.avatar || "https://via.placeholder.com/150"}
            className="avatar"
            alt="avatar"
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/150";
            }}
          />
          <p className="username">{userData.nombre}</p>
        </div>
        <nav className="nav-menu">
          <button
            onClick={() => changeTab("inicio")}
            className={activeTab === "inicio" ? "active" : ""}
          >
            <FaHome /> Inicio
          </button>
          <button
            onClick={() => changeTab("perfil")}
            className={activeTab === "perfil" ? "active" : ""}
          >
            <FaUser /> Perfil
          </button>
          <button
            onClick={() => changeTab("seminarios")}
            className={activeTab === "seminarios" ? "active" : ""}
          >
            <FaChalkboardTeacher /> Seminarios
          </button>
          <button
            onClick={() => changeTab("quizzes")}
            className={activeTab === "quizzes" ? "active" : ""}
          >
            <FaQuestionCircle /> Quizzes
          </button>
          <button
            onClick={() => changeTab("cursos")}
            className={activeTab === "cursos" ? "active" : ""}
          >
            <FaBook /> Cursos
          </button>
          <button
            onClick={() => changeTab("cuadernillos")}
            className={activeTab === "cuadernillos" ? "active" : ""}
          >
            <FaBookOpen /> Cuadernillos
          </button>
          <button onClick={handleLogout} className="logout-btn">
            <FaSignOutAlt /> Cerrar Sesión
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <header>
          <h1>Bienvenido, {userData.nombre.toUpperCase()}</h1>
          <div className="header-info">
            <p>
              <strong>Correo:</strong> {userData.email}
            </p>
            <p>
              <strong>ID:</strong> {userData.id_user}
            </p>
          </div>
        </header>
        {error && <div className="error-message">{error}</div>}
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;
