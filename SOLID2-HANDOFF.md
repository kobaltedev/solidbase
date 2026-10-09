# Solid 2 Migration Handoff

Updated: 2026-10-09 (second session). The Back/Forward stale-content bug is root-caused and fixed; see "History Problem: Root Cause And Fix" below, which supersedes the earlier investigation sections. This is a continuation guide, not a claim that the migration is ready to merge.

## Immediate State

- SolidBase repository: /Users/devagr/solid-docs-infra/repos/solidbase.
- Branch: solid2, tracking origin/solid2 on devagrawal09/solidbase.
- Implementation head before this handoff: cff3c8d, already pushed.
- Draft PR: https://github.com/kobaltedev/solidbase/pull/174.
- Prior implementation head: cfae258.
- The tracked worktree was clean before adding this document. No candidate history fix has been committed.
- solid-js and @solidjs/web are pinned to 2.0.0-rc.14; @solidjs/router is pinned to 2.0.0-next.37.
- The official web release fixes the previous hydration mismatch. No vendored runtime patch is present.
- The Back/Forward stale-content bug is fixed on solid2 (page-data commit after fee6165), verified in real Chromium against production builds of dev/ and docs/. Opus's jsdom duplicate-history-write finding did not reproduce in Chromium and was not the cause; its selector guard and lang effect were not applied.

## User Constraints

- Keep changes minimal and avoid unnecessary compatibility shims.
- Do not commit or push new test files yet. Browser scripts and reproduction fixtures have remained outside the repositories. This handoff records how to find/recreate them.
- Do not commit a temporary Solid runtime patch; the user chose to wait for official releases.
- Git identity: Dev Agrawal <devagrawal09@gmail.com>. Use configured identity, never override it with another agent identity.
- Do not modify or revert unrelated work. The workspace contains multiple repositories and may have other active agents.
- If clarification is necessary, use the question tool and ask two questions at a time.
- SolidBase scope includes the library, dev/, docs/, and existing tests. solidjs/solid-docs and its osmium theme are out of scope.
- PR #173's REPL integration is intentionally excluded from the Solid 2 branch.
- The latest instruction was to stop investigation, prepare this detailed handoff, and push task-related work to GitHub. Do not interpret the handoff as approval to merge the PR or publish dependencies.

## Completed In cff3c8d

- Updated solid-js and @solidjs/web from rc.13 to rc.14 in root, dev, and docs manifests; updated peer minimums and lockfile.
- Updated Router from next.35 to next.37, the release whose peers explicitly match rc.14.
- Addressed jer3m01's aliased-code-import review: dev/vite.config.mts defines @dev, and dev/src/routes/ec-file.mdx imports @dev/Document.tsx. The production page rendered the alias title and imported source successfully.
- Removed the ignored SolidBaseRoot meta.provider option, as requested by review.
- Added exact prerender-crawler@0.2.0 and migrated link extraction, queueing, and output writes to its engine.
- Retained prerender's child process: importing the built production server into Vite's process keeps runtime handles alive and prevents build exit.
- Retained app-relative output under a non-root Vite base, relative-link handling, skipped HTTP-status reports, and 404.html generation.
- Added release-age exclusions needed by the new prereleases through pnpm's generated workspace configuration.
- Replied to all three review comments on #174.

Review threads: 4206689730 (alias), 4206866046 (meta option), 4206974739 (crawler).

Verification update: https://github.com/kobaltedev/solidbase/pull/174#issuecomment-6068468679.

That comment predates Opus's finding. Its unresolved-cause wording remains appropriate, but any assumption that Router or Solid itself is definitely responsible should be corrected using the evidence below.

## Verification Already Completed

- Frozen pnpm install passed.
- Library build and forced TypeScript project build passed.
- Existing test suite: 29 files, 128 tests passed after restoring the original locale implementation.
- Biome passed for changed source files; git diff --check passed.
- Library pack passed, with its tarball written outside the repository.
- Dev production build prerendered 15 pages plus 404.html and exited normally.
- Docs production build prerendered 41 pages plus 404.html and exited normally.
- Root and /base/ crawler fixtures produced app-relative output and correct requests for page-relative links.
- Additional crawler fixtures tested trailing directory URLs, base href, non-200 statuses, thrown handler errors, and held-handle process exit.
- Static browser checks passed hydration on /, /guide/, /fr/, and /reference/ with no page errors.
- Forward SPA navigation retained an in-page sentinel, confirming it was not a full-page reload.
- Theme selection, cookie persistence across reload, mobile menu opening, and locale selection passed.
- Valid routes returned 200; an unknown route returned 404.

These checks do NOT establish that browser history is correct. Earlier checks that compared only URL and lang were insufficient. Compare rendered content, title, history entries, and reactive route state too.

## History Problem: Root Cause And Fix

Verified in headless Chromium (Playwright, cloud container) against minified production builds served statically, recording h1, title, lang, history depth and every pushState/replaceState.

Baseline symptom, narrowed: history entries were always correct (no extra pushState), but returning to the route the document was hydrated on never re-rendered, whether by Back or by a link. Other routes navigated fine. Dev mode (vite dev) was unaffected.

Root cause chain:

1. During hydration, Solid 2 re-runs async memo computes inside subFetch (@solidjs/web), which replaces the global Promise with a MockPromise that never settles until the compute returns synchronously.
2. The page-data memo's window cache lookup always missed: modules registered page data under their absolute file path, while the Solid 2 router's lazy moduleUrl is Vite-root-relative (src/routes/x.mdx). In 1.x the vinxi manifest src was absolute, so the fast path worked; the migration broke it.
3. The memo therefore called the route component's lazy preload() synchronously inside the stubbed compute. In production, preload goes through Vite's __vitePreload, which builds its chain from the global Promise, so it returned a MockPromise.
4. Solid's lazy() caches that promise forever. The next visit to the hydrated route awaited it, the navigation transition never settled, and the previous page stayed rendered. Dev mode skips __vitePreload, so it never saw the mock.

Fix (src/client/page-data.ts, src/config/vite-plugin/virtual.ts, src/config/vite-plugin/index.ts):

- Register page data under the Vite-root-relative posix path, matching moduleUrl. This restores the fast path and stops absolute build paths leaking into client bundles.
- Yield once (await undefined) before preloading in the page-data memo, so preload never runs under the hydration stub. This also covers non-markdown landing routes (verified with a temporary .tsx route), which have no window page data.
- An extension check on moduleUrl was tried and rejected: on the server, moduleUrl is the client asset URL (/assets/x.js), so it broke SSR page data and titles.

Tests: two cases added to tests/client/page-data.test.ts (window cache hit by moduleUrl; preload deferred past the synchronous compute, which fails without the fix) and the registration key asserted in tests/config/virtual.test.ts. No new test files.

Verified after the fix: dev / -> /about -> Back/Forward; landing /about -> /dave -> Back -> / -> Back -> Forward; locale switches at /, /about, /router -> /router/fr -> /router/fr/about with Back/Forward; docs / -> /guide and /guide -> /fr/guide with Back/Forward (titles correct); dev mode; SSR titles and 200/404 statuses; 130 tests; library build with forced tsc; Biome; dev 15 pages and docs 41 pages prerendered.

Follow-ups needing the user's direction:

- Report upstream to Solid: lazy() caches a promise created while subFetch stubs the global Promise, so any preload() called synchronously in an async memo during hydration permanently breaks that lazy component.
- Update #174 with this root cause; the verification comment there predates it.
- Opus's selector guard and lang effect remain unapplied. Neither symptom reproduced in Chromium with the fix (no extra history writes, lang correct after Back/Forward). Revisit only if a browser reproduces them.

## Remaining History Problem (superseded)

Reported browser symptom:

1. Load dev / or docs /.
2. Follow a link to dev /about or docs /guide.
3. Invoke browser Back.
4. The URL can return to / while the previous page's heading/content remains rendered.

A locale flow also showed /about -> /fr/about -> Back changing the URL without restoring the previous language/content. Apparent JavaScript stalls were not consistently reproduced and are not an established runtime freeze.

Astra's independent investigation reported stale rendering too. A later Opus investigation found a specific, independently testable history corruption in SolidBase, described below. Opus could not run a real browser in its native sandbox, so it did not prove that the duplicate write is the cause of the exact production-browser symptom.

## Opus Investigation (superseded: jsdom-only, not the browser cause)

Agent: Claude Opus, driver claude, native harness.

Session: ses_ee24ed859ffehfrDQaFlFgy1oY.

The first execution failed during a server restart with Plugin runtime unavailable. The same session resumed and completed. Do not confuse this with a completed browser run.

Sandbox limitations: Chromium startup failed with a MachPort permission error; listening on a port failed with EPERM; the preferred OC++ scratch directory was not writable. Opus used /tmp/claude-501/bb/ and Node/jsdom instead. It left tracked files and installed dependencies unchanged.

### Observed Cause Of Duplicate History Entries

- src/client/locale.ts recreates the locales array and option objects when the pathname changes (approximately lines 162-171).
- Kobalte Select 2.0.0-alpha.2 reacts to option keys and calls setSelectedKeys(keysToKeep), even when the selected key is unchanged. The published select chunk was dist/select/De07CvDa.jsx, approximately lines 282-286.
- This emits onChange with the current locale. Simply removing allowDuplicateSelectionEvents did not stop the behavior in Opus's tests.
- src/default-theme/components/LocaleSelector.tsx currently forwards every truthy option to locale.setLocale(option), approximately line 21.
- setLocale calls navigate(routePath) in src/client/locale.ts, approximately line 196.
- Browser Back starts a router location write with _navigation: -1. The selector's redundant navigate starts another write with _navigation: 1 for the same location.
- Router then commits the second write with pushState, creating a duplicate entry and destroying the Forward stack.

Example trace: after / -> /about -> Back, the URL / had history.state._depth = 1 rather than 0, because of an extra pushState('/'). Forward then stayed on / instead of returning to /about.

Opus reproduced this using the real dev App, the SolidBase Vite plugin, installed rc.14, and installed Router next.37. An isolated plain-router app, including lazy routes, Loading, and an async page-data memo, handled Back/Forward correctly. That is evidence against a router/runtime-only explanation, not proof that every production timing case is resolved.

### Candidate Fix Verified In jsdom

Guard the selector so changes to option identity cannot navigate to the already-current locale:

~~~tsx
onChange={(option) =>
  option &&
  option.code !== locale.currentLocale().code &&
  locale.setLocale(option)
}
~~~

This was applied in memory by a scratch Vite load hook, NOT to tracked source. Opus confirmed that it eliminated the duplicate pushState on Back and preserved Forward.

There is also a separate lang synchronization issue: html lang is written only by setLocale's onSettled callbacks. Ordinary links and Back/Forward do not inherently call that action. Once the duplicate selector callback is suppressed, stale lang becomes visible.

Opus's second candidate changes the Solid import to include createEffect and removes onSettled from that import, then places this after currentLocale is created:

~~~tsx
if (!isServer) {
  createEffect(
    () => currentLocale().code,
    (code) => {
      document.documentElement.lang = code;
    },
  );
}
~~~

Remove the two onSettled callbacks that assign document.documentElement.lang inside setLocale. Keep the generator navigation action. The effect follows the committed route and writes lang after rendering.

Results observed by Opus:

| Variant | Back | Forward |
| --- | --- | --- |
| Baseline / -> /about | Correct root content in jsdom, but duplicate push and depth 1 | Stuck at root |
| Selector guard | Correct content, depth 0, no extra push | About rendered correctly |
| Baseline locale switch | Extra push on Back | Forward destroyed |
| Guard alone, locale flow | Content correct, lang remained fr-FR | Route correct |
| Guard plus lang effect | Content, title, lang, depth correct | All correct |

### Earlier Attempt And Why It Was Reverted

Before Opus's investigation, the main agent temporarily tried the split lang effect without the selector guard. It could not fix stale rendering/history because the actual route was not settling correctly. It also broke two existing unit-test expectations because their navigate mock does not change a reactive pathname. The original tracked locale.ts was restored byte-for-byte before cff3c8d was pushed.

If implementing the combined fix, existing locale unit tests need a reactive location mock and navigate behavior that actually updates it. Do not weaken the tests merely to make the lang assertions pass. Confirm whether the user's prohibition on new test files still applies; modifications to existing tests may be sufficient.

Removing onSettled leaves an intentionally yield-less generator passed to action, which Biome's useYield rule can flag. The generator form was previously required by action's API. Use the current API correctly and explain any necessary targeted suppression; do not blindly replace it with an unsupported plain callback.

## Local Reproduction Artifacts

These are machine-local and deliberately not committed as new test files:

- /tmp/claude-501/bb/real/vite.config.mts: full dev configuration copy with a pre-load transformation hook and jsdom Vitest configuration.
- /tmp/claude-501/bb/real/app.test.tsx: renders the real dev App, clicks a link or invokes locale selection, traverses history, and logs h1/title/lang/state and all history writes.
- /tmp/claude-501/bb/rcopy: instrumented router copy used for tracing. Final conclusions were rechecked with the installed router, without RCOPY.
- /tmp/claude-501/bb/fx: isolated plain-router fixture.
- /tmp/sb-pw/opus-history-browser.mjs: main agent's browser probe, records pushState/replaceState plus path, heading, title, lang, and state at START/NAV/BACK/FORWARD.
- /tmp/sb-pw/docs-history.mjs and history-diagnose.mjs: earlier independent history probes.
- /tmp/sb-pw/docs-static.mjs: successful hydration/theme/mobile/forward-navigation checks. This alone does not establish correct history.
- /tmp/sb-pw/lang.mjs: older language-only probe; do not use its results as a content-rendering assertion.
- /tmp/sb-crawl: isolated base/relative-link crawler fixtures.
- /private/var/folders/k4/g2_9q0g52437sbcp5m856r6m0000gn/T/ocpp/sb-static-rc14.mjs: simple static server taking an output directory and a port.

Paths may appear with /private/tmp instead of /tmp on macOS. Fixtures may be unavailable on another machine; recreate their behavior from this document and source.

### Replay Opus's jsdom Runs

Run from the SolidBase dev directory:

~~~sh
FIX='' ../node_modules/.bin/vitest run --config /tmp/claude-501/bb/real/vite.config.mts
FIX=guard ../node_modules/.bin/vitest run --config /tmp/claude-501/bb/real/vite.config.mts
FIX=guardlang ../node_modules/.bin/vitest run --config /tmp/claude-501/bb/real/vite.config.mts
FIX=guardlang START=/about TARGET=locale ../node_modules/.bin/vitest run --config /tmp/claude-501/bb/real/vite.config.mts
~~~

The fixture writes diagnostics to /tmp/claude-501/bb/real/out.txt by default; use OUT to keep runs separate. The fixture logs rather than providing a complete assertive regression suite. Review the actual trace, including history depth and extra pushState calls.

## Exact Stop Point (first session; superseded)

- No tracked implementation changes after cff3c8d; this document is the only new tracked deliverable.
- The main agent reinstalled playwright in /tmp/sb-pw because its package files were missing. That did not touch repository dependencies.
- Browser launch then failed because Chromium headless shell revision 1248 was not installed. No successful main-harness browser comparison of the candidate fixes has occurred.
- A normal baseline dev production build completed successfully.
- Then FIX=guardlang vite build using Opus's scratch config completed successfully and prerendered 15 pages plus 404.html. Its in-memory candidate fix was applied to generated dev/dist artifacts only.
- IMPORTANT: dev/dist at the stop point contains the candidate guard/lang variant, not a clean build of tracked cff3c8d. Rebuild with the ordinary dev config before treating it as baseline. dist is not tracked and will not be pushed.
- A static server on port 4198 was started by the main agent for browser verification and is being stopped during handoff cleanup. Port 4174 was already occupied; it was not killed because its ownership was unclear. Do not assume any previous server is still running.
- Multiple OC++ server restarts interrupted this conversation. Re-read git status and verify actual installed/built versions before continuing.

## Next Agent Workflow (first session; steps 1-7 done)

1. Read this handoff, inspect git status, and confirm the branch and runtime versions. Do not assume generated dist matches tracked source.
2. Reproduce Opus's baseline, guard, and guardlang runs in jsdom and inspect the history-write trace.
3. Restore browser access outside the native sandbox. In /tmp/sb-pw, install the Chromium revision matching Playwright if needed. Do not modify repository dependencies just to run the browser probe.
4. Build the ordinary dev configuration and test / -> /about -> Back -> Forward, then /about -> /fr/about -> Back -> Forward. Record heading, title, lang, history state/depth, and every pushState. A URL-only assertion is inadequate.
5. Build the candidate via the scratch load hook and repeat the same browser tests. The user has asked to stop here; obtain the next user's direction before committing a fix, new tests, or external reports.
6. If both candidate changes fix the browser behavior, implement the smallest source change with existing-test updates and re-run library/typecheck, existing tests, dev/docs builds, and production browser checks.
7. If stale rendering persists despite correct history entries, isolate that second problem without presenting the proven duplicate-history bug as its established cause. Keep facts and hypotheses separate.
8. Update #174's status accurately. Do not mark ready to merge merely because the hydration mismatch is fixed or unit tests pass.

## Other Migration Context

- Solid 2 uses @solidjs/vite-plugin start mode instead of SolidStart: solidPlugin({ start: true, ssr: true }).
- Existing migration work includes split effects, async page data, contexts-as-providers, native links/useLinkState, filesystem-routing, Document/app entry generation, MDX compilation, and child-process static prerender.
- src/client/page-data.ts deliberately preserves deferStream via a MemoOptions cast. Removing it allowed HTTP 200 to commit before an async catch-all route set HTTP 404.
- src/client/Root.tsx sets HTTP 404 when no route matches; explicit catch-all routes still win.
- Hydration blocker was solidjs/solid#3741, fixed upstream by #3757. The old mismatch came from attribute/children evaluation ordering and memo ID allocation. rc.14 fixes it.
- Kobalte remains 2.0.0-alpha.2. Do not assume the current release has fixed the selector callback behavior found by Opus.
- Docs still has six skipped/broken links reported by prerender. Root-relative links under non-root Vite base are an additional follow-up. The docs OG plugin is disabled pending Solid 2 support.
- Prerender-crawler v0.2 normalizes trailing slashes and lacks a base-mapping hook; the adapter retains original URL spellings for requests/link resolution. Its discovery header is comma-delimited, so literal commas in discovered paths are a known unaddressed adapter limitation.

## REPL And Playground Work

- SolidBase #173: https://github.com/kobaltedev/solidbase/pull/173, separate draft REPL integration by milomg, last inspected head 130cd07. Do not merge it into solid2 implicitly.
- Rewritten packages/solid-repl was unpublished when inspected. npm solid-repl@0.26.0 was the old 2024 package, not the rewritten monorepo artifact. Clean #173 installs lacked a declared usable REPL dependency and a matching lockfile.
- Scratch /tmp/sb173 applies #173 on upstream main, with local REPL symlinks. It is not the migration branch and its local changes were not committed/pushed.
- Browser host UI uses Solid 1.9; example preview code can target Solid 1 or Solid 2 independently. A Solid 2 host cannot simply mount the Solid 1 UI in its component tree.
- Architecture decision remains open: port the REPL host UI to Solid 2 or embed the whole REPL through an iframe endpoint. Iframes do not inherently reduce workers; lazy/shared worker policy needs separate design.
- Reviews posted on #173: https://github.com/kobaltedev/solidbase/pull/173#pullrequestreview-5407779105 and https://github.com/kobaltedev/solidbase/pull/173#pullrequestreview-5407851392.
- Review findings: unconditional plugin resolution crashes sites without solid-repl; every site emits about 19.5 MB of workers even without a REPL page; eager four-workers-per-embed startup; global styled-system alias; global Panda utility/reset scope; missing main.tsx when the first block is titled; worker/import errors outside the intended ErrorBoundary; missing tests. Code was judged a thoughtful draft, not low-quality slop.
- Solid playground #200 removed the local eslint-solid-standalone patch after upgrading to released 0.18.1. It merged as 1e1cb0d.
- Milo later superseded the standalone dependency in commit e7b00c05b6e13df28e9be535d17644debd34bf1b: builds ESLint directly with browser shims and chooses Solid 1 or Solid 2 configs in the linter worker. This later commit was read, not browser-verified by this agent.
- Playground checkout: /Users/devagr/solid-docs-infra/repos/solid-playground, main, clean but behind upstream/main by four commits at handoff. Do not fast-forward it or publish it as part of this handoff without checking for new work.

## GitHub Delivery

All migration implementation changes through cff3c8d were already pushed to origin/solid2. This handoff is committed and pushed separately so a new agent can start from the same branch. No new test files, generated dist, node_modules, temporary runtime patches, or scratch worktrees are included.
