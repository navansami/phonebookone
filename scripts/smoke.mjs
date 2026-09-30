import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const base = process.argv[2] || 'http://127.0.0.1:3000';
const env = Object.fromEntries((await readFile('.env.local', 'utf8')).trim().split(/\r?\n/).map(line => line.split(/=(.*)/s).slice(0, 2)));
for (const route of ['/', '/login', '/admin']) {
  const response = await fetch(base + route);
  assert.equal(response.status, 200, route);
  const html = await response.text();
  assert.match(html, /FTP Telephone Book/);
  assert.match(html, /\/favicon.ico/);
}
assert.equal((await fetch(base + '/api/contacts')).status, 401);
const verified = await fetch(base + '/api/access/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: env.HOTEL_ACCESS_CODE }) });
assert.equal(verified.status, 200);
const cookie = verified.headers.get('set-cookie').split(';')[0];
const contacts = await (await fetch(base + '/api/contacts?limit=500&include_pictures=true', { headers: { Cookie: cookie } })).json();
assert.equal(contacts.pagination.total, 198);
assert.equal(contacts.contacts.length, 198);
const login = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: env.ADMIN_USERNAME, password: env.ADMIN_PASSWORD }) });
assert.equal(login.status, 200);
const token = (await login.json()).access_token;
const taxonomy = await fetch(base + '/api/admin/taxonomy/departments', { headers: { Authorization: `Bearer ${token}` } });
assert.equal(taxonomy.status, 200);
assert.ok((await taxonomy.json()).items.length > 0);
assert.equal((await fetch(base + '/site.webmanifest')).status, 200);
assert.equal((await fetch(base + '/sw.js')).status, 200);
const assetsResponse = await fetch(base + '/offline-assets.json');
assert.equal(assetsResponse.status, 200);
const assets = await assetsResponse.json();
assert.ok(assets.length > 10);
for (const asset of assets) assert.equal((await fetch(base + asset)).status, 200, asset);
console.log('PASS routes, assets, offline manifest, hotel gate, seeded directory and admin API');
