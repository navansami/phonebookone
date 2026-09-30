import { getDatabase } from './store.js';

let testProviders = null;
export function setTestFmcProviders(providers) { testProviders = providers; }

export async function getFmcProviders() {
  if (testProviders) return globalThis.structuredClone(testProviders);
  const db = await getDatabase();
  return db.collection('fmc_network_providers')
    .find({}, { projection: { _id: 0 } })
    .sort({ id: 1 })
    .toArray();
}
