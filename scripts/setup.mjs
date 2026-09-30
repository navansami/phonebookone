import { existsSync } from 'node:fs';
import { readFile, writeFile, appendFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';

if (existsSync('.env.local')) {
  const existing = await readFile('.env.local', 'utf8');
  const additions = [];
  if (!/^MONGODB_URI=/m.test(existing)) additions.push('MONGODB_URI=');
  if (!/^MONGODB_DATABASE=/m.test(existing)) additions.push('MONGODB_DATABASE=phonebookone');
  if (additions.length) await appendFile('.env.local', `${existing.endsWith('\n') ? '' : '\n'}${additions.join('\n')}\n`);
  console.log('Existing .env.local kept; MongoDB settings added if missing.');
} else {
  const password = randomBytes(18).toString('base64url');
  const secret = randomBytes(48).toString('base64url');
  const hotelCode = `H-${randomBytes(2).toString('hex').toUpperCase()}`;
  await writeFile('.env.local', `ADMIN_USERNAME=admin\nADMIN_PASSWORD=${password}\nSESSION_SECRET=${secret}\nHOTEL_ACCESS_CODE=${hotelCode}\nMONGODB_URI=\nMONGODB_DATABASE=phonebookone\n`, { mode: 0o600 });
  console.log('Created .env.local with local admin and hotel credentials. Open the file to view them.');
}
