export const fields = ['name', 'extension', 'company', 'department', 'designation', 'mobile', 'landline', 'email', 'website', 'languages', 'comments', 'tags', 'expose', 'is_ert', 'is_ifa', 'is_third_party', 'profile_picture'];
export const exportFields = fields.filter(field => field !== 'profile_picture');
export const taxonomyFields = { departments: 'department', companies: 'company', designations: 'designation', tags: 'tags', languages: 'languages' };

export function validateContact(input, partial = false) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid contact data');
  const output = {};
  for (const field of fields) {
    if (!(field in input)) continue;
    const value = input[field];
    if (field === 'tags' || field === 'languages') {
      if (!Array.isArray(value) || value.length > 50 || value.some(item => typeof item !== 'string' || item.length > 200)) throw new Error(`Invalid ${field}`);
      output[field] = [...new Set(value.map(item => item.trim()).filter(Boolean))];
    } else if (field.startsWith('is_') || field === 'expose') {
      if (typeof value !== 'boolean') throw new Error(`Invalid ${field}`);
      output[field] = value;
    } else {
      if (value !== null && typeof value !== 'string') throw new Error(`Invalid ${field}`);
      if (typeof value === 'string' && value.length > (field === 'comments' ? 5000 : field === 'profile_picture' ? 2000 : field === 'website' ? 500 : 200)) throw new Error(`${field} is too long`);
      output[field] = typeof value === 'string' ? value.trim() : null;
    }
  }
  if (!partial && !output.name) throw new Error('Name is required');
  if ('name' in output && !output.name) throw new Error('Name is required');
  if (partial && !Object.keys(output).length) throw new Error('No updates provided');
  return output;
}

export function makeContact(store, data) {
  const now = new Date().toISOString();
  const contact = { id: String(store.nextId || 1).padStart(4, '0'), name: data.name,
    extension: null, company: null, department: null, designation: null, mobile: null,
    landline: null, email: null, website: null, languages: [], comments: null, tags: [],
    expose: true, is_ert: false, is_ifa: false, is_third_party: false, profile_picture: null,
    ...data, created_at: now, updated_at: now };
  store.nextId = (store.nextId || 1) + 1;
  store.contacts.push(contact);
  return contact;
}

export function filterContacts(contacts, params) {
  let list = contacts.slice();
  const search = params.get('search')?.trim().toLowerCase();
  if (search) list = list.filter(contact => [contact.name, contact.department, contact.company, contact.designation, contact.extension, contact.mobile, contact.email, ...(contact.tags || [])].some(value => String(value || '').toLowerCase().includes(search)));
  for (const [query, field] of [['tag', 'tags'], ['language', 'languages']]) {
    const value = params.get(query)?.toLowerCase();
    if (value) list = list.filter(contact => (contact[field] || []).some(item => item.toLowerCase().includes(value)));
  }
  for (const field of ['is_ert', 'is_ifa', 'is_third_party']) {
    const value = params.get(field);
    if (value === 'true' || value === 'false') list = list.filter(contact => Boolean(contact[field]) === (value === 'true'));
  }
  if (params.get('exclude_third_party') === 'true') list = list.filter(contact => !contact.is_third_party);
  const sort = params.get('sort_by') || params.get('sortBy') || 'name';
  if (['name', 'department', 'extension'].includes(sort)) list.sort((a, b) => String(a[sort] || '').localeCompare(String(b[sort] || ''), undefined, { numeric: true }) * (sort === 'extension' ? -1 : 1));
  return list;
}

export function taxonomyInventory(store, type) {
  const field = taxonomyFields[type];
  if (!field) throw new Error('Unsupported taxonomy type');
  const map = new Map();
  for (const contact of store.contacts) for (const raw of (Array.isArray(contact[field]) ? contact[field] : [contact[field]])) {
    const name = String(raw || '').trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const item = map.get(key) || { name, count: 0, samples: [] };
    item.count++;
    if (item.samples.length < 3 && !item.samples.includes(contact.name)) item.samples.push(contact.name);
    map.set(key, item);
  }
  for (const name of store.taxonomies[type] || []) if (!map.has(name.toLowerCase())) map.set(name.toLowerCase(), { name, count: 0, samples: [] });
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function rewriteTaxonomy(store, type, oldName, replacement) {
  const field = taxonomyFields[type];
  if (!field) throw new Error('Unsupported taxonomy type');
  let updated = 0;
  for (const contact of store.contacts) {
    const current = contact[field];
    let changed = false;
    if (Array.isArray(current)) {
      changed = current.some(item => item.toLowerCase() === oldName.toLowerCase());
      if (changed) { contact[field] = [...new Set(current.map(item => item.toLowerCase() === oldName.toLowerCase() ? replacement : item).filter(Boolean))]; updated++; }
    } else if (String(current || '').toLowerCase() === oldName.toLowerCase()) { contact[field] = replacement || null; changed = true; updated++; }
    if (changed) contact.updated_at = new Date().toISOString();
  }
  return updated;
}

export function parseCsv(text) {
  const rows = []; let row = []; let value = ''; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === ',' && !quoted) { row.push(value); value = ''; }
    else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(value); if (row.some(cell => cell.trim())) rows.push(row); row = []; value = '';
    } else value += ch;
  }
  if (quoted) throw new Error('CSV has an unclosed quoted field');
  row.push(value); if (row.some(cell => cell.trim())) rows.push(row);
  return rows;
}

export function csvCell(value) {
  const text = Array.isArray(value) ? value.join(', ') : String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
