# Energy Orbit Configurator

A web application to generate a configuration QR code for the Energy Orbit Apple Watch app.

## Features
- Configure Home Assistant entities for Grid, Solar, and Battery.
- Set maximum power values for orbit calculations.
- Optional: Store HA URL and Access Token (all processed locally in the browser).
- Privacy-first: No data is sent to any server.
- Instant QR Code generation.
- Download QR Code as PNG.

## Deployment to GitHub Pages

1. Create a new repository on GitHub named `energy-orbit-configurator`.
2. Initialize git in this folder:
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/energy-orbit-configurator.git
   git push -u origin main
   ```
3. Enable GitHub Pages in your repository settings:
   - Go to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.

The repository already includes a GitHub Action to automatically deploy the site.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
