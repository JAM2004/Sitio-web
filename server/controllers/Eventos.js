import db from '../src/db.js';

export const verEventos = async (req, res) => {

  try {
    if (req.user.id_rol === 1) { 
      const [eventos] = await db.execute('SELECT * FROM eventos ORDER BY deleted_at DESC');
      return res.json(eventos);
    }
    else if (req.user.id_rol === 3) {
      const [eventos] = await db.execute(
        'SELECT * FROM eventos WHERE deleted_at IS NULL ORDER BY fecha_inicio DESC'
      );
      return res.json(eventos);
  } 
    else {
      return res.status(403).json({ error: 'No autorizado: acceso restringido' });
    }
  }
  
  catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
};

export const crearEvento = async (req, res) => {
  const { titulo, descripcion, fecha_inicio, fecha_fin, lugar } = req.body;
  const usuarioId = req.user.id;

  if (fecha_inicio && fecha_fin && new Date(fecha_inicio) > new Date(fecha_fin)) {
    return res.status(400).json({ error: 'La fecha de inicio no puede ser posterior a la fecha de fin' });
  }

  try {
    await db.query('START TRANSACTION');
            // Crear página asociada a la nueva plantilla
    const slug = `evento-${Date.now()}`;
    const [paginaResult] = await db.execute(
      'INSERT INTO paginas (slug_url, fecha_modificacion) value (?, NOW())',
      [slug]
    );
    const paginaId = paginaResult.insertId;


    // Selecciona plantilla base (por defecto id 1)
    const [basePlantillas] = await db.execute('SELECT id_plantilla, nombre_plantilla, estructura_base FROM plantillas WHERE id_plantilla = 1');
    if (basePlantillas.length === 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({ error: 'Plantilla base no encontrada' });
    }

    const base = basePlantillas[0];
      const sanitizedTitle = String(titulo || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 100);
      const nuevaPlantillaNombre = sanitizedTitle;
      const estructuraBase = base.estructura_base;
      const [plantillaInsert] = await db.execute(
      'INSERT INTO plantillas (nombre_plantilla, estructura_base, paginas_id_pagina) VALUES (?, ?, ?)',
      [nuevaPlantillaNombre, estructuraBase, paginaId]
      );
    const nuevaPlantillaId = plantillaInsert.insertId;

    // Crear componentes basados en estructura_base
    // const componentesArray = [
    //   { tipo: 'texto', contenido: JSON.stringify({ nombre: 'Portada', texto: '', color: '#000000' }) },
    //   { tipo: 'imagen', contenido: JSON.stringify({ nombre: 'Imagen Destacada', url: '', alt: '' }) },
    //   { tipo: 'slider', contenido: JSON.stringify({ nombre: 'Galería', slides: [] }) },
    //   { tipo: 'contacto', contenido: JSON.stringify({ nombre: 'Contacto', titulo: '', telefono: '', email: '' }) },
    //   { tipo: 'about', contenido: JSON.stringify({ nombre: 'Acerca De', titulo: '', descripcion: '', imagen: '' }) }
    // ];

    // let orden = 1;
    // for (const comp of componentesArray) {
    //   const [compResult] = await db.execute(
    //     'INSERT INTO componentes (tipo_componente, contenido, orden, plantillas_id_plantilla) VALUES (?, ?, ?, ?)',
    //     [comp.tipo, comp.contenido, orden, nuevaPlantillaId]
    //   );
    //   orden++;
    // }

        // Crear evento y vincular la plantilla
    const [eventoResult] = await db.execute(
      'INSERT INTO eventos (titulo, descripcion, fecha_inicio, fecha_fin, lugar, usuarios_ID_User, plantillas_id_plantilla) value (?, ?, ?, ?, ?, ?, ?)',
      [titulo, descripcion, fecha_inicio, fecha_fin, lugar, usuarioId, nuevaPlantillaId]
    );
    const eventoId = eventoResult.insertId;


    await db.query('COMMIT');

    res.json({ message: 'Evento creado', paginaId, slug, id_evento: eventoId, id_plantilla: nuevaPlantillaId });
  } catch (err) {
    try { await db.query('ROLLBACK'); } catch (e) { /* ignore */ }
    console.error('Error creando evento:', err);
    res.status(500).json({ error: err.message });
  }
};

  export const toggleEvento = async (req, res) => {
  const { id } = req.params; 

  if (req.user.id_rol !== 1 && req.user.id_rol !== 3) { 
    return res.status(403).json({ error: 'No autorizado: solo admins y editores pueden cambiar el estado de eventos' });
  }

  try {
    await db.query('START TRANSACTION');

    const [eventos] = await db.execute(
      'SELECT plantillas_id_plantilla, deleted_at FROM eventos WHERE id_evento = ?',
      [id]
    );

    if (eventos.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    const evento = eventos[0];
    const plantillaId = evento.plantillas_id_plantilla;
    const isActive = evento.deleted_at === null;

    const [plantilla] = await db.execute(
      'SELECT paginas_id_pagina FROM plantillas WHERE id_plantilla = ?',
      [plantillaId]
    );

    const isActiveQuery = isActive ? 'UPDATE eventos SET deleted_at = NOW() WHERE id_evento = ?' : 'UPDATE eventos SET deleted_at = NULL WHERE id_evento = ?';
    await db.execute(isActiveQuery, [id]);

    if (plantilla.length > 0 && plantilla[0].paginas_id_pagina) {
      const pageQuery = isActive ? 'UPDATE paginas SET deleted_at = NOW() WHERE id_pagina = ?' : 'UPDATE paginas SET deleted_at = NULL WHERE id_pagina = ?';
      await db.execute(pageQuery, [plantilla[0].paginas_id_pagina]);
    }

    const templateQuery = isActive ? 'UPDATE plantillas SET deleted_at = NOW() WHERE id_plantilla = ?' : 'UPDATE plantillas SET deleted_at = NULL WHERE id_plantilla = ?';
    await db.execute(templateQuery, [plantillaId]);

    await db.query('COMMIT');
    const action = isActive ? 'desactivado' : 'activado';
    res.json({ message: `Evento ${action} correctamente` });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Error al cambiar estado del evento:', err);
    res.status(500).json({ error: err.message });
  }
};

export const editarEvento = async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, fecha_inicio, fecha_fin, lugar } = req.body;

   if (req.user.id_rol !== 1 && req.user.id_rol !==3) { 
    return res.status(403).json({ error: 'No autorizado: solo personal autorizado pueden editar eventos' });}

    if (!titulo && !descripcion && !fecha_inicio && !fecha_fin && !lugar) {
    return res.status(400).json({ error: 'Debe proporcionar al menos un campo para actualizar' });}

    if (fecha_inicio && fecha_fin && new Date(fecha_inicio) > new Date(fecha_fin)) {
    return res.status(400).json({ error: 'La fecha de inicio no puede ser posterior a la fecha de fin' });}

  try {
     const [exist] = await db.execute(
      'SELECT id_evento FROM eventos WHERE id_evento = ? AND deleted_at IS NULL',
      [id]
    );
    if (exist.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado o eliminado' });
    }
    

  const act = [];
    const value = [];
    if (titulo !== undefined) { act.push('titulo = ?'); value.push(titulo); }
    if (descripcion !== undefined) { act.push('descripcion = ?'); value.push(descripcion); }
    if (fecha_inicio !== undefined) { act.push('fecha_inicio = ?'); value.push(fecha_inicio); }
    if (fecha_fin !== undefined) { act.push('fecha_fin = ?'); value.push(fecha_fin); }
    if (lugar !== undefined) { act.push('lugar = ?'); value.push(lugar); }

    const query = `UPDATE eventos SET ${act.join(', ')} WHERE id_evento = ? AND deleted_at IS NULL`;
    value.push(id); 
    const queryPlantilla = 'UPDATE plantillas SET nombre_plantilla = ? WHERE id_plantilla = (SELECT plantillas_id_plantilla FROM eventos WHERE id_evento = ?)';
    await db.execute(queryPlantilla, [titulo, id]);  

    const [result] = await db.execute(query, value);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Evento no encontrado o no se realizaron cambios' });
    }

    res.json({ message: 'Evento actualizado correctamente' });

  }
 catch (err) {
    console.error('Error editando evento:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
