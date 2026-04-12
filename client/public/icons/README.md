# PWA Icons

This directory needs two PNG icons for the PWA manifest:

- `icon-192.png` — 192x192 pixels
- `icon-512.png` — 512x512 pixels (also used as maskable)

## Generating from SVG

Install sharp or use an online converter:

```bash
npx sharp-cli --input icon.svg --output icon-192.png --resize 192
npx sharp-cli --input icon.svg --output icon-512.png --resize 512
```

Or use https://svgtopng.com with the icon.svg in this folder.

For the hackathon demo, use any 192x192 and 512x512 PNG and name them accordingly.
The app will still work without icons — the manifest just won't show a custom icon.
