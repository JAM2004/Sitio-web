import React, { useState, useEffect } from "react";
import "./modal.css";

const UserModal = ({ isOpen, onClose, onSubmit, usuarioAEditar }) => {
  // 1. ESTADO: Agregamos currentPassword y confirmPassword
  const initialState = {
    Username: "",
    email: "",
    id_rol: "2",
    password: "", // Nueva contraseña
    confirmPassword: "", // Confirmación de la nueva
    currentPassword: "", // Contraseña actual (solo para validar cambio al editar)
  };

  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState(""); // Estado para mensajes de error de validación

  // Variable auxiliar para saber si estamos editando
  const isEditing = !!usuarioAEditar;

  useEffect(() => {
    if (usuarioAEditar) {
      // MODO EDICIÓN: Cargar datos, limpiar passwords
      setFormData({
        Username: usuarioAEditar.Username || "",
        email: usuarioAEditar.email || "",
        id_rol: usuarioAEditar.id_rol || "2",
        password: "",
        confirmPassword: "",
        currentPassword: "",
      });
    } else {
      // MODO CREAR: Resetear todo
      setFormData(initialState);
    }
    setError(""); // Limpiar errores previos
  }, [usuarioAEditar, isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    // Limpiar error si el usuario empieza a corregir
    if (name === "password" || name === "confirmPassword") setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 2. VALIDACIÓN: Las contraseñas nuevas deben coincidir
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    // 3. VALIDACIÓN: En edición, si escribe nueva contraseña, debe poner la actual
    if (
      isEditing &&
      formData.password.length > 0 &&
      formData.currentPassword.length === 0
    ) {
      setError("Debes ingresar tu contraseña actual para autorizar el cambio.");
      return;
    }

    // Si todo está bien, enviamos
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="overlay">
      <div className="modalContainer">
        <div className="header">
          <h2 className="title">
            {isEditing
              ? `Editar Usuario: ${formData.Username}`
              : "Crear Nuevo Usuario"}
          </h2>
          <button onClick={onClose} className="closeButton">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          {/* --- DATOS GENERALES (Bloqueados en Edición) --- */}
          <div className="inputGroup">
            <label className="label">Nombre de Usuario</label>
            <input
              type="text"
              name="Username"
              value={formData.Username}
              onChange={handleChange}
              className="input"
              required
              disabled={isEditing}
              style={{ backgroundColor: isEditing ? "#e9ecef" : "white" }}
            />
          </div>

          <div className="inputGroup">
            <label className="label">Correo Electrónico</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              required
              disabled={isEditing}
              style={{ backgroundColor: isEditing ? "#e9ecef" : "white" }}
            />
          </div>

          <div className="inputGroup">
            <label className="label">Rol</label>
            <select
              name="id_rol"
              value={formData.id_rol}
              onChange={handleChange}
              className="select"
              disabled={isEditing}
              style={{ backgroundColor: isEditing ? "#e9ecef" : "white" }}
            >
              <option value="1">Administrador</option>
              <option value="2">Usuario</option>
              <option value="3">Editor</option>
            </select>
          </div>

          {/* --- SECCIÓN DE CONTRASEÑAS --- */}
          {isEditing && (
            <div
              style={{ borderTop: "1px solid #ddd", margin: "15px 0" }}
            ></div>
          )}

          {/* 1. CONTRASEÑA ACTUAL (Solo visible en Edición) */}
          {isEditing && (
            <div className="inputGroup">
              <label className="label">
                Contraseña Actual (Para autorizar cambios)
              </label>
              <input
                type="text"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className="input"
                placeholder="Tu contraseña actual"
                // Si el usuario escribió una nueva pass, esta se vuelve obligatoria visualmente
                style={{
                  borderColor:
                    error && formData.currentPassword === "" ? "red" : "#ccc",
                }}
              />
            </div>
          )}

          {/* 2. NUEVA CONTRASEÑA */}
          <div className="inputGroup">
            <label className="label">
              {isEditing ? "Nueva Contraseña" : "Contraseña"}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input"
              // Obligatorio en CREAR, Opcional en EDITAR
              required={!isEditing}
              placeholder={isEditing ? "Dejar vacío si no cambia" : "******"}
            />
          </div>

          {/* 3. CONFIRMAR NUEVA CONTRASEÑA */}
          <div className="inputGroup">
            <label className="label">
              {isEditing
                ? "Confirmar Nueva Contraseña"
                : "Confirmar Contraseña"}
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input"
              // Obligatorio si escribieron algo en el campo de arriba
              required={formData.password.length > 0 || !isEditing}
              placeholder="Repite la contraseña"
              style={{
                borderColor: error.includes("coinciden") ? "red" : "#ccc",
              }}
            />
          </div>

          {/* Mensaje de Error Visual */}
          {error && (
            <p
              style={{
                color: "red",
                fontSize: "0.9rem",
                marginTop: "-10px",
                marginBottom: "10px",
              }}
            >
              {error}
            </p>
          )}

          <div className="footer">
            <button type="button" onClick={onClose} className="btnCancel">
              Cancelar
            </button>
            <button type="submit" className="btnSubmit">
              {isEditing ? "Actualizar Datos" : "Guardar Usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
