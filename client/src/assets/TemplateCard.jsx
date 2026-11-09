import React, { useRef, useState } from "react";
import { Flex, Box, Button, VStack, HStack, Text, Drawer, DrawerOverlay, DrawerContent, DrawerHeader, DrawerBody, DrawerCloseButton, Input, Divider, Slider, useToast} from "@chakra-ui/react";
import "./TemplateCard.css";

const TemplateCard = ({ template, onSelect, onPreview, disabled = false, showButtons = true, onPortadaActualizada, onDeleted, enableCardClick = false }) => {

  const fileInputRef = useRef(null);
  const [portadaLocal, setPortadaLocal] = useState(template.portada);
  const [plantillaActiva, setPlantillaActiva] = useState(null);
  const esAdmin = localStorage.getItem("id_rol") === "1";

  const handleSelectImage = (e) => {
    e.stopPropagation();
    fileInputRef.current.click();
  };

const handleFileChange = async (e) => {
  e.stopPropagation();
  const file = e.target.files[0];
  if (!file) return;

  const token = localStorage.getItem("token");

  try {
    const res = await fetch(
      `http://localhost:3000/componentes/${template.id_plantilla}/imagenes`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();

    const formData = new FormData();
    formData.append("imagen", file);
    formData.append("tipo", "portada");
    formData.append("orden", "1");

    const resUpload = await fetch(
      `http://localhost:3000/componentes/${template.id_plantilla}/imagenes`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const dataUpload = await resUpload.json();

    if (!resUpload.ok) {
      console.error("Error guardando imagen:", dataUpload);
      return;
    }

    const urlImagen = dataUpload.url;
    const urlConTimestamp = `http://localhost:3000${urlImagen}?t=${Date.now()}`;

    setPortadaLocal(urlConTimestamp);

    if (onPortadaActualizada) {
      onPortadaActualizada(template.id_plantilla, urlImagen);
    }

  } catch (error) {
    console.error("Error subiendo portada:", error);
  }
};

  const handleLimpiar = async () => {
    if (
      !window.confirm(
        "¿Vaciar esta plantilla? Se borrará el contenido de la página del evento."
      )
    ) {
      return;
    }
    const token = localStorage.getItem("token");
    try {
      const res = await fetch( `http://localhost:3000/plantillas/${template.id_plantilla}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          }
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("Error eliminando plantilla:", data);
          return;
        }
        const plantillaId= template.id_plantilla.toString();
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.includes(plantillaId)) {
            localStorage.removeItem(key);
          }
        }

        console.log("Plantilla eliminada:", data);
        setPortadaLocal(null);

        if (onDeleted) {
          onDeleted(template.id_plantilla);
        }

    } catch (error) {
      console.error("Error eliminando plantilla:", error);
    }
  };

  return (
    <div
      className="template-card"
      style={{ cursor: disabled ? "not-allowed" : (enableCardClick ? "pointer" : "default"), opacity: disabled ? 0.5 : 1 }}
      onClick={() => {
        if (enableCardClick && !disabled && onSelect) onSelect();
      }}
    >

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleFileChange}
      />

    <div onClick={showButtons ? handleSelectImage : undefined}>
      {portadaLocal ? (
        <div className="card-image">
          <img src={portadaLocal} alt={template.titulo} />
        </div>
      ) : (
        <div className="card-image no-image">
          <span>Agregar portada</span>
        </div>
      )}
      </div>

      <div className="card-content">
        <h3>{template.titulo}</h3>
        <p>{template.descripcion}</p>

        {showButtons && (
          <>
            <button
              className="use-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (!disabled && onSelect) onSelect();
              }}
              disabled={disabled}
              style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
            >
              Editar plantilla
            </button>
            {onPreview && (
              <button
                className="preview-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disabled) onPreview();
                }}
                disabled={disabled}
                style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
              >
                Ver plantilla
              </button>
            )}
            
            {esAdmin && (
              <button
                className="limpiar-btn"
                
                onClick={ (e) => {
                  e.stopPropagation();
                  handleLimpiar();
                }}
                disabled={disabled}
                style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
              >
                Limpiar Plantilla
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TemplateCard;
