import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TemplateCard from "../../assets/TemplateCard.jsx";
import { useTemplates } from "../../context/TemplatesContext";
import "./TemplatePage.css";

const TemplatesPage = () => {
  const navigate = useNavigate();
  const { refreshTrigger } = useTemplates();
  const [templates, setTemplates] = useState([]);

  const cargarPlantillas = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:3001/plantillas", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      const plantillasFormateadas = data.map(template => {
        const nombreEvento =
          template.evento?.titulo ||
          template.evento?.nombre ||
          template.nombre_evento ||
          template.nombre_plantilla ||
          "Evento sin nombre";

        const urlBase = template.portada?.url ?? template.portada;
        const portadaCompleta = urlBase
          ? `http://localhost:3001${urlBase}?t=${Date.now()}`
          : null;

        return {
          id_plantilla: template.id_plantilla,
          titulo: nombreEvento,
          descripcion:
            template.descripcion ||
            "Haz clic para personalizar esta plantilla.",
          portada: portadaCompleta,
          estructura: template.estructura || template.estructura_base || null
        };
      });

      setTemplates(plantillasFormateadas);
    } catch (err) {
      console.error("Error cargando plantillas:", err);
    }
  };

  useEffect(() => {
    cargarPlantillas();
  }, [refreshTrigger]);

  const actualizarPortada = (idPlantilla, nuevaUrl) => {
    const urlCacheBust = `http://localhost:3001${nuevaUrl}?t=${Date.now()}`;

    setTemplates(prev =>
      prev.map(t =>
        t.id_plantilla === idPlantilla
          ? { ...t, portada: urlCacheBust }
          : t
      )
    );
  };

  return (
    <div className="templates-container">
      <header className="templates-header">
        <h1>Plantillas</h1>
      </header>

      <div className="templates-grid">
        {templates.map((template) => (
          <div key={template.id_plantilla} className="template-wrapper">
            <TemplateCard
              template={template}
              onPortadaActualizada={actualizarPortada}
              onSelect={() =>
                navigate(`/dashboard/editor/${template.id_plantilla}`)
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplatesPage;