import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Input,
  Divider,
  Slider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { EditIcon, DeleteIcon } from "@chakra-ui/icons";
import { useState, useEffect, useRef } from "react";
import "./EditorCanvas.css";
import ColorPicker from "./ColorPicker";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import CarouselBlock from "./CarouselBlock";
import DroppableColumn from "./DroppableColumn";
import SidebarEditor from "./SidebarEditor";
import { getDefaultStructure } from "./estructuraDefault";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";


const getEditorDataKey = (plantillaId) => `editorData_${plantillaId}`;

const normalizeInitialSections = (initialData) => {
  if (!initialData) return null;
  if (Array.isArray(initialData)) return initialData;
  if (Array.isArray(initialData.sections)) return initialData.sections;
  return null;
};

const isValidSections = (candidate) => {
  return Array.isArray(candidate) && candidate.length > 0 && candidate.every((section) => section && Array.isArray(section.columns));
};

function SortableSection({ id, children, style, ...props }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <Box
      ref={setNodeRef}
      {...props}
      {...attributes}
      {...listeners}
      style={{
        ...style,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 5 : undefined,
      }}

    >
      {children}
    </Box>
  );
}
// --- Arrastre de bloques ---
// Los ids de bloque/columna van prefijados ("b:" / "c:") para no chocar con los
// de las secciones (números o "header"/"footer").

// Al arrastrar un bloque solo se puede soltar sobre bloques/columnas, y al
// arrastrar una sección solo sobre secciones. Sin este filtro, closestCenter
// compara centros y la sección (enorme) gana casi siempre: el bloque se movería
// y además reordenaría la sección por error.  
const collisionPorTipo = ({ droppableContainers, ...args }) => {
  const esBloque = String(args.active.id).startsWith("b:");
  const permitidos = droppableContainers.filter((c) => {
    const id = String(c.id);
    const esDeBloque = id.startsWith("b:") || id.startsWith("c:");
    return esBloque ? esDeBloque : !esDeBloque;
  });
  return closestCenter({ ...args, droppableContainers: permitidos });
};

const buscarBloque = (sections, id) => {
  for (const s of sections) {
    for (const c of s.columns) {
      const i = c.blocks.findIndex((b) => String(b.id) === id);
      if (i >= 0) return { col: c, i };
    }
  }
  return null;
};
// Quita el bloque de su columna y lo inserta en la destino: en la posición
// exacta del bloque sobre el que se suelta, o al final si se suelta en la columna
const moverBloque = (secciones, idBloque, idDestino) => {
  const origen = buscarBloque(secciones, idBloque);
  if (!origen) return secciones;

  let destino;
  if (idDestino.startsWith("c:")) {
    const col = secciones.flatMap((s) => s.columns).find((c) => String(c.id) === idDestino.slice(2));
    if (!col) return secciones;
    destino = { col, i: col.blocks.length };
  } else if (idDestino.startsWith("b:")) {
    destino = buscarBloque(secciones, idDestino.slice(2));
    if (!destino) return secciones;
  } else {
    return secciones;
  }

  const bloque = origen.col.blocks[origen.i];

  if (origen.col === destino.col) {
    const bloques = origen.col.blocks.filter((_, i) => i !== origen.i);
    const indice = destino.i - (origen.i < destino.i ? 1 : 0);
    bloques.splice(indice, 0, bloque);
    const nueva = { ...origen.col, blocks: bloques };
    return secciones.map((s) => ({ ...s, columns: s.columns.map((c) => (c === origen.col ? nueva : c)) }));
  }
  const enOrigen = { ...origen.col, blocks: origen.col.blocks.filter((_, i) => i !== origen.i) };
  const enDestino = { ...destino.col, blocks: [...destino.col.blocks] };
  enDestino.blocks.splice(destino.i, 0, bloque);

  return secciones.map((s) => ({
    ...s,
    columns: s.columns.map((c) => {
      if (c === origen.col) return enOrigen;
      if (c === destino.col) return enDestino;
      return c;
    }),
  }));
}

export default function EditorCanvas({ initialData, onSave, plantillaId, slugUrl }) {
  const toast = useToast();
  const [sectionToDelete, setSectionToDelete] = useState(null);
  const cancelRef = useRef();

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("contenido");

  const [isSectionSelectorOpen, setSectionSelectorOpen] = useState(false);
  const [targetSectionId, setTargetSectionId] = useState(null);

  const [sections, setSections] = useState(() => {
    const dataKey = getEditorDataKey(plantillaId);
    const saved = localStorage.getItem(dataKey);
    const normalized = normalizeInitialSections(initialData);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (isValidSections(parsed)) {
          return parsed;
        }
      } catch {
        // ignore invalid saved data
      }
    }

    return normalized && isValidSections(normalized) ? normalized : getDefaultStructure();
  });

  const [selectedSection, setSelectedSection] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);


  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    if (String(active.id).startsWith("b:")) {
      const idBloque = String(active.id).slice(2);
      const idDestino = String(over.id);
      setSections((prev) => moverBloque(prev, idBloque, idDestino));
      return;
    }
    if (over.id === "header" || over.id === "footer") return;

    setSections((prev) => {
      const movibles = prev.filter((s) => s.id !== "header" && s.id !== "footer");
      const from = movibles.findIndex((s) => s.id === active.id);
      const to = movibles.findIndex((s) => s.id === over.id);
    if (from < 0 || to < 0) return prev;

    const reordenadas = arrayMove(movibles, from, to);
    let i = 0;
    return prev.map((s) => (s.id === "header" || s.id === "footer" ? s : reordenadas[i++]));
    });
  };

  // Cargar datos cuando cambia plantillaId o initialData
  useEffect(() => {
    const dataKey = getEditorDataKey(plantillaId);
    const saved = localStorage.getItem(dataKey);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (isValidSections(parsed)) {
          setSections(parsed);
          return;
        }
      } catch {
        // ignore invalid saved data
      }
    }

    const normalized = normalizeInitialSections(initialData);
    setSections(normalized && isValidSections(normalized) ? normalized : getDefaultStructure());
  }, [plantillaId, initialData]);

  // Guardar en localStorage cuando sections cambia (después de cargar inicial)
  useEffect(() => {
    const dataKey = getEditorDataKey(plantillaId);
    localStorage.setItem(dataKey, JSON.stringify(sections));
  }, [sections, plantillaId]);

  const updateBlockContent = (blockId, value) => {
    const cleanValue = value.replace(/\r/g, "");
    const newSections = sections.map((section) => ({
      ...section,
      columns: section.columns.map((col) => ({
        ...col,
        blocks: col.blocks.map((block) =>
          block.id === blockId
            ? { ...block, content: value }
            : block
        )
      }))
    }));

    setSections(newSections);
  };

  const deleteBlock = (blockId) => {
    const newSections = sections.map((section) => ({
      ...section,
      columns: section.columns.map((col) => ({
        ...col,
        blocks: col.blocks.filter((block) => block.id !== blockId)
      }))
    }));

    setSections(newSections);
  };

  const updateMenuItem = (blockId, value) => {
    const newSections = sections.map((section) => ({
      ...section,
      columns: section.columns.map((col) => ({
        ...col,
        blocks: col.blocks.map((block) =>
          block.id === blockId
            ? { ...block, content: value }
            : block
        )
      }))
    }));

    setSections(newSections);
  };

  const deleteMenuItem = (blockId) => {
    const newSections = sections.map((section) => ({
      ...section,
      columns: section.columns.map((col) => ({
        ...col,
        blocks: col.blocks.filter((block) => block.id !== blockId)
      }))
    }));

    setSections(newSections);
  };

  useEffect(() => {
    localStorage.setItem("editorData", JSON.stringify(sections));
  }, [sections]);

  const openSectionEditor = (sectionId) => {
    setSelectedSection(sections.find((s) => s.id === sectionId));
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    setSelectedSection(null);
  };

  const addTemplateSection = (type) => {
    let newSection;

    if (type === "hero") {
      newSection = {
        id: Date.now(),
        type: "section",
        backgroundColor: "#ffffff",
        columns: [
          {
            id: "col-" + Date.now(),
            blocks: [
            ]
          }
        ]
      };
    }
    if (type === "carousel-full") {
      newSection = {
        id: Date.now(),
        type: "section",
        fullWidth: true,
        backgroundColor: "#ffffff",
        columns: [
          {
            id: "carousel-col-" + Date.now(),
            blocks: [
              {
                id: Date.now() + 1,
                type: "carousel",
                content: [
                  "https://picsum.photos/1600/600?random=1",
                  "https://picsum.photos/1600/600?random=2",
                  "https://picsum.photos/1600/600?random=3"
                ]
              }
            ]
          }
        ]
      };
    }
    if (type === "hero-image") {
      newSection = {
        id: Date.now(),
        type: "section",
        backgroundColor: "#ffffff",
        columns: [
          {
            id: "col-" + Date.now(),
            blocks: [
              {
                id: Date.now() + 1,
                type: "image",
                src: "https://via.placeholder.com/800x300"
              }
            ]
          }
        ]
      };
    }

    const idx = sections.findIndex((s) => s.id === targetSectionId);

    const updated = [...sections];
    updated.splice(idx, 0, newSection);

    setSections(updated);
    setSectionSelectorOpen(false);
  };
  const addBlockToSection = (type) => {
    const newSections = sections.map((sec) => {
      if (sec.id !== selectedSection.id) return sec;

      return {
        ...sec,
        columns: sec.columns.map((col) => {
          if (sec.type === "header" && type === "menu-item") {
            if (col.id !== "menu-col") return col;
          }

          return {
            ...col,
            blocks: [
              ...col.blocks,
              {
                id: Date.now(),
                type,
                styles: {},
                content:
                  type === "carousel"
                    ? ["https://via.placeholder.com/800x300"]
                    : type === "text"
                      ? "Nuevo texto"
                      : type === "heading"
                        ? "Nuevo título"
                        : type === "button"
                          ? "Botón"
                          : type === "box"
                            ? "Párrafo"
                            : type === "menu-item"
                              ? ""
                              : ""
              }
            ]
          };
        })
      };
    });

    setSections(newSections);
  };
  const handleCarouselUpload = (blockId, file, index) => {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const newSections = sections.map((section) => ({
        ...section,
        columns: section.columns.map((col) => ({
          ...col,
          blocks: col.blocks.map((block) => {
            if (block.id !== blockId) return block;

            const newImages = [...block.content];
            newImages[index] = reader.result;

            return {
              ...block,
              content: newImages
            };
          })
        }))
      }));

      setSections(newSections);
    };

    reader.readAsDataURL(file);
  };


  const updateSectionColor = (color) => {
    const newSections = sections.map((sec) =>
      sec.id === selectedSection.id
        ? { ...sec, backgroundColor: color }
        : sec
    );
    setSections(newSections);
  };
  const updateHoverColor = (color) => {
    const newSections = sections.map((sec) =>
      sec.id === selectedSection.id
        ? { ...sec, hoverColor: color }
        : sec
    );
    setSections(newSections);
  };

  const updateTextColor = (color) => {
    const newSections = sections.map((sec) =>
      sec.id === selectedSection.id
        ? { ...sec, textColor: color }
        : sec
    );
    setSections(newSections);
  };

  const addNewSectionAbove = (targetId) => {
    if (targetId === "header") return;

    const newSection = {
      id: Date.now(),
      type: "section",
      backgroundColor: "#ffffff",
      columns: [{ id: "col-" + Date.now(), blocks: [] }]
    };

    const idx = sections.findIndex((s) => s.id === targetId);

    const updated = [...sections];
    updated.splice(idx, 0, newSection);

    setSections(updated);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/home";
    }
  };

  const confirmDeleteSection = () => {
    const filtered = sections.filter((sec) => sec.id !== sectionToDelete);
    setSections(filtered);

    toast({
      title: "Sección eliminada",
      description: "La sección se eliminó correctamente",
      status: "success",
      duration: 3000,
      isClosable: true,
    });

    setSectionToDelete(null);
  };

  const uploadImage = async (file, tipo = "galeria") => {
    if (!file || !plantillaId) return null;

    const formData = new FormData();
    formData.append("imagen", file);
    formData.append("tipo", tipo);

    try {
      const res = await fetch(
        `http://localhost:3001/componentes/${plantillaId}/imagenes`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );

      if (!res.ok) {
        throw new Error("Error subiendo imagen");
      }

      const data = await res.json();

      return data.url.startsWith("http")
        ? data.url
        : `http://localhost:3001${data.url}`;

    } catch (error) {
      console.error(error);

      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        status: "error",
        duration: 3000,
        isClosable: true,
      });

      return null;
    }
  };

  const handleImageUpload = async (blockId, file) => {
    if (!file) return;

    const imageUrl = await uploadImage(file, "galeria");

    if (!imageUrl) return;

    const newSections = sections.map((section) => ({
      ...section,
      columns: section.columns.map((col) => ({
        ...col,
        blocks: col.blocks.map((block) =>
          block.id === blockId
            ? {
              ...block,
              src: imageUrl,
            }
            : block
        ),
      })),
    }));

    setSections(newSections);

    toast({
      title: "Imagen subida",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  const handleLogoUpload = async (file, tipo = "logo", orden = 0) => {
    if (!file) return;
    if (!plantillaId) {
      toast({
        title: "Error",
        description: "No se encontró el ID de la plantilla para subir el logo.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const formData = new FormData();
    formData.append("imagen", file);
    formData.append("tipo", tipo);
    formData.append("orden", orden);

    try {
      const res = await fetch(
        `http://localhost:3001/componentes/${plantillaId}/imagenes`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );

      if (!res.ok) {
        throw new Error("Error subiendo imagen");
      }

      const data = await res.json();
      const imageUrl = data.url
        ? data.url.startsWith("http")
          ? data.url
          : `http://localhost:3001${data.url}`
        : "";

      const newSections = sections.map((section) => {
        if (section.type !== "header") return section;

        return {
          ...section,
          columns: section.columns.map((col) => {
            if (col.id !== "logo-col") return col;

            return {
              ...col,
              blocks: col.blocks.map((block) =>
                block.type === "image"
                  ? { ...block, src: imageUrl }
                  : block
              )
            };
          })
        };
      });

      setSections(newSections);

    } catch (error) {
      console.error("Error subiendo imagen:", error);
      toast({
        title: "Error",
        description: "Error al subir la imagen",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const removeLogo = () => {
    const newSections = sections.map((section) => {
      if (section.type !== "header") return section;

      return {
        ...section,
        columns: section.columns.map((col) => {
          if (col.id !== "logo-col") return col;

          return {
            ...col,
            blocks: col.blocks.map((block) =>
              block.type === "image"
                ? { ...block, src: "" }
                : block
            )
          };
        })
      };
    });

    setSections(newSections);
  };

  const handleSave = async () => {
    if (!plantillaId) {
      toast({
        title: "Error",
        description: "No se encontró el ID de la plantilla",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log("Guardando plantilla con estructura:", sections);
      const response = await fetch(
        `http://localhost:3001/plantillas/${plantillaId}/estructura`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ estructura: sections }),
        }

      );

      if (!response.ok) {
        throw new Error("Error al guardar la plantilla");
      }

      const dataKey = getEditorDataKey(plantillaId);
      localStorage.setItem(dataKey, JSON.stringify(sections));
      toast({
        title: "Éxito",
        description: "Plantilla guardada correctamente",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      if (onSave) {
        onSave(sections);
      }
    } catch (error) {
      console.error("Error guardando:", error);
      toast({
        title: "Error",
        description: error.message || "Error al guardar la plantilla",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateBlock = (blockId, updates) => {
    const newSections = sections.map((section) => ({
      ...section,
      columns: section.columns.map((col) => ({
        ...col,
        blocks: col.blocks.map((block) =>
          block.id === blockId
            ? {
              ...block,
              ...updates,
            }
            : block
        ),
      })),
    }));

    setSections(newSections);

    const updatedBlock = newSections
      .flatMap((s) => s.columns)
      .flatMap((c) => c.blocks)
      .find((b) => b.id === blockId);

    setSelectedBlock(updatedBlock);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedBlock = e.target.closest(".editable-block");
      const clickedToolbar = e.target.closest(".floating-toolbar");

      if (!clickedBlock && !clickedToolbar) {
        setSelectedBlock(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  return (
    <Box className={`page-canvas ${isSidebarOpen ? "canvas-shrink" : ""}`}>
      <Box
        className="top-editor-bar"
        position="sticky"
        top="0"
        width="100%"
        zIndex="2000"
        bg="#333333"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        px={2}
        py={2}
      >
        <HStack>
          <Button
            variant="outline"
            borderColor="#8a8a8a"
            color="#ffffff"
            px={6}
            minW="110px"
            flexShrink={0}
            onClick={handleBack}
            _hover={{
              bg: "#454645",
              color: "#ffffff",
            }}
          >
            Volver
          </Button>
        </HStack>

        <HStack key={plantillaId} spacing={3}>

          <Button
            variant="outline"
            borderColor="#8a8a8a"
            color="#ffffff"
            px={6}
            minW="120px"
            flexShrink={0}
            _hover={{
              bg: "#454645",
              color: "#ffffff",
            }}
            onClick={() => {
              if (slugUrl) {
                window.open(`/evento/${slugUrl}`, "_blank", "noopener,noreferrer");
              } else {
                alert("Esta plantilla no tiene pagina publica todavia");
              }
            }}

          >
            Vista previa
          </Button>
          <Button
            bg="#ffffff"
            color="#333333"
            px={6}
            minW="120px"
            flexShrink={0}
            _hover={{ bg: "#e0dcdc" }}
            onClick={handleSave}
            isLoading={isLoading}
            loadingText="Guardando..."
          >
            Guardar
          </Button>
        </HStack>
      </Box>

      <Divider borderColor="gray.300" opacity={0.5} />

      <VStack spacing={0} align="stretch" w="100%">
        <DndContext sensors={sensors} collisionDetection={collisionPorTipo} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {sections.map((section) => (
              <SortableSection
                id={section.id}
                key={section.id}
                className={`section-wrapper hover-parent ${section.type === "header" ? "header" : ""}`}
                bg={section.backgroundColor}
                color={section.textColor || "#000000"}
                width="100%"
                pt={section.fullWidth ? 0 : section.type === "header" ? 4 : 2}
                pb={section.fullWidth ? 0 : 6}
                px={section.fullWidth ? 0 : 6}
                position="relative"
                minH={
                  section.type === "header"
                    ? "80px"
                    : section.columns[0].blocks.length === 0
                      ? "380px"
                      : "auto"
                }
                style={{
                  "--menu-hover-color": section.hoverColor || "#5c5c5c"
                }} >
                <Box className="hover-menu"
                  position="absolute"
                  top="10px"
                  right="10px"
                  bg="#3a3a3a"
                  borderRadius="md"
                  display="flex"
                  overflow="hidden"
                  zIndex="10"
                >
                  <Button
                    size="xs"
                    bg="transparent"
                    color="white"
                    _hover={{ bg: "#4a4a4a" }}
                    borderRadius="0"
                    onClick={() => openSectionEditor(section.id)}
                  >
                    <FiEdit />
                  </Button>
                  {section.id !== "header" && section.id !== "footer" && (
                    <Button
                      size="xs"
                      bg="transparent"
                      color="white"
                      _hover={{ bg: "#4a4a4a" }}
                      borderRadius="0"
                      onClick={() => setSectionToDelete(section.id)}
                    >
                      <FiTrash2 />
                    </Button>
                  )}
                </Box>

                {section.id !== "header" && section.id !== "footer" && (
                  <div className="add-section-hover">
                    <Button
                      size="sm"
                      bg="#007bff"
                      color="white"
                      _hover={{
                        bg: "#0063cc",
                      }}
                      onClick={() => {
                        setTargetSectionId(section.id);
                        setSectionSelectorOpen(true);
                      }}
                    >
                      + Agregar sección
                    </Button>
                  </div>
                )}

                {section.type === "header" ? (
                  <HStack
                    w="100%"
                    h="80px"
                    align="center"
                    justify="space-between"
                    px={6}
                  >
                    <Box minW="140px" maxW="160px">
                      <DroppableColumn
                        column={section.columns[0]}
                        isHeader
                        setSelectedBlock={setSelectedBlock}
                        updateBlockContent={updateBlockContent}
                        isEditingHeader={
                          isSidebarOpen && selectedSection?.id === section.id
                        }
                      />
                    </Box>
                    <HStack
                      className="menu-desktop"
                      spacing={6}
                      h="100%"
                      align="stretch"
                      justify="center"
                      flex="1"
                    >
                      <DroppableColumn
                        column={section.columns[1]}
                        isHeader
                        setSelectedBlock={setSelectedBlock}
                        updateBlockContent={updateBlockContent}
                        isEditingHeader={
                          isSidebarOpen && selectedSection?.id === section.id
                        }
                      />
                    </HStack>

                    <Box className="menu-mobile-btn">☰</Box>
                  </HStack>
                ) : (
                  <HStack justify="space-between"
                    spacing={section.fullWidth ? 0 : 6}
                    w="100%">
                    {section.columns.map((column) => (
                      <DroppableColumn
                        key={column.id}
                        column={column}
                        handleImageUpload={handleImageUpload}
                        isHeader={section.type === "header"}
                        updateBlock={updateBlock}
                        setSelectedBlock={setSelectedBlock}
                        selectedBlock={selectedBlock}
                        updateBlockContent={updateBlockContent}
                        isEditingHeader={
                          isSidebarOpen && selectedSection?.id === section.id
                        }
                        deleteBlock={deleteBlock}
                      />
                    ))}
                  </HStack>
                )}
              </SortableSection>
            ))}
            <SidebarEditor
              isOpen={isSidebarOpen}
              selectedBlock={selectedBlock}
              updateBlock={updateBlock}
              onClose={closeSidebar}
              selectedSection={selectedSection}
              sections={sections}
              setSections={setSections}
              addBlockToSection={addBlockToSection}
              updateMenuItem={updateMenuItem}
              deleteMenuItem={deleteMenuItem}
              handleCarouselUpload={handleCarouselUpload}
              handleLogoUpload={handleLogoUpload}
              removeLogo={removeLogo}
              updateSectionColor={updateSectionColor}
              updateTextColor={updateTextColor}
              updateHoverColor={updateHoverColor}
            />
            <AlertDialog
              isOpen={!!sectionToDelete}
              leastDestructiveRef={cancelRef}
              onClose={() => setSectionToDelete(null)}
              isCentered
            >
              <AlertDialogOverlay>
                <AlertDialogContent>
                  <AlertDialogHeader fontSize="lg" fontWeight="bold">
                    Eliminar sección
                  </AlertDialogHeader>

                  <AlertDialogBody>
                    ¿Estás seguro de que quieres eliminar esta sección? Esta acción no se puede deshacer.
                  </AlertDialogBody>

                  <AlertDialogFooter>
                    <Button ref={cancelRef} onClick={() => setSectionToDelete(null)}>
                      Cancelar
                    </Button>

                    <Button colorScheme="red" onClick={confirmDeleteSection} ml={3}>
                      Eliminar
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialogOverlay>
            </AlertDialog>
            <Modal
              isOpen={isSectionSelectorOpen}
              onClose={() => setSectionSelectorOpen(false)}
              size="6xl"
            >
              <ModalContent>
                <ModalHeader>Agregar una sección</ModalHeader>
                <ModalCloseButton />

                <ModalBody>
                  <HStack align="start" spacing={6}>

                    <VStack align="start" minW="200px">
                      <Text fontWeight="bold">Secciones</Text>
                      <Button variant="ghost">Todas las secciones</Button>
                    </VStack>

                    <Box flex="1">
                      <HStack wrap="wrap" spacing={4}>
                        <Box
                          border="1px solid #ddd"
                          p={4}
                          cursor="pointer"
                          onClick={() => addTemplateSection("hero")}
                        >
                          <Text>Sección en blanco</Text>
                        </Box>
                        <Box
                          border="1px solid #ddd"
                          p={4}
                          cursor="pointer"
                          onClick={() => addTemplateSection("carousel-full")}
                        >
                          <Text>Carousel</Text>
                        </Box>
                      </HStack>
                    </Box>
                  </HStack>
                </ModalBody>
              </ModalContent>
            </Modal>

          </SortableContext>
        </DndContext>
      </VStack>
    </Box>
  );
}
