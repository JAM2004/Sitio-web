import {
  IconButton,
  HStack,
  NumberInput,
  NumberInputField,
  Input,
} from "@chakra-ui/react";
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiTrash2
} from "react-icons/fi";
import CarouselBlock from "./CarouselBlock";
import { Box, Button, Divider, Text, VStack } from "@chakra-ui/react";
import "./DroppableColumn.css";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// useSortable es un hook: no puede llamarse dentro de un .map, así que cada
// bloque se envuelve en su propio componente. Sustituye al <Box>, no lo anida:
// así el DOM y el layout no cambian en absoluto.
function SortableBlock({ id, children, style, ...props }) {
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

export default function DroppableColumn({ column, handleImageUpload, handleCarouselUpload, setSelectedBlock, isHeader, updateBlock, updateBlockContent, isEditingHeader, deleteBlock, selectedBlock }) {
  const { setNodeRef } = useDroppable({ id: `c:${column.id}` });

  // Arrastre de un tirador: escala ancho % y alto máx px en proporción.
  // ponytail: un solo factor para ambos ejes; si algún día hace falta
  // deformar (ancho y alto independientes), separar en dos arrastres.
  const startResize = (e, block, esquina) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    const handle = e.currentTarget;
    const rect = handle.parentElement.getBoundingClientRect();
    const pct0 = parseFloat(block.styles?.width || "100");
    const max0 = parseFloat(block.styles?.maxHeight || "400");
    const x0 = e.clientX;
    const y0 = e.clientY;
    const sx = esquina === "ne" || esquina === "se" ? 1 : -1;
    const sy = esquina === "se" || esquina === "sw" ? 1 : -1;

    handle.setPointerCapture(e.pointerId);

    const mover = (ev) => {
      const dx = ((ev.clientX - x0) * sx + (ev.clientY - y0) * sy) / 2;
      const f = Math.max(0.2, 1 + dx / Math.max(rect.width, 1));
      const pct = Math.min(100, Math.max(10, Math.round(pct0 * f)));
      const max = Math.min(1500, Math.max(50, Math.round(max0 * f)));
      updateBlock(block.id, {
        styles: { ...block.styles, width: `${pct}%`, maxHeight: `${max}px` },
      });
    };

    const fin = (ev) => {
      handle.removeEventListener("pointermove", mover);
      handle.removeEventListener("pointerup", fin);
      handle.removeEventListener("lostpointercapture", fin);
      if (handle.hasPointerCapture?.(ev.pointerId)) {
        handle.releasePointerCapture(ev.pointerId);
      }
    };

    handle.addEventListener("pointermove", mover);
    handle.addEventListener("pointerup", fin);
    handle.addEventListener("lostpointercapture", fin);
  };

  return (
    <Box ref={setNodeRef} className={`column ${isHeader ? "header-column" : ""}`}
      w="100%"
      h="100%"
      display="flex"
      flexDirection={isHeader ? "row" : "column"}
      alignItems="center"
      justifyContent={isHeader ? "center" : "flex-start"}
      gap={isHeader ? 6 : 2}>

      <SortableContext items={column.blocks.map((b) => `b:${b.id}`)} strategy={rectSortingStrategy}>
        {column.blocks.map((block) => {
          if (block.type === "hero") {
            return (
              <SortableBlock key={block.id} id={`b:${block.id}`} className="hero-wrapper" w="100%">
                <HStack spacing={10} align="start">
                  <Box flex="1">
                    <Text
                      contentEditable={!isHeader || isEditingHeader}
                      suppressContentEditableWarning
                      fontSize="lg"
                      lineHeight="1.7"
                      onBlur={(e) => updateBlockContent(block.id, e.target.innerText)}
                    >
                      {block.content}
                    </Text>
                  </Box>
                </HStack>
              </SortableBlock>
            );
          }

          if (block.type === "menu-item") {
            return (
              <SortableBlock
                key={block.id}
                id={`b:${block.id}`}
                className="menu-item"
                display="flex"
                alignItems="center"
                justifyContent="center"
                px={6}
                h="100%"
                cursor="pointer"
                align-self="stretch"
                whiteSpace="nowrap"
              >
                <Text
                  h="100%"
                  display="flex"
                  alignItems="center"
                  contentEditable={!isHeader || isEditingHeader}
                  suppressContentEditableWarning
                  onBlur={(e) => updateBlockContent(block.id, e.target.innerText)}
                >
                  {block.content}
                </Text>
              </SortableBlock>
            );
          }

          return (
            <SortableBlock
              key={block.id}
              id={`b:${block.id}`}
              className="block editable-block"
              w="100%"
              position="relative"
              border={selectedBlock?.id === block.id ? "2px solid transparent" : "none"}
              borderradius="12px"
              onMouseDown={() => setSelectedBlock(block)}
              px={5}
              py={4}
            >
              {selectedBlock?.id === block.id && ["text", "box", "heading"].includes(block.type) && (
                <HStack
                  className="floating-toolbar"
                  position="absolute"
                  top="-55px"
                  left="0"
                  bg="white"
                  p={2}
                  borderRadius="xl"
                  boxShadow="lg"
                  zIndex="100"
                  spacing={2}

                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >

                  <NumberInput
                    size="sm"
                    w="70px"
                    min={8}
                    max={100}
                    value={parseInt(block.styles?.fontSize || 16)}

                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}

                    onChange={(valueString, valueNumber) =>
                      updateBlock(block.id, {
                        styles: {
                          ...block.styles,
                          fontSize: `${valueNumber}px`,
                        },
                      })
                    }
                  >
                    <NumberInputField />
                  </NumberInput>
                  <IconButton
                    size="sm"
                    icon={<FiBold />}
                    onClick={() =>
                      updateBlock(block.id, {
                        styles: {
                          ...block.styles,
                          fontWeight:
                            block.styles?.fontWeight === "bold"
                              ? "normal"
                              : "bold",
                        },
                      })
                    }
                  />
                  <IconButton
                    size="sm"
                    icon={<FiItalic />}
                    onClick={() =>
                      updateBlock(block.id, {
                        styles: {
                          ...block.styles,
                          fontStyle:
                            block.styles?.fontStyle === "italic"
                              ? "normal"
                              : "italic",
                        },
                      })
                    }
                  />
                  <IconButton
                    size="sm"
                    icon={<FiUnderline />}
                    onClick={() =>
                      updateBlock(block.id, {
                        styles: {
                          ...block.styles,
                          textDecoration:
                            block.styles?.textDecoration === "underline"
                              ? "none"
                              : "underline",
                        },
                      })
                    }
                  />

                  <IconButton
                    size="sm"
                    icon={<FiAlignLeft />}
                    onClick={() =>
                      updateBlock(block.id, {
                        styles: {
                          ...block.styles,
                          textAlign: "left",
                        },
                      })
                    }
                  />

                  <IconButton
                    size="sm"
                    icon={<FiAlignCenter />}
                    onClick={() =>
                      updateBlock(block.id, {
                        styles: {
                          ...block.styles,
                          textAlign: "center",
                        },
                      })
                    }
                  />
                  <IconButton
                    size="sm"
                    icon={<FiAlignRight />}
                    onClick={() =>
                      updateBlock(block.id, {
                        styles: {
                          ...block.styles,
                          textAlign: "right",
                        },
                      })
                    }
                  />
                </HStack>
              )}

              {selectedBlock?.id === block.id && block.type === "image" && !isHeader && (
                <VStack
                  className="floating-toolbar"
                  position="absolute"
                  top="-96px"
                  left="0"
                  bg="white"
                  p={2}
                  borderRadius="xl"
                  boxShadow="lg"
                  zIndex="100"
                  spacing={2}
                  align="stretch"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <HStack spacing={2}>
                    <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.500" whiteSpace="nowrap">
                      Formato de imagen
                    </Text>
                    <IconButton
                      size="sm"
                      aria-label="Alinear a la izquierda"
                      icon={<FiAlignLeft />}
                      isActive={(block.styles?.align || "center") === "left"}
                      onClick={() =>
                        updateBlock(block.id, { styles: { ...block.styles, align: "left" } })
                      }
                    />
                    <IconButton
                      size="sm"
                      aria-label="Centrar"
                      icon={<FiAlignCenter />}
                      isActive={(block.styles?.align || "center") === "center"}
                      onClick={() =>
                        updateBlock(block.id, { styles: { ...block.styles, align: "center" } })
                      }
                    />
                    <IconButton
                      size="sm"
                      aria-label="Alinear a la derecha"
                      icon={<FiAlignRight />}
                      isActive={(block.styles?.align || "center") === "right"}
                      onClick={() =>
                        updateBlock(block.id, { styles: { ...block.styles, align: "right" } })
                      }
                    />
                  </HStack>
                  <HStack spacing={2}>
                    <Text fontSize="xs" whiteSpace="nowrap">ancho %</Text>
                    <NumberInput
                      size="sm" w="70px" min={10} max={100}
                      value={parseInt(block.styles?.width || "100")}
                      onChange={(_, vn) => {
                        if (!Number.isNaN(vn))
                          updateBlock(block.id, { styles: { ...block.styles, width: `${vn}%` } });
                      }}
                    >
                      <NumberInputField />
                    </NumberInput>
                    <Text fontSize="xs" whiteSpace="nowrap">alto max px</Text>
                    <NumberInput
                      size="sm" w="80px" min={50} max={1500}
                      value={parseInt(block.styles?.maxHeight || "400")}
                      onChange={(_, vn) => {
                        if (!Number.isNaN(vn))
                          updateBlock(block.id, { styles: { ...block.styles, maxHeight: `${vn}px` } });
                      }}
                    >
                      <NumberInputField />
                    </NumberInput>
                    <Input
                      size="sm" w="160px" placeholder="Texto alternativo"
                      value={block.alt || ""}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onChange={(e) => updateBlock(block.id, { alt: e.target.value })}
                    />
                  </HStack>
                </VStack>
              )}
              {selectedBlock?.id === block.id && block.type === "button" && (
                <HStack
                  className="floating-toolbar"
                  position="absolute"
                  top="-55px"
                  left="0"
                  bg="white"
                  p={2}
                  borderRadius="xl"
                  zIndex="100"
                  spacing={2}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()} >
                  <Input
                    size="sm"
                    w="230px"
                    placeholder="Enlace #seccion o https://..."
                    value={block.href || ""}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onChange={(e) => updateBlock(block.id, { href: e.target.value })}
                  />
                </HStack>
              )}

              {!isHeader && (
                <Button
                  className="delete-btn"
                  size="xs"
                  position="absolute"
                  top="10px"
                  right="10px"
                  zIndex="20"
                  borderRadius="full"
                  bg="rgba(0,0,0,0.75)"
                  color="white"
                  minw="28px"
                  h="28px"
                  p={0}
                  boxshadow="md"
                  transition="all 0.2s ease"
                  _hover={{ bg: "rgba(70,70,70,0.9)", transform: "scale(1.08)" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteBlock(block.id);
                  }}
                >
                  <FiTrash2 size={14} />
                </Button>
              )}
              {block.type === "text" && (
                <Text
                  className="editable-text"
                  w="100%"
                  contentEditable={!isHeader || isEditingHeader}
                  suppressContentEditableWarning
                  onBlur={(e) => updateBlockContent(block.id, e.target.innerText)}

                  fontSize={block.styles?.fontSize}
                  fontWeight={block.styles?.fontWeight}
                  fontStyle={block.styles?.fontStyle}
                  textDecoration={block.styles?.textDecoration}
                  textAlign={block.styles?.textAlign}
                >
                  {block.content}
                </Text>
              )}

              {block.type === "image" && !isHeader && (
                <Box w="100%">
                  <Box
                    border="2px dashed #555"
                    borderRadius="xl"
                    p={4}
                    textAlign="center"
                    cursor="pointer"
                    transition="0.2s"
                    position="relative"
                    overflow="hidden"
                    _hover={{
                      borderColor: "#000000",
                      bg: "gray.50",
                    }}
                    onClick={() => {
                      if (!block.src) {
                        document
                          .getElementById(`image-upload-${block.id}`)
                          .click();
                      }
                    }
                    }
                  >
                    {block.src ? (
                      <Box
                        position="relative"
                        w={block.styles?.width || "100%"}
                        ml={block.styles?.align === "left" ? 0 : "auto"}
                        mr={block.styles?.align === "right" ? 0 : "auto"}
                      >
                        <img
                          src={block.src}
                          alt={block.alt || "contenido"}
                          style={{
                            width: "100%",
                            display: "block",
                            borderRadius: "12px",
                            objectFit: "cover",
                            maxHeight: block.styles?.maxHeight || "400px",
                          }}
                        />
                        {selectedBlock?.id === block.id &&
                          ["nw", "ne", "sw", "se"].map((c) => (
                            <Box
                              key={c}
                              position="absolute"
                              w="10px"
                              h="10px"
                              borderRadius="full"
                              bg="white"
                              border="2px solid #2563eb"
                              zIndex="22"
                              style={{
                                top: c[0] === "n" ? -5 : undefined,
                                bottom: c[0] === "s" ? -5 : undefined,
                                left: c[1] === "w" ? -5 : undefined,
                                right: c[1] === "e" ? -5 : undefined,
                                cursor:
                                  c === "nw" || c === "se"
                                    ? "nwse-resize"
                                    : "nesw-resize",
                                touchAction: "none",
                                userSelect: "none",
                                WebkitUserSelect: "none",
                              }}
                              onPointerDown={(e) => startResize(e, block, c)}
                            />
                          ))}
                      </Box>
                    ) : (
                      <>
                        <Text fontSize="lg" fontWeight="bold">
                          + Subir imagen
                        </Text>

                        <Text fontSize="sm" opacity="0.6">
                          PNG, JPG, WEBP
                        </Text>
                      </>
                    )}
                    {block.src && (
                      <Button
                        size="xs"
                        position="absolute"
                        top="10px"
                        left="10px"
                        zIndex="21"
                        bg="rgba(0,0,0,0.75)"
                        color="white"
                        _hover={{ bg: "rgba(70,70,70,0.9)" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          document.getElementById(`image-upload-${block.id}`).click();
                        }}
                      >
                        Cambiar
                      </Button>
                    )}

                    <Input
                      id={`image-upload-${block.id}`}
                      type="file"
                      accept="image/*"
                      display="none"
                      onChange={(e) =>
                        handleImageUpload(block.id, e.target.files[0])
                      }
                    />
                  </Box>
                </Box>
              )}

              {block.type === "image" && isHeader && (
                <Box
                  h="100%"
                  display="flex"
                  alignItems="center"
                  justifyContent="flex-start"
                >
                  {block.src ? (
                    <img
                      src={block.src}
                      alt="logo"
                      style={{
                        maxHeight: "60px",
                        width: "auto",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <Box
                      border="2px dashed #afafaf"
                      borderRadius="lg"
                      px={5}
                      py={3}
                      minW="120px"
                      textAlign="center"
                      opacity={0.7}
                    >
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        textColor="#afafaf"
                      >
                        Sin logo
                      </Text>

                      <Text
                        fontSize="xs"
                        opacity="0.6"
                      >
                        Agrega uno desde el menú
                      </Text>
                    </Box>
                  )}
                </Box>
              )}

              {block.type === "button" && (
                <Button
                  variant="ghost"
                  color="inherit"
                  size="sm"
                >
                  {block.content}
                </Button>
              )}

              {block.type === "divider" && <Divider my={2} />}
              {block.type === "carousel" && (
                <CarouselBlock
                  block={block}
                  updateBlock={updateBlock}
                  handleCarouselUpload={handleCarouselUpload}
                />)}
              {block.type === "spacer" && <Box h="20px" />}
              {block.type === "heading" && (
                <Text fontSize={block.styles?.fontSize || "2xl"}
                  fontWeight={block.styles?.fontWeight || "bold"}
                  fontStyle={block.styles?.fontStyle}
                  textDecoration={block.styles?.textDecoration}
                  textAlign={block.styles?.textAlign}
                  contentEditable={!isHeader || isEditingHeader}
                  onBlur={(e) => updateBlockContent(block.id, e.target.innerText)}>
                  {block.content}
                </Text>
              )}

              {block.type === "box" && (
                <Box bg="gray.100" p={4} rounded="md">
                  <Text
                    w="100%"
                    whiteSpace="pre-wrap"
                    contentEditable={!isHeader || isEditingHeader}
                    supressContentEditableWarning
                    onBlur={(e) => updateBlockContent(block.id, e.target.innerText)}
                    fontSize={block.styles?.fontSize}
                    fontWeight={block.styles?.fontWeight}
                    fontStyle={block.styles?.fontStyle}
                    textDecoration={block.styles?.textDecoration}
                    textAlign={block.styles?.textAlign}
                  >
                    {block.content}</Text>
                </Box>
              )}
            </SortableBlock>
          );
        })}
      </SortableContext>
    </Box>
  );
}