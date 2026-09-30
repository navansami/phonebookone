import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import path from 'node:path';

const dataDir = () => path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'));
const dataFile = () => path.join(dataDir(), 'phonebook.json');
let mutation = Promise.resolve();

export async function readStore() {
  try { return JSON.parse(await readFile(dataFile(), 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return { contacts: [], taxonomies: {}, suggestions: [], nextId: 1 };
  }
}

export function updateStore(update) {
  const work = mutation.then(async () => {
    const store = await readStore();
    const result = await update(store);
    await mkdir(dataDir(), { recursive: true });
    const temporary = path.join(dataDir(), `phonebook.${process.pid}.${Date.now()}.tmp`);
    await writeFile(temporary, JSON.stringify(store, null, 2), { mode: 0o600 });
    await rename(temporary, dataFile());
    return result;
  });
  mutation = work.catch(() => {});
  return work;
}

export function nextContactId(store) {
  const id = String(store.nextId || 1).padStart(4, '0');
  store.nextId = (store.nextId || 1) + 1;
  return id;
}
