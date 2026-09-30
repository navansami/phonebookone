import { readFile, writeFile } from 'node:fs/promises';

const app = JSON.parse(await readFile('.next/app-build-manifest.json', 'utf8'));
const dynamic = JSON.parse(await readFile('.next/react-loadable-manifest.json', 'utf8'));
const files = new Set(['/','/login','/admin','/favicon.ico','/site.webmanifest']);
for (const [route, assets] of Object.entries(app.pages)) if (route === '/layout' || route === '/[[...slug]]/page') {
  for (const asset of assets) files.add('/_next/' + asset);
}
for (const [key, value] of Object.entries(dynamic)) if (key.includes('ui/App.jsx')) {
  for (const asset of value.files) files.add('/_next/' + asset);
}
await writeFile('public/offline-assets.json', JSON.stringify([...files], null, 2) + '\n');
console.log(`Offline asset manifest includes ${files.size} URLs.`);
