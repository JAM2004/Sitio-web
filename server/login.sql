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
  `tipo` enum('portada','galeria','fondo','logo','carousel') DEFAULT NULL,
  `orden` int DEFAULT '0',
  PRIMARY KEY (`id_imagen`),
  KEY `plantillas_id_plantilla` (`plantillas_id_plantilla`),
  CONSTRAINT `evento_imagenes_ibfk_1` FOREIGN KEY (`plantillas_id_plantilla`) REFERENCES `plantillas` (`id_plantilla`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evento_imagenes`
--

LOCK TABLES `evento_imagenes` WRITE;
/*!40000 ALTER TABLE `evento_imagenes` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventos`
--

LOCK TABLES `eventos` WRITE;
/*!40000 ALTER TABLE `eventos` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paginas`
--

LOCK TABLES `paginas` WRITE;
/*!40000 ALTER TABLE `paginas` DISABLE KEYS */;
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
  KEY `fk_plantillas_paginas1_idx` (`paginas_id_pagina`),
  KEY `idx_plantillas_nombre` (`nombre_plantilla`),
  CONSTRAINT `fk_plantillas_paginas1` FOREIGN KEY (`paginas_id_pagina`) REFERENCES `paginas` (`id_pagina`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plantillas`
--

LOCK TABLES `plantillas` WRITE;
/*!40000 ALTER TABLE `plantillas` DISABLE KEYS */;
INSERT INTO `plantillas` (id_plantilla, nombre_plantilla, estructura_base, paginas_id_pagina, deleted_at) VALUES (1,'estructura base','[{\"id\":\"header\",\"type\":\"header\",\"backgroundColor\":\"#ffffff\",\"textColor\":\"#000000\",\"columns\":[{\"id\":\"logo-col\",\"blocks\":[{\"id\":1,\"type\":\"image\",\"src\":\"\",\"content\":\"\"}]},{\"id\":\"menu-col\",\"blocks\":[{\"id\":2,\"type\":\"menu-item\",\"content\":\"Inicio\"},{\"id\":3,\"type\":\"menu-item\",\"content\":\"Planea tu visita\"},{\"id\":4,\"type\":\"menu-item\",\"content\":\"Zonas Temáticas\"},{\"id\":5,\"type\":\"menu-item\",\"content\":\"Eventos\"},{\"id\":6,\"type\":\"menu-item\",\"content\":\"Blog\"},{\"id\":7,\"type\":\"menu-item\",\"content\":\"Únete\"},{\"id\":8,\"type\":\"menu-item\",\"content\":\"Contacto\"},{\"id\":9,\"type\":\"menu-item\",\"content\":\"Apóyanos\"}]}]},{\"id\":\"auto-main\",\"type\":\"section\",\"backgroundColor\":\"#ffffff\",\"columns\":[{\"id\":\"main-col-1\",\"blocks\":[]}]},{\"id\":\"footer\",\"type\":\"footer\",\"backgroundColor\":\"#ffffff\",\"textColor\":\"#000000\",\"columns\":[{\"id\":\"footer-col\",\"blocks\":[{\"id\":\"footer-text\",\"type\":\"text\",\"content\":\"© 2026. Todos los derechos reservados.\"}]}]}]',NULL,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` (ID_User, Username, Pass, email, estado, id_rol, must_change_pass) VALUES (1,'admin','$2b$10$In6FWjmBL0nOD0478N2ho.d.DzAZ7fc6uluO/CYN6aKU9bE0ctIYW','admin@empresa.com',1,1,0);
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

-- Dump completed on 2026-11-23 02:29:14
