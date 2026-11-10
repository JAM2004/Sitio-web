-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: login
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `evento_imagenes`
--

DROP TABLE IF EXISTS `evento_imagenes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evento_imagenes` (
  `id_imagen` int NOT NULL AUTO_INCREMENT,
  `plantillas_id_plantilla` int NOT NULL,
  `url_imagen` varchar(500) NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `tipo` enum('portada','galeria','fondo','logo') DEFAULT NULL,
  `orden` int DEFAULT '0',
  PRIMARY KEY (`id_imagen`),
  KEY `plantillas_id_plantilla` (`plantillas_id_plantilla`),
  CONSTRAINT `evento_imagenes_ibfk_1` FOREIGN KEY (`plantillas_id_plantilla`) REFERENCES `plantillas` (`id_plantilla`)
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evento_imagenes`
--

LOCK TABLES `evento_imagenes` WRITE;
/*!40000 ALTER TABLE `evento_imagenes` DISABLE KEYS */;
INSERT INTO `evento_imagenes` VALUES (3,2,'/uploads/ufc-portada.jpg','UFC 315','portada',1),(5,1,'/uploads/1771436594022-8757974.jpg','UFC 315','portada',1),(7,5,'/uploads/1772222628437-503856028.jpg','UFC-315-Poster','portada',1),(8,5,'/uploads/1771868598006-992711397.jpg','1771868598006-992711397','portada',1),(9,5,'/uploads/1771868967138-451974660.jpg','1771868967138-451974660','portada',1),(10,5,'/uploads/1771868992352-169772822.jpg','1771868992352-169772822','portada',1),(11,5,'/uploads/1771869009375-163901272.jpg','UFC-315-Poster','portada',1),(13,5,'/uploads/1772038262940-571518048.jpg','UFC-315-Poster','portada',1),(14,5,'/uploads/1772048565210-619976445.jpg','UFC-315-Poster','portada',1),(15,6,'/uploads/1772648443026-588228176.jfif','The Wolf Howl_ Khamzat Chimaev_','portada',1),(16,5,'/uploads/1772211579484-735518214.jfif','ufc 315','portada',1),(17,6,'/uploads/1772211600166-129489042.png','Captura de pantalla 2025-12-03 233829','portada',1),(18,5,'/uploads/1772211744111-161927307.png','Captura de pantalla 2025-12-03 233829','portada',1),(19,5,'/uploads/1772211769531-148186705.png','Captura de pantalla 2025-12-03 233829','portada',1),(20,6,'/uploads/1772211861601-838651282.png','Captura de pantalla 2025-12-03 233829','portada',1),(21,6,'/uploads/1772211912292-781009460.png','Captura de pantalla 2025-12-03 233829','portada',1),(22,5,'/uploads/1772219096602-617739387.png','Captura de pantalla 2025-12-03 233829','portada',1),(23,5,'/uploads/1772219110547-321630126.png','Captura de pantalla 2025-12-03 233829','portada',1),(24,5,'/uploads/1772219297119-542552146.jfif','The Wolf Howl_ Khamzat Chimaev_','portada',1),(25,5,'/uploads/1772219750649-722388193.jfif','The Wolf Howl_ Khamzat Chimaev_','portada',1),(26,5,'/uploads/1772220668603-35983977.jfif','The Wolf Howl_ Khamzat Chimaev_','portada',1),(47,7,'/uploads/1776452084144-832383544.webp','ufc 317','portada',1),(52,9,'/uploads/1778871854240-170966460.png','{5C643A91-0216-4F40-8083-5E788CFACB54}','galeria',0),(54,8,'/uploads/1778269555974-117773412.jfif','ufc 315','galeria',0),(56,8,'/uploads/1778269675961-666588859.jfif','UFC 318','portada',1);
/*!40000 ALTER TABLE `evento_imagenes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eventos`
--

DROP TABLE IF EXISTS `eventos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eventos` (
  `id_evento` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text,
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin` datetime DEFAULT NULL,
  `lugar` varchar(255) DEFAULT NULL,
  `usuarios_ID_User` int NOT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `plantillas_id_plantilla` int NOT NULL,
  PRIMARY KEY (`id_evento`),
  KEY `fk_eventos_usuarios1_idx` (`usuarios_ID_User`),
  KEY `fk_eventos_plantillas1_idx` (`plantillas_id_plantilla`),
  KEY `idx_eventos_titulo` (`titulo`),
  KEY `idx_eventos_fecha` (`fecha_inicio`),
  CONSTRAINT `fk_eventos_plantillas1` FOREIGN KEY (`plantillas_id_plantilla`) REFERENCES `plantillas` (`id_plantilla`),
  CONSTRAINT `fk_eventos_usuarios1` FOREIGN KEY (`usuarios_ID_User`) REFERENCES `usuarios` (`ID_User`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventos`
--

LOCK TABLES `eventos` WRITE;
/*!40000 ALTER TABLE `eventos` DISABLE KEYS */;
INSERT INTO `eventos` VALUES (1,'UFC 315','Muhammad vs. Della Maddalena','2026-02-14 00:00:00','2026-02-15 00:00:00','Quebec, Canadá',1,NULL,5),(2,'UFC 316','Dvalishvili vs. O\'Malley 2','2026-02-23 00:00:00','2026-02-24 00:00:00','Nueva Jersey, Estados Unidos',1,NULL,6),(3,'UFC 317','Topuria vs. Oliveira','2026-03-07 00:00:00','2026-03-08 00:00:00','Paradise, Nevada.',1,NULL,7),(4,'UFC 318','Holloway vs. Poirier 3','2026-03-24 00:00:00','2026-03-25 00:00:00','Luisiana, Estados Unidos',1,NULL,8),(5,'UFC 319','du Plessis vs. Chimaev','2026-04-25 00:00:00','2026-04-26 00:00:00','Illinois, Estados Unidos',1,NULL,9),(6,'UFC 320','Ankalaev vs. Pereira 2','2026-05-02 00:00:00','2026-05-03 00:00:00','Nevada, Estados Unidos',1,'2026-05-11 18:08:21',11);
/*!40000 ALTER TABLE `eventos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `pagina_evento`
--

DROP TABLE IF EXISTS `pagina_evento`;
/*!50001 DROP VIEW IF EXISTS `pagina_evento`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `pagina_evento` AS SELECT 
 1 AS `id_plantilla`,
 1 AS `estructura_base`,
 1 AS `slug_url`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `paginas`
--

DROP TABLE IF EXISTS `paginas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paginas` (
  `id_pagina` int NOT NULL AUTO_INCREMENT,
  `slug_url` varchar(255) NOT NULL,
  `fecha_modificacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_pagina`),
  UNIQUE KEY `slug_url` (`slug_url`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paginas`
--

LOCK TABLES `paginas` WRITE;
/*!40000 ALTER TABLE `paginas` DISABLE KEYS */;
INSERT INTO `paginas` VALUES (4,'evento-1771437687396','2026-05-08 19:49:40',NULL),(5,'evento-1771872038663','2026-02-23 18:40:38',NULL),(6,'evento-1772481342443','2026-03-02 19:55:42',NULL),(7,'evento-1772648512078','2026-05-11 18:08:30',NULL),(8,'evento-1777048192606','2026-05-11 18:08:28',NULL),(10,'evento-1778097673560','2026-05-11 18:08:21','2026-05-11 18:08:21');
/*!40000 ALTER TABLE `paginas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plantillas`
--

DROP TABLE IF EXISTS `plantillas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plantillas` (
  `id_plantilla` int NOT NULL AUTO_INCREMENT,
  `nombre_plantilla` varchar(100) NOT NULL,
  `estructura_base` json DEFAULT NULL,
  `paginas_id_pagina` int DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_plantilla`),
  UNIQUE KEY `nombre_plantilla` (`nombre_plantilla`),
  KEY `fk_plantillas_paginas1_idx` (`paginas_id_pagina`),
  KEY `idx_plantillas_nombre` (`nombre_plantilla`),
  CONSTRAINT `fk_plantillas_paginas1` FOREIGN KEY (`paginas_id_pagina`) REFERENCES `paginas` (`id_pagina`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plantillas`
--

LOCK TABLES `plantillas` WRITE;
/*!40000 ALTER TABLE `plantillas` DISABLE KEYS */;
INSERT INTO `plantillas` VALUES (1,'estructura base','{\"footer\": {\"texto\": \"© Todos los derechos reservados\", \"estilos\": {\"color\": \"#ffffff\", \"padding\": \"20px\", \"textAlign\": \"center\", \"backgroundColor\": \"#111111\"}}, \"header\": {\"logo\": \"/uploads/default-logo.png\", \"menu\": [{\"id\": \"m1\", \"link\": \"#inicio\", \"texto\": \"Inicio\"}, {\"id\": \"m2\", \"link\": \"#about\", \"texto\": \"Sobre\"}, {\"id\": \"m3\", \"link\": \"#schedule\", \"texto\": \"Horarios\"}, {\"id\": \"m4\", \"link\": \"#tickets\", \"texto\": \"Boletos\"}], \"estilos\": {\"color\": \"#ffffff\", \"padding\": \"16px 32px\", \"backgroundColor\": \"#0d0d0d\"}}, \"secciones\": [{\"id\": \"hero-1\", \"tipo\": \"hero\", \"bloques\": [{\"id\": \"hero-title\", \"tipo\": \"texto\", \"contenido\": \"Título del Evento\"}, {\"id\": \"hero-subtitle\", \"tipo\": \"texto\", \"contenido\": \"Descripción corta o frase principal\"}, {\"id\": \"hero-btn\", \"tipo\": \"boton\", \"contenido\": \"Comprar boletos\"}], \"estilos\": {\"color\": \"#ffffff\", \"padding\": \"100px 20px\", \"textAlign\": \"center\", \"backgroundSize\": \"cover\", \"backgroundImage\": \"/uploads/default-hero.jpg\", \"backgroundPosition\": \"center\"}}, {\"id\": \"about-1\", \"tipo\": \"about\", \"bloques\": [{\"id\": \"about-title\", \"tipo\": \"texto\", \"contenido\": \"Acerca del Evento\"}, {\"id\": \"about-desc\", \"tipo\": \"texto\", \"contenido\": \"Aquí puedes colocar una descripción general del evento, su importancia y cualquier información relevante.\"}, {\"id\": \"about-img\", \"tipo\": \"imagen\", \"contenido\": \"/uploads/about-default.jpg\"}], \"estilos\": {\"padding\": \"60px 20px\", \"textAlign\": \"center\", \"backgroundColor\": \"#ffffff\"}}, {\"id\": \"image-featured\", \"tipo\": \"imagen-destacada\", \"bloques\": [{\"id\": \"featured-img\", \"tipo\": \"imagen\", \"contenido\": \"/uploads/featured-default.jpg\"}], \"estilos\": {\"padding\": \"0\", \"backgroundColor\": \"#000000\"}}, {\"id\": \"schedule-1\", \"tipo\": \"horarios\", \"bloques\": [{\"id\": \"schedule-title\", \"tipo\": \"texto\", \"contenido\": \"Horario del Evento\"}, {\"id\": \"schedule-desc\", \"tipo\": \"texto\", \"contenido\": \"Incluye aquí las horas de inicio, intermedios, y actividades programadas.\"}], \"estilos\": {\"padding\": \"60px 20px\", \"textAlign\": \"center\", \"backgroundColor\": \"#f7f7f7\"}}, {\"id\": \"sponsors-1\", \"tipo\": \"sponsors\", \"bloques\": [{\"id\": \"sponsors-title\", \"tipo\": \"texto\", \"contenido\": \"Patrocinadores\"}, {\"id\": \"sponsors-logos\", \"tipo\": \"galeria\", \"contenido\": [\"/uploads/sponsor1.png\", \"/uploads/sponsor2.png\", \"/uploads/sponsor3.png\"]}], \"estilos\": {\"padding\": \"50px 20px\", \"textAlign\": \"center\", \"backgroundColor\": \"#ffffff\"}}, {\"id\": \"cta-1\", \"tipo\": \"cta\", \"bloques\": [{\"id\": \"cta-text\", \"tipo\": \"texto\", \"contenido\": \"¿Listo para asistir al evento?\"}, {\"id\": \"cta-btn\", \"tipo\": \"boton\", \"contenido\": \"Comprar boletos\"}], \"estilos\": {\"color\": \"#ffffff\", \"padding\": \"60px 20px\", \"textAlign\": \"center\", \"backgroundColor\": \"#222222\"}}]}',NULL,NULL),(5,'UFC 315','{\"titulo\": \"Plantilla Básica de Evento\", \"componentes\": [{\"orden\": 1, \"detalles\": [{\"valor\": \"Título del Evento\", \"tipo_detalle\": \"contenido\"}, {\"valor\": \"#000000\", \"tipo_detalle\": \"color\"}], \"contenido\": {}, \"tipo_componente\": \"texto\"}, {\"orden\": 2, \"detalles\": [{\"valor\": \"/uploads/default-image.jpg\", \"tipo_detalle\": \"imagen_url\"}, {\"valor\": \"Imagen del evento\", \"tipo_detalle\": \"alt\"}], \"contenido\": {}, \"tipo_componente\": \"imagen\"}, {\"orden\": 3, \"detalles\": [{\"valor\": \"/uploads/slide1.jpg\", \"tipo_detalle\": \"imagen_url\"}, {\"valor\": \"/uploads/slide2.jpg\", \"tipo_detalle\": \"imagen_url\"}], \"contenido\": {\"slides\": []}, \"tipo_componente\": \"slider\"}], \"descripcion\": \"Plantilla predeterminada para páginas de eventos con título, descripción, imagen y slider\"}',4,NULL),(6,'UFC 316','[{\"id\": \"header\", \"type\": \"header\", \"columns\": [{\"id\": \"header-col\", \"blocks\": [{\"id\": 1776443756186, \"type\": \"text\", \"content\": \"Cabeza\"}]}]}, {\"id\": \"main\", \"type\": \"section\", \"columns\": [{\"id\": 1776443756187, \"blocks\": [{\"id\": 1776443756188, \"type\": \"text\", \"content\": \"Sección principal\"}]}]}, {\"id\": \"footer\", \"type\": \"footer\", \"columns\": [{\"id\": \"footer-col\", \"blocks\": [{\"id\": 1776443756189, \"type\": \"text\", \"content\": \"Footer\"}]}]}]',5,NULL),(7,'UFC 317','[{\"id\": \"header\", \"type\": \"header\", \"columns\": [{\"id\": \"logo-col\", \"blocks\": [{\"id\": 1777056290299, \"src\": \"\", \"type\": \"image\", \"content\": \"\"}]}, {\"id\": \"menu-col\", \"blocks\": [{\"id\": 1777056290300, \"type\": \"menu-item\", \"content\": \"Inicio\"}, {\"id\": 1777056290301, \"type\": \"menu-item\", \"content\": \"Planea tu visita\"}, {\"id\": 1777056290302, \"type\": \"menu-item\", \"content\": \"Zonas Temáticas\"}, {\"id\": 1777056290303, \"type\": \"menu-item\", \"content\": \"Eventos\"}, {\"id\": 1777056290304, \"type\": \"menu-item\", \"content\": \"Blog\"}, {\"id\": 1777056290305, \"type\": \"menu-item\", \"content\": \"Únete\"}, {\"id\": 1777056290306, \"type\": \"menu-item\", \"content\": \"Contacto\"}, {\"id\": 1777056290307, \"type\": \"menu-item\", \"content\": \"Apóyanos\"}]}], \"textColor\": \"#ffffff\", \"backgroundColor\": \"#e52b83\"}, {\"id\": \"auto-main-1\", \"type\": \"section\", \"columns\": [{\"id\": \"main-col-1\", \"blocks\": []}], \"backgroundColor\": \"#ffffff\"}]',6,NULL),(8,'UFC 318','[{\"id\": \"header\", \"type\": \"header\", \"columns\": [{\"id\": \"logo-col\", \"blocks\": [{\"id\": 1, \"src\": \"\", \"type\": \"image\", \"content\": \"\"}]}, {\"id\": \"menu-col\", \"blocks\": [{\"id\": 2, \"type\": \"menu-item\", \"content\": \"Inicio\"}, {\"id\": 3, \"type\": \"menu-item\", \"content\": \"Planea tu visita\"}, {\"id\": 4, \"type\": \"menu-item\", \"content\": \"Zonas Temáticas\"}, {\"id\": 5, \"type\": \"menu-item\", \"content\": \"Eventos\"}, {\"id\": 6, \"type\": \"menu-item\", \"content\": \"Blog\"}, {\"id\": 7, \"type\": \"menu-item\", \"content\": \"Únete\"}, {\"id\": 8, \"type\": \"menu-item\", \"content\": \"Contacto\"}, {\"id\": 9, \"type\": \"menu-item\", \"content\": \"Apóyanos\"}]}], \"textColor\": \"#ffffff\", \"backgroundColor\": \"#e52b83\"}, {\"id\": \"auto-main-1778269629636\", \"type\": \"section\", \"columns\": [{\"id\": \"main-col-1\", \"blocks\": []}], \"backgroundColor\": \"#ffffff\"}]',7,NULL),(9,'UFC 319','[{\"id\": \"header\", \"type\": \"header\", \"columns\": [{\"id\": \"logo-col\", \"blocks\": [{\"id\": 1, \"src\": \"\", \"type\": \"image\", \"content\": \"\"}]}, {\"id\": \"menu-col\", \"blocks\": [{\"id\": 2, \"type\": \"menu-item\", \"content\": \"Inicio\"}, {\"id\": 3, \"type\": \"menu-item\", \"content\": \"Planea tu visita\"}, {\"id\": 4, \"type\": \"menu-item\", \"content\": \"Zonas Temáticas\"}, {\"id\": 5, \"type\": \"menu-item\", \"content\": \"Eventos\"}, {\"id\": 6, \"type\": \"menu-item\", \"content\": \"Blog\"}, {\"id\": 7, \"type\": \"menu-item\", \"content\": \"Únete\"}, {\"id\": 8, \"type\": \"menu-item\", \"content\": \"Contacto\"}, {\"id\": 9, \"type\": \"menu-item\", \"content\": \"Apóyanos\"}]}], \"textColor\": \"#000000\", \"backgroundColor\": \"#ffffff\"}, {\"id\": \"auto-main\", \"type\": \"section\", \"columns\": [{\"id\": \"main-col-1\", \"blocks\": []}], \"backgroundColor\": \"#ffffff\"}, {\"id\": \"footer\", \"type\": \"footer\", \"columns\": [{\"id\": \"footer-col\", \"blocks\": [{\"id\": \"footer-text\", \"type\": \"text\", \"content\": \"© 2026. Todos los derechos reservados.\"}]}], \"textColor\": \"#000000\", \"backgroundColor\": \"#ffffff\"}]',8,NULL),(11,'UFC 320','[{\"id\": \"header\", \"type\": \"header\", \"columns\": [{\"id\": \"logo-col\", \"blocks\": [{\"id\": 1, \"src\": \"\", \"type\": \"image\", \"content\": \"\"}]}, {\"id\": \"menu-col\", \"blocks\": [{\"id\": 2, \"type\": \"menu-item\", \"content\": \"Inicio\"}, {\"id\": 3, \"type\": \"menu-item\", \"content\": \"Planea tu visita\"}, {\"id\": 4, \"type\": \"menu-item\", \"content\": \"Zonas Temáticas\"}, {\"id\": 5, \"type\": \"menu-item\", \"content\": \"Eventos\"}, {\"id\": 6, \"type\": \"menu-item\", \"content\": \"Blog\"}, {\"id\": 7, \"type\": \"menu-item\", \"content\": \"Únete\"}, {\"id\": 8, \"type\": \"menu-item\", \"content\": \"Contacto\"}, {\"id\": 9, \"type\": \"menu-item\", \"content\": \"Apóyanos\"}]}], \"textColor\": \"#ffffff\", \"backgroundColor\": \"#e52b83\"}, {\"id\": \"auto-main-1778269594757\", \"type\": \"section\", \"columns\": [{\"id\": \"main-col-1\", \"blocks\": []}], \"backgroundColor\": \"#ffffff\"}]',10,'2026-05-11 18:08:21');
/*!40000 ALTER TABLE `plantillas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id_rol` int NOT NULL,
  `nombre_rol` varchar(50) NOT NULL,
  `descripcion` text,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `nombre_rol` (`nombre_rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Administrador','Control absoluto del sistema'),(2,'Visitante','Solo puede visualizar el contenido'),(3,'Editor','Puede diseñar páginas');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `ID_User` int NOT NULL AUTO_INCREMENT,
  `Username` varchar(40) NOT NULL,
  `Pass` varchar(255) NOT NULL,
  `email` varchar(40) NOT NULL,
  `estado` tinyint(1) DEFAULT '1',
  `id_rol` int DEFAULT NULL,
  `must_change_pass` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`ID_User`),
  UNIQUE KEY `ID_User` (`ID_User`),
  UNIQUE KEY `Username` (`Username`),
  KEY `id_rol` (`id_rol`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` (ID_User, Username, Pass, email, estado, id_rol) VALUES (1,'Antonio','$2b$10$JqJb1nhAcvhca/BFwDfrVO.9AKCPOLqv9NqrNFXtyIdP/dcM88mlm','antonio1234@gmail.com',1,1),(2,'Daniel','$2b$10$ri8Qf7EMYNtN35vIYzZWsOSZMKHnUYk2rZEgDv6UUUWZsvSx6PWuy','daniel54321@gmail.com',0,2),(3,'Valeria','$2b$10$7A96oxE16JD8l.9lUX4auez7wEqG8kv8kPKKfqI6fcGimZPtzKh36','valeria123@gmail.com',0,3),(4,'noharaayang','$2b$10$MQOmN4xv85rNhXVTnq6.3egf56c6qK1lQEA7iqFxFCWsx4Jrl8s3O','noharita1@gmail.com',0,1),(5,'DUCL10','$2b$10$mptzvv3wm.iEgmkUHauNsO91eDKCglMSIXnM64fG3gyjRvL.4J7Wm','duclcota@gmail.com',1,3),(6,'CachetesHDP','$2b$10$UZXPuzxRW2Gg/lbcavLaaOpamFFTQweyByNCInUcJFHSBNodNGC82','cache@gmail.com',1,2);
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Final view structure for view `pagina_evento`
--

/*!50001 DROP VIEW IF EXISTS `pagina_evento`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `pagina_evento` AS select `pl`.`id_plantilla` AS `id_plantilla`,`pl`.`estructura_base` AS `estructura_base`,`pa`.`slug_url` AS `slug_url` from (`plantillas` `pl` join `paginas` `pa` on((`pa`.`id_pagina` = `pl`.`paginas_id_pagina`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-15 21:27:46
