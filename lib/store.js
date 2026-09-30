import { MongoClient } from 'mongodb';

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

async function loadStore(db, session) {
  const options = session ? { session } : {};
  const state = await db.collection('state').findOne({ _id: 'main' }, options);
  const contacts = await db.collection('contacts').find({}, options).toArray();
  const suggestions = await db.collection('suggestions').find({}, options).toArray();
  return {
    contacts: contacts.map(item => { const contact = { ...item }; delete contact._id; return contact; }),
    taxonomies: state?.taxonomies || {},
    suggestions: suggestions.map(item => { const suggestion = { ...item }; delete suggestion._id; return suggestion; }),
    nextId: state?.nextId || Math.max(0, ...contacts.map(contact => Number.parseInt(contact.id, 10) || 0)) + 1
  };
}

export async function readStore() {
  if (testStore) return globalThis.structuredClone(testStore);
  return loadStore(await getDatabase());
}

async function saveChanges(collection, before, after, session) {
  const old = new Map(before.map(item => [item.id, item]));
  const current = new Set();
  for (const item of after) {
    current.add(item.id);
    if (JSON.stringify(old.get(item.id)) !== JSON.stringify(item)) {
      await collection.replaceOne({ _id: item.id }, { ...item, _id: item.id }, { upsert: true, session });
    }
  }
  for (const id of old.keys()) if (!current.has(id)) await collection.deleteOne({ _id: id }, { session });
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
