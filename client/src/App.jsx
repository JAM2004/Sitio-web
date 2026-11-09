import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Login from './pages/Login/login.jsx';
import Inicio from "./components/inicio.jsx";
import Dashboard from "./components/dashboard";
import Usuarios from "./pages/Usuarios/usuarios.jsx";
import EventsPage from "./components/EventsPage.jsx";
import Plantillas from "./pages/Plantillas/TemplatePage.jsx";
import EditorPage from "./pages/Plantillas/EditorPage.jsx";
import TemplateReadOnly from "./pages/Plantillas/TemplateReadOnly.jsx";
import PublicEventPage from "./pages/PublicEventPage.jsx";
//import addUserMmodal from "./components/Modal/Modal.jsx"; 
import "./App.css";

// Sin token no hay panel: manda al login (y devuelve aquí al cerrar sesión)
function RequireAuth({ children }) {
  const location = useLocation();
  if (!localStorage.getItem("token")) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/evento/:slug" element={<PublicEventPage />} />

      {/* TODAS LAS PÁGINAS QUE LLEVAN SIDEBAR VAN AQUÍ */}
      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>}>
        <Route path="inicio" element={<Inicio />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="eventos" element={<EventsPage />} />
        <Route path="plantillas" element={<Plantillas />} />

        {/*RUTA DEL EDITOR COMO LAS DEMÁS */}
        <Route path="editor/:id" element={<EditorPage />} />
        <Route path="plantillas/vista/:id" element={<TemplateReadOnly />} />
      </Route>
    </Routes>
  );
}

export default App;
