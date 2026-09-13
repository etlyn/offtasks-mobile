# Offtasks Acceptance Scenarios

These 22 feature files and 109 manual scenarios were moved from
`etlyn/offtasks.com/end-to-end-testing` without changing their Gherkin content.
The shared Etlyn runner replaces the old local runner and report scripts.

- `web/features`: 11 features, 59 scenarios for `etlyn/offtasks.com`.
- `mobile/features`: 11 features, 50 scenarios for `etlyn/offtasks-mobile`.
- `COVERAGE.md`: the original capability inventory, with current repository paths.

From the `etlyn-e2e` repository root with Node 24:

```sh
node scripts/run-e2e-gherkin.mjs list --surface offtasks-web
node scripts/run-e2e-gherkin.mjs list --surface offtasks-mobile
yarn e2e:test:offtasks:web
yarn e2e:test:offtasks:mobile
yarn e2e:test:offtasks:mobile task-composer
yarn e2e:report:open
```

The CLI also accepts `--platform` as an alias for `--surface`. Reports default
to `reports/` in the caller's working directory; use `E2E_REPORTS_DIR` for a
separate run location. `E2E_ROOT` can point to another directory with the same
`offtasks/web/features` and `offtasks/mobile/features` layout.

The shared runner uses pass/fail/skip/pending outcomes. The retired Offtasks
runner's numeric code display, live report refresh, comment outcome, and
`--strict` flag are not supported; numeric comments remain in the feature files
for reference. A failed scenario makes the shared runner exit unsuccessfully.
Never treat unexecuted, skipped, or pending scenarios as release approval.

Use disposable Supabase test accounts. Cross-client sync scenarios need both
apps connected to the same test project. Widget checks require the actual
iOS app and widget extension. These are manual checks, not automated browser
or native regression results.

## Device-first Onboarding

`mobile/features/guest-onboarding.feature` adds eight current acceptance cases.
The older inventory is historical and is not evidence of current execution.
`mobile/maestro/guest.yaml` is a native iOS automation flow for Maestro 2.10.0.
Run it only on a dedicated simulator: it clears that simulator app's data.

```sh
maestro --device "$SIMULATOR_ID" test offtasks/mobile/maestro/guest.yaml \
	--format junit --output reports/offtasks-guest.xml
```

Account cases require a disposable isolated backend with the
`20260912000000_device_planner_sync` migration. Do not run fixture writes against
production. Simulator, API contract, manual, and phone-install evidence must
remain separate in the product readiness report.
