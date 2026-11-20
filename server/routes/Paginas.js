import express from 'express';
import * as paginas from '../controllers/Paginas.js';

const router = express.Router();

router.get('/:slug', paginas.verPaginas);

export default router;
