# Deploy HABI to `https://www.clientwebsitedemo.com/habi`

Panel-style host (DirectAdmin/cPanel layout: `/home/USER/htdocs/DOMAIN/`).
Everything runs on ONE URL: PWA at `/habi/`, API at `/habi/api`.

> You wrote the target dir once as `havi` — standardize on **habi** (or rename
> consistently; every path below uses `habi`).

## Target layout

```
/home/rao1983/
├── habi-backend/                                   ← Laravel (OUTSIDE htdocs, never web-visible)
│   ├── app/ bootstrap/ config/ database/ public/ routes/ storage/ vendor/ …
│   └── .env
└── htdocs/www.clientwebsitedemo.com/
    └── habi/                                       ← web folder (only public files)
        ├── .htaccess                               ← from deploy/subfolder/htaccess.txt
        ├── index.php                               ← from deploy/subfolder/index.php
        ├── index.html  assets/  sw.js  manifest.webmanifest  *.png *.svg  (Vite dist/*)
        └── storage  → symlink to /home/rao1983/habi-backend/storage/app/public
```

## Prerequisites in the control panel / SSH

| Need | Notes |
|---|---|
| PHP **8.2 or 8.3** | `php -v` over SSH. Set the domain's PHP handler version in the panel |
| PostgreSQL 12+ | **Mandatory** — the API uses PG-only syntax (`ilike`). If your panel only offers MySQL, stop and check with the host |
| SSH access | You need it for composer, artisan, symlink. (No SSH ⇒ ask host to enable it) |
| Cron | One crontab line (step 7) |

## 1. Upload the backend

Put the Laravel source at `/home/rao1983/habi-backend` **without** `vendor/`,
`node_modules/`, and **without** your local `.env`:

```bash
# from your PC
scp -r backend rao1983@SERVER:~/habi-backend        # then delete .env on server
```

## 2. Install composer dependencies (on server)

```bash
cd ~/habi-backend
composer install --no-dev --optimize-autoloader
# upload deploy/subfolder/env.example as ~/habi-backend/.env, then fill in:
#   DB creds, APP_URL, FRONTEND_URL, MAPBOX key (optional)
php artisan key:generate
```

## 3. Database

Create the Postgres DB + user in the panel (or via psql as superuser), then:

```bash
cd ~/habi-backend
php artisan migrate --force
php artisan db:seed --force      # references + ~10 demo users seeded with password "password" (see §9)
```

## 4. Build the PWA **for the subfolder** (on your PC)

```powershell
cd frontend
$env:VITE_BASE = "/habi/"
npm run build
Remove-Item Env:\VITE_BASE   # so the next dev build defaults to "/"
```

Then upload the **contents of `frontend/dist/`** into `habi/` (index.html,
assets/, sw.js, manifest.webmanifest, icons). Upload alongside them:
- `deploy/subfolder/htaccess.txt` → rename to `.htaccess` in `habi/`
- `deploy/subfolder/index.php`      → `habi/index.php`

The dev workflow is unaffected: local `npm run dev` (no VITE_BASE) still
serves from `/`.

## 5. Storage symlink (uploads: POD photos, ad images)

```bash
ln -s /home/rao1983/habi-backend/storage/app/public /home/rao1983/htdocs/www.clientwebsitedemo.com/habi/storage
```
If the host blocks the symlink, ask support to create it (or point an Apache
`Alias /habi/storage /home/rao1983/habi-backend/storage/app/public`); it cannot
be done from `.htaccess` because the backend sits outside `htdocs`.

## 6. Permissions (once, on server)

```bash
cd ~/habi-backend
mkdir -p storage/framework/{sessions,views,cache/data} storage/framework/testing bootstrap/cache
# DirectAdmin runs PHP-FPM as the panel user itself (user-user group), not 'apache':
chown -R rao1983:rao1983 storage bootstrap/cache
# (Other stacks: match your php-fpm pool user — check 'user' in the pool .conf)
```

## 7. Cron (scheduler: auto-cancel + affiliate vesting, every minute)

```
* * * * * cd /home/rao1983/habi-backend && /usr/bin/php artisan schedule:run >> /dev/null 2>&1
```
(DirectAdmin UI: Cron Jobs → add exactly this line; confirm `which php` first.)

## 8. Point /habi at the new tree

If `www.clientwebsitedemo.com/habi` previously existed, clear it first.
Then harden caches: `php artisan config:cache route:cache view:cache`.
Visit `https://www.clientwebsitedemo.com/habi/up` → 2xx means API + entry php
work; open `/habi/` → the PWA loads, login works.

## 9. Before you call it live (this codebase's gotchas)

- **Demo accounts**: `db:seed` seeds ~10 users incl. admin **`09170000001`**
  (roles 001–010) all sharing the password **`password`** — not the
  `Password123!` in `DEMO-ACCOUNTS.txt` (that only applies to the
  `MasterSeeder`/factory set used in local dev). Over a public network these
  are guessable: change or delete every seeded user **before** going live, and
  remove `DEMO-ACCOUNTS.txt` from any web path.
- **Forgot-password**: OTP is only logged (no SMS gateway wired) — real
  resets must go through staff until you connect Semaphore/Twilio.
- **GPS**: only from the rider app via `/habi/api/sync/offline-queue`;
  `orders:simulate-gps` is dev-only.
- **CORS**: same-origin, nothing to change. If later you serve the PWA from a
  different host, add its origin to `backend/config/cors.php`.
- **Maintenance mode** toggle (Admin → Settings) gates public browsing only —
  handy while you finish setup.

## Updates later

1. Local (PowerShell): `$env:VITE_BASE="/habi/"; npm run build; Remove-Item Env:\VITE_BASE`
   → upload `dist/*` → `habi/`
2. Backend: upload changed files to `habi-backend/` → `composer install --no-dev -o`
   → `php artisan migrate --force` → `php artisan config:cache route:cache view:cache`
3. The service worker (`autoUpdate`) picks up the new build on next visit.
