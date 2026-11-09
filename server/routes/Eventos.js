import { Router } from 'express';
import * as eventos from '../controllers/Eventos.js';
import { authenticateToken, requireRole } from '../middleware/Auth.js';

const router = Router();

router.post('/crear', authenticateToken, requireRole(1, 3), eventos.crearEvento);
router.get('/ver', authenticateToken, eventos.verEventos);
// Editor publica (activa/desactiva); la eliminación no existe: desactivar oculta
router.patch('/toggle/:id', authenticateToken, requireRole(1, 3), eventos.toggleEvento);
router.patch('/editar/:id', authenticateToken, requireRole(1, 3), eventos.editarEvento);

export default router;
