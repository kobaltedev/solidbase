# Solid 2 Migration Handoff

Updated 2026-10-13. Remove before #174 leaves draft.

## State

- Branch: solid2 on devagrawal09/solidbase. PR #174 remains draft; maintainers decide merge timing, versioning, dist-tags and dependency policy.
- Runtime pins unchanged: solid-js/@solidjs/web rc.14, router next.37, Vite plugin next.47, meta next.2, Kobalte alpha.2. Primitives fixes remain unreleased as of today's npm check.
- No vendored runtime patches or new test files. #173 REPL work remains separate.
- Never merge, publish or post outside devagrawal09/solidbase. Commit as Dev Agrawal <devagrawal09@gmail.com>.

## Completed

- Existing Back/Forward fix preserved: register page data using Vite-root-relative module paths and await undefined before lazy preload. Promise.resolve still hits the hydration Promise stub. Missing page modules return undefined.
- Native tabs replace Kobalte tabs, avoiding unreleased event-listener/resize-observer owner-count bugs. Preserve selected-tab styling, linked ARIA IDs, roving focus, Home/End, wrapping arrows (including RTL), force-mounted panels and persisted named groups.
- Persist named selection in the effect's apply phase after the signal commits, deferring initial writes so hydration does not overwrite a saved cookie. BroadcastChannel synchronization and reload persistence verified.
- The tab-group BroadcastChannel is created only on the client and closed on cleanup (SSR previously leaked one per named group).
- Native details/summary replaces the dev-only Kobalte accordion preview, with matching displayed snippet. Kobalte's demo used the same server/client ownership mismatch; this does not claim to fix arbitrary consumer Kobalte widgets.
- Prerender, sitemap and llms respect fileRoutes.dir. Missing directories yield no markdown seeds; other errors propagate. fileRoutes:false does not index default markdown files.
- Prerender worker exits only after stdout is flushed; child-process isolation retained.
- Missing-provider diagnostics restored using optional provider helpers/default context values.
- Docs font preloads restored; obsolete Nitro deployment instructions and config references updated.
- Dev/docs typechecks exclude generated output and include ambient declarations. DocSearch callable export normalized for differing TypeScript resolution modes.
- Preferred-language initial effect deferred so a saved JS cookie is not overwritten before onSettled reads it.

## Verification

- 138 tests pass across the existing 29 test files.
- Library build/typecheck and dev/docs standalone typechecks pass.
- Production dev: 15 pages plus 404.html. Production docs: 41 pages plus 404.html.
- Browser direct-load matrix: docs quickstart, add-to-existing, markdown, extending-themes; dev pm, ec, ec-file, preview; both home pages. No hydration/page/console errors in the matrix.
- Tab clicks, keyboard wrap/Home/End, unique IDs, visible selected panels, cookie reload, cross-tab BroadcastChannel synchronization, RTL keyboard behavior pass.
- History restores path/content/title/lang on Back/Forward. Locale selection, copy-page enabled state, theme-cookie reload and mobile navigation pass.
- JS preference cookie restores JS tab labels on reload. TS/JS toggle UI is disabled in current app configurations, so its click path was not verified.
- Independent read-only review found no verified actionable issues; browser checks cover hydration ownership.

## Remaining

- #174 stays draft until maintainer review and release/dependency decisions. Remove this note before leaving draft.
- Docs OG generation stays disabled pending Solid 2 support in its dependency.
- Vite native-config-loader warnings and prerender discovery headers with literal commas remain known limitations.
- Custom startConfig extensions require leading dots; dotted final URL segments are excluded from link discovery (explicit markdown seeds are still emitted).
- Existing raw Promise/lazy hydration upstream report remains the user's responsibility; previous detailed handoff is in branch history.
