import bcryptjs from "bcryptjs";
import pool from "./db.js";


// Hashea contraseñas que no se hayan hasheado en la base de datos.
const [usuarios] = await pool.query("SELECT ID_User AS id, Pass FROM usuarios");

for (const user of usuarios) {
  // Si la contraseña no está hasheada
  if (!user.Pass.startsWith("$2b$")) {
    const hashed = await bcryptjs.hash(user.Pass, 10);
    await pool.query("UPDATE usuarios SET Pass = ? WHERE ID_User = ?", [hashed, user.id]);
    console.log(`✅ Usuario ${user.id} actualizado`);
  }
}