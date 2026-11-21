import { BSON, MongoClient } from 'mongodb';

let testStore = null;
let testMutation = Promise.resolve();

// The test adapter keeps API tests independent of a user's Atlas account.
export function setTestStore(store) { testStore = store; }

function connection() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    const error = new Error('MONGODB_URI is not configured');
    error.code = 'MONGODB_URI_MISSING';
    throw error;
  }
  const database = process.env.MONGODB_DATABASE?.trim() || 'phonebookone';
  if (!globalThis.__phonebookMongo || globalThis.__phonebookMongo.uri !== uri) {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    const ready = client.connect().catch(error => {
      if (globalThis.__phonebookMongo?.client === client) delete globalThis.__phonebookMongo;
      throw error;
    });
    globalThis.__phonebookMongo = { uri, client, ready };
  }
  return { ...globalThis.__phonebookMongo, database };
}

export async function getDatabase() {
  const { ready, database } = connection();
  const client = await ready;
  return client.db(database);
}

export async function closeDatabase() {
  const connection = globalThis.__phonebookMongo;
  delete globalThis.__phonebookMongo;
  if (connection) await connection.client.close();
}

// Imported contacts may have only a MongoDB key. Keep its BSON type so a
// string key and an ObjectId with the same hex digits address different rows.
const mongoIdPrefix = 'mongo_';
function publicContact({ _id, ...contact }) {
  if (typeof contact.id === 'string' && contact.id && !contact.id.startsWith(mongoIdPrefix)) return contact;
  const key = BSON.EJSON.stringify(_id, { relaxed: false });
  return { ...contact, id: mongoIdPrefix + Buffer.from(key).toString('base64url') };
}

function contactFilter(id) {
  if (!id.startsWith(mongoIdPrefix)) return { id };
  try {
    const key = Buffer.from(id.slice(mongoIdPrefix.length), 'base64url').toString();
    const _id = BSON.EJSON.parse(key, { relaxed: false });
    return { _id: { $eq: _id } };
  } catch {
    // Malformed external ID. Every MongoDB document has an _id.
    return { _id: { $exists: false } };
  }
}

async function loadStore(db, session) {
  const options = session ? { session } : {};
  const state = await db.collection('state').findOne({ _id: 'main' }, options);
  const contacts = await db.collection('contacts').find({}, options).toArray();
  const suggestions = await db.collection('suggestions').find({}, options).toArray();
  return {
    contacts: contacts.map(publicContact),
    taxonomies: state?.taxonomies || {},
    suggestions: suggestions.map(item => { const suggestion = { ...item }; delete suggestion._id; return suggestion; }),
    nextId: contacts.reduce((next, { id }) => {
      const number = Number(id);
      return Number.isSafeInteger(number) ? Math.max(next, number + 1) : next;
    }, state?.nextId || 1)
  };
}

export async function readStore() {
  if (testStore) return globalThis.structuredClone(testStore);
  return loadStore(await getDatabase());
}

export async function updateContactById(id, data) {
  const changes = { ...data, updated_at: new Date().toISOString() };
  if (testStore) return updateStore(store => {
    const contact = store.contacts.find(item => item.id === id);
    return contact ? Object.assign(contact, changes) : null;
  });
  const db = await getDatabase();
  const saved = await db.collection('contacts').findOneAndUpdate(
    contactFilter(id),
    { $set: changes },
    { returnDocument: 'after', timeoutMS: 8000 }
  );
  return saved && publicContact(saved);
}

async function saveChanges(collection, before, after, session) {
  const isContacts = collection.collectionName === 'contacts';
  const filterForId = isContacts ? contactFilter : id => ({ _id: id });
  const old = new Map(before.map(item => [item.id, item]));
  const current = new Set();
  for (const item of after) {
    current.add(item.id);
    if (!old.has(item.id)) {
      // A legacy document may already use this directory ID as its MongoDB key.
      const document = isContacts ? { ...item } : { ...item, _id: item.id };
      await collection.insertOne(document, { session });
    } else if (JSON.stringify(old.get(item.id)) !== JSON.stringify(item)) {
      await collection.replaceOne(filterForId(item.id), item, { session });
    }
  }
  for (const id of old.keys()) if (!current.has(id)) await collection.deleteOne(filterForId(id), { session });
}

export async function updateStore(update) {
  if (testStore) {
    const work = testMutation.then(async () => {
      const draft = globalThis.structuredClone(testStore);
      const result = await update(draft);
      testStore = draft;
      return result;
    });
    testMutation = work.catch(() => {});
    return work;
  }
  const db = await getDatabase();
  // Ensure every writer conflicts on this document, including the first writer.
  await db.collection('state').updateOne({ _id: 'main' }, { $setOnInsert: { taxonomies: {}, nextId: 1, version: 0 } }, { upsert: true });
  const { client } = connection();
  const session = client.startSession();
  try {
    return await session.withTransaction(async () => {
      const original = await loadStore(db, session);
      const draft = globalThis.structuredClone(original);
      const result = await update(draft);
      await saveChanges(db.collection('contacts'), original.contacts, draft.contacts, session);
      await saveChanges(db.collection('suggestions'), original.suggestions, draft.suggestions, session);
      await db.collection('state').updateOne({ _id: 'main' }, {
        $set: { taxonomies: draft.taxonomies, nextId: draft.nextId }, $inc: { version: 1 }
      }, { session });
      return result;
    });
  } finally { await session.endSession(); }
}

export function nextContactId(store) {
  const id = String(store.nextId || 1).padStart(4, '0');
  store.nextId = (store.nextId || 1) + 1;
  return id;
}
