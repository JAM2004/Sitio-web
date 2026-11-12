import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TemplateCard from "../assets/TemplateCard.jsx";
import "./Dashboard.css";
import { getDefaultStructure } from "../pages/Plantillas/Componentes/EstructuraDefault.jsx";

const Inicio = () => {
  const [templates, setTemplates] = useState([]);
  const navigate = useNavigate();

  const deepEqual = (a, b) => {
    if (a === b) return true;
    if (a == null || b == null) return a === b;
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i])) return false;
      }
      return true;
    }
    if (typeof a === 'object' && typeof b === 'object') {
      const keysA = Object.keys(a).filter(k => k !== 'id');
      const keysB = Object.keys(b).filter(k => k !== 'id');
      if (keysA.length !== keysB.length) return false;
      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!deepEqual(a[key], b[key])) return false;
      }
      return true;
    }
    return false;
  };

  const isDefaultStructure = (estructura) => {
    return deepEqual(estructura, getDefaultStructure());
  };

  const cargarPlantillas = async () => {
    try {
      const token = localStorage.getItem("token");

      // Traer plantillas
      const resPlantillas = await fetch("http://localhost:3001/plantillas", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const plantillasData = await resPlantillas.json();

      // Traer eventos
      let eventosData = [];

      try {
        const resEventos = await fetch("http://localhost:3001/eventos/ver", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (resEventos.ok) {
          eventosData = await resEventos.json();
        } else {
          console.warn("No se pudieron cargar eventos");
        }

      } catch (error) {
        console.warn("Error cargando eventos:", error);
      }
      const plantillasFormateadas = plantillasData.map((template) => {

        const evento = eventosData.find(
          (event) => event.plantillas_id_plantilla === template.id_plantilla
        );

        const titulo = evento?.titulo || template.nombre_plantilla;

        const descripcion =
          evento?.descripcion || "Descripción no disponible";

        const urlBase = template.portada?.url ?? template.portada;

        const portadaCompleta = urlBase
          ? `http://localhost:3001${urlBase}?t=${Date.now()}`
          : null;

        return {
          id_plantilla: template.id_plantilla,
          titulo,
          descripcion,
          portada: portadaCompleta,
          estructura: template.estructura || template.estructura_base || null,
          slug_url: template.slug_url || null,
        };
      });

      setTemplates(plantillasFormateadas);

    } catch (err) {
      console.error("Error cargando plantillas:", err);
    }
  };

  useEffect(() => {
    cargarPlantillas();
  }, []);


  const actualizarPortada = (idPlantilla, nuevaUrl) => {
    const urlCacheBust = `http://localhost:3001${nuevaUrl}?t=${Date.now()}`;

    setTemplates((prev) =>
      prev.map((t) =>
        t.id_plantilla === idPlantilla
          ? { ...t, portada: urlCacheBust }
          : t
      )
    );
  };

  const handlePlantillaEliminada = (idPlantilla) => {
    // Recargar las plantillas después de que se elimine/vacíe una
    cargarPlantillas();
  };

  return (
    <div className="templates-container">
      <header className="templates-header">
        <h1>Eventos disponibles</h1>
      </header>

      <div className="cards-container">
        {templates.map((template) => (
          <div key={template.id_plantilla} className="template-wrapper">
            <TemplateCard
              template={template}
              showButtons={false}
              enableCardClick={true}
              onSelect={() => {
                if (template.slug_url) {
                  navigate(`/evento/${template.slug_url}`);
                }
              }}
              disabled={isDefaultStructure(template.estructura)}
              onDeleted={handlePlantillaEliminada}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Inicio;