// node scripts/check-imports.mjs
// exit 1 si un import relativo no resuelve con esa escritura (mayúsculas mal o
// archivo inexistente): en Windows casi todo compila (el FS ignora mayúsculas)
// y en Linux revienta.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const roots = ['client/src', 'server/src', 'server/controllers',
               'server/routes', 'server/middleware'];
const exts = ['', '.js', '.jsx', '.mjs', '.json'];

const files = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|jsx|mjs)$/.test(e.name)) files.push(p);
  }
}
roots.forEach(r => walk(path.join(root, r)));

// './x' y '../y' sea en `from '...'`, en `export ... from` o side-effect
const spec = /\bfrom\s+['"](\.[^'"]+)['"]|\bimport\s+['"](\.[^'"]+)['"]/g;

let total = 0;
const bad = [];
for (const file of files) {
  // sin comentarios: un import viejo comentado no es un import
  const clean = fs.readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
  for (const m of clean.matchAll(spec)) {
    const rel = m[1] || m[2];
    total++;
    const abs = path.resolve(path.dirname(file), rel);
    if (!coincide(conExtension(abs))) {
      bad.push(`${path.relative(root, file)} → ${rel}`);
    }
  }
}

// Resuelve extensión/índice como haría el bundler
function conExtension(abs) {
  const cand = [abs,
    ...exts.slice(1).map(e => abs + e),
    ...exts.map(e => path.join(abs, 'index' + e))];
  return cand.find(c => fs.existsSync(c)) || abs;
}

// existsSync NO sirve para esto (en Windows ignora mayúsculas): hay que
// comparar segmento a segmento contra el readdir real de cada carpeta.
function coincide(abs) {
  const rel = path.relative(root, abs);
  if (rel.startsWith('..')) return true;          // fuera del repo: fuera de alcance
  let dir = root;
  for (const seg of rel.split(path.sep)) {
    let names;
    try { names = fs.readdirSync(dir); } catch { return true; }
    if (!names.includes(seg)) return false;
    dir = path.join(dir, seg);
  }
  return true;
}

for (const b of bad) console.log('  ✗ ' + b);
console.log(`\n${total} imports relativos revisados · ${bad.length} sin resolver (mayúsculas o archivo inexistente)`);
process.exit(bad.length ? 1 : 0);
