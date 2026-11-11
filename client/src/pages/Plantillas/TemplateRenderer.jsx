import React from "react";
import { Box, Heading, Text, Button, VStack, HStack, Wrap, WrapItem, Image, Divider } from "@chakra-ui/react";

const TemplateRenderer = ({ estructura }) => {
  if (!estructura || !estructura.sections) {
    return <div>No hay estructura para renderizar</div>;
  }

  const renderBlock = (block) => {
    const key = block.id ?? JSON.stringify(block);
    const content = typeof block.content === "string" ? block.content : "";

    const textStyles = {
    fontSize: block.styles?.fontSize,
    fontWeight: block.styles?.fontWeight,
    fontStyle: block.styles?.fontStyle,
    textDecoration: block.styles?.textDecoration,
    textAlign: block.styles?.textAlign,
    };

    switch (block.type) {
      case "heading":
        return (
          <Heading key={key} as="h2" size="lg" mb={3} {...textStyles}>
            {block.content}
          </Heading>
        );
      case "text":
        return (
          <Text key={key} whiteSpace="pre-line" fontSize="md" mb={3} {...textStyles}>
            {content}
          </Text>
        );
      case "hero":
        return (
          <Box key={key} p={10} bg="rgba(255, 255, 255, 0.85)" borderRadius="2xl" boxShadow="md" mb={6}>
            {block.content && (
              <Text fontSize="lg" color="gray.700" {...textStyles}>
                {block.content}
              </Text>
            )}
          </Box>
        );
      case "menu-item":
        return (
          <Button key={key} variant="pointer" size="sm" colorScheme="pink" mr={2} mb={2}>
            {content || "Menu"}
          </Button>
        );
      case "button":
        return (
          <Button key={key} colorScheme="pink" size="md" mb={3}>
            {content || "Acción"}
          </Button>
        );
      case "box":
        return (
          <Box key={key} p={5} bg="gray.50" borderRadius="lg" mb={3}>
            <Text whiteSpace="pre-wrap" {...textStyles}>
              {content}
            </Text>
          </Box>
        );
      case "image":
        return (
          <Image
            key={key}
            src={block.src || block.content}
            alt={block.alt || "Imagen"}
            objectFit="cover"
            w="100%"
            maxH="500px"
            borderRadius="lg"
            mb={4}
          />
        );
      case "carousel":
        return (
          <Wrap key={key} spacing={4} mb={4} overflowX="auto" py={2}>
            {Array.isArray(block.content)
              ? block.content.map((src, index) => (
                  <WrapItem key={`${key}-${index}`}>
                    <Image
                      src={src}
                      alt={`carousel-${index}`}
                      maxH="300px"
                      borderRadius="lg"
                    />
                  </WrapItem>
                ))
              : (
                  <Image
                    src={block.content}
                    alt="carousel"
                    maxH="300px"
                    borderRadius="lg"
                  />
                )}
          </Wrap>
        );
      case "divider":
        return <Divider key= {key} my ={2} />;
      case "spacer":
        return <Box key={key} h={"20px"} />;
      default:
        return (
          <Text key={key} fontSize="md" color="gray.600" mb={3}>
            {content || "Bloque desconocido"}
          </Text>
        );    
    }
  };

  const renderColumn = (column, sectionType) => {
    if (!column || !Array.isArray(column.blocks)) return null;

    const isHeader = sectionType === "header";

    return (
      <Box key={column.id} flex="1" minW={isHeader ? "120px" : "0"}>
        {column.blocks.map((block) => renderBlock(block))}
      </Box>
    );
  };

  const renderSection = (section) => {
    const sectionStyles = {
      backgroundColor: section.backgroundColor || "#ffffff",
      color: section.textColor || "inherit",
    };

    return (
      <Box
        key={section.id}
        bg={sectionStyles.backgroundColor}
        color={sectionStyles.color}
        py={section.type === "header" ? 4 : 8}
        px={6}
        w="100%"
      >
        {section.type === "header" ? (
          <HStack spacing={6} align="center" wrap="wrap">
            {section.columns.map((column) => (
              <Box key={column.id} flex={column.id === "logo-col" ? "0 0 auto" : "1"}>
                {column.blocks.map((block) => {
                  if (block.type === "image") {
                    return (
                      <Image
                        key={block.id}
                        src={block.src || block.content}
                        alt={block.alt || "Logo"}
                        maxH="80px"
                        objectFit="contain"
                        mb={2}
                      />
                    );
                  }

                  if (block.type === "menu-item") {
                    return (
                      <Button 
                        key={block.id} 
                        variant="ghost" 
                        size="md" 
                        color={sectionStyles.color}
                        _hover={{ opacity: 0.8 }}
                        mr={2} 
                        mb={2}
                      >
                        {block.content}
                      </Button>
                    );
                  }

                  return renderBlock(block);
                })}
              </Box>
            ))}
          </HStack>
        ) : (
          <VStack align="stretch" spacing={8}>
            <HStack spacing={6} align="stretch" wrap="wrap">
              {section.columns.map((column) => renderColumn(column, section.type))}
            </HStack>
          </VStack>
        )}
      </Box>
    );
  };

  return (
    <VStack spacing={0} align="stretch" minH="100vh" w="100%">
      {estructura.sections.map(renderSection)}
    </VStack>
  );
};

export default TemplateRenderer;