# Arscon Valves Procurement Portal

A responsive B2B product catalogue and request-for-quotation portal for Arscon Valves Co. L.L.C. The frontend is served by the included Node.js server and uses a local SQLite database seeded with sample catalogue data.

## Run locally

Use Node.js 22.5 or newer (Node.js 24 recommended), then run:

```powershell
node server.js
```

Open [http://127.0.0.1:3001](http://127.0.0.1:3001). VS Code also has a **Run Arscon procurement portal** task. The database is created at `data/arscon.sqlite` on first start.

## Team access

Administrative routes are disabled until a server-side bearer token is set. In PowerShell, set a private token before starting the server:

```powershell
$env:ARSCON_ADMIN_TOKEN = [guid]::NewGuid().ToString('N')
node server.js
```

Keep the token in the deployment environment, not in source control. Team members enter it using **Team access**; it is held only for that browser session. Without the token, team routes return `503`.

## Current scope

The working portal includes searchable and filterable product data, specification views and downloadable PDF data sheets, a persistent browser-side quote list, RFQ submission with technical attachments, and a token-protected enquiry dashboard with status updates and secure attachment retrieval. Official contact details were not included in the brief and should be added after confirmation.

The included SQLite service is a local starter implementation, not an architecture validated for 500,000 concurrent users. Before production deployment, replace or migrate the local database for the hosting environment, add customer authentication and the required team roles, configure transactional email, use private object storage with file scanning, and implement production-grade monitoring, backups, rate limiting and load testing. Company-specific product photography and independently verified technical specifications should also replace the sample data and generic industrial imagery.

## GitHub

The source is connected to [drabdulbasid/juned-arscon](https://github.com/drabdulbasid/juned-arscon) on the `main` branch. `.gitignore` excludes the local database, secrets and workspace task file. The supplied business profile, prompt documents and generated local datasheet were not included in the repository.

## Hostinger VPS deployment

### Hostinger Web App

The Hostinger Web App is deployed at `https://valves.drabdulbasid.com`; the existing root-domain website remains untouched. The initial deployment used a ZIP upload because the GitHub repository picker did not advance. This does not auto-deploy when GitHub changes.

To make an updated upload from the project root in PowerShell, run:

```powershell
Compress-Archive -Path index.html,server.js,package.json,arscon-hero-clean.png -DestinationPath arscon-hostinger-upload.zip -Force
```

In hPanel, upload that ZIP to the existing Web App and deploy it. Do not include `data/` or secrets in the archive. The current app stores SQLite under its app `data` directory; back it up and confirm Hostinger preserves that directory before redeploying or accepting real RFQs. Hostinger Daily Backup should be confirmed to cover the Web App's SQLite file.

For future GitHub auto-deploys, the hPanel flow is:

1. In hPanel, open **Websites → Add Website → Deploy Web App** and choose GitHub.
2. Authorize Hostinger to access `drabdulbasid/juned-arscon`, then select the `main` branch.
3. Select Node.js 22.5 or newer, use `npm start` as the start command, and leave the build command empty.
4. Add environment variables in the app settings: `NODE_ENV=production` and `ARSCON_ADMIN_TOKEN` set to a long random secret generated/stored in hPanel. Do not commit the token.
5. Assign a new subdomain, `valves.drabdulbasid.com`. If hPanel warns that an existing website must be removed to use a domain, stop and choose the new subdomain instead; do not replace the current root site.
6. Deploy, then verify `/api/health` and submit a test RFQ. Confirm with Hostinger support that the app's `data` directory is writable and retained across deployments/restores before accepting customer inquiries; `ARSCON_DATA_DIR` can point to another persistent writable directory if Hostinger provides one.

The app binds to `0.0.0.0` when `NODE_ENV=production` and uses Hostinger's `PORT` environment variable. The local development default remains `127.0.0.1`. Hostinger's Daily Backup should be confirmed to include the Web App files and its SQLite data, not just the existing website. The portal currently provides local PDF downloads only; it does not send RFQ email notifications.

### VPS alternative

The example configuration deploys to `valves.drabdulbasid.com` and leaves the root domain unchanged. Add an A record for `valves` in Hostinger DNS pointing to the VPS IPv4 address. Do not change the root (`@`) record. Allow inbound ports 22, 80 and 443 in the Hostinger VPS firewall; the Node port stays private behind Nginx.

Connect to the VPS using your own terminal, install Node.js 24, Git, Nginx and Certbot, then run:

```sh
sudo useradd --system --home /opt/arscon --shell /usr/sbin/nologin arscon
sudo install -d -o arscon -g arscon /var/lib/arscon /etc/arscon
sudo git clone --branch main --depth 1 https://github.com/drabdulbasid/juned-arscon.git /opt/arscon
sudo chown -R root:arscon /opt/arscon
sudo install -m 644 /opt/arscon/deploy/arscon.service /etc/systemd/system/arscon.service
```

Create the private service environment and generate its admin token on the VPS (the token is written directly to the root-only service configuration, not printed):

```sh
sudo sh -c 'printf "HOST=127.0.0.1\nPORT=3001\nARSCON_DATA_DIR=/var/lib/arscon\nARSCON_ADMIN_TOKEN=%s\n" "$(openssl rand -hex 32)" > /etc/arscon/arscon.env'
sudo chown root:arscon /etc/arscon/arscon.env
sudo chmod 640 /etc/arscon/arscon.env
sudo install -d /etc/nginx/sites-available /etc/nginx/sites-enabled
sudo install -m 644 /opt/arscon/deploy/nginx-valves.conf /etc/nginx/sites-available/arscon
sudo ln -sfn /etc/nginx/sites-available/arscon /etc/nginx/sites-enabled/arscon
sudo nginx -t && sudo systemctl enable --now arscon
sudo systemctl reload nginx
sudo certbot --nginx -d valves.drabdulbasid.com
```

The database persists in `/var/lib/arscon` across code updates. After DNS has resolved to the VPS and the first deployment is running, update with `cd /opt/arscon && sudo git pull --ff-only && sudo systemctl restart arscon`. Confirm the public site and RFQ flow after deployment. This starter still needs production review for customer-data retention, upload scanning, backups, rate limiting, monitoring and email delivery before accepting real business inquiries.