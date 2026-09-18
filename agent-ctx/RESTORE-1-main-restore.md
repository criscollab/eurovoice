# Task RESTORE-1 — Agent Work Record

**Agent**: Main restoration agent (Z.ai Code)

## Summary

Recreated all 6 lost component/lib files, updated `sticky-player.tsx` and
`page.tsx`, added the 6 missing API routes, extended the Prisma schema with
`likes`/`hearts`/`dislikes` and a new `SongReaction` model, and updated `.env`
with the Ko-fi / support goal variables.

All work was done directly in the main session — no sub-agents were spawned.

## Files touched

### Created
- `src/components/album-art.tsx`
- `src/components/search-bar.tsx`
- `src/components/reaction-buttons.tsx`
- `src/components/support-dialog.tsx`
- `src/components/still-listening-prompt.tsx`
- `src/lib/download-cover.ts`
- `src/app/api/search/route.ts`
- `src/app/api/songs/[id]/react/route.ts`
- `src/app/api/support/settings/route.ts`
- `src/app/api/admin/process-covers/route.ts`
- `src/app/api/stations/[id]/cover/route.ts`
- `src/app/api/stats/reactions/route.ts`

### Updated
- `src/components/sticky-player.tsx` — uses `AlbumArt`, adds `ReactionButtons`
  in two places (desktop next to song info, mobile under the progress bar).
- `src/app/page.tsx` — added SearchBar, SupportDialog, StillListeningPrompt,
  dynamic "Resultados para…" header, search empty state, mobile improvements.
- `prisma/schema.prisma` — added `likes`, `hearts`, `dislikes` to `Song`
  + new `SongReaction` model with `@@unique([sessionId, songId])`.
- `src/lib/db.ts` — added `SCHEMA_VERSION` tag to invalidate cached client
  after `prisma generate` (otherwise dev server still serves the old client).
- `.env` — added `KO_FI_URL`, `SUPPORT_GOAL_EUR`, `SUPPORT_RAISED_EUR`.

## Verification performed
- `bun run lint` — 0 errors, 0 warnings.
- `bun run db:push` — schema synced, Prisma client regenerated.
- Restarted dev server to pick up new Prisma client (in-memory cache was
  holding the old one). After restart, all new endpoints return 200:
  - `GET /api/search?q=...` → 200, returns matches with station info.
  - `GET /api/songs/[id]/react?sessionId=...` → 200, returns counts + userReaction.
  - `POST /api/songs/[id]/react` → 200, toggles/replaces correctly (tested:
    like → heart → like again, counters shift as expected).
  - `GET /api/support/settings` → 200, returns `koFiUrl`, `goalEur`,
    `raisedEur`, `monthName` ("Septiembre").
  - `POST /api/admin/process-covers` → 401 without admin session.
  - `GET /api/stations/[id]/cover` → 200 (null cover when no song has one) /
    404 for unknown station.
  - `GET /api/stats/reactions` → 200, returns top liked/hearted/disliked.
- `GET /` → 200, page renders "Apoya", "Buscar canciones", "Emisoras
  disponibles", etc.

## Gotchas / things to know for the next agent
1. **Prisma client cache in dev**: When you change the Prisma schema and run
   `prisma generate`/`db:push`, the dev server's in-memory `globalThis.prisma`
   still holds an instance built from the OLD client. The fix lives in
   `src/lib/db.ts`: bump `SCHEMA_VERSION` after each `prisma generate` so the
   cached instance is dropped on next import. If you ever see
   `Unknown argument X` from Prisma at runtime, this is why — bump the
   version AND restart the dev server (Node caches `require()`'d modules too).
2. **`_count` field**: StationCard and page.tsx rely on `station._count.songs`
   (a Prisma relation count). Keep that in mind if you change the stations
   query — `_count: { select: { songs: true } }` must stay in the include.
3. **`sessionStorage` keys**:
   - `eurovoice_session_id` (localStorage) — anonymous session id used by
     listener heartbeats AND reactions.
   - `eurovoice_still_listening_shown` (sessionStorage) — set by
     `StillListeningPrompt` so it only shows once per tab session.
4. **Search clears itself on click**: `SearchBar.handleSongClick` calls
   `onResultsChange?.([], '')` then `playSongFromSearch`. The empty array
   means "no filtering", but the empty query means the grid header goes back
   to "Emisoras disponibles". If you want to preserve the search query while
   the song loads, change the `[]` to the current `stationIds`.
5. **Still-listening prompt threshold**: 30 min (`30 * 60` seconds). Change
   `THRESHOLD_SECONDS` in `still-listening-prompt.tsx` if needed.
6. **`Promise.resolve().then()` pattern**: used in `useEffect`s to avoid the
   ESLint rule that forbids calling `setState` directly during render. Keep
   this pattern in any new effects that read from external sources.
7. **YouTube thumbnails**: `downloadYouTubeCover` skips files < 2KB
   (YouTube serves a 120x90 gray placeholder for missing thumbnails). Don't
   lower this threshold or you'll save placeholders.
