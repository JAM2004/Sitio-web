import { Router } from 'express';
import * as Comp from '../controllers/Componentes.js';
import { authenticateToken, requireRole } from '../middleware/Auth.js';
import upload from '../src/multerConfig.js';

const router = Router();

// Subir imagen
router.post('/:plantillas_id_plantilla/imagenes', authenticateToken, requireRole(1, 3), upload.single('imagen'), Comp.addImagenCompleta);
// GET sin auth: la portada la pide la página pública
router.get('/:plantillas_id_plantilla/imagenes', Comp.VerImg);
router.patch('/imagenes/:id_imagen', authenticateToken, requireRole(1, 3), Comp.ActIma);
router.delete('/imagenes/:id_imagen', authenticateToken, requireRole(1, 3), Comp.eliminarIma);

export default router;
