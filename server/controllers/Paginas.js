import db from '../src/db.js';

export const verPaginas = async (req, res) => {
    const {slug} = req.params;

    try {
        const [pagina] = await db.execute(
            `SELECT pl.id_plantilla, pl.estructura_base, pa.slug_url, ev.titulo
            FROM paginas pa
            JOIN plantillas pl ON pl.paginas_id_pagina = pa.id_pagina
            JOIN eventos ev ON ev.plantillas_id_plantilla = pl.id_plantilla
            WHERE pa.slug_url = ?
            AND ev.deleted_at IS NULL
            AND pl.deleted_at IS NULL
            AND pa.deleted_at IS NULL
            `, [slug]
        );
        if (!pagina.length) {
            return res.status(404).json({ error: 'Página no encontrada' });
        }
        res.json(pagina[0]);
    } catch (err) {
        console.error('Error obteniendo página:', err);
        res.status(500).json({ error: 'Error al obtener página' });
    }
 
};