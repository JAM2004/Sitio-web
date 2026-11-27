import test from 'node:test'
import assert from 'node:assert/strict';
import { slugify } from '../src/slug.js';

test('quita acentos y pasa a minusculas', () => {
    assert.equal(slugify('Fiesta de la Ñandú'), 'fiesta-de-la-nandu');
});

test('colapsa espacios y signos en un solo guion', () => {
  assert.equal(slugify('  Café   &  Té  '), 'cafe-te');
});

test('no deja guiones en los extremos', () => {
  assert.equal(slugify('---Hola---'), 'hola');
});

test('un título sin letras ni números da cadena vacía', () => {
  assert.equal(slugify('¿¡!?'), '');
});

test('corta a 80 caracteres sin terminar en guion', () => {
    const s = slugify('a'.repeat(79) + 'b c');
    assert.ok(s.length <= 80);
    assert.ok(!s.endsWith('-'));
});