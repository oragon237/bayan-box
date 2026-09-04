# Deploy HABI to a live Ubuntu VPS

Target layout, matching the artifacts in this folder (`deploy/`):

```
/var/www/habi
├── backend/     Laravel API  (becoolbox.app/api, /up, /storage)
├── frontend/    built PWA    (becoolbox.app  — Vite dist output)
└── certbot/     ACME http-01 challenge root (optional webroot mode)
```

One domain, same origin: the PWA calls `/api` on the same host, so **no CORS
changes are needed** — `config/cors.php` already whitelists `https://becoolbox.app`
and `config/app.php` auto-disables debug + stack traces on the live domain.

Assumes **Ubuntu 24.04 LTS**, 2+ vCPU / 2 GB RAM, root access, DNS A record for
`becoolbox.app` + `www.becoolbox.app` pointing at the server IP.

---

## 1. Base system

```bash
apt update && apt -y upgrade
apt -y install nginx postgresql-16 redis-server php8.3-fpm php8.3-cli \
  php8.3-pgsql php8.3-redis php8.3-mbstring php8.3-xml php8.3-curl \
  php8.3-zip php8.3-intl php8.3-gd php8.3-bcmath unzip git certbot python3-certbot-nginx
# Composer
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
# Node 20 (frontend build can run locally instead — see §6)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt -y install nodejs
ufw allow 'Nginx Full' && ufw allow OpenSSH && ufw --force enable
```

## 2. Database

```bash
sudo -u postgres psql -c "CREATE ROLE habi LOGIN PASSWORD 'CHANGE_ME_strong_unique';"
sudo -u postgres psql -c "CREATE DATABASE habi OWNER habi;"
```
(Keep `DB_CONNECTION=pgsql` — the migrations are Postgres-tested; `ilike` is used.)

## 3. Code

```bash
mkdir -p /var/www/habi && chown www-data:www-data /var/www/habi
git clone <your-repo-url> /tmp/habi
rsync -a --exclude .env --exclude node_modules --exclude vendor /tmp/habi/backend/ /var/www/habi/backend/
cd /var/www/habi/backend
composer install --no-dev --optimize-autoloader
cp /path/to/repo/deploy/env.production.example .env   # then fill secrets
php artisan key:generate
```

Use a **fresh** `APP_KEY` — do not reuse the dev key. Generate a unique
`DB_PASSWORD`, paste real tokens for `MAPBOX_ACCESS_TOKEN` / `ORS_API_KEY`.

## 4. Migrate, seed, storage

```bash
cd /var/www/habi/backend
php artisan migrate --force
php artisan db:seed --force        # references + ~10 users incl. admin @ password "password" — see §9
php artisan storage:link           # serves /storage for POD photos, ad images
chown -R www-data:www-data storage bootstrap/cache
php artisan config:cache && php artisan route:cache && php artisan view:cache
```

> The admin account (`09170000001` "HABI Admin") is created by `db:seed` with
> password **`password`** (`backend/database/seeders/DatabaseSeeder.php:20`),
> alongside demo users `09170000001–010` (same password). `bayanbox:demo`
> (`routes/console.php`) is just an alias for `db:seed --class=DatabaseSeeder`.
> `DEMO-ACCOUNTS.txt`'s `Password123!` only applies to the `MasterSeeder`/
> factory set used in local dev. On a public host, change or delete every one
> of them (§9) and never ship `DEMO-ACCOUNTS.txt`.

## 5. Nginx + TLS

The vhost file references the certificate paths, so issue certs FIRST via a
temporary HTTP-only bootstrap config (enabling the real vhost before the certs
exist would fail `nginx -t`):

```bash
mkdir -p /var/www/habi/certbot
tee /etc/nginx/sites-enabled/habi-bootstrap <<'EOF'
server {
    listen 80;
    server_name becoolbox.app www.becoolbox.app;
    location ^~ /.well-known/acme-challenge/ { root /var/www/habi/certbot; }
}
EOF
nginx -t && systemctl reload nginx
certbot certonly --webroot -w /var/www/habi/certbot -d becoolbox.app -d www.becoolbox.app
rm /etc/nginx/sites-enabled/habi-bootstrap
cp deploy/nginx.becoolbox.app.conf /etc/nginx/sites-available/habi
ln -s /etc/nginx/sites-available/habi /etc/nginx/sites-enabled/habi
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

## 6. Frontend (PWA)

```bash
cd /tmp/habi/frontend
npm ci
npm run build                # VITE_API_URL unset → API base defaults to /api (same origin)
mkdir -p /var/www/habi/frontend
rsync -a dist/ /var/www/habi/frontend/
```
The build emits `index.html`, `assets/`, `sw.js`, `manifest.webmanifest` — ship
ALL of them or offline/PWA install breaks. HTTPS is mandatory for service
workers — already covered by certbot.

## 7. Background jobs

Scheduler (order auto-cancel/reassign + affiliate 72h vesting, both every minute):

```bash
(crontab -u www-data -l; echo "* * * * * cd /var/www/habi/backend && php artisan schedule:run >> /dev/null 2>&1") | crontab -u www-data -
```

Queue worker (persistent, survives reboots):

```bash
cp deploy/systemd/habi-queue@.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now habi-queue@1   # add @2, @3 to run more concurrent workers
```

## 8. Verify (post-deploy checklist)

- `curl -s https://becoolbox.app/up` → 2xx (framework health)
- Open the site on a phone → installable via "Add to Home Screen"
- Log in as a demo account → place a delivery order → staff (`/staff/ops/dispatch`)
  auto-assigns → rider advances states → customer `/orders/{id}/track` live GPS + ETA
- Staff Finance: record a rider cash remittance → rider dashboard **Cash on Hand** drops to ₱0
- Bell notifications + sound fire (30 s poll)
- Uploads: a POD photo taken in the rider app renders from `/storage/...`
- `sudo -u www-data php artisan queue:monitor redis` → no failed jobs:
  `php artisan queue:retry all` if any

## 9. Updates (repeat deploy)

```bash
rsync -a --delete --exclude .env --exclude storage --exclude node_modules \
      --exclude vendor new_backend/ /var/www/habi/backend/
cd /var/www/habi/backend && composer install --no-dev -o \
  && php artisan migrate --force \
  && php artisan config:cache route:cache view:cache \
  && systemctl restart habi-queue@1
rsync -a new_frontend/dist/ /var/www/habi/frontend/
```
`--delete` keeps old hashed assets out of the PWA cache path; the service worker
(`autoUpdate`) picks the new version on next visit.

## 10. Known production gaps (decide before launch)

| Gap | Where | Action |
|---|---|---|
| Forgot-password OTP has **no SMS/email sender** — code only lands in `storage/logs` and is surfaced in the response while `APP_DEBUG` is on (live: forced off) | `AuthController::forgotPassword` | Wire Semaphore/Twilio before launch, or keep "Contact staff to reset" |
| Rider GPS only arrives via `POST /api/sync/offline-queue` from the rider device | `OfflineSyncController` | Confirm the rider app points at the prod URL; `php artisan orders:simulate-gps` is dev-only — do NOT run it on prod |
| No rate limiting issues expected, but Sanctum tokens expire at `1440` min | `config/sanctum.php` | Tune session lifetime if needed |
| Backups | — | `pg_dump` nightly + rsync `storage/app/public` (photos are business records) |
