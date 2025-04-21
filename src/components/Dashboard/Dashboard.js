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
} from "react-icons/fa";
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
  useEffect(() => {
    const fetchPublicaciones = async () => {
      try {
        const res = await api.get("/publicaciones?page=1&tipo=1");
        if (res.data?.data) {
          const nuevosPosts = res.data.data.map((item) => ({
            id: item.id,
            nombre: `Usuario ${item.user_id}`,
            contenido: item.descripcion,
            rol: item.rol?.name || "Estudiante",
            thumb: `https://app.cepreuna.edu.pe/storage/${item.imagen_tumb}`,
          }));
          setPosts((prev) => [...nuevosPosts, ...prev]); // coloca los nuevos primero
        }
      } catch (err) {
        console.error("Error al obtener publicaciones:", err);
      } finally {
        setPostsLoading(false);
      }
    };

    if (userData?.nombre) {
      fetchPublicaciones();
    }
  }, [userData]);

  const location = useLocation();
  const navigate = useNavigate();

  const api = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL,
    withCredentials: true,
  });

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
            <div className="post-box">
              <div className="post-header">
                <img src={userData.avatar} className="avatar-sm" alt="avatar" />
                <strong>{userData.nombre}</strong>
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

            <div className="posts-list">
              {postsLoading ? (
                <p>Cargando publicaciones...</p>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="post-card">
                    <div className="post-header">
                      <img
                        src={post.thumb || "/avatar.png"}
                        className="avatar-sm"
                        alt="avatar"
                      />
                      <div>
                        <strong>{post.nombre}</strong>
                        <div className="post-role">{post.rol}</div>
                      </div>
                    </div>
                    <div className="post-body">
                      <p>{post.contenido}</p>
                    </div>
                  </div>
                ))
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
