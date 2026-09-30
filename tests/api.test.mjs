import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { GET, POST, PUT, PATCH, DELETE } from '../app/api/[...path]/route.js';
import { setTestStore } from '../lib/store.js';
import { setTestImages } from '../lib/images.js';

setTestStore({ contacts: [], taxonomies: {}, suggestions: [], nextId: 1 });
setTestImages(new Map());
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'correct test password';
process.env.HOTEL_ACCESS_CODE = 'H-A5F1';
process.env.SESSION_SECRET = randomBytes(48).toString('base64url');

async function call(method, route, payload, headers = {}) {
  const url = new URL(`http://localhost${route}`);
  const init = { method, headers: { ...headers } };
  if (payload !== undefined) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(payload); }
  const request = new Request(url, init);
  const action = { GET, POST, PUT, PATCH, DELETE }[method];
  return action(request, { params: Promise.resolve({ path: url.pathname.split('/').slice(2) }) });
}

test('admin auth and hotel access gate', async () => {
  assert.equal((await call('GET', '/api/contacts')).status, 401);
  assert.equal((await call('POST', '/api/auth/login', { username: 'admin', password: 'wrong' })).status, 401);
  const login = await call('POST', '/api/auth/login', { username: 'admin', password: 'correct test password' });
  assert.equal(login.status, 200);
  const token = (await login.json()).access_token;
  const adminHeaders = { Authorization: `Bearer ${token}` };
  assert.deepEqual(await (await call('GET', '/api/auth/me', undefined, adminHeaders)).json(), { username: 'admin' });
  const access = await call('POST', '/api/access/verify', { code: 'HA5F1' });
  assert.equal(access.status, 200);
  const cookie = access.headers.get('set-cookie').split(';')[0];
  const publicHeaders = { Cookie: cookie };
  assert.equal((await call('GET', '/api/contacts', undefined, publicHeaders)).status, 200);

  const created = await call('POST', '/api/contacts', { name: 'Ada Test', department: 'Operations', tags: ['ERT'], languages: ['French'] }, publicHeaders);
  assert.equal(created.status, 201);
  const id = (await created.json()).id;
  const listing = await (await call('GET', '/api/contacts?search=Ada&tag=ERT&language=French', undefined, publicHeaders)).json();
  assert.equal(listing.pagination.total, 1);
  assert.equal(listing.contacts[0].id, id);
  assert.equal((await call('PUT', `/api/contacts/${id}`, { designation: 'Manager' }, publicHeaders)).status, 200);
  assert.equal((await call('PATCH', `/api/admin/contacts/${id}/ert?is_ert=true`, undefined, adminHeaders)).status, 200);
  const afterFlag = await (await call('GET', `/api/contacts/${id}`, undefined, publicHeaders)).json();
  assert.equal(afterFlag.is_ert, true);

  assert.equal((await call('POST', '/api/admin/taxonomy/departments', { name: 'Front Office' }, adminHeaders)).status, 200);
  assert.equal((await call('PATCH', '/api/admin/taxonomy/departments', { current_name: 'Operations', new_name: 'Rooms' }, adminHeaders)).status, 200);
  const taxonomy = await (await call('GET', '/api/admin/taxonomy/departments', undefined, adminHeaders)).json();
  assert.ok(taxonomy.items.some(item => item.name === 'Rooms' && item.count === 1));
  assert.equal((await call('PATCH', '/api/admin/contacts/bulk', { contact_ids: [id], updates: { expose: false } }, adminHeaders)).status, 200);
  assert.match((await (await call('GET', '/api/admin/contacts/export', undefined, adminHeaders)).text()), /Ada Test/);
  assert.equal((await call('DELETE', `/api/admin/contacts/${id}`, undefined, adminHeaders)).status, 200);
  assert.equal((await call('GET', `/api/contacts/${id}`, undefined, publicHeaders)).status, 404);
});

test('CSV preview/import, image upload, and suggestions retain their API contract', async () => {
  const login = await call('POST', '/api/auth/login', { username: 'admin', password: 'correct test password' });
  const token = (await login.json()).access_token;
  const adminHeaders = { Authorization: `Bearer ${token}` };
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const form = new FormData();
  form.set('file', new File(['name,department,tags,languages\r\n"Test, CSV",Engineering,"ERT, Staff",French\r\n'], 'contacts.csv', { type: 'text/csv' }));
  async function csv(apply) {
    const url = new URL(`http://localhost/api/admin/contacts/import?apply_changes=${apply}`);
    const request = new Request(url, { method: 'POST', headers: adminHeaders, body: form });
    return POST(request, { params: Promise.resolve({ path: ['admin', 'contacts', 'import'] }) });
  }
  const preview = await (await csv(false)).json();
  assert.equal(preview.valid_rows, 1);
  assert.equal(preview.created_count, 0);
  const applied = await (await csv(true)).json();
  assert.equal(applied.created_count, 1);
  const found = await (await call('GET', '/api/contacts?search=Test%2C%20CSV', undefined, { Cookie: cookie })).json();
  assert.equal(found.pagination.total, 1);
  const imageForm = new FormData();
  imageForm.set('file', new File([Uint8Array.from([137, 80, 78, 71])], 'photo.png', { type: 'image/png' }));
  const uploadUrl = new URL(`http://localhost/api/upload/profile-picture?contact_id=${found.contacts[0].id}`);
  const imageResponse = await POST(new Request(uploadUrl, { method: 'POST', headers: adminHeaders, body: imageForm }), { params: Promise.resolve({ path: ['upload', 'profile-picture'] }) });
  assert.equal(imageResponse.status, 200);
  const imageUrl = (await imageResponse.json()).url;
  assert.equal((await call('GET', imageUrl, undefined, { Cookie: cookie })).status, 200);
  assert.equal((await call('POST', '/api/suggestions', { type: 'edit', name: 'Test, CSV' }, { Cookie: cookie })).status, 201);
});

test('missing Atlas URI returns a configuration error', async () => {
  setTestStore(null);
  const previous = process.env.MONGODB_URI;
  delete process.env.MONGODB_URI;
  try {
    const verified = await call('POST', '/api/access/verify', { code: 'HA5F1' });
    const cookie = verified.headers.get('set-cookie').split(';')[0];
    const response = await call('GET', '/api/contacts', undefined, { Cookie: cookie });
    assert.equal(response.status, 503);
    assert.match((await response.json()).detail, /MONGODB_URI/);
  } finally {
    if (previous === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = previous;
    setTestStore({ contacts: [], taxonomies: {}, suggestions: [], nextId: 1 });
  }
});
