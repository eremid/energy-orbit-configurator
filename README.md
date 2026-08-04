# Energy Orbit Configurator

Live at: [https://eremid.github.io/energy-orbit-configurator/](https://eremid.github.io/energy-orbit-configurator/)

A web application to generate a configuration QR code for the Energy Orbit Apple Watch app.

## Features
- Configure Home Assistant entities for Solar, Battery, and Grid.
- Set peak power values — they scale the gauges on the watch.
- Watch preview: see what the three watch views will look like with your configuration.
- Optional: Store HA URL and Access Token (all processed locally in the browser).
- Privacy-first: No data is sent to any server. Fonts are self-hosted and the
  page ships a CSP with `connect-src 'none'`, so nothing can leave the browser.
- Instant QR Code generation, downloadable as a PNG.
- Import and copy the configuration as JSON.
- French and English.

## Design

The interface follows the shared Energy Orbit identity (`EnergyPalette`), where
colour carries meaning rather than decoration:

| Colour    | Meaning                                    |
| --------- | ------------------------------------------ |
| `#FFCC00` | Solar — production, totals, peak           |
| `#AF52DE` | House & grid — what consumes, what is drawn |
| `#01B3FB` | Battery — charge, power, autonomy           |
| `#30D158` | Good news — self-sufficient, surplus        |
| `#0D0F14` | Background (`#07080B` for input wells)     |

Type is Nunito for everything measured and JetBrains Mono for identifiers, JSON
and URLs. Tokens live in [`src/index.css`](src/index.css).

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
