import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { readStore, updateStore } from '../lib/store.js';
import { saveImage } from '../lib/images.js';

const sourcePath = path.resolve('data/phonebook.json');
const source = JSON.parse(await readFile(sourcePath, 'utf8'));
if (!Array.isArray(source.contacts)) throw new Error('Local phonebook snapshot has no contacts array');
if (!process.env.MONGODB_URI?.trim()) throw new Error('Set MONGODB_URI in .env.local before migrating');

const current = await readStore();
if (current.contacts.length || current.suggestions.length || Object.keys(current.taxonomies).length) {
  throw new Error('Atlas database already has phonebook data; migration stopped without changes');
}

let images = 0;
for (const contact of source.contacts) {
  const filename = contact.profile_picture?.match(/^\/api\/images\/([\w.-]+\.(?:png|jpg|webp))$/)?.[1];
  if (!filename) continue;
  const bytes = await readFile(path.resolve('data/uploads', filename));
  const type = filename.endsWith('.png') ? 'image/png' : filename.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
  await saveImage(filename, bytes, type);
  images++;
}

const count = await updateStore(store => {
  if (store.contacts.length || store.suggestions.length || Object.keys(store.taxonomies).length) {
    throw new Error('Atlas database received data during migration; migration stopped');
  }
  store.contacts = source.contacts;
  store.taxonomies = source.taxonomies || {};
  store.suggestions = source.suggestions || [];
  store.nextId = source.nextId || Math.max(0, ...source.contacts.map(contact => Number.parseInt(contact.id, 10) || 0)) + 1;
  return store.contacts.length;
});
console.log(`Migrated ${count} contacts and ${images} images from the local backup to MongoDB Atlas.`);
