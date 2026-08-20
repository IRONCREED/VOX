# IRON WARDEN

IRON WARDEN is the experimental constitutional enforcement project for the
IRONCREED website. It lives beside the application, observes it through a
public testing interface, and blocks a build when a registered invariant fails.

Its authority is deliberately narrow:

- WARDEN enforces recorded rules and never creates them;
- historical tests remain registered and immutable until an explicit normative
  decision replaces them;
- every deployment build collects the entire relevant historical corpus;
- a missing, altered, skipped, or failing historical test stops publication;
- application internals are not exported merely to make WARDEN convenient;
- the testing interface may offer broader observation and controlled test
  states while hiding the application’s internal structure.

The model is an experiment. The project can later be replaced if its independent
boundary creates more fragility than protection. Replacement must preserve the
historical corpus, the integrity registry, and the release-blocking contract.

## Interface

`testing-interface/site-driver.mjs` is the stable external boundary. Post-build
tests request pages through the compiled Worker in the same shape as a network
client. Source-level tests read only canonical public artifacts and registries.

## Historical corpus

`history/manifest.json` registers every historical test and every protected
testing-interface file with SHA-256. The runner verifies integrity and rejects
unregistered historical files before it starts Node’s test runner.

Tests are divided into `prebuild` and `postbuild` phases. The production build
executes both phases around compilation; therefore Sites cannot publish a
candidate that omitted either applicable part of history.

An explicit normative decision may replace a historical invariant that has
become incompatible with newly required behavior. The old test file and hash
remain intact, while its manifest entry receives `status: "superseded"` and a
`supersededBy` reference to an active registered successor. The runner verifies
the integrity of both active and superseded files, executes active tests only,
and refuses an orphaned replacement.
