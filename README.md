# PhonebookOne

One Next.js codebase for the FTP Telephone Book. The existing public directory, hotel-code screen, themes, favorites, search and filters, contact views, PWA shell and admin dashboard retain their original React components and styles. Next.js serves the API; MongoDB Atlas stores contacts, taxonomy values, suggestions and profile pictures.

## Set up

Use Node.js 20.19 or newer. In this folder:

```powershell
npm.cmd install
npm.cmd run setup
```

Open `.env.local` and set `MONGODB_URI` to your Atlas connection string. Keep this file private. `MONGODB_DATABASE` defaults to `phonebookone`. The generated admin password and hotel access code are also in `.env.local`; setup preserves existing values. Configure the Atlas database user and network access for the machine or host running Next.js.

Then import the existing local phonebook snapshot into an **empty** Atlas database:

```powershell
npm.cmd run migrate:local
npm.cmd run dev
```

Open http://127.0.0.1:3000. `migrate:local` copies `data/phonebook.json` and any referenced `data/uploads/` images, including contact IDs, taxonomy values, suggestions and the next ID. It refuses to replace a populated Atlas database. The local backup stays untouched. If the local snapshot is absent, `npm.cmd run seed` loads the bundled `seed/Telephonebook.json` into an empty database instead. That snapshot has 204 rows; six have blank names and are skipped, leaving 198 contacts. These are saved snapshots, not a live export from the old backend. Current live data can be imported through the admin CSV workflow.

An unset `MONGODB_URI` produces a clear API configuration error. Setup does not seed automatically. The app does not write contact data or images to its local filesystem during normal use.

## Code layout

- `ui/`: the original React components, pages, contexts, CSS and services. The design classes are unchanged.
- `app/[[...slug]]/`: Next.js entry for `/`, `/login` and `/admin`.
- `app/api/[...path]/`: contact, auth, taxonomy, CSV, image and suggestion endpoints.
- `lib/store.js`: MongoDB Atlas collections and transactional updates.
- `lib/images.js`: GridFS profile picture storage.
- `data/`: ignored local backup from the previous file-backed version; not used at runtime.

Admin login issues a 24-hour signed token. The hotel code creates an eight-hour HTTP-only access cookie. The admin credential, database URI and signing secret remain server-only in `.env.local`. For deployment, set the same environment variables on the server and keep the old local backup until migration is verified.

## Verification

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd test
# With `npm.cmd run start` running and Atlas configured:
node scripts/smoke.mjs http://127.0.0.1:3000
```

The API tests exercise access, auth, CRUD, filtering, flags, taxonomy, bulk edits, CSV, image delivery and suggestions using an in-memory test adapter. A live Atlas connection is needed to verify migration and persistence end to end. A connected browser was unavailable in the initial conversion, so responsive visual parity still merits a browser review.
