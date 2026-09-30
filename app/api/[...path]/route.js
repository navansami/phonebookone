import { readStore, updateStore } from '../../../lib/store.js';
import { saveImage, readImage } from '../../../lib/images.js';
import { getFmcProviders } from '../../../lib/fmc-network.js';
import { adminFromRequest, checkCredentials, checkHotelCode, createToken } from '../../../lib/auth.js';
import { exportFields, taxonomyFields, validateContact, makeContact, filterContacts, taxonomyInventory, rewriteTaxonomy, parseCsv, csvCell } from '../../../lib/contacts.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const noStore = { 'Cache-Control': 'no-store' };
const loginAttempts = new Map();
function json(data, status = 200) { return Response.json(data, { status, headers: noStore }); }
function error(message, status = 400) { return json({ detail: message }, status); }
function asBoolean(value) { return value === 'true'; }
async function body(request) {
  if (Number(request.headers.get('content-length') || 0) > 1024 * 1024) throw new Error('Request is too large');
  const text = await request.text();
  if (text.length > 1024 * 1024) throw new Error('Request is too large');
  try { return JSON.parse(text); } catch { throw new Error('Invalid JSON'); }
}
function mutableContact(store, id) { return store.contacts.find(contact => contact.id === id); }
async function accessFromRequest(request) {
  if (await adminFromRequest(request)) return true;
  const token = request.headers.get('cookie')?.match(/(?:^|;\s*)phonebook_access=([^;]+)/)?.[1];
  if (!token) return false;
  try { const { jwtVerify } = await import('jose'); const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.SESSION_SECRET)); return payload.sub === 'hotel'; }
  catch { return false; }
}
function safeName(value) { const name = String(value || '').trim().replace(/\s+/g, ' '); if (!name || name.length > 200) throw new Error('Name must be between 1 and 200 characters'); return name; }

async function handleAuth(request, segments, method) {
  if (segments[1] === 'login' && method === 'POST') {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    const entry = loginAttempts.get(ip) || { count: 0, until: Date.now() + 15 * 60 * 1000 };
    if (entry.until <= Date.now()) { entry.count = 0; entry.until = Date.now() + 15 * 60 * 1000; }
    if (entry.count >= 10) return error('Too many login attempts. Try again later.', 429);
    const input = await body(request);
    if (!checkCredentials(input.username, input.password)) { entry.count++; loginAttempts.set(ip, entry); return error('Incorrect username or password', 401); }
    loginAttempts.delete(ip);
    const response = json({ access_token: await createToken('admin'), token_type: 'bearer' });
    response.headers.set('Set-Cookie', `phonebook_access=${await createToken('hotel', '8h')}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`);
    return response;
  }
  if (segments[1] === 'me' && method === 'GET') return await adminFromRequest(request) ? json({ username: process.env.ADMIN_USERNAME }) : error('Could not validate credentials', 401);
  return error('Not found', 404);
}

async function handleContacts(request, segments, method, url) {
  if (!(await accessFromRequest(request))) return error('Hotel access required', 401);
  const id = segments[1];
  if (!id && method === 'GET') {
    const store = await readStore();
    const all = filterContacts(store.contacts, url.searchParams);
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(1000, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '20', 10) || 20));
    const contacts = all.slice((page - 1) * limit, page * limit).map(contact => url.searchParams.get('include_pictures') === 'true' ? contact : { ...contact, profile_picture: null });
    return json({ contacts, pagination: { page, limit, total: all.length, total_pages: Math.ceil(all.length / limit) } });
  }
  if (!id && method === 'POST') {
    const data = validateContact(await body(request));
    const contact = await updateStore(store => makeContact(store, data));
    return json(contact, 201);
  }
  if (id && method === 'GET') {
    const contact = mutableContact(await readStore(), id);
    return contact ? json(contact) : error('Contact not found', 404);
  }
  if (id && method === 'PUT') {
    const data = validateContact(await body(request), true);
    const contact = await updateStore(store => {
      const existing = mutableContact(store, id);
      if (!existing) return null;
      Object.assign(existing, data, { updated_at: new Date().toISOString() });
      return existing;
    });
    return contact ? json(contact) : error('Contact not found', 404);
  }
  return error('Not found', 404);
}

async function handleTaxonomy(request, type, method) {
  if (!taxonomyFields[type]) return error('Unsupported taxonomy type');
  if (method === 'GET') return json({ taxonomy_type: type, items: taxonomyInventory(await readStore(), type) });
  const input = await body(request);
  if (method === 'POST') {
    const name = safeName(input.name);
    await updateStore(store => { store.taxonomies[type] ||= []; if (!store.taxonomies[type].some(item => item.toLowerCase() === name.toLowerCase())) store.taxonomies[type].push(name); });
    return json({ message: 'Taxonomy value created successfully', updated_contacts: 0 });
  }
  if (method === 'PATCH') {
    const current = safeName(input.current_name), next = safeName(input.new_name);
    const updated = await updateStore(store => {
      store.taxonomies[type] = (store.taxonomies[type] || []).filter(name => name.toLowerCase() !== current.toLowerCase());
      if (!store.taxonomies[type].some(name => name.toLowerCase() === next.toLowerCase())) store.taxonomies[type].push(next);
      return rewriteTaxonomy(store, type, current, next);
    });
    return json({ message: 'Taxonomy value updated successfully', updated_contacts: updated });
  }
  if (method === 'DELETE') {
    const name = safeName(input.name);
    const replacement = input.replacement_name ? safeName(input.replacement_name) : null;
    const store = await readStore();
    const usage = taxonomyInventory(store, type).find(item => item.name.toLowerCase() === name.toLowerCase())?.count || 0;
    if (usage && !replacement) return error('Replacement name is required for values currently used by contacts');
    const updated = await updateStore(current => {
      current.taxonomies[type] = (current.taxonomies[type] || []).filter(item => item.toLowerCase() !== name.toLowerCase());
      if (replacement && !current.taxonomies[type].some(item => item.toLowerCase() === replacement.toLowerCase())) current.taxonomies[type].push(replacement);
      return rewriteTaxonomy(current, type, name, replacement);
    });
    return json({ message: 'Taxonomy value removed successfully', updated_contacts: updated });
  }
  return error('Not found', 404);
}

async function handleImport(request, url) {
  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file.name !== 'string' || !file.name.toLowerCase().endsWith('.csv')) return error('Please upload a CSV file');
  if (file.size > 2 * 1024 * 1024) return error('CSV is too large');
  const raw = Buffer.from(await file.arrayBuffer());
  const text = new TextDecoder('utf-8', { fatal: true }).decode(raw).replace(/^\uFEFF/, '');
  const rows = parseCsv(text);
  if (!rows.length) return error('CSV file is missing a header row');
  const headers = rows[0].map(item => item.trim());
  const valid = [], errors = [];
  rows.slice(1).forEach((row, index) => {
    const source = Object.fromEntries(headers.map((key, i) => [key, (row[i] || '').trim()]));
    try {
      const data = {};
      for (const field of exportFields) {
        const value = source[field];
        if (value === undefined) continue;
        if (['tags', 'languages'].includes(field)) data[field] = value.split(',').map(item => item.trim()).filter(Boolean);
        else if (field === 'expose' || field.startsWith('is_')) data[field] = value ? ['true', '1', 'yes', 'y', 'on'].includes(value.toLowerCase()) : field === 'expose';
        else data[field] = value || null;
      }
      const contact = validateContact(data);
      valid.push({ row: index + 2, data: contact });
    } catch (exception) { errors.push({ row: index + 2, message: exception.message }); }
  });
  const apply = url.searchParams.get('apply_changes') === 'true';
  let created = 0;
  if (apply) created = await updateStore(store => { for (const item of valid) makeContact(store, item.data); return valid.length; });
  return json({ apply_changes: apply, total_rows: rows.length - 1, valid_rows: valid.length, created_count: created,
    errors, preview: valid.slice(0, 20).map(({ row, data }) => ({ row, name: data.name, department: data.department, designation: data.designation, company: data.company })) });
}

async function handleAdminContacts(request, segments, method, url) {
  const id = segments[2];
  if (!id && method === 'POST') return handleContacts(request, ['contacts'], method, url);
  if (id === 'bulk' && method === 'PATCH') {
    const input = await body(request);
    if (!Array.isArray(input.contact_ids) || !input.contact_ids.length || input.contact_ids.length > 1000) return error('Select contacts to update');
    const updates = validateContact(input.updates, true);
    const updated = await updateStore(store => {
      let count = 0;
      for (const contact of store.contacts) if (input.contact_ids.includes(contact.id)) { Object.assign(contact, updates, { updated_at: new Date().toISOString() }); count++; }
      return count;
    });
    return json({ message: 'Contacts updated successfully', updated_contacts: updated });
  }
  if (id === 'export' && method === 'GET') {
    const contacts = filterContacts((await readStore()).contacts, url.searchParams);
    const lines = [exportFields.join(','), ...contacts.map(contact => exportFields.map(field => csvCell(contact[field])).join(','))];
    return new Response('\uFEFF' + lines.join('\r\n') + '\r\n', { status: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="phonebook_contacts.csv"', ...noStore } });
  }
  if (id === 'import' && method === 'POST') return handleImport(request, url);
  if (!id) return error('Not found', 404);
  if (method === 'PUT') return handleContacts(request, ['contacts', id], 'PUT', url);
  if (method === 'DELETE' && segments.length === 3) {
    const removed = await updateStore(store => { const count = store.contacts.length; store.contacts = store.contacts.filter(contact => contact.id !== id); return store.contacts.length !== count; });
    return removed ? json({ message: 'Contact deleted successfully' }) : error('Contact not found', 404);
  }
  if (method === 'PATCH' && segments.length === 4) {
    const flags = { ert: ['is_ert', 'is_ert'], ifa: ['is_ifa', 'is_ifa'], expose: ['expose', 'expose'], 'third-party': ['is_third_party', 'is_third_party'] };
    const config = flags[segments[3]];
    if (!config || !['true', 'false'].includes(url.searchParams.get(config[1]))) return error('Invalid status');
    const result = await updateStore(store => { const contact = mutableContact(store, id); if (!contact) return null; contact[config[0]] = asBoolean(url.searchParams.get(config[1])); contact.updated_at = new Date().toISOString(); return contact; });
    return result ? json(result) : error('Contact not found', 404);
  }
  return error('Not found', 404);
}

async function handleUpload(request, url) {
  const id = url.searchParams.get('contact_id');
  if (!id || !(mutableContact(await readStore(), id) || /^temp_\d{10,16}$/.test(id))) return error('Contact not found', 404);
  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file.type !== 'string' || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return error('Invalid file type. Only PNG, JPEG or WebP images are allowed');
  if (file.size > 5 * 1024 * 1024) return error('File too large. Maximum size is 5MB');
  const extension = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[file.type];
  const filename = `${id}-${crypto.randomUUID()}.${extension}`;
  await saveImage(filename, Buffer.from(await file.arrayBuffer()), file.type);
  const imageUrl = `/api/images/${filename}`;
  await updateStore(store => { const contact = mutableContact(store, id); if (contact) { contact.profile_picture = imageUrl; contact.updated_at = new Date().toISOString(); } });
  return json({ url: imageUrl, message: 'Profile picture uploaded successfully' });
}

async function dispatch(request, params) {
  const segments = (await params).path;
  const method = request.method;
  const url = new URL(request.url);
  try {
    if (!['GET', 'HEAD'].includes(method)) {
      const origin = request.headers.get('origin');
      if (origin && origin !== url.origin) return error('Cross-origin requests are not allowed', 403);
    }
    if (segments[0] === 'auth') return await handleAuth(request, segments, method);
    if (segments[0] === 'access' && segments[1] === 'me' && method === 'GET') return (await accessFromRequest(request)) ? json({ verified: true }) : error('Hotel access required', 401);
    if (segments[0] === 'access' && segments[1] === 'verify' && method === 'POST') {
      if (!checkHotelCode((await body(request)).code)) return error('Invalid hotel code', 401);
      const token = await createToken('hotel', '8h');
      const response = json({ verified: true });
      response.headers.set('Set-Cookie', `phonebook_access=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800${url.protocol === 'https:' ? '; Secure' : ''}`);
      return response;
    }
    if (segments[0] === 'images' && segments[1] && method === 'GET') {
      if (!(await accessFromRequest(request))) return error('Hotel access required', 401);
      const filename = segments[1];
      if (!/^[\w.-]+\.(png|jpg|webp)$/.test(filename)) return error('Not found', 404);
      const file = await readImage(filename);
      return file ? new Response(file.bytes, { headers: { 'Content-Type': file.type, 'Cache-Control': 'private, max-age=3600' } }) : error('Not found', 404);
    }
    if (segments[0] === 'contacts') return await handleContacts(request, segments, method, url);
    if (segments[0] === 'fmc-network' && segments.length === 1 && method === 'GET') {
      if (!(await accessFromRequest(request))) return error('Hotel access required', 401);
      return json({ providers: await getFmcProviders() });
    }
    if (segments[0] === 'tags' && method === 'GET') {
      if (!(await accessFromRequest(request))) return error('Hotel access required', 401);
      return json({ tags: [...new Set((await readStore()).contacts.flatMap(contact => contact.tags || []))].sort() });
    }
    if (segments[0] === 'languages' && method === 'GET') {
      if (!(await accessFromRequest(request))) return error('Hotel access required', 401);
      return json({ languages: [...new Set((await readStore()).contacts.flatMap(contact => contact.languages || []))].filter(value => value !== 'English').sort() });
    }
    if (segments[0] === 'suggestions' && method === 'POST') {
      if (!(await accessFromRequest(request))) return error('Hotel access required', 401);
      const suggestion = await body(request);
      if (!['new', 'edit'].includes(suggestion.type) || !suggestion.name) return error('Invalid suggestion');
      await updateStore(store => { store.suggestions.push({ ...suggestion, id: crypto.randomUUID(), created_at: new Date().toISOString() }); });
      return json({ message: 'Suggestion received', type: suggestion.type }, 201);
    }
    if (segments[0] === 'admin') {
      if (!(await adminFromRequest(request))) return error('Could not validate credentials', 401);
      if (segments[1] === 'contacts') return await handleAdminContacts(request, segments, method, url);
      if (segments[1] === 'taxonomy') return await handleTaxonomy(request, segments[2], method);
    }
    if (segments[0] === 'upload' && segments[1] === 'profile-picture' && method === 'POST') {
      if (!(await adminFromRequest(request))) return error('Could not validate credentials', 401);
      return await handleUpload(request, url);
    }
    return error('Not found', 404);
  } catch (exception) {
    if (exception.message === 'SESSION_SECRET must contain at least 32 characters') return error('Server authentication is not configured', 503);
    if (exception.code === 'MONGODB_URI_MISSING') return error('MongoDB Atlas is not configured. Add MONGODB_URI to .env.local.', 503);
    if (exception.name?.startsWith('Mongo') || exception.name === 'MongoError') {
      console.error('Phonebook database request failed:', exception.name);
      return error('MongoDB Atlas is unavailable', 503);
    }
    if (exception instanceof SyntaxError || exception instanceof TypeError || exception.message?.includes('Invalid') || exception.message?.includes('required') || exception.message?.includes('too long') || exception.message?.includes('too large')) return error(exception.message);
    console.error('Phonebook API failed:', exception);
    return error('The request could not be completed', 500);
  }
}
export async function GET(request, { params }) { return dispatch(request, params); }
export async function POST(request, { params }) { return dispatch(request, params); }
export async function PUT(request, { params }) { return dispatch(request, params); }
export async function PATCH(request, { params }) { return dispatch(request, params); }
export async function DELETE(request, { params }) { return dispatch(request, params); }
