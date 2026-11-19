import { Box, Button, Text, HStack, Input, VisuallyHidden } from "@chakra-ui/react";
import { useState } from "react";
import { FiChevronLeft, FiChevronRight, FiPlus, FiTrash2 } from "react-icons/fi";

export default function CarouselBlock({ block, updateBlock, handleCarouselUpload, soloLectura }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const imagenes = Array.isArray(block.content) ? block.content : block.content ? [block.content] : [];

  const next = () => {
    setCurrentIndex((prev) =>
      (prev === imagenes.length - 1 ? 0 : prev + 1)
    );
  };

  const prev = () => {
    setCurrentIndex((prev) =>
      (prev === 0 ? imagenes.length - 1 : prev - 1)
    );
  };

  const quitarActual = () => {
    const nuevas = imagenes.filter((_, idx) => idx !== currentIndex);
    updateBlock(block.id, { content: nuevas });
    setCurrentIndex(Math.min(currentIndex, Math.max(0, nuevas.length - 1)));
  };

  return (
    <Box w="100%" h="70vh"
      textAlign="center"
      position="relative"
      overflow="hidden"
      borderRadius="18px"
      role="region"
      aria-roledescription="carousel"
      aria-label="Imagenes del carrusel">
      {imagenes.length === 0 ? (
        <Text pt={24} opacity={0.7}>
          {soloLectura
            ? "Este carrusel no tiene imagenes"
            : 'Sin imagenes todavia: usa "+ Imagen" para agregar la primera'}
        </Text>
      ) : (
        <>
          <img
            src={imagenes[currentIndex]}
            alt={`Imagen ${currentIndex + 1} de ${imagenes.length}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "all 0.4s ease"
            }}
          />
          <Box
            position="absolute"
            inset="0"
            bg="rgba(0,0,0,0.25)"
          />
          <Button
            aria-label="Imagen anterior"
            position="absolute"
            top="50%"
            left="20px"
            transform="translateY(-50%)"
            borderRadius="full"
            bg="rgba(0,0,0,0.45)"
            color="white"
            minW="50px"
            h="50px"
            fontSize="24px"
            zIndex="2"
            _hover={{
              bg: "rgba(0,0,0,0.7)",
              transform: "translateY(-50%) scale(1.08)"
            }}
            onClick={prev}
          >
            <FiChevronLeft />
          </Button>

          <Button
            aria-label="Imagen siguiente"
            position="absolute"
            top="50%"
            right="20px"
            transform="translateY(-50%)"
            borderRadius="full"
            bg="rgba(0,0,0,0.45)"
            color="white"
            minW="50px"
            h="50px"
            fontSize="24px"
            zIndex="2"
            _hover={{
              bg: "rgba(0,0,0,0.7)",
              transform: "translateY(-50%) scale(1.08)"
            }}
            onClick={next}
          >
            <FiChevronRight />
          </Button>

          <HStack
            position="absolute"
            bottom="20px"
            left="50%"
            transform="translateX(-50%)"
            spacing={3}
            zIndex="2"
          >
            {imagenes.map((_, index) => (
              <Button
                key={index}
                type="button"
                aria-label={`Ir a la imagen ${index + 1}`}
                aria-current={currentIndex === index ? "true" : "undefined"}
                minW="24px"
                h="24px"
                p={0}
                borderRadius="full"
                bg="transparent"
                _hover={{ bg: "transparent" }}
                onClick={() => setCurrentIndex(index)}
              >
                <Box
                  w={currentIndex === index ? "24px" : "10px"}
                  h="10px"
                  borderRadius="full"
                  bg={currentIndex === index ? "white" : "rgba(255,255,255,0.5)"}
                  transition="all 0.3s ease"
                />
              </Button>
            ))}
          </HStack>
        </>
      )}
      {imagenes.length > 0 && (
        <Text
          position="absolute" top="10px" left="10px" zIndex="3"
          color="white" bg="rgba(0,0,0,0.6)" px={2} py={1} borderRadius="md" fontSize="sm"
        >
          {currentIndex + 1} / {imagenes.length}
        </Text>
      )}

      <VisuallyHidden role="status" aria-live="polite">
        {imagenes.length > 0 ? `Imagen ${currentIndex + 1} de ${imagenes.length}` : ""}
      </VisuallyHidden>

      {!soloLectura && (
      <HStack position="absolute" top="10px" right="10px" zIndex="3" spacing={2}>
        <Button size="xs" bg="rgba(0,0,0,0.6)" color="white" leftIcon={<FiPlus />} _hover={{ bg: "rgba(0,0,0,0.85" }}
          onClick={() => document.getElementById(`carousel-upload-${block.id}`).click()}>
          Imagen
        </Button>
        {imagenes.length > 0 && (
          <Button size="xs" bg="rgba(0, 0, 0, 0.6)" color="white" leftIcon={<FiTrash2 />} _hover={{ bg: "red.500" }}
            onClick={quitarActual}>
            Quitar
          </Button>
        )}
        <Input
          id={`carousel-upload-${block.id}`}
          type="file"
          accept="image/*"
          display="none"
          onChange={(e) => {
            handleCarouselUpload(block.id, e.target.files[0], imagenes.length);
            e.target.value = "";
          }}
        />
      </HStack>
      )}
    </Box>
  );
}