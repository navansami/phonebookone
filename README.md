# PhonebookOne

One Next.js codebase for the FTP Telephone Book. The public directory, hotel-code screen, dark/light themes, favorites, search and filters, contact cards and modals, emergency/IFA views, offline banner, PWA shell and admin dashboard use the original React components and Tailwind styles. Next.js serves their API from the same process. No Python, MongoDB or Cloudinary process is needed for local use.

## Run locally

Use Node.js 20 or newer. In this folder:

```powershell
npm.cmd install
npm.cmd run setup
npm.cmd run dev
```

Open http://127.0.0.1:3000. `setup` creates `.env.local` with a generated admin password and hotel access code, then seeds the local store once. To see the credentials, open `.env.local` locally. The file is ignored by Git. This workspace already has a generated admin password; its hotel code is the original `H-A5F1`.

The seed snapshot at `seed/Telephonebook.json` has 204 rows. Six have blank names and fail the original server's required-name rule, so the local store contains the other **198 contacts**. The source snapshot is preserved for review. This is a file snapshot, not an export from a live MongoDB database. To migrate current live data, export it from the old server and use the admin CSV preview/import workflow. No live database credentials were available in these folders.

## One-process architecture

- `ui/`: copied client components, contexts, pages, CSS and services. Moving this directory under `ui/` avoids Next.js treating its `pages/` subfolder as a second router. The existing JSX layout and Tailwind design classes are unchanged.
- `app/[[...slug]]/`: Next.js entry for the existing client-side routes `/`, `/login` and `/admin`. BrowserRouter runs in the browser as before.
- `app/api/[...path]/`: matching contact, auth, taxonomy, CSV, image and suggestion endpoints.
- `lib/`: validation, filtering, file-backed persistence and signed admin/hotel sessions.
- `data/`: writable local store and uploads. This directory is ignored by Git. Writes are serialized within one Node process and replaced atomically.
- `public/sw.js`: offline caching of the app shell and successful directory reads.

Admin login issues a 24-hour signed token. The hotel code creates an eight-hour HTTP-only access cookie. The React login and hotel-code screens retain their original appearance. The admin credential and signing secret remain server-only in `.env.local`.

The app must run as **one persistent Node.js process with a writable `DATA_DIR`**. The JSON store is not suitable for multiple app instances or an ephemeral serverless filesystem; migrate `lib/store.js` to a shared database before deploying that way. Back up `data/phonebook.json` and `data/uploads/` together. Protect the seed snapshot if the directory contains private staff information.

## Verification

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd test
# With `npm.cmd run start` running in another terminal:
node scripts/smoke.mjs http://127.0.0.1:3000
```

The API tests cover access, admin authentication, CRUD, filtering, flags, taxonomy, bulk edits, CSV preview/import, image upload and suggestions without touching the seeded contacts. A connected browser was unavailable in this session, so visual parity and responsive interaction checks still need a browser review before replacing the existing app.
