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