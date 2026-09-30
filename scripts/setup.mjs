import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';

if (existsSync('.env.local')) {
  console.log('Existing .env.local kept.');
} else {
  const password = randomBytes(18).toString('base64url');
  const secret = randomBytes(48).toString('base64url');
  const hotelCode = `H-${randomBytes(2).toString('hex').toUpperCase()}`;
  await writeFile('.env.local', `ADMIN_USERNAME=admin\nADMIN_PASSWORD=${password}\nSESSION_SECRET=${secret}\nHOTEL_ACCESS_CODE=${hotelCode}\nDATA_DIR=./data\n`, { mode: 0o600 });
  console.log('Created .env.local with local admin and hotel credentials. Open the file to view them.');
}
