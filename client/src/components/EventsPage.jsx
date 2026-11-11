import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import "./EventsPage.css";
import EventModal from "./Modal/EventModal.jsx";
import { Toaster, toast } from "sonner";
import { useTemplates } from "../context/TemplatesContext";

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventoEditar, setEventoEditar] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(null);
  const { refreshTemplates } = useTemplates();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // eventos por página
  const totalPages = Math.ceil(events.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;

  const obtenerEventos = async () => {
    try {
      const response = await fetch("http://localhost:3000/eventos/ver", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Error en la petición");

      const data = await response.json();
      return data;
    } catch (error) {
      toast.error("Error al obtener eventos");
      return [];
    }
  };

  useEffect(() => {
    obtenerEventos().then((data) => {
      if (Array.isArray(data)) {
        setEvents(data);
      } else {
        toast.error("Error: La API no devolvió datos válidos");
        setEvents([]);
      }
    });
  }, []);

  const abrirModalCrear = () => {
    setEventoEditar(null);
    setIsModalOpen(true);
  };

  const abrirModalEditar = (evento) => {
    setEventoEditar(evento);
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setEventoEditar(null);
  };

  const handleCrearEditarEvento = async (formData) => {
    try {
      let res;
      let dataToSend = formData;

      if (eventoEditar) {
        dataToSend = {
          ...eventoEditar,
          ...formData,
        };

        Object.keys(dataToSend).forEach((key) => {
          if (dataToSend[key] === "" && eventoEditar[key]) {
            dataToSend[key] = eventoEditar[key];
          }
        });

        res = await fetch(
          `http://localhost:3000/eventos/editar/${eventoEditar.id_evento}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(dataToSend),
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || errorData.message || "Error al editar evento");
        }

        toast.success("Evento actualizado correctamente");
        refreshTemplates();
      } else {
        res = await fetch("http://localhost:3000/eventos/crear", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || errorData.message || "Error al crear evento");
        }

        toast.success("Evento creado correctamente");
      }

      const datos = await obtenerEventos();
      if (Array.isArray(datos)) setEvents(datos);
      cerrarModal();
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  
  };

  const handleToggleStatus = async (event) => {
    try {
      setLoadingStatus(event.id_evento);

      const isActive = event.deleted_at === null;
      const newStatus = isActive ? new Date().toISOString() : null;

      const res = await fetch(
        `http://localhost:3000/eventos/toggle/${event.id_evento}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ deleted_at: newStatus }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al cambiar estado");
      }

      const datos = await obtenerEventos();
      if (Array.isArray(datos)) setEvents(datos);
      refreshTemplates();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoadingStatus(null);
    }
  };

  const filteredEvents = events.filter((event) => {
    const textoEvento = event.titulo || "";
    return textoEvento.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const eventsPaginated = filteredEvents.slice(indexOfFirst, indexOfLast);

  return (
    <div className="events-container">
      <Toaster richColors position="top-center" />
      <h2 className="page-title">Gestión de Eventos</h2>

      <div className="actions-bar">
        <button className="btn-add" onClick={abrirModalCrear}>
          Agregar Nuevo Evento
        </button>

        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar evento por título..."
            className="search-input"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={cerrarModal}
        onSubmit={handleCrearEditarEvento}
        eventoAEditar={eventoEditar}
      />

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Título del Evento</th>
              <th>Descripción</th>
              <th>Fecha Inicio</th>
              <th>Fecha Fin</th>
              <th>Lugar</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {eventsPaginated.map((event) => (
              <tr key={event.id_evento}>
                <td>{event.titulo}</td>
                <td>{event.descripcion}</td>
                <td>
                  {event.fecha_inicio
                    ? format(new Date(event.fecha_inicio), "dd-MM-yyyy", {
                        locale: es,
                      })
                    : "N/A"}
                </td>
                <td>
                  {event.fecha_fin
                    ? format(new Date(event.fecha_fin), "dd-MM-yyyy", {
                        locale: es,
                      })
                    : "N/A"}
                </td>
                <td>{event.lugar}</td>
                <td className="actions-cell">
                  <button
                    className="btn-edit"
                    onClick={() => abrirModalEditar(event)}
                  >
                    Editar
                  </button>

                  <button
                    className={`btn-status ${
                      event.deleted_at === null
                        ? "status-active"
                        : "status-inactive"
                    }`}
                    onClick={() => handleToggleStatus(event)}
                    disabled={loadingStatus === event.id_evento}
                  >
                    {loadingStatus === event.id_evento
                      ? "..."
                      : event.deleted_at === null
                      ? "ACTIVO"
                      : "INACTIVO"}
                  </button>
                </td>
              </tr>
            ))}

            {filteredEvents.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                  No se encontraron eventos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN FUNCIONAL */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
          >
            &lt;
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              className={`page-btn ${currentPage === i + 1 ? "active" : ""}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}

          <button
            className="page-btn"
            onClick={() =>
              setCurrentPage((p) => Math.min(p + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
};

export default EventsPage;