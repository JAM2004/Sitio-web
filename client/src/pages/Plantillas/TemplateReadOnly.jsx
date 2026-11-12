import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Spinner, Center, Button, Text } from "@chakra-ui/react";
import TemplateRenderer from "./TemplateRenderer";


// Boton de vista previa en TemplateCard que redirige a esta página, mostrando la plantilla sin opciones de edición. Solo lectura.

const convertirTablasAEstructura = (data) => {
  if (!data) return { sections: [] };

  const secciones = data.secciones || [];
  const columnas = data.columnas || [];
  const bloques = data.bloques || [];

  const seccionesOrdenadas = [...secciones].sort((a, b) => (a.orden || 0) - (b.orden || 0));
  const columnasOrdenadas = [...columnas].sort((a, b) => (a.orden || 0) - (b.orden || 0));
  const bloquesOrdenados = [...bloques].sort((a, b) => (a.orden || 0) - (b.orden || 0));

  const sections = seccionesOrdenadas.map((seccion) => {
    const sectionColumns = columnasOrdenadas
      .filter((col) => col.id_seccion === seccion.id_seccion)
      .map((col) => {
        const columnBlocks = bloquesOrdenados
          .filter((block) => block.id_columna === col.id_columna)
          .map((block) => ({
            id: block.id_bloque,
            type: block.tipo,
            content: block.contenido || ""
          }));

        return { id: col.id_columna, blocks: columnBlocks };
      });

    return { id: seccion.id_seccion, type: seccion.tipo, columns: sectionColumns };
  });

  return { sections };
};

export default function TemplateReadOnly() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [estructura, setEstructura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:3001/plantillas/vista/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          setMessage("Error cargando plantilla");
          return;
        }

        const data = await res.json();
        const base = data.estructura_base || data.estructura || null;

        if (!base) {
          setMessage("No hay estructura en esta plantilla");
          return;
        }

        const parsed = typeof base === "string" ? JSON.parse(base) : base;
        const finalStructure = parsed.sections ? parsed : convertirTablasAEstructura(data);
        setEstructura(finalStructure);
      } catch (err) {
        console.error("Error cargando plantilla read-only:", err);
        setMessage("Error cargando plantilla");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <Center minH="100vh">
        <Spinner size="lg" />
      </Center>
    );
  }

  return (
    <Box minH="100vh" bg="gray.100" p={4}>
      <Box mb={4} display="flex" gap={2}>
        <Button onClick={() => navigate(-1)}>Volver</Button>
      </Box>

      {message ? (
        <Center minH="60vh">
          <Text>{message}</Text>
        </Center>
      ) : (
        <TemplateRenderer estructura={estructura} />
      )}
    </Box>
  );
}
