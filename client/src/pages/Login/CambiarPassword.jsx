import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./login.css";

// Se muestra cuando el admin marcó "cambiar contraseña al próximo ingreso"
export default function CambiarPassword() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (nueva.length < 8) {
      return setErrorMessage("La contraseña debe tener al menos 8 caracteres");
    }
    if (nueva !== confirmar) {
      return setErrorMessage("Las contraseñas no coinciden");
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/usuarios/cambiar-pass", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          password_nueva: nueva,
          password_confirmar: confirmar,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "No se pudo cambiar la contraseña");
        return;
      }

      // El token sigue marcado como "forzado": salir y entrar con la nueva
      alert("Contraseña actualizada. Inicia sesión con tu nueva contraseña.");
      logout();
      navigate("/", { replace: true });
    } catch (error) {
      setErrorMessage("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2 className="login-title">Cambia tu contraseña</h2>
        <p style={{ textAlign: "center", marginBottom: "18px" }}>
          Tu administrador pidió cambiar esta contraseña. Define una nueva para
          continuar.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="nueva">
            Nueva contraseña
          </label>
          <input
            id="nueva"
            type="password"
            className="input-field"
            placeholder="Mínimo 8 caracteres"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
          />

          <label className="field-label" htmlFor="confirmar">
            Confirmar contraseña
          </label>
          <input
            id="confirmar"
            type="password"
            className="input-field"
            placeholder="Repite la contraseña"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
          />

          {errorMessage && (
            <p style={{ color: "#c0392b", fontSize: "0.9em" }}>{errorMessage}</p>
          )}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
