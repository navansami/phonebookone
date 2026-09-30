import { readFile } from 'node:fs/promises';
import { updateStore } from '../lib/store.js';
import { validateContact } from '../lib/contacts.js';

const input = JSON.parse(await readFile(new URL('../seed/Telephonebook.json', import.meta.url), 'utf8'));
if (!Array.isArray(input)) throw new Error('Expected a contact array');
const count = await updateStore(store => {
  if (store.contacts.length) return 0;
  const now = new Date().toISOString();
  store.contacts = input.flatMap((source, index) => {
    if (!String(source.name || '').trim()) return [];
    const id = String(source.id || index + 1).padStart(4, '0');
    const normalized = { ...source };
    for (const field of ['tags', 'languages']) {
      if (typeof normalized[field] === 'string') normalized[field] = normalized[field].split(',').map(value => value.trim()).filter(Boolean);
      else if (!Array.isArray(normalized[field])) normalized[field] = [];
    }
    for (const field of ['expose', 'is_ert', 'is_ifa', 'is_third_party']) {
      if (normalized[field] == null) delete normalized[field];
      else if (typeof normalized[field] === 'string') normalized[field] = ['true', '1', 'yes', 'y', 'on'].includes(normalized[field].toLowerCase());
    }
    const data = validateContact(normalized);
    return [{ extension: null, company: null, department: null, designation: null, mobile: null,
      landline: null, email: null, website: null, languages: [], comments: null, tags: [],
      expose: true, is_ert: false, is_ifa: false, is_third_party: false, profile_picture: null,
      ...data, id, created_at: source.created_at || now, updated_at: source.updated_at || now }];
  });
  store.nextId = Math.max(0, ...store.contacts.map(contact => Number.parseInt(contact.id, 10) || 0)) + 1;
  return store.contacts.length;
});
console.log(count ? `Seeded ${count} valid contacts from the ${input.length}-row bundled snapshot.` : 'Database already has contacts; seed skipped.');
