import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Spinner, Center, Button, Text } from "@chakra-ui/react";
import TemplateRenderer from "./Plantillas/TemplateRenderer";
import "./PublicEventPage.css";

export default function PublicEventPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const parseEstructura = (raw) => {
    if (!raw) return null;
    let parsed = raw;

    if (typeof raw === "string") {
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        console.error("Error parseando estructura_base:", err);
        return null;
      }
    }

    if (Array.isArray(parsed)) {
      return { sections: parsed };
    }

    if (parsed.sections) {
      return parsed;
    }

    if (Array.isArray(raw.secciones) && Array.isArray(raw.columnas) && Array.isArray(raw.bloques)) {
      const secciones = raw.secciones.slice().sort((a, b) => (a.orden || 0) - (b.orden || 0));
      const columnas = raw.columnas.slice().sort((a, b) => (a.orden || 0) - (b.orden || 0));
      const bloques = raw.bloques.slice().sort((a, b) => (a.orden || 0) - (b.orden || 0));

      const sections = secciones.map((seccion) => {
        const sectionColumns = columnas
          .filter((col) => col.id_seccion === seccion.id_seccion)
          .map((col) => {
            const columnBlocks = bloques
              .filter((block) => block.id_columna === col.id_columna)
              .map((block) => ({ id: block.id_bloque, type: block.tipo, content: block.contenido || "" }));

            return { id: col.id_columna, blocks: columnBlocks };
          });

        return { id: seccion.id_seccion, type: seccion.tipo, columns: sectionColumns };
      });

      return { sections };
    }

    return null;
  };

  useEffect(() => {
    const loadPage = async () => {
      try {
        const res = await fetch(`http://localhost:3001/pagina/${slug}`);

        if (!res.ok) {
          setMessage("Página no encontrada");
          return;
        }

        const data = await res.json();
        console.log('Página recibida:', data);
        setPageData(data);
      } catch (err) {
        console.error("Error cargando página:", err);
        setMessage("Error cargando la página");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadPage();
    }
  }, [slug]);

  useEffect(() => {
    if (!pageData) return;
    const anterior = document.title;
    if (pageData.titulo) document.title = pageData.titulo;
    return () => { document.title = anterior;};
  }, [pageData]);

  const pageStructure = pageData ? parseEstructura(pageData.estructura_base || pageData.estructura || pageData) : null;

  if (loading) {
    return (
      <Center minH="100vh">
        <Spinner size="lg" />
      </Center>
    );
  }

  return (
    <Box w="100%">
      {/* Contenido del evento */}
      {pageStructure ? (
        <TemplateRenderer estructura={pageStructure} />
      ) : (
        <Center minH="100vh">
          <Text fontSize="xl">Esta pagina ya no esta disponible.</Text>
        </Center>
      )}
    </Box>
  );
}
