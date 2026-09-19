# Worklog

## RESTORE-1 — Restoration of lost Euro Voice components (2025)

### Task
Sandbox restart caused several Euro Voice radio component files to be lost.
This task recreates them, updates existing files, and adds the missing API
routes + Prisma schema fields needed to support them.

### Files created
- `src/components/album-art.tsx`
  Album cover image with a vinyl record effect. Falls back to `VinylDisc`
  when no `coverUrl` is set. Uses unique SVG ids per color to avoid
  conflicts when multiple discs are rendered on the same page.
- `src/components/search-bar.tsx`
  Debounced (300ms) search input with a dropdown of matching songs. Calls
  `/api/search?q=...`, shows loading spinner, closes on outside click, and
  on result click loads the song in its station via
  `playSongFromSearch(stationId, songId)`.
- `src/components/reaction-buttons.tsx`
  Three buttons (like / heart / dislike) with optimistic updates and
  count formatting (`999`, `1.5K`). Pulls `sessionId` from
  `localStorage["eurovoice_session_id"]`. Heart icon fills when active.
- `src/components/support-dialog.tsx`
  Donation dialog in Spanish. Shows monthly goal progress bar, 4 tiers
  (€1/€3/€5/€10) + custom link, "what your contribution helps" section,
  "free for all" message. Tier click shows a thank-you screen with the
  Ko-fi link (does NOT auto-open — user clicks the link manually).
- `src/components/still-listening-prompt.tsx`
  Toast that appears after 30 min of accumulated active play time. Only
  shows once per session (`sessionStorage`). Fixed bottom-right above the
  player (`bottom-24`).
- `src/lib/download-cover.ts`
  `downloadYouTubeCover(url)` — tries `maxresdefault` → `hqdefault` →
  `mqdefault`, saves to `public/covers/{videoId}.jpg`, returns the
  relative URL or null. Never throws.

### Files updated
- `src/components/sticky-player.tsx`
  - Replaced `VinylDisc` import with `AlbumArt` (with
    `coverUrl={currentSong?.coverUrl}`).
  - Added `ReactionButtons` import; rendered twice (hidden on mobile next
    to song info, and below the mobile progress bar with `md:hidden`).
  - YouTube button already present (uses `normalizeYouTubeUrl`).
- `src/app/page.tsx`
  - Added imports: `SearchBar`, `SupportDialog`, `StillListeningPrompt`,
    `Heart`, `SearchX`, `useCallback`.
  - Added state: `supportOpen`, `matchingStationIds`, `searchQuery`.
  - Added `handleSearchResults` callback to wire `SearchBar` to the grid.
  - Added "Apoya" button in the header (pink, icon-only on mobile).
  - Added `SearchBar` section between hero and stations grid.
  - Grid now uses `filteredStations`; empty-search state shows `SearchX`.
  - "¿Cómo funciona?" section hidden on mobile (`hidden md:block`).
  - Mobile padding/sizes already adjusted (`px-3 py-6` on hero,
    `text-3xl` for hero h2 on mobile).
  - Added `<SupportDialog>` and `<StillListeningPrompt>` at the bottom.
- `prisma/schema.prisma`
  - Added `likes`, `hearts`, `dislikes` to `Song` (with indexes).
  - Added `SongReaction` model with `@@unique([sessionId, songId])`.
- `src/lib/db.ts`
  - Added a `SCHEMA_VERSION` tag to invalidate the cached `PrismaClient`
    instance when the schema changes (avoids "unknown argument" runtime
    errors after `prisma generate` in dev).
- `.env`
  - Added `KO_FI_URL`, `SUPPORT_GOAL_EUR`, `SUPPORT_RAISED_EUR`.

### API routes created
- `src/app/api/search/route.ts` — GET `/api/search?q=...`. Searches
  songs by title/artist, returns matches with station info.
- `src/app/api/songs/[id]/react/route.ts` — GET returns counts + the
  caller's `userReaction`; POST toggles/replaces the caller's reaction
  (transactional, keeps denormalized counters in sync).
- `src/app/api/support/settings/route.ts` — GET returns Ko-fi URL,
  goal, raised, current month name (in Spanish).
- `src/app/api/admin/process-covers/route.ts` — POST (admin-only).
  Iterates songs with `youtubeUrl` but no `coverUrl`, downloads the
  YouTube thumbnail via `downloadYouTubeCover`.
- `src/app/api/stations/[id]/cover/route.ts` — GET returns the cover
  URL of the most-played song in the station (or null).
- `src/app/api/stats/reactions/route.ts` — GET returns top
  liked/hearted/disliked songs.

### Verification
- `bun run db:push` — schema synced (likes/hearts/dislikes + SongReaction
  table created). Prisma client regenerated.
- `bun run lint` — clean (0 errors, 0 warnings).
- Dev server restarted to pick up new Prisma client (the existing in-memory
  client had the old schema cached). After restart:
  - `GET /` → 200 (page renders "Apoya", "Emisoras disponibles", search bar).
  - `GET /api/search?q=...` → 200, returns matching songs.
  - `GET /api/songs/[id]/react` → 200, returns counts + userReaction.
  - `POST /api/songs/[id]/react` → 200, toggles/replaces correctly
    (verified with a test session).
  - `GET /api/support/settings` → 200, returns Ko-fi URL + goal + raised.
  - `POST /api/admin/process-covers` → 401 without admin session (correct).
  - `GET /api/stations/[id]/cover` → 200 (null cover for stations without
    one) / 404 for unknown station id.
  - `GET /api/stats/reactions` → 200, returns top liked/hearted/disliked.

### Notes
- The dev server's `PrismaClient` was cached in `globalThis.prisma` from
  before the schema change. After `prisma generate`, the in-memory client
  still used the old runtime dataModel and rejected queries referencing
  `likes`/`hearts`/`dislikes`. Fixed by:
  1. Adding a `SCHEMA_VERSION` constant in `src/lib/db.ts` that, when
     bumped, drops the cached instance so the next import builds a fresh
     one from the regenerated client.
  2. Restarting the dev server so the Node module cache re-imports
     `@prisma/client` from the newly-generated `.prisma/client/index.js`.
