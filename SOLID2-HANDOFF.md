# Solid 2 Migration Handoff

Updated 2026-10-13. A working note for continuing the migration. Remove it before #174 leaves draft (it was removed once in 88cc5a2; the previous long version is in bcff012).

## State

- Branch `solid2` on devagrawal09/solidbase. Draft PR: https://github.com/kobaltedev/solidbase/pull/174. The branch is level with upstream main (merge-base f34c043).
- Pins: solid-js and @solidjs/web 2.0.0-rc.14, @solidjs/router 2.0.0-next.37, @solidjs/vite-plugin 3.0.0-next.47, @solidjs/meta 1.0.0-next.2, @kobalte/core 2.0.0-alpha.2, Vite 8.
- Last verified at 88cc5a2:
  - `pnpm test`: 130/130.
  - `pnpm build`: tsc and library build both pass.
  - Biome is clean.
  - dev build: 15 pages + 404.html.
  - docs build: 41 pages + 404.html, 0 skipped links.

## Constraints

- The user is the PR author, not a SolidBase maintainer. Release decisions belong to the maintainers (jer3m01): merge timing, versioning, dist-tags, dependency policy. Raise them in #174; don't decide them.
- Keep changes minimal and avoid compatibility shims. Don't commit temporary runtime patches.
- Don't add new test files; modifying existing tests is fine. Keep repro apps outside the repo.
- Commit as Dev Agrawal <devagrawal09@gmail.com>, using `git -c user.name=… -c user.email=…` if the container's identity differs.
- Never merge, publish, or post to repos outside devagrawal09/solidbase. The session cannot write to kobaltedev/* or solidjs/*, so the user posts comments and issues.
- REPL integration (#173) is excluded from this branch.

## Done this session

- b5e90a6 and bcff012 fix Back/Forward rendering the stale page in production when returning to the route the document hydrated on. Cause:
  - Solid's hydration re-runs async memos with the global `Promise` stubbed.
  - Page-data called the route's `lazy().preload()` inside that compute.
  - `lazy()` cached a never-settling promise.
  - The page-data window cache never hit, because modules registered under absolute paths while the router's `moduleUrl` is root-relative.

  Fix: register under the Vite-root-relative path, and add `await undefined` before `preload()`. `await` uses the intrinsic Promise; `await Promise.resolve()` would hit the stub. On the server, `moduleUrl` is the client asset URL, so don't key logic on its file extension.
- 7aee00e fixes the six broken docs links, and page-data returns undefined instead of throwing when a route has no page module.
- Reproduced the `lazy()` caching bug in a minimal Solid app with no SolidBase and no router (dev mode is unaffected; `await undefined` fixes it). The user has the issue draft. Check with them whether it has been filed at solidjs/solid; it relates to #3908 (`lazyModule` caches the same way).
- Drafted a #174 status comment, including "Questions for maintainers" covering merge timing, versioning, router/meta as peer deps, newer prereleases and `minimumReleaseAgeExclude`. The user posts it; check whether it's posted.

## Open work, highest priority first

### 1. Tab groups break hydration (HIGH, pre-existing on the branch)

Landing directly on any page with a tab group (`:::tab-group`, code tabs, package-manager blocks) throws a hydration mismatch and halts reactivity. Tabs don't switch, the theme menu is empty, and copy-page stays disabled. Client-side navigation to those pages works.

- Affected docs pages: /guide/quickstart, /guide/add-to-existing, /guide/features/markdown, /guide/customization/extending-themes.
- Affected dev pages: /, /pm, /ec, /ec-file, /preview.

Root cause, reproduced in a bare Solid 2 + Kobalte app and proven fixed with aliased patches:
- Solid 2 numbers hydration nodes by counting owners per component. Server `createEffect` still reserves an id.
- Two @solid-primitives functions return early on the server, before creating their client-side effect:
  - `createEventListener` (event-listener 3.0.0-next.5), used by Kobalte `Tabs.List` via `createSelectableCollection`;
  - `createResizeObserver` (resize-observer 4.0.0-next.3), used by `Tabs.Indicator`.
- So the client counts one extra owner, and the following `Dynamic`/`Polymorphic` gets the wrong hydration key.
- Plain-Solid proof: `if (!isServer) createEffect(...)` followed by `<Dynamic>` mismatches.

Upstream status as of 2026-10-09:
- event-listener: fixed on solid-primitives `next` (commit 8db42b0, which calls `createOwner()` on the server), but unreleased. npm only has next.5.
- resize-observer: unfixed, even on `next`.
- Kobalte: alpha.2 is the latest, and it pins both primitives exactly.

SolidBase's own `WindowEventListener` use (Article.tsx) is safe: it creates no effect.

Options (awaiting the user's choice):
- pnpm `patchedDependencies` for both primitives. About 15 minutes. Fixes SolidBase's own docs and dev sites only; consumers don't get pnpm patches.
- Plain-markup tabs in `DirectiveContainer` (src/default-theme/mdx-components.tsx). About 80–120 lines. Keep the `.tabs-*` classes and `data-selected`, ARIA tablist semantics, arrow/Home/End keys, roving tabindex, forceMount panels, `createUniqueId` ids, the persisted-cookie and BroadcastChannel sync for titled groups, and TS/JS naming and toggle. The indicator becomes static or is measured without ResizeObserver. Fixes users too.
- Wait for upstream: a solid-primitives release, then a Kobalte release, then bump.

Recommendation given to the user: do the pnpm patch now; file two solid-primitives issues (release the event-listener fix; give `createResizeObserver` the same server `createOwner()`); and ask the maintainers in #174 whether to take plain markup now or wait for Kobalte. The Vite-plugin build-time patch was rejected as a brittle shim.

### 2. Prerender crashes when `src/routes` is missing (MEDIUM, verified)

`getRoutesDir()` hard-codes `src/routes` (src/config/routes-index.ts), and prerender (on by default) calls `getRoutesIndex` unconditionally. As a result, `fileRoutes: { dir }` or custom routes fail `vite build` with ENOENT. Fix: use the configured dir, and treat a missing dir as no markdown seeds.

### 3. Low severity

Verified:
- `useSolidBaseContext`'s `?? throw` fallbacks never run, because Solid 2 `getContext` throws `ContextNotFoundError` first (src/client/context.tsx and other createContextProvider consumers).
- docs/src/Document.tsx lost the `getFontPreloadLinkAttrs()` preload links that the old entry-server emitted.
- Stale docs text: deploy.mdx mentions Nitro/`app.config.ts`; the docs/vite.config.mts description says "for SolidStart".
- Dev-only strict-read warnings: `useThemeText` reads config in component bodies; `children().toArray()` in DirectiveContainer; `props.deferStream` in page-data.

Unverified:
- prerender-worker exits before stdout flushes (possible truncation on macOS).
- The crawler drops discovered links with a dot in the last segment.
- `startConfig()` doesn't dot-prefix custom extensions.

### 4. Not for this PR

- Optional page-data redesign: a per-page `?solidbase-data` module loaded with plain `import()`, reusing values cached during the page compile.
- The docs OG image plugin is disabled until @solid-mediakit/og supports Solid 2.
- Root-relative links break under a non-root Vite base.
- The prerender crawler adapter can't handle commas in discovered paths.
- Coverage gap: no SSR→hydrate test for tab groups, and no prerender plugin tests.
- A breaking-changes list for the PR description was produced by the review but not yet drafted into the PR. Regenerate it from `git diff f34c043 HEAD`.

## Verifying

- Library: `pnpm install --frozen-lockfile`, then `pnpm test`, `pnpm build`, `npx biome check <files>`.
- Apps: `cd dev && pnpm build`, `cd docs && pnpm build`. Output is in dist/client; prerender logs any skipped links. dev's theme hard-codes the title "I am the captain now", so use docs for title checks.
- Browser:
  - Serve dist/client statically, falling back to 404.html.
  - Drive it with Playwright/Chromium. In cloud containers, Playwright is at /opt/node-tools/node_modules/playwright.
  - Always land directly on the page under test, not only navigate to it.
  - Record page errors, h1, title, `lang`, `history.state._depth` and every pushState/replaceState.
  - URL-only checks are insufficient.
- SSR: import dist/server/server.js and call `handleRequest(new Request(url))` to check the status code and `<title>`.
- The earlier probe scripts and repro apps lived in a scratch dir and are not in the repo. Recreate them from the descriptions above.
