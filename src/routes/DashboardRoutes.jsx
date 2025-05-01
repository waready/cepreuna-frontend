import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import Inicio from "../pages/Inicio";
import Perfil from "../pages/Perfil";
import Seminarios from "../pages/Seminarios";
import Quizzes from "../pages/Quizzes";
import Cursos from "../pages/Cursos";
import Cuadernillos from "../pages/Cuadernillos";

const DashboardRoutes = ({ userData, onLogout }) => (
    <DashboardLayout userData={userData} onLogout={onLogout}>
        <Routes>
            <Route path="/" element={<Navigate to="inicio" />} />
            <Route path="inicio" element={<Inicio userData={userData} />} />
            <Route path="perfil" element={<Perfil userData={userData} />} />
            <Route path="seminarios" element={<Seminarios />} />
            <Route path="quizzes" element={<Quizzes />} />
            <Route path="cursos" element={<Cursos />} />
            <Route path="cuadernillos" element={<Cuadernillos />} />
        </Routes>
    </DashboardLayout>
);

export default DashboardRoutes;
