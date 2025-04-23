import React, { useEffect, useState, useCallback } from "react";
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
} from "react-icons/fa";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import "./Dashboard.css";
import Seminarios from "../Seminarios/Seminarios";
import Quizzes from "../Quizzes/Quizzes";

const Dashboard = ({ onLogout, userData }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("inicio");
  const [newComment, setNewComment] = useState("");
  const [posts, setPosts] = useState([
    {
      id: 1,
      nombre: "JHEFERZON AMERICO PEREZ",
      contenido: "No puedo validar el pago desde el día 17 del presente mes",
      rol: "Estudiante",
    },
  ]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    nextPageUrl: null,
    prevPageUrl: null,
  });

  const location = useLocation();
  const navigate = useNavigate();

  const api = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL,
    withCredentials: true,
  });

  const fetchPublicaciones = async (page = 1) => {
    try {
      setPostsLoading(true);
      const res = await api.get(`/publicaciones?page=${page}&tipo=1`);
      if (res.data?.data) {
        const nuevosPosts = res.data.data.map((item) => ({
          id: item.id,
          nombre: item.datos_usuario?.nombres || `Usuario ${item.user_id}`,
          contenido: item.descripcion,
          rol: item.rol?.name || "Estudiante",
          thumb: item.datos_usuario?.path_foto || `https://app.cepreuna.edu.pe/storage/publicaciones/${item.imagen_tumb}`,
          imagen_pub: item.imagen_pub ? `https://app.cepreuna.edu.pe/storage/publicaciones/${item.imagen_pub}` : null,
          like: item.like,
          created_at: item.created_at,
        }));
        setPosts(nuevosPosts);
        setPagination({
          currentPage: res.data.current_page,
          lastPage: res.data.last_page,
          nextPageUrl: res.data.next_page_url,
          prevPageUrl: res.data.prev_page_url,
        });
      }
    } catch (err) {
      console.error("Error al obtener publicaciones:", err);
      setError("Error al cargar las publicaciones");
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.nombre) {
      fetchPublicaciones();
    }
  }, [userData]);

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

  useEffect(() => {
    const verifySession = async () => {
      try {
        const { data } = await api.get("/verify-session");
        if (!data.success) throw new Error();
      } catch {
        handleLogout();
      }
    };
    verifySession();
  }, [api, handleLogout]);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    if (tab && tab !== activeTab) setActiveTab(tab);
  }, [location.search, activeTab]);

  useEffect(() => {
    if (userData?.nombre) {
      setLoading(false);
    }
  }, [userData]);

  const changeTab = (tab) => {
    setActiveTab(tab);
    navigate(`/dashboard?tab=${tab}`);
  };

  const handleCommentSubmit = () => {
    if (newComment.trim() !== "") {
      setPosts([
        {
          id: posts.length + 1,
          nombre: userData.nombre,
          contenido: newComment,
          rol: "Estudiante",
        },
        ...posts,
      ]);
      setNewComment("");
    }
  };

  const handleNextPage = () => {
    if (pagination.nextPageUrl) {
      fetchPublicaciones(pagination.currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (pagination.prevPageUrl) {
      fetchPublicaciones(pagination.currentPage - 1);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "perfil":
        return (
          <section>
            <h2>Perfil del Estudiante</h2>
          </section>
        );
      case "seminarios":
        return <Seminarios />;
      case "quizzes":
        return <Quizzes />;
      case "cursos":
        return (
          <section>
            <h2>Próximamente cursos</h2>
          </section>
        );
      default:
        return (
          <section>
            {/* Área para crear nuevos posts */}
            <div className="post-box">
              <div className="post-header">
                <div className="avatar-container">
                  {userData.avatar ? (
                    <img
                      src={userData.avatar}
                      className="avatar-sm"
                      alt="avatar"
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
              />
              <div className="post-actions">
                <button onClick={handleCommentSubmit}>Publicar</button>
              </div>
            </div>

            {/* Lista de posts existentes */}
            <div className="posts-list">
              {postsLoading ? (
                <p>Cargando publicaciones...</p>
              ) : (
                <>
                  {posts.map((post) => (
                    <div key={post.id} className="post-card">
                      <div className="post-header">
                        <div className="avatar-container">
                          {post.thumb ? (
                            <img
                              src={post.thumb}
                              className="avatar-sm"
                              alt="avatar"
                            />
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
                        <p style={{ whiteSpace: 'pre-line' }}>{post.contenido}</p>
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
                        <span>
                          {formatDistanceToNow(new Date(post.created_at), {
                            addSuffix: true,
                            locale: es
                          })}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Controles de paginación */}
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
              )}
            </div>
          </section>
        );
    }
  };

  if (!userData || !userData.nombre) {
    return (
      <div className="dashboard-loading">
        <p>Cargando usuario...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="profile-box">
          <img src={userData.avatar} className="avatar" alt="avatar" />
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
          <button onClick={handleLogout} className="logout-btn">
            <FaSignOutAlt /> Cerrar Sesión
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <header>
          <h1>Bienvenido, {userData.nombre.toUpperCase()}</h1>
          <p>Correo: {userData.email}</p>
          <p>ID: {userData.id_user}</p>
        </header>
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;
