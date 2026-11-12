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
import { Box, Button, Divider, Text } from "@chakra-ui/react";
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

export default function DroppableColumn({ column, handleImageUpload, setSelectedBlock, isHeader, updateBlock, updateBlockContent, isEditingHeader, deleteBlock, selectedBlock }) {
  const { setNodeRef } = useDroppable({ id: `c:${column.id }` });

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
            {selectedBlock?.id === block.id && ["text", "box"].includes(block.type) && (
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
                  onClick={() =>
                    document
                      .getElementById(`image-upload-${block.id}`)
                      .click()
                  }
                >
                  {block.src ? (
                    <img
                      src={block.src}
                      alt="contenido"
                      style={{
                        width: "100%",
                        borderRadius: "12px",
                        objectFit: "cover",
                        maxHeight: "400px",
                      }}
                    />
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
                      textColor= "#afafaf"
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
                updateBlockContent={updateBlockContent}
              />)}
            {block.type === "spacer" && <Box h="20px" />}
            {block.type === "heading" && (
              <Text fontSize="2xl"
                fontWeight="bold"
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