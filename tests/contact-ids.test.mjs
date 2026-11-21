import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { ObjectId } from 'mongodb';
import { GET, POST, PUT, PATCH, DELETE } from '../app/api/[...path]/route.js';
import { createToken } from '../lib/auth.js';
import { closeDatabase, getDatabase } from '../lib/store.js';

// Point PHONEBOOK_TEST_MONGO_URI at a test replica set to exercise the actual driver.
test('admin edits target the original imported MongoDB document', { skip: !process.env.PHONEBOOK_TEST_MONGO_URI }, async t => {
  process.env.MONGODB_URI = process.env.PHONEBOOK_TEST_MONGO_URI;
  process.env.MONGODB_DATABASE = 'phonebook_test_' + randomUUID().replaceAll('-', '');
  process.env.SESSION_SECRET = randomUUID();
  const db = await getDatabase();
  t.after(async () => { try { await db.dropDatabase(); } finally { await closeDatabase(); } });
  const contacts = db.collection('contacts');
  const key = new ObjectId();
  await contacts.insertMany([
    { _id: key, name: 'ObjectId contact' },
    { _id: key.toHexString(), id: null, name: 'String key contact' },
    { _id: '0008', id: '0007', name: 'Directory ID contact' }
  ]);
  const headers = { Authorization: 'Bearer ' + await createToken('admin') };
  async function request(method, path, data, expectedStatus = 200) {
    const req = new Request('http://localhost/api/' + path, { method, headers, body: JSON.stringify(data) });
    const response = await ({ GET, POST, PUT, PATCH, DELETE }[method])(req, {
      params: { path: new URL(req.url).pathname.split('/').slice(2) }
    });
    assert.equal(response.status, expectedStatus);
    return response.json();
  }
  const listing = await request('GET', 'contacts');
  const ids = listing.contacts.map(contact => contact.id);
  assert.ok(ids.every(id => typeof id === 'string' && id.length));
  assert.equal(new Set(ids).size, 3);
  assert.ok(ids.includes('0007'));
  const id = listing.contacts.find(contact => contact.name === 'ObjectId contact').id;
  const path = 'admin/contacts/' + encodeURIComponent(id);
  const saved = await request('PUT', path, { extension: '2345' });
  assert.equal(saved.id, id);
  assert.equal((await contacts.findOne({ _id: key })).extension, '2345');
  assert.equal((await contacts.findOne({ _id: key.toHexString() })).extension, undefined);
  await request('PATCH', path + '/ert?is_ert=true');
  assert.equal((await contacts.findOne({ _id: key })).is_ert, true);
  assert.equal((await request('GET', 'contacts/' + encodeURIComponent(id))).extension, '2345');
  assert.equal(await contacts.countDocuments(), 3);
  await request('DELETE', path);
  assert.equal(await contacts.findOne({ _id: key }), null);
  assert.equal(await contacts.countDocuments(), 2);
  const created = await request('POST', 'admin/contacts', { name: 'New contact' }, 201);
  assert.equal(created.id, '0008');
  assert.equal((await contacts.findOne({ _id: '0008' })).name, 'Directory ID contact');
  assert.equal((await request('GET', 'contacts/0008')).name, 'New contact');
});
