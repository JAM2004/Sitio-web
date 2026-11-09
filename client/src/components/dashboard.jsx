import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./sidebar";
import Header from "./header";
import "./Dashboard.css";

const Dashboard = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const isEditor = pathname.startsWith("/dashboard/editor")
  if (!user) return null;

  return (


    <div className="dashboard">

      {!isEditor && <Sidebar rol={localStorage.getItem("id_rol")} />}
      <div className={`main-content ${isEditor ? "no-header" : ""}`}>

        {!isEditor && (
          <Header
            title={
              user.id_rol === 1
                ? "Panel de Control Maestro"
                : "Zona de Trabajo"
            }
          />
        )}

        <div className={`content ${isEditor ? "editor-full" : ""}`}>
          <Outlet />
        </div>

      </div>
    </div>
  );
};

export default Dashboard;