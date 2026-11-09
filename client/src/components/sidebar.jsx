import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

const Sidebar = ({ rol }) => {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-header">
          <img src="/logo.png" alt="Logo" width="1000" />
        </div>

        <ul className="menu">
          {/* 1. INICIO: Visible para TODOS */}
          <li>
            <NavLink to="/dashboard/inicio">Inicio</NavLink>
          </li>

          {/* 2. PLANTILLAS: Visible para ADMIN y EDITOR */}
          {(rol === "1" || rol === "3") && (
            <li>
              <NavLink to="/dashboard/plantillas">Plantillas</NavLink>
            </li>
          )}

          {/* 2. EVENTOS: Visible para ADMIN y EDITOR
              (el Visitante no entra al panel) */}
          {(rol === "1" || rol === "3") && (
            <li>
              <NavLink to="/dashboard/eventos">Eventos</NavLink>
            </li>
          )}

          {/* 4. CONFIGURACIÓN DE USUARIO (Mi Perfil): Visible para TODOS
              (Aquí es donde el Editor y Usuario cambian su contraseña/nombre) */}
          <li>
            <NavLink to="/dashboard/usuarios">
              {localStorage.getItem("id_rol") === "1"
                ? "Usuarios"
                : "Mi usuario"}
            </NavLink>
          </li>
        </ul>
      </div>

      <div className="sidebar-user">
        <p className="user-text">Hola, {user?.Username}</p>
        <button onClick={logout} className="btn-logout">
          Salir
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
