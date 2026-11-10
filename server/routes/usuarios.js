import { Router } from 'express';
import connection from '../src/db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { authenticateAdmin, authenticateToken } from '../middleware/Auth.js';

dotenv.config();

const router = Router();

router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const [rows] = await connection.query('SELECT u.ID_User, u.Username, u.email, u.estado, u.id_rol, r.nombre_rol FROM usuarios u LEFT JOIN roles r ON u.id_rol = r.id_rol');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }

});

router.post('/login', async (req, res) => {
  const { email, password } = (req.body || {});

  try {
  const [rows] = await connection.query('SELECT * FROM usuarios WHERE email = ?', [email.trim()]);
    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const user = rows[0];
    const passwordMatches = await bcrypt.compare(password, user.Pass);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (user.estado !== 1) { 
      return res.status(403).json({ error: 'Usuario dado de baja' });
    }   

    if (user.id_rol === 2) {
      return res.status(403).json({ error: 'Rol Visitante sin acceso al panel' });
    }
  

    const payload = {
      id: user.ID_User,
      email: user.email,
      id_rol: user.id_rol,
      must_change_pass: user.must_change_pass === 1
    };

    const secret = process.env.JWT_SECRET;
    const token = jwt.sign(payload, secret, { expiresIn: '24h' });

    const safeUser = { ...user };
    if (safeUser.Pass) delete safeUser.Pass;

    return res.json({ token, user: safeUser });
  
  } 
  catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Error de autenticación' });
  }
});

router.post('/registerUsers', authenticateAdmin, async (req,res) => {
const { nombre, email, password, rol } = (req.body || {});

if (!email || !password || !rol) {
    return res.status(400).json({ error: 'Correo, contraseña y rol son requeridos' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Correo inválido' });
  }

try{
  const [existing] = await connection.query('SELECT * FROM usuarios WHERE email = ?', [email.trim()]);
  if (existing.length > 0) {
    return res.status(400).json({ error: 'El correo ya está registrado'});
  }

    const hashpass = await bcrypt.hash(password, 10);

    const [result] = await connection.execute(
      'INSERT INTO usuarios (Username,email, Pass, id_rol) VALUES (?, ?, ?, ?)',
      [nombre, email, hashpass, rol]
    );

    res.status(201).json({ message: 'Usuario registrado exitosamente', id_user: result.insertId });
    

}
catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.patch('/usuarios/:id/status', authenticateAdmin, async (req,res) => {
  const { id } = req.params;
  const { status } = req.body;

      if (req.user.id_rol !== 1) {
    return res.status(403).json({ error: 'No autorizado: solo admins pueden eliminar usuarios' });
  }
   if (status !== 0 && status !== 1) {
    return res.status(400).json({ error: 'Status inválido: debe ser 0 (desactivado) o 1 (activado)' });
  }

  try
  {
     if (status === 1) { } 

     else if (status === 0) {
      const [Usuarios] = await connection.query('SELECT COUNT(*) as count FROM usuarios WHERE id_rol = 1 AND estado = 1 AND ID_User != ?', [id]);
      if (Usuarios[0].count === 0) {
        return res.status(403).json({ error: 'No puedes desactivar al último administrador' });
      }
    }

      await connection.execute('UPDATE usuarios SET estado = ? WHERE ID_User = ?',[status,id]);
        res.json({ message: `Usuario ${status === 1 ? 'activado' : 'desactivado'} correctamente` });
}

  
  catch (err){
      console.error('Error eliminando usuario:', err);
    res.status(500).json({ error: err.message });
  }

}
);

router.patch('/usuarios/cambiar-pass', authenticateToken, async (req, res) => {
  const { password_actual, password_nueva, password_confirmar } = req.body;
  // Si el admin marcó "cambio forzado", no se pide la contraseña actual
  const forzado = !!req.user.must_change_pass;

  if (!password_nueva || !password_confirmar) {
    return res.status(400).json({ error: 'La nueva contraseña y su confirmación son requeridas' });
  }

  if (!forzado && !password_actual) {
    return res.status(400).json({ error: 'La contraseña actual es requerida' });
  }

  if (password_nueva !== password_confirmar) {
    return res.status(400).json({ error: 'La nueva contraseña y la confirmación no coinciden' });
  }

  if (password_nueva.length < 8) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
  }

  if (!forzado && password_actual === password_nueva) {
    return res.status(400).json({ error: 'La nueva contraseña no puede ser igual a la actual' });
  }

  try {
    const [user] = await connection.execute('SELECT Pass FROM usuarios WHERE ID_User = ? AND estado = 1', [req.user.id]);
    if (user.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (!forzado) {
      const compara = await bcrypt.compare(password_actual, user[0].Pass);
      if (!compara) {
        return res.status(401).json({ error: 'Contraseña actual incorrecta' });
      }
    }

    const hashedNueva = await bcrypt.hash(password_nueva, 10);

    await connection.execute('UPDATE usuarios SET Pass = ?, must_change_pass = 0 WHERE ID_User = ?', [hashedNueva, req.user.id]);

    console.log(`Contraseña cambiada por usuario ${req.user.id} en ${new Date().toISOString()}`);

    res.json({
      message: 'Contraseña cambiada correctamente',
      // El token actual sigue marcado como "forzado": hay que entrar de nuevo
      requiereRelogin: forzado
    });
  } catch (err) {
    console.error('Error cambiando contraseña:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
);

// Admin: restablece la contraseña de un usuario y lo obliga a cambiarla al entrar
router.patch('/usuarios/:id/reset-pass', authenticateAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const [usuarios] = await connection.execute('SELECT ID_User FROM usuarios WHERE ID_User = ?', [id]);
    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const temporal = crypto.randomBytes(9).toString('base64url');
    const hash = await bcrypt.hash(temporal, 10);

    await connection.execute('UPDATE usuarios SET Pass = ?, must_change_pass = 1 WHERE ID_User = ?', [hash, id]);

    console.log(`Contraseña restablecida por admin ${req.user.id} para el usuario ${id}`);
    res.json({ message: 'Contraseña restablecida. El usuario deberá cambiarla al ingresar.', temporal });
  } catch (err) {
    console.error('Error restableciendo contraseña:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


export default router;