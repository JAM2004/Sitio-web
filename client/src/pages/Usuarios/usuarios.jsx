import React, { useState, useEffect } from "react";
import "./usuarios.css";
import UserModal from "../../components/Modal/Modal.jsx";
import Search from "../../components/Searchbar/Search.jsx";
import { Toaster, toast } from "sonner";

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState(null);
  const [idRolActual, setIdRolActual] = useState(() => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split(".")[1])).id_rol ?? null;
    } catch {
      return null;
    }
  });

  const [paginaActual, setPaginaActual] = useState(1);
  const usuariosPorPagina = 5;

  const indiceUltimoUsuario = paginaActual * usuariosPorPagina;
  const indicePrimerUsuario = indiceUltimoUsuario - usuariosPorPagina;

  const obtenerUsuarios = async () => {
    try {
      const respuesta = await fetch("http://localhost:3000/usuarios", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!respuesta.ok) throw new Error("No se pudo conectar");
      const datos = await respuesta.json();
      setUsuarios(datos);
    } catch (error) {
      console.warn("Modo Demo o Error: ", error);
    }
  };

  useEffect(() => {
    const admin = idRolActual === 1;

    if (admin) {
      obtenerUsuarios();
    } else {
      // Sin permiso para listar: solo mi propia fila para cambiar mi contraseña
      const propio = JSON.parse(localStorage.getItem("user") || "null");
      if (propio) {
        const roles = { 1: "Administrador", 2: "Visitante", 3: "Editor" };
        setUsuarios([{ ...propio, nombre_rol: roles[propio.id_rol] || "" }]);
      }
    }
  }, []);

  const usuariosFiltrados = usuarios.filter((user) => {
    const coincideNombre =
      user.Username?.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
      false;

    const esAdmin = idRolActual === 1;

    if (!esAdmin && user.estado !== 1) return false;

    return coincideNombre;
  });

  const usuariosActuales = usuariosFiltrados.slice(
    indicePrimerUsuario,
    indiceUltimoUsuario
  );

  const totalPaginas = Math.ceil(usuariosFiltrados.length / usuariosPorPagina);

  const cambiarPagina = (num) => setPaginaActual(num);


  const abrirModalEditar = (usuario) => {
    setUsuarioEditar(usuario);
    setIsModalOpen(true);
  };

  const abrirModalCrear = () => {
    setUsuarioEditar(null);
    setIsModalOpen(true);
  };

  const cerrarYLimpiarModal = () => {
    setIsModalOpen(false);
    setUsuarioEditar(null);
  };

  const handleCrearUsuario = async (datosDelModal) => {
    try {
      const payload = {
        nombre: datosDelModal.Username,
        email: datosDelModal.email,
        password: datosDelModal.password,
        rol: datosDelModal.id_rol,
      };

      const respuesta = await fetch("http://localhost:3000/registerUsers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await respuesta.json();

      if (respuesta.ok) {
        toast.success(data.message);
        obtenerUsuarios();
        cerrarYLimpiarModal();
      } else {
        toast.error(data.error || "Error al crear el usuario");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleEditarUsuario = async (datosDelModal) => {
    try {
      const payload = {
        password_actual: datosDelModal.currentPassword,
        password_nueva: datosDelModal.password,
        password_confirmar: datosDelModal.confirmPassword,
      };

      const respuesta = await fetch(
        "http://localhost:3000/usuarios/cambiar-pass",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await respuesta.json();

      if (respuesta.ok) {
        toast.success(data.message || "Contraseña actualizada");
        cerrarYLimpiarModal();
      } else {
        toast.error(data.error || "Error al actualizar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const resetearPassword = async (usuario) => {
    if (
      !window.confirm(
        `¿Restablecer la contraseña de ${usuario.Username}? Se le pedirá cambiarla al ingresar.`
      )
    ) {
      return;
    }

    try {
      const respuesta = await fetch(
        `http://localhost:3000/usuarios/${usuario.ID_User}/reset-pass`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await respuesta.json();

      if (!respuesta.ok) throw new Error(data.error || "Error");

      try {
        await navigator.clipboard.writeText(data.temporal);
      } catch {
        // sin portapapeles: el toast igual muestra la contraseña
      }
      toast.success(
        `Contraseña temporal de ${usuario.Username}: ${data.temporal} (copiada al portapapeles)`
      );
    } catch (error) {
      toast.error(error.message);
    }
  };

  const toggleEstadoUsuario = async (id, estadoActual) => {
    const nuevoEstado = estadoActual == 1 ? 0 : 1;

    setUsuarios((prev) =>
      prev.map((u) =>
        u.ID_User === id ? { ...u, estado: nuevoEstado } : u
      )
    );

    try {
      const respuesta = await fetch(
        `http://localhost:3000/usuarios/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ status: nuevoEstado }),
        }
      );

      const data = await respuesta.json();

      if (!respuesta.ok) throw new Error(data.error || "Error");

      toast.success(data.message);
    } catch (error) {
      setUsuarios((prev) =>
        prev.map((u) =>
          u.ID_User === id ? { ...u, estado: estadoActual } : u
        )
      );
      toast.error(error.message);
    }
  };

  const esAdmin = idRolActual === 1;

  return (
    <div className="usuarios-container">
      <Toaster richColors position="top-center" />
      <h2 className="titulo-principal">
        {esAdmin ? "Gestión de Usuarios" : "Mi usuario"}
      </h2>

      {esAdmin && (
        <div className="actions-bar">
          <button className="btn-add" onClick={abrirModalCrear}>
            Agregar Nuevo Usuario
          </button>

          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar usuario..."
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPaginaActual(1);
              }}
            />
          </div>
        </div>
      )}

      <table className="tabla-usuarios">
        <thead>
          <tr>
            <th className="left-th">Nombre</th>
            <th className="left-th">Email</th>
            <th className="left-th">Rol</th>
            <th>Estado</th>
          </tr>
        </thead>

        <tbody>
          {usuariosActuales.length > 0 ? (
            usuariosActuales.map((user) => {
              const idLogueado = parseInt(localStorage.getItem("id_user"));
              const esMiUsuario = user.ID_User === idLogueado;

              return (
                <tr key={user.ID_User}>
                  <td>{user.Username}</td>
                  <td>{user.email}</td>
                  <td>{user.nombre_rol}</td>
                  <td className="texto-centro">
                    <div className="acciones-container">
                      {esMiUsuario ? (
                        <button
                          className="btn btn-editar"
                          onClick={() => abrirModalEditar(user)}
                          style={{ marginRight: "10px" }}
                        >
                          Editar
                        </button>
                      ) : (
                        <span
                          style={{
                            marginRight: "10px",
                            color: "#ccc",
                            fontSize: "0.8em",
                          }}
                        >
                          Bloqueado
                        </span>
                      )}

                      {esAdmin && (
                        <button
                          className="btn btn-editar"
                          onClick={() => resetearPassword(user)}
                          style={{ marginRight: "10px" }}
                        >
                          Reset
                        </button>
                      )}

                      {esAdmin && (
                        <button
                          className={`btn btn-estado ${
                            user.estado == 1
                              ? "status-activo"
                              : "status-inactivo"
                          }`}
                          onClick={() =>
                            toggleEstadoUsuario(user.ID_User, user.estado)
                          }
                        >
                          {user.estado == 1 ? "Activo" : "Inactivo"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="5" className="texto-centro" style={{ padding: "20px" }}>
                No hay usuarios para mostrar
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {totalPaginas > 1 && (
        <div className="paginacion-container">
          <button
            onClick={() => cambiarPagina(paginaActual - 1)}
            disabled={paginaActual === 1}
            className="btn-nav"
          >
            &lt;
          </button>

          {Array.from({ length: totalPaginas }, (_, index) => (
            <button
              key={index + 1}
              onClick={() => cambiarPagina(index + 1)}
              className={
                paginaActual === index + 1
                  ? "btn-pagina activo"
                  : "btn-pagina"
              }
            >
              {index + 1}
            </button>
          ))}

          <button
            onClick={() => cambiarPagina(paginaActual + 1)}
            disabled={paginaActual === totalPaginas}
            className="btn-nav"
          >
            &gt;
          </button>
        </div>
      )}

      <UserModal
        isOpen={isModalOpen}
        onClose={cerrarYLimpiarModal}
        onSubmit={usuarioEditar ? handleEditarUsuario : handleCrearUsuario}
        usuarioAEditar={usuarioEditar}
      />
    </div>
  );
};

export default Usuarios;