import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";

let saliendo = false;

const cerrarSesion = () => {
    if(saliendo) return;
    saliendo = true;
    ["token", "user", "id_rol", "id_user"].forEach((k) => localStorage.removeItem(k))
    toast.error("Tu sesion expiro.");
    setTimeout(() => window.location.assign("/"), 900);
};

const fetchOriginal = window.fetch.bind(window);

window.fetch = async (...args) => {
    const res = await fetchOriginal(...args);
    if(res.status !== 401 && res.status !== 403) return res;

    const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
    if (!url.includes("/api/")) return res;

    const token = localStorage.getItem("token");
    if (!token) return res;
    if (res.status === 401) { cerrarSesion(); return res; }

    try {
        if (jwtDecode(token).exp * 1000 < Date.now())  cerrarSesion ();
    } catch {
        cerrarSesion();
    }
    return res;
};