# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.2] - 2026-11-01

### Fixed

- Replaced the dynamic PyPI version badge in the README with a static badge. The dynamic
  shields.io badge can show “package or version not found” on the PyPI project page itself
  (especially right after publish), which looked like a broken release.

## [0.1.1] - 2026-11-01

### Changed

- Renamed the project to **Compose Guard** for PyPI publication (`compose-doctor` was already
  taken by an unrelated package). Distribution/CLI `compose-guard`, import `compose_guard`,
  config `.compose-guard.yml`, suppressions `# compose-guard: …`, exception base
  `ComposeGuardError`, and repository/docs/UI branding. Rule IDs `CD000`–`CD015` are unchanged.
- README links (including License) use absolute GitHub URLs so they work on the PyPI project page.

### Added

- Web playground in `web/`: a landing page, docs, examples and an editor that runs the real
  `compose_guard` package in the browser with Pyodide, with Netlify configuration and CI.
- GitHub Actions workflow that publishes to PyPI on a published GitHub Release or manual
  `workflow_dispatch` (Trusted Publishing).

## [0.1.0] - 2026-10-25

### Added

- Located YAML loader built on `yaml.compose`: 1-based line and column for every key and list
  item, YAML 1.1 aliases and merge keys, and protection against alias bombs, recursive aliases and
  deep nesting.
- Sixteen rules: CD000 (invalid configuration) and CD001–CD015 covering image pinning, privileged
  mode, Docker socket and sensitive host mounts, host networking and namespaces, exposed database
  ports, hard-coded secrets, dangerous capabilities, disabled security profiles, healthchecks,
  restart policies, `depends_on` conditions, memory limits and fixed container names.
- Text, JSON (`schema_version` 1) and SARIF 2.1.0 output.
- Inline suppressions (`# compose-doctor: ignore ...`, `ignore-file`) and a `.compose-doctor.yml`
  config file with global and per-service ignores, severity overrides and `fail_on`
  (renamed to Compose Guard in 0.1.1).
- CLI with default-file discovery, standard input, `--fail-on`, `--ignore`, `--show-suppressed`,
  `--list-rules` and documented exit codes.
- Insecure and hardened example stacks, CI on Python 3.10–3.13, and a manually triggered SARIF
  upload workflow.

[0.1.2]: https://github.com/yagnang-vyas/compose-guard/releases/tag/v0.1.2
[0.1.1]: https://github.com/yagnang-vyas/compose-guard/releases/tag/v0.1.1
[0.1.0]: https://github.com/yagnang-vyas/compose-guard/releases/tag/v0.1.0
