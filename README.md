# Compose Guard

Compose Guard lints Docker Compose files for security holes, misconfigurations and reliability
problems before they reach production.

[![CI](https://github.com/yagnang-vyas/compose-guard/actions/workflows/ci.yml/badge.svg)](https://github.com/yagnang-vyas/compose-guard/actions/workflows/ci.yml)
[![Live demo](https://img.shields.io/badge/live%20demo-compose--guard.netlify.app-0f766e)](https://compose-guard.netlify.app/)
[![PyPI](https://img.shields.io/pypi/v/compose-guard.svg)](https://pypi.org/project/compose-guard/)

**[Try it in your browser →](https://compose-guard.netlify.app/playground)** The playground runs
this exact Python package with Pyodide, so you can lint a Compose file without installing
anything. Your YAML never leaves the browser.

## Why it exists

Compose files are usually copied from tutorials and grow by trial and error. They reach production
with `latest` image tags, databases published on every network interface, the Docker socket
mounted into a container, plain-text passwords in `environment:`, no healthchecks and no restart
policy. `docker compose config` happily accepts all of that, and nothing complains until a
database is found by a scanner or a service stays down after a reboot.

Compose Guard reads your Compose files and tells you, with the exact line and a concrete fix,
what to change. It is small, has one dependency (PyYAML), and fits into CI as a gate or as a
GitHub code scanning source.

## Features

- **15 documented rules** for security (privileged mode, Docker socket, dangerous capabilities,
  disabled seccomp/AppArmor, host namespaces, sensitive host paths, exposed databases, hard-coded
  secrets) and reliability (unpinned images, healthchecks, restart policies, `depends_on`
  conditions, memory limits, fixed container names), plus CD000 for entries Compose itself
  would reject.
- **Accurate line numbers**, including through YAML anchors, aliases and `<<` merge keys: a
  finding inherited from an `x-` block points at the line where the value is defined.
- **Text, JSON and SARIF 2.1.0** output. SARIF findings show up in GitHub code scanning.
- **Inline suppressions** (`# compose-guard: ignore CD005`) and a **config file** with global and
  per-service ignores and severity overrides. Suppressed findings are counted, never lost.
- **CI-friendly exit codes** with a configurable threshold (`--fail-on`).
- **Never prints secrets.** Findings about environment variables name the key, never the value.
- **Safe parsing.** YAML is parsed with `yaml.compose` and `SafeLoader`; no Python objects are
  constructed from your file, and alias bombs are rejected.

## Installation

Python 3.10 or newer:

```console
pip install compose-guard
compose-guard --version
```

Or install from a clone:

```console
git clone https://github.com/yagnang-vyas/compose-guard.git
cd compose-guard
python -m venv .venv && . .venv/bin/activate
pip install .
compose-guard --version
```

## Quick start

```console
# Lint compose.yaml (or compose.yml, docker-compose.yaml, docker-compose.yml) in this directory
compose-guard

# Lint specific files, or standard input
compose-guard deploy/compose.yaml deploy/compose.prod.yaml
cat compose.yaml | compose-guard -

# Fail CI on warnings too, and write SARIF for code scanning
compose-guard --fail-on warning --format sarif > compose-guard.sarif

# See every rule with its rationale and fix
compose-guard --list-rules
```

`python -m compose_guard` works the same as `compose-guard`.

## Sample output

[`examples/insecure/compose.yaml`](https://github.com/yagnang-vyas/compose-guard/blob/main/examples/insecure/compose.yaml) is a **deliberately insecure**
small shop stack (web app, PostgreSQL, Redis, a worker and Adminer) with fake credentials. It
triggers all 15 rules:

<!-- generated:insecure-output -->
```console
$ compose-guard examples/insecure/compose.yaml
examples/insecure/compose.yaml:6:3 warning CD007 [web] Service has no healthcheck although it publishes ports
    fix: Add a healthcheck that proves the service is serving, for example test: ["CMD-SHELL", "pg_isready -U app"] for PostgreSQL, with interval, timeout and retries.
examples/insecure/compose.yaml:6:3 warning CD008 [web] Service has no restart policy
    fix: Set 'restart: unless-stopped' (or 'always' / 'on-failure').
examples/insecure/compose.yaml:6:3 note CD010 [web] Service has no memory limit
    fix: Set 'mem_limit: 512m' or 'deploy.resources.limits.memory: 512M'.
examples/insecure/compose.yaml:7:5 warning CD001 [web] Image 'example/shop-web:latest' uses the 'latest' tag
    fix: Pin a specific version tag (postgres:16.4) or a digest (image@sha256:...).
examples/insecure/compose.yaml:8:5 note CD015 [web] Service sets a fixed container_name
    fix: Remove 'container_name' and refer to the service by its service name.
examples/insecure/compose.yaml:13:7 error CD006 [web] Environment variable 'DJANGO_SECRET_KEY' has a hard-coded secret value
    fix: Load it from the environment or an untracked .env file (KEY: ${KEY}), or use Docker secrets with a *_FILE variable.
examples/insecure/compose.yaml:15:9 warning CD009 [web] Depends on 'db' only being started, not healthy, although it has a healthcheck
    fix: Use the long form: depends_on: {db: {condition: service_healthy}}.
examples/insecure/compose.yaml:18:3 note CD010 [db] Service has no memory limit
    fix: Set 'mem_limit: 512m' or 'deploy.resources.limits.memory: 512M'.
examples/insecure/compose.yaml:19:5 warning CD001 [db] Image 'postgres' has no tag, so it resolves to 'latest'
    fix: Pin a specific version tag (postgres:16.4) or a digest (image@sha256:...).
examples/insecure/compose.yaml:21:9 error CD005 [db] PostgreSQL container port 5432 is published on all interfaces
    fix: Remove the port mapping and connect over the Compose network, or bind it to loopback, for example '127.0.0.1:5432:5432'.
examples/insecure/compose.yaml:24:7 error CD006 [db] Environment variable 'POSTGRES_PASSWORD' has a hard-coded secret value
    fix: Load it from the environment or an untracked .env file (KEY: ${KEY}), or use Docker secrets with a *_FILE variable.
examples/insecure/compose.yaml:30:5 warning CD008 [db] Restart policy is 'no'
    fix: Set 'restart: unless-stopped' (or 'always' / 'on-failure').
examples/insecure/compose.yaml:32:3 warning CD007 [cache] Service has no healthcheck although other services depend on it (web)
    fix: Add a healthcheck that proves the service is serving, for example test: ["CMD-SHELL", "pg_isready -U app"] for PostgreSQL, with interval, timeout and retries.
examples/insecure/compose.yaml:32:3 note CD010 [cache] Service has no memory limit
    fix: Set 'mem_limit: 512m' or 'deploy.resources.limits.memory: 512M'.
examples/insecure/compose.yaml:35:9 error CD005 [cache] Redis container port 6379 is published on all interfaces
    fix: Remove the port mapping and connect over the Compose network, or bind it to loopback, for example '127.0.0.1:5432:5432'.
examples/insecure/compose.yaml:38:3 note CD010 [worker] Service has no memory limit
    fix: Set 'mem_limit: 512m' or 'deploy.resources.limits.memory: 512M'.
examples/insecure/compose.yaml:40:5 error CD002 [worker] Container runs in privileged mode
    fix: Remove 'privileged: true' and grant only the specific capabilities or devices needed.
examples/insecure/compose.yaml:41:5 warning CD013 [worker] 'pid: host' shares the host's namespace
    fix: Remove the setting so the container gets its own namespace.
examples/insecure/compose.yaml:43:9 error CD011 [worker] Dangerous capability SYS_ADMIN is added
    fix: Remove the capability, or replace it with the narrowest one the service needs.
examples/insecure/compose.yaml:45:9 error CD012 [worker] The seccomp security profile is disabled
    fix: Remove the 'unconfined' option. If a specific call is blocked, use a custom profile that allows only that call.
examples/insecure/compose.yaml:48:9 error CD006 [worker] Environment variable 'PAYMENT_API_TOKEN' has a hard-coded secret value
    fix: Load it from the environment or an untracked .env file (KEY: ${KEY}), or use Docker secrets with a *_FILE variable.
examples/insecure/compose.yaml:50:9 error CD003 [worker] The Docker socket /var/run/docker.sock is mounted into the container
    fix: Remove the socket mount. If the service really needs the Docker API, put a filtering proxy (for example docker-socket-proxy) in front of it and allow only the calls it needs.
examples/insecure/compose.yaml:51:9 error CD014 [worker] Sensitive host path /etc is mounted
    fix: Mount only the specific application directory the service needs, read-only if possible.
examples/insecure/compose.yaml:53:9 warning CD009 [worker] Depends on 'db' only being started, not healthy, although it has a healthcheck
    fix: Use the long form: depends_on: {db: {condition: service_healthy}}.
examples/insecure/compose.yaml:56:3 note CD010 [adminer] Service has no memory limit
    fix: Set 'mem_limit: 512m' or 'deploy.resources.limits.memory: 512M'.
examples/insecure/compose.yaml:57:5 warning CD001 [adminer] Image 'adminer' has no tag, so it resolves to 'latest'
    fix: Pin a specific version tag (postgres:16.4) or a digest (image@sha256:...).
examples/insecure/compose.yaml:58:5 warning CD004 [adminer] Container uses the host's network stack
    fix: Remove 'network_mode: host' and publish only the ports you need with 'ports:'.

10 errors, 11 warnings, 6 notes, 0 suppressed in 1 file
```
<!-- /generated:insecure-output -->

[`examples/hardened/compose.yaml`](https://github.com/yagnang-vyas/compose-guard/blob/main/examples/hardened/compose.yaml) is the same stack with every
finding fixed: pinned images, loopback-only ports, secrets from `.env` and Docker secrets,
healthchecks with `condition: service_healthy`, restart policies, memory limits, no privileged
settings or host mounts.

<!-- generated:hardened-output -->
```console
$ compose-guard examples/hardened/compose.yaml
No problems found in 1 file.
```
<!-- /generated:hardened-output -->

## Web playground

Live at **[compose-guard.netlify.app](https://compose-guard.netlify.app/)**.
[`web/`](https://github.com/yagnang-vyas/compose-guard/tree/main/web) holds its source: a landing page and a browser playground that runs this exact
Python package with Pyodide (WebAssembly). Your YAML stays in the browser. See [web/README.md](https://github.com/yagnang-vyas/compose-guard/blob/main/web/README.md) for the architecture and Netlify deployment.

## Rules

Generated from `compose-guard --list-rules`, which also prints each rule's fix.

<!-- generated:rule-table -->
| ID | Severity | Rule | Why it matters |
|---|---|---|---|
| CD000 | error | Invalid configuration | An entry that does not follow the Compose specification is either rejected by Docker Compose or silently means something other than intended, and the other rules cannot check it. |
| CD001 | warning | Unpinned image | An image without a tag, or with the 'latest' tag, can change underneath you: a redeploy or a fresh host silently pulls a different version, which breaks reproducibility and can introduce untested or vulnerable code. |
| CD002 | error | Privileged container | A privileged container gets every Linux capability and access to all host devices, and most isolation between it and the host is turned off. A compromise of the container is effectively a compromise of the host. |
| CD003 | error | Docker socket mounted | Access to the Docker socket is root access to the host: anything in the container can start a privileged container that mounts the host filesystem. This applies even to a read-only mount, because the socket accepts API calls either way. |
| CD004 | warning | Host network mode | With 'network_mode: host' every port the container listens on is open on the host's interfaces, bypassing Compose port mapping, and the container can reach services bound to the host's loopback address. |
| CD005 | error | Database port exposed on all interfaces | Publishing a database port without a loopback host IP makes it reachable from every network the host is on, and Docker's iptables rules bypass host firewalls such as ufw. Exposed databases are found and attacked within hours. |
| CD006 | error | Hard-coded secret in environment | A password, token or key written into the Compose file ends up in version control, in 'docker inspect' output and in anyone's copy of the repository. Rotating it means rewriting history. |
| CD007 | warning | No healthcheck | Without a healthcheck Docker only knows whether the process is running, not whether it is serving. Dependent services cannot wait for it to be ready, and a hung process is never reported as unhealthy. An explicitly disabled healthcheck is reported as a note. |
| CD008 | warning | No restart policy | Docker's default is not to restart containers. After a crash or a host reboot the service stays down until someone notices. |
| CD009 | warning | depends_on without health condition | Plain 'depends_on' only waits for the dependency's container to start, not for it to be ready, so the service races its database on every cold start. When the dependency has a healthcheck, Compose can wait for it properly. Dependencies without a healthcheck are reported by CD007 instead. |
| CD010 | note | No memory limit | Without a memory limit one leaking or overloaded container can consume all host memory and trigger the kernel's OOM killer against unrelated services, including the database. |
| CD011 | error | Dangerous capability | SYS_ADMIN is close to full root, SYS_MODULE loads kernel modules, SYS_PTRACE can read other processes' memory, NET_ADMIN reconfigures host-visible networking, and ALL grants everything. Each one widens the path from a compromised container to the host. |
| CD012 | error | Security profile disabled | Docker's default seccomp and AppArmor profiles block system calls and file accesses that containers almost never need but exploits often do. Running unconfined removes that layer of defence. |
| CD013 | warning | Host namespace shared | Sharing the host's PID namespace lets the container see and signal host processes; sharing IPC exposes host shared memory; 'userns_mode: host' disables user-namespace remapping so container root is host root. |
| CD014 | error | Sensitive host path mounted | Mounting the host root, system configuration (/etc), root's home, kernel interfaces (/proc, /sys), the boot partition or Docker's own data directory gives the container a way to read secrets from, or tamper with, the host. |
| CD015 | note | Fixed container_name | A fixed container name prevents scaling the service beyond one replica and clashes when two Compose projects on the same host use the same name. Compose already gives each container a unique, predictable name. |
<!-- /generated:rule-table -->

## Suppressions and configuration

### Inline comments

```yaml
services:
  db:
    image: postgres:16.4
    ports:
      # compose-guard: ignore CD005 -- only reachable through the VPN
      - "10.8.0.1:5432:5432"
    container_name: db  # compose-guard: ignore CD015

# compose-guard: ignore-file CD010
```

- `# compose-guard: ignore ID[,ID...]` suppresses those rules on its own line. When the comment
  is on a line by itself it also covers the line directly below.
- `# compose-guard: ignore-file ID[,ID...]` anywhere suppresses those rules for the whole file.
- Anything after `--` is a free-text reason. Unknown rule IDs are an error, so a typo cannot
  silently suppress nothing.

### Config file

Compose Guard reads `.compose-guard.yml` from the current directory, or the file given with
`--config PATH`:

```yaml
ignore: [CD015]          # ignore these rules everywhere
services:
  worker:
    ignore: [CD007]      # ignore these rules for one service
severity:
  CD010: warning         # change a rule's severity
fail_on: warning         # default for --fail-on
```

Unknown keys or rule IDs are rejected with a list of valid ones. Command-line flags win:
`--ignore CD010,CD015` adds to the config file's `ignore` list and `--fail-on` overrides
`fail_on`.

Suppressed findings always appear in the summary (`2 suppressed`). `--show-suppressed` lists them;
SARIF output always includes them, marked as suppressed (`inSource` for comments, `external` for
configuration).

## CI usage

As a gate, any CI system only needs the exit code:

```console
compose-guard --fail-on warning
```

On GitHub, upload SARIF so findings appear as code scanning alerts on the lines they refer to.
Code scanning must be enabled for the repository (Settings → Code security), and private
repositories need GitHub Advanced Security.

```yaml
name: Compose Guard
on: [push, pull_request]

permissions:
  contents: read
  security-events: write

jobs:
  compose-guard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.13"
      - run: pip install compose-guard
      - run: compose-guard compose.yaml --format sarif --fail-on never > compose-guard.sarif
      - uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: compose-guard.sarif
          category: compose-guard
```

This repository's own [SARIF demo workflow](https://github.com/yagnang-vyas/compose-guard/blob/main/.github/workflows/sarif-demo.yml) does the same for
the insecure example. It only runs when triggered manually, so the example does not create alerts
on every push.

## JSON output

`--format json` prints one object with a stable shape (`schema_version` 1). For this input on
standard input:

<!-- generated:json-output -->
```yaml
services:
  db:
    image: postgres:16.4
    restart: unless-stopped
    mem_limit: 1g
    ports:
      - "5432:5432"
```

```console
$ compose-guard --format json - < compose.yaml
{
  "schema_version": 1,
  "tool": {
    "name": "compose-guard",
    "version": "0.1.0"
  },
  "files": [
    "<stdin>"
  ],
  "summary": {
    "error": 1,
    "warning": 1,
    "note": 0,
    "suppressed": 0
  },
  "findings": [
    {
      "rule_id": "CD007",
      "severity": "warning",
      "file": "<stdin>",
      "line": 2,
      "column": 3,
      "service": "db",
      "message": "Service has no healthcheck although it publishes ports",
      "fix": "Add a healthcheck that proves the service is serving, for example test: [\"CMD-SHELL\", \"pg_isready -U app\"] for PostgreSQL, with interval, timeout and retries."
    },
    {
      "rule_id": "CD005",
      "severity": "error",
      "file": "<stdin>",
      "line": 7,
      "column": 9,
      "service": "db",
      "message": "PostgreSQL container port 5432 is published on all interfaces",
      "fix": "Remove the port mapping and connect over the Compose network, or bind it to loopback, for example '127.0.0.1:5432:5432'."
    }
  ]
}
```
<!-- /generated:json-output -->

- `findings` holds unsuppressed findings, sorted by file, line and rule ID. `service` is the
  service name; `line` and `column` are 1-based.
- `summary` counts unsuppressed findings by severity, plus suppressed findings.
- With `--show-suppressed`, a `suppressed` array lists suppressed findings with an extra
  `"suppression": "inline"` or `"config"` field.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | No unsuppressed finding at or above `--fail-on` (default `error`) |
| 1 | At least one such finding |
| 2 | Usage or input error: bad flag, missing file, YAML error, invalid config. The message goes to stderr as `compose-guard: error: <file>:<line>: <message>` |
| 130 | Interrupted (Ctrl-C) |
| 141 | Output pipe closed early, for example by `\| head` |

## Limitations

- Each file is linted on its own. Override files are not merged the way
  `docker compose -f a.yaml -f b.yaml` merges them.
- `${VAR}` interpolation is detected but not resolved, and `.env` files are not read.
  Interpolated values are treated as unknown: an interpolated image tag is not called unpinned,
  an interpolated secret is not called hard-coded, and an interpolated host IP is not judged.
- Compose Guard only sees the Compose file. A healthcheck defined in an image's Dockerfile, or a
  firewall in front of a published port, is invisible to it; suppress the finding with a reason.
- Suppression comments are found by scanning the raw text, so a `# compose-guard:` marker inside
  a multi-line string would also be read as a suppression.
- It does not lint Dockerfiles or Kubernetes manifests and does not fix files automatically.

## Prior art

- [hadolint](https://github.com/hadolint/hadolint) lints Dockerfiles, not Compose files.
- [Checkov](https://github.com/bridgecrewio/checkov) and [KICS](https://github.com/Checkmarx/kics)
  are broad infrastructure-as-code scanners that include Docker Compose checks among many other
  formats.
- `docker compose config` validates and renders a Compose file but does not judge it.

Compose Guard focuses on Compose only and stays small and dependency-light, with accurate line
numbers through anchors and merge keys, per-line suppressions and SARIF output.

## Development

```console
python -m venv .venv && . .venv/bin/activate
make install   # pip install -e ".[dev]"
make check     # ruff, ruff format --check, mypy --strict, pytest with >=90% branch coverage
make format    # apply formatting and safe lint fixes
```

- [SPEC.md](https://github.com/yagnang-vyas/compose-guard/blob/main/SPEC.md) describes the design (especially the loader) and records every judgment call
  under "Decisions". [AGENTS.md](https://github.com/yagnang-vyas/compose-guard/blob/main/AGENTS.md) holds the ground rules for contributors.
- Each rule has `tests/fixtures/bad_cdNNN.yaml` and `good_cdNNN.yaml`. Bad fixtures mark expected
  findings with `# expect: CDNNN` and the test checks the exact lines.
- `UPDATE_GOLDEN=1 pytest` regenerates `tests/golden/insecure.json`;
  `python scripts/update_readme.py` regenerates the sample output and rule table above. A test
  fails if either is stale.

## Releasing

1. Run `make check` and `python scripts/update_readme.py` (and
   `python web/scripts/export_snapshot.py` if the rule catalogue changed).
2. Update [CHANGELOG.md](https://github.com/yagnang-vyas/compose-guard/blob/main/CHANGELOG.md), bump `__version__` in `src/compose_guard/__init__.py`.
3. Tag and publish a GitHub Release (`vX.Y.Z`). The [Publish](https://github.com/yagnang-vyas/compose-guard/blob/main/.github/workflows/publish.yml)
   workflow builds the sdist/wheel and uploads to PyPI via Trusted Publishing.
4. On PyPI, configure a Trusted Publisher for this repository (`compose-guard`, workflow
   `publish.yml`, environment `pypi`) before the first release upload.

## Roadmap

- Merge override files the way `docker compose -f` does and lint the result.
- Optional `.env` support for resolving interpolation.
- More rules: `read_only` root filesystems, `no-new-privileges`, missing `user:`, published
  admin UIs.
- A pre-commit hook and a ready-made GitHub Action.

## License

MIT, see [LICENSE](https://github.com/yagnang-vyas/compose-guard/blob/main/LICENSE).
