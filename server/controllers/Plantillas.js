import connection from '../src/db.js';
import { getDefaultStructure } from '../EstructuraDefault.js';

export const verPlantillas = async (req, res) => {
  try {
    let query = `SELECT p.id_plantilla, p.nombre_plantilla, p.estructura_base, pg.slug_url 
                 FROM plantillas p 
                 LEFT JOIN paginas pg ON p.paginas_id_pagina = pg.id_pagina
                 WHERE p.id_plantilla != 1 AND p.deleted_at IS NULL 
                 ORDER BY p.id_plantilla DESC`;

    const [plantillas] = await connection.query(query);

    const plantillaIds = plantillas.map(p => p.id_plantilla);

    let imagenesPortada = [];
    if (plantillaIds.length > 0) {
      const [rows] = await connection.query(
        `SELECT plantillas_id_plantilla, url_imagen, alt_text
         FROM evento_imagenes
         WHERE plantillas_id_plantilla IN (?) AND LOWER(tipo) = 'portada'`,
        [plantillaIds]
      );
      imagenesPortada = rows;
    }

    const plantillasConEstructura = plantillas.map(p => {
      const portada = imagenesPortada.find(img => img.plantillas_id_plantilla === p.id_plantilla);

      return {
        id_plantilla: p.id_plantilla,
        nombre_plantilla: p.nombre_plantilla,
        slug_url: p.slug_url,
        estructura: (() => {
          try {
            if (p.estructura_base === null) return null;
            if (typeof p.estructura_base === 'string' || Buffer.isBuffer(p.estructura_base)) return JSON.parse(p.estructura_base);
            return p.estructura_base;
          } catch {
            return null;
          }
        })(),
        portada: portada ? { url: portada.url_imagen, alt_text: portada.alt_text } : null
      };
    });

    res.json(plantillasConEstructura);

  } catch (err) {
    console.error('Error obteniendo plantillas:', err);
    res.status(500).json({ error: 'Error al obtener plantillas' });
    
  }
};

export const verUnaPlantilla = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await connection.query('SELECT p.id_plantilla, p.nombre_plantilla, p.estructura_base, pg.slug_url FROM plantillas p LEFT JOIN paginas pg ON p.paginas_id_pagina = pg.id_pagina WHERE p.id_plantilla = ? AND p.deleted_at IS NULL', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error obteniendo plantilla:', err);
    res.status(500).json({ error: 'Error al obtener plantilla' });
  }
};

export const Actualizar = async (req, res) => {
  const { id } = req.params;
  const { estructura } = req.body;

  if (!Array.isArray(estructura)) {
    return res.status(400).json({ error: 'Estructura inválida: debe ser un array' });
  }

  if (estructura === undefined) {
    return res.status(400).json({ error: 'Campo "estructura" requerido en el body' });
  }

  try {
    const [existe] = await connection.query('SELECT id_plantilla FROM plantillas WHERE id_plantilla = ?', [id]);
    if (existe.length === 0) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    const estructuraJSON = JSON.stringify(estructura);
    const [result] = await connection.execute(
      'UPDATE plantillas SET estructura_base = ? WHERE id_plantilla = ?',
      [estructuraJSON, id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: 'No se realizaron cambios' });
    }

    res.json({ message: 'Estructura de plantilla actualizada correctamente', id_plantilla: Number(id) });
  } catch (err) {
    console.error('Error actualizando estructura de plantilla:', err);
    res.status(500).json({ error: 'Error al actualizar estructura' });
  }
};

export const VaciarUnaPlantilla = async (req, res) => {
  const { id } = req.params;

  try {
    const [existe] = await connection.query('SELECT id_plantilla FROM plantillas WHERE id_plantilla = ?', [id]);
    if (existe.length === 0) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    const [result] = await connection.execute(
      'UPDATE plantillas SET estructura_base = ? WHERE id_plantilla = ? AND deleted_at IS NULL',
      [JSON.stringify(getDefaultStructure()), id],
    );

    const [deleteImagesResult] = await connection.execute(
      'DELETE FROM evento_imagenes WHERE plantillas_id_plantilla = ? AND LOWER(tipo) = "portada"',
      [id]
    );


    if (result.affectedRows === 0) {
      return res.status(400).json({ error: 'No se realizaron cambios' });
    }

    res.json({ message: 'Plantilla vaciada correctamente', id_plantilla: Number(id) });
  } catch (err) {
    console.error('Error vaciando plantilla:', err);
    res.status(500).json({ error: 'Error al vaciar plantilla' });
  }
};
