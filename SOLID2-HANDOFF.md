# Solid 2 Migration Handoff

Updated 2026-10-21. Remove before #174 leaves draft.

## State

- Branch: solid2 on devagrawal09/solidbase. PR #174 remains draft; maintainers decide merge timing, versioning, dist-tags and dependency policy.
- Runtime pins: solid-js/@solidjs/web rc.16 (exact peer of Kobalte alpha.4), Kobalte 2.0.0-alpha.4, storage 5.0.0-next.7; event-listener next.9, keyboard next.8, scroll next.7 aligned with Kobalte's pins. Router next.37, Vite plugin next.47 and meta next.2 already accept rc.16, so unchanged.
- No vendored runtime patches or new test files. #173 REPL work remains separate.
- Never merge, publish or post outside devagrawal09/solidbase. Commit as Dev Agrawal <devagrawal09@gmail.com>.

## Completed

- Back/Forward fix: page data is registered under Vite-root-relative module paths. The `await undefined` before lazy preload was dropped because solid-js rc.15+ fixes the hydration Promise stub (solidjs/solid#4013). Missing page modules return undefined.
- Kobalte Tabs (tab groups) and Accordion (dev preview) restored now that alpha.4's primitives no longer shift hydration keys on direct loads.
- Named tab groups use makePersisted (cookieStorage + messageSync over a client-only BroadcastChannel) with `hydrated: true`; onCleanup calls dispose and closes the channel. The server always renders the first tab, and the client applies the saved cookie about 45ms after hydration. This applies to prerendered pages and to live SSR.
- Prerender, sitemap and llms respect fileRoutes.dir. Missing directories yield no markdown seeds; other errors propagate. fileRoutes:false does not index default markdown files.
- Prerender worker exits only after stdout is flushed; child-process isolation retained.
- Missing-provider diagnostics restored using optional provider helpers/default context values.
- Docs font preloads restored; obsolete Nitro deployment instructions and config references updated.
- Dev/docs typechecks exclude generated output and include ambient declarations. DocSearch callable export normalized for differing TypeScript resolution modes.
- Preferred-language initial effect deferred so a saved JS cookie is not overwritten before onSettled reads it.

## Verification

- 137 tests pass across the existing 29 test files (the Promise-stub workaround test was removed with the workaround).
- Library build/typecheck and dev/docs standalone typechecks pass.
- Production dev: 15 pages plus 404.html. Production docs: 41 pages plus 404.html.
- Browser direct-load matrix: docs quickstart, add-to-existing, markdown, extending-themes; dev pm, ec, ec-file, preview; both home pages. No hydration/page/console errors in the matrix.
- Tab clicks, same-key group sync, keyboard wrap/Home/End, cookie reload, cross-tab BroadcastChannel synchronization, RTL keyboard (Kobalte follows locale direction, not document dir) and accordion pass.
- History restores path/content/title/lang on Back/Forward. Locale selection, copy-page enabled state, theme-cookie reload and mobile navigation pass.
- JS preference cookie restores JS tab labels on reload. TS/JS toggle UI is disabled in current app configurations, so its click path was not verified.
- Independent read-only review found no verified actionable issues; browser checks cover hydration ownership.

## Remaining

- #174 stays draft until maintainer review and release/dependency decisions. Remove this note before leaving draft.
- Docs OG generation stays disabled pending Solid 2 support in its dependency.
- Vite native-config-loader warnings and prerender discovery headers with literal commas remain known limitations.
- Custom startConfig extensions require leading dots; dotted final URL segments are excluded from link discovery (explicit markdown seeds are still emitted).
- Existing raw Promise/lazy hydration upstream report remains the user's responsibility; previous detailed handoff is in branch history.
