import { GridFSBucket } from 'mongodb';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { getDatabase } from './store.js';

let testImages = null;
export function setTestImages(images) { testImages = images; }

export async function saveImage(filename, bytes, type) {
  if (testImages) { testImages.set(filename, { bytes, type }); return; }
  const bucket = new GridFSBucket(await getDatabase(), { bucketName: 'profile_images' });
  await pipeline(Readable.from([bytes]), bucket.openUploadStream(filename, { metadata: { type } }));
}

export async function readImage(filename) {
  if (testImages) return testImages.get(filename) || null;
  const db = await getDatabase();
  const file = await db.collection('profile_images.files').findOne({ filename }, { sort: { uploadDate: -1 } });
  if (!file) return null;
  const bucket = new GridFSBucket(db, { bucketName: 'profile_images' });
  const chunks = [];
  for await (const chunk of bucket.openDownloadStream(file._id)) chunks.push(chunk);
  return { bytes: Buffer.concat(chunks), type: file.metadata?.type || 'application/octet-stream' };
}
