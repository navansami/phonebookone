import { FMC_NETWORK_PROVIDERS } from '../seed/fmcNetworkData.js';
import { getDatabase, closeDatabase } from '../lib/store.js';

try {
  if (!process.env.MONGODB_URI?.trim()) throw new Error('Set MONGODB_URI in .env.local before importing the FMC network');
  const db = await getDatabase();
  const collection = db.collection('fmc_network_providers');
  if (new Set(FMC_NETWORK_PROVIDERS.map(provider => provider.id)).size !== FMC_NETWORK_PROVIDERS.length) {
    throw new Error('FMC network snapshot contains duplicate provider IDs');
  }

  const result = await collection.bulkWrite(FMC_NETWORK_PROVIDERS.map(provider => ({
    updateOne: { filter: { _id: provider.id }, update: { $setOnInsert: provider }, upsert: true }
  })), { ordered: false });
  console.log(`Imported ${result.upsertedCount} new FMC providers; ${FMC_NETWORK_PROVIDERS.length - result.upsertedCount} already existed.`);
} finally {
  await closeDatabase();
}
