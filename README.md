# Fleet Tracker (front end)

Next.js 14 (App Router) + TypeScript + Leaflet + Zustand. All data is sample data for now.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Structure

```
app/(app)/layout.tsx          shared layout: top menu + page
app/(app)/page.tsx            Live tracking (map)
app/(app)/[group]/[slug]/     every menu page (/fleet/vehicles, /users/rights, ...)
components/TopNav.tsx         main menu (config in lib/pages.ts -> NAV)
components/live/*             vehicle list, map, detail sidebar, bottom vehicle table
components/DataPage.tsx       generic list + add/edit/delete page
components/RightsPage.tsx     role x page permission matrix
lib/pages.ts                  menu + columns/rows of each page
lib/data.ts, lib/store.ts     sample vehicles and selection state
```

## Next steps

- Add a page: add an entry to `NAV` and `PAGE_DEFS` in `lib/pages.ts`.
- Connect Laravel: replace `lib/data.ts` / the rows in `DataPage` with fetch calls to the API
  (put the base URL in `NEXT_PUBLIC_API_URL`). Live positions: Laravel Reverb (WebSocket) into the Zustand store.
- Map: uses OpenStreetMap tiles. For Google Maps, replace `components/live/MapView.tsx` only.
- Add login: Next.js middleware can redirect to /login when the API token cookie is missing.
