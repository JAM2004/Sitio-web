import { Flex, Box } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import EditorCanvas from "./Componentes/EditorCanvas";
import { getDefaultStructure } from "./Componentes/estructuraDefault"; 

export default function EditorPage() {
  const { id } = useParams();
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [templateData, setTemplateData] = useState(null);
  const [slugUrl, setSlugUrl] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const tituloPrevio = document.title;
    const cargarPlantilla = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:3001/plantillas/vista/${id}`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error(`Error ${res.status} al cargar la plantilla`);
        }

        const data = await res.json();
        
        let estructura = null;
        const base = data.estructura || data.estructura_base || null;
        if (base) {
          estructura = typeof base === "string" ? JSON.parse(base) : base;
        } else if (hasTableData(data)) {
          estructura = convertirTablasAEstructura(data);
        }

        if (Array.isArray(estructura)) {
          estructura = { sections: estructura };
        }

        if (!estructura || !Array.isArray(estructura.sections)) {
          estructura = getDefaultStructure ();
        }

        setTemplateData(estructura);
        setSlugUrl(data.slug_url);
        if (data.nombre_plantilla) {
          document.title = data.nombre_plantilla;
        }
      } catch (err) {
        console.error("Error cargando plantilla:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      cargarPlantilla();
    }
    return () => {
      document.title = tituloPrevio; };
  }, [id]);

  const hasTableData = (data) => {
    return data && Array.isArray(data.secciones) && Array.isArray(data.columnas) && Array.isArray(data.bloques);
  };

  const convertirTablasAEstructura = (data) => {
    const { secciones, columnas, bloques } = data;
    
    // Ordenar por orden
    secciones.sort((a, b) => a.orden - b.orden);
    columnas.sort((a, b) => a.orden - b.orden);
    bloques.sort((a, b) => a.orden - b.orden);
    
    const sections = secciones.map(seccion => {
      const sectionColumns = columnas
        .filter(col => col.id_seccion === seccion.id_seccion)
        .map(col => {
          const columnBlocks = bloques
            .filter(block => block.id_columna === col.id_columna)
            .map(block => ({
              id: block.id_bloque,
              type: block.tipo,
              content: block.contenido
            }));
          
          return {
            id: col.id_columna,
            blocks: columnBlocks
          };
        });
      
      return {
        id: seccion.id_seccion,
        type: seccion.tipo,
        columns: sectionColumns
      };
    });
    
    return { sections };
  };

  const guardarCambios = async (estructuraActualizada) => {
    try {
      const token = localStorage.getItem("token");
      
      await fetch(`http://localhost:3001/plantillas/${id}/estructura`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estructura: estructuraActualizada }),
      });
    } catch (err) {
      console.error("Error guardando cambios:", err);
      alert("Error al guardar cambios");
    }
  };

  const convertirEstructuraATablas = (estructura) => {
    const secciones = [];
    const columnas = [];
    const bloques = [];
    
    estructura.sections.forEach((section, sectionIndex) => {
      secciones.push({
        id_seccion: section.id,
        tipo: section.type,
        orden: sectionIndex
      });
      
      section.columns.forEach((column, columnIndex) => {
        columnas.push({
          id_columna: column.id,
          id_seccion: section.id,
          orden: columnIndex
        });
        
        column.blocks.forEach((block, blockIndex) => {
          bloques.push({
            id_bloque: block.id,
            id_columna: column.id,
            tipo: block.type,
            contenido: block.content || "",
            orden: blockIndex
          });
        });
      });
    });
    
    return { secciones, columnas, bloques };
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <Flex h="100vh">
      <Box flex="1" bg="gray.100" p={0}>
        <EditorCanvas
          setSelectedBlock={setSelectedBlock}
          initialData={templateData}
          onSave={guardarCambios}
          plantillaId={id}
          slugUrl={slugUrl}
        />
      </Box>
    </Flex>
  );
}