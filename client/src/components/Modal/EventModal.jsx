import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import "./Modal.css";

const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  
  if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
    return dateString.split("T")[0]; 
  }
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  ////+
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  
  return `${year}-${month}-${day}`;
};

const EventModal = ({ isOpen, onClose, onSubmit, eventoAEditar }) => {
  const initialState = {
    titulo: "",
    descripcion: "",
    fecha_inicio: "",
    fecha_fin: "",
    lugar: "",
  };

  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);

  const isEditing = !!eventoAEditar;

  useEffect(() => {
    if (eventoAEditar) {
      setFormData({
        titulo: eventoAEditar.titulo || "",
        descripcion: eventoAEditar.descripcion || "",
        fecha_inicio: formatDateForInput(eventoAEditar.fecha_inicio),
        fecha_fin: formatDateForInput(eventoAEditar.fecha_fin),
        lugar: eventoAEditar.lugar || "",
      });
    } else {
      setFormData(initialState);
    }
  }, [eventoAEditar, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación de fechas
    if (formData.fecha_inicio && formData.fecha_fin) {
      const fechaInicio = new Date(formData.fecha_inicio);
      const fechaFin = new Date(formData.fecha_fin);
      
      if (fechaInicio > fechaFin) {
        toast.error("La fecha es incorrecta");
        return;
      }
    }
    
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="overlay">
      <div className="modalContainer">
        <div className="header">
          <h2 className="title">
            {isEditing ? `Editar Evento: ${formData.titulo || 'Sin título'}` : "Crear Nuevo Evento"}
          </h2>
          <button onClick={onClose} className="closeButton" disabled={loading}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="inputGroup">
            <label className="label">Título</label>
            <input
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div className="inputGroup">
            <label className="label">Descripción</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div className="inputGroup">
            <label className="label">Fecha Inicio</label>
            <input
              type="date"
              name="fecha_inicio"
              value={formData.fecha_inicio}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div className="inputGroup">
            <label className="label">Fecha Fin</label>
            <input
              type="date"
              name="fecha_fin"
              value={formData.fecha_fin}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div className="inputGroup">
            <label className="label">Lugar</label>
            <input
              name="lugar"
              value={formData.lugar}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div className="footer">
            <button type="button" onClick={onClose} className="btnCancel" disabled={loading}>Cancelar</button>
            <button type="submit" className="btnSubmit" disabled={loading}>
              {loading ? "Procesando..." : (isEditing ? "Actualizar Evento" : "Guardar Evento")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
