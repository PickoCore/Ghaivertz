# Ghaivert

> Free, browser-based Minecraft resource pack converter — ItemsAdder ↔ Nexo ↔ Oraxen

**Live:** [ghaivert.vercel.app](https://ghaivert.vercel.app)

## Features
- ✅ ItemsAdder → Nexo
- ✅ Nexo → ItemsAdder  
- ✅ Oraxen → ItemsAdder
- 📦 Full pack conversion: YML configs + asset file structure
- 🔒 100% browser-based, zero upload
- ⚙️ Version-aware (IA 4.0.x, Nexo 0.3–0.7, Oraxen 1.16–2.0)

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy (Vercel)

```bash
npx vercel --prod
```

Or connect your GitHub repo to Vercel and it auto-deploys.

## Project Structure

```
src/
  app/
    page.tsx          # Homepage
    convert/page.tsx  # Main converter UI
    about/page.tsx    # About & field mappings
  lib/
    types.ts          # TypeScript interfaces
    versions.ts       # Plugin version registry
    converters/
      index.ts        # Orchestrator
      ia-parser.ts    # ItemsAdder ZIP parser
      ia-to-nexo.ts   # IA → Nexo
      nexo-to-ia.ts   # Nexo → IA
      oraxen-to-ia.ts # Oraxen → IA
  components/
    shared/
      Navbar.tsx
```

## Conversion Notes

Fields that **cannot** be auto-converted (require manual migration):
- `behaviours` (furniture, machinery) — plugin-specific
- `events` — different systems per plugin
- `specific_properties` — use target plugin's equivalent
- `nbt` — use Components (Nexo) or item properties (IA)

## Credits

Built by [ghaa](https://ghaa.my.id) — part of the NusaLife ecosystem.
