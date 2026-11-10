import jwt from 'jsonwebtoken';
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    // Cambio de contraseña forzado: solo se deja pasar el cambio
    if (decoded.must_change_pass && !req.originalUrl.includes('cambiar-pass')) {
      return res.status(403).json({ error: 'Debes cambiar tu contraseña', code: 'CAMBIO_PASS' });
    }
    req.user = decoded;
    next();
  });

};

    // Uso: router.post('/x', authenticateToken, requireRole(1,3), ctrl)
    // 1 = Administrador, 3 = Editor (2 = Visitante no entra al panel)
    export const requireRole = (...roles) => (req, res, next) => {
      if (!req.user || !roles.includes(req.user.id_rol)) {
        return res.status(403).json({ error: 'No autorizado para esta acción' });
      }
      next();
    };

    export const authenticateAdmin = (req, res, next) => {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Token requerido' });
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
        if (decoded.id_rol !== 1) return res.status(403).json({ error: 'No autorizado (solo admins)' });
        req.user = decoded;

        next();
      } catch (err) {
        res.status(401).json({ error: 'Token inválido' });
      }
    };


