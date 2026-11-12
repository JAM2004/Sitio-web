import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";
import { useAuth } from "../../context/AuthContext";
// import logo1 from "../assets/p6.png";
// import logo2 from '../assets/p7.png'
// import logo3 from '../assets/p8.png'

export default function Login_component() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) return alert("Por favor ingresa un correo");
    if (!pass.trim()) return alert("Por favor ingresa la contraseña");

    try {
      setLoading(true);

      const response = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: pass }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "Ocurrió un error inesperado"); 
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setLoading(false);
        alert(errorMessage);   
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      login(data.user);
      if (data.user?.must_change_pass) {
        navigate("/cambiar-password", { replace: true });
      } else {
        navigate("/dashboard/inicio", { replace: true });
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      alert("Error en la conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="logos-row" aria-hidden>
          {/* AQUI VAN LOS LOGOS */}
        </div>

        <h2 className="login-title">Iniciar sesión</h2>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="email">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            className="input-field"
            placeholder="ejemplo1@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="field-label" htmlFor="pass">
            Contraseña
          </label>
          <input
            id="pass"
            type="password"
            className="input-field"
            placeholder="Contra_IMCA4"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Conectando..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
