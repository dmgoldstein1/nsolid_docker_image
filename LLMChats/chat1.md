User: N|Solid is a downstream fork of node.js with added telemetry features. I want to be able to test untrusted Javascript code in an N|Solid Docker container which is in a “high security mode”, so to speak. It is on the lookout to see if the Javascript process is trying to contact suspicious servers/IP addresses/domains. I also want it to actively inspect the processes and analyze them to see if there are suspicious patterns, such as cryptomining, bot-netting etc. The runtime should actively block anything deemed suspicious, inform me of the potential problem and provide verbose details, and allow me to resume or shut down the container. I think these advanced features will benefit from having another container that uses the Otel telemetry to monitor these processes, identify threats, tell the runtime to block the potentially dangerous activity, and provide a browser-based dashboard keep me informed of the status of its analysis. I want an analysis tool which will intentionally break real-time processes and wait for me to expressly permit them to resume. This is _not_ meant to run in production - this is a tool an engineer can use to approach unknown Javascript code with caution and proactively verify that it is not malicious or problematic.

GitHub Copilot: 

User: @agent Try Again

GitHub Copilot: 

User: @agent Try Again

GitHub Copilot: 

I'll start by researching the workspace to understand what's already in place — the N|Solid Docker image structure, any existing configuration, and what capabilities N|Solid provides for telemetry/security. 

Research N|Solid workspace

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/README.md)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/etc/environment)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/etc/os-release)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/home/node)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/home/nsolid)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local)

Searched for files matching `**/Dockerfile*`, no matches

Searched for files matching `**/docker-compose*`, no matches

Searched for files matching `**/.env*`, no matches

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/bin)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/CHANGELOG.md#1-1), lines 1 to 100

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/LICENSE_NSOLID#1-1), lines 1 to 50

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/README.md)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/include)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/etc)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/include/node)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules)

Searched for regex `NSOLID|nsolid` (`**/etc/profile.d/**`), no results

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/etc/profile.d)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/etc/profile)

Searched for regex `otel|opentelemetry|OTEL`, 20 results

Searched for regex `NSOLID|nsolid_version|NODE_VERSION` (`**/etc/**`), 9 results

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/include/node/node_version.h#1-1), lines 1 to 50

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/include/node/nsolid.h#1-1), lines 1 to 100

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/include/node/config.gypi#1-1), lines 1 to 100

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/nsolid-cli)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng)

Searched for regex `NSOLID_SAAS|NSOLID_COMMAND|NSOLID_DATA|NSOLID_APPNAME|NSOLID_TAGS`, 20 results

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/etc/passwd)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/share/man/man1/nsolid.1#800-800), lines 800 to 1000

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/config.json)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/package.json)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/nsolid-cli/package.json)

Searched for regex `otlp|opentelemetry|otel|tracing|OTEL_` (`**/usr/local/**`), 20 results

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/include/node/config.gypi#100-100), lines 100 to 200

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/include/node/node_version.h#50-50), lines 50 to 148

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/etc/ssh)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/etc/ssl)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/etc/security)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/etc/bash.bashrc#1-1), lines 1 to 50

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/home/node/.bashrc#1-1), lines 1 to 50

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/home/nsolid/.bashrc#1-1), lines 1 to 50

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/npm)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/npm/package.json#1-1), lines 1 to 20

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/npm/.npmrc)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/etc/ssh/ssh_config#1-1), lines 1 to 50

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/corepack)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/include/node/nsolid.h#100-100), lines 100 to 250

Searched for regex `nsolid_version|NSOLID_VERSION` (`**/usr/local/include/**`), 7 results

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/corepack/package.json#1-1), lines 1 to 15

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/etc/ssl/openssl.cnf#1-1), lines 1 to 30

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/etc/default)

Searched for regex `ENTRYPOINT|CMD|EXPOSE|WORKDIR|FROM|ENV` (`**/Dockerfile*`), no results

Read [](file:///Users/danielgoldstein/Library/Application%20Support/Code/User/workspaceStorage/f2da6b8dd02eb5967db586c58a4087f6/GitHub.copilot-chat/chat-session-resources/d737d775-465c-4740-9553-693ea7e89d5c/toolu_bdrk_01ScJYtrx7Y9HMz3vYxYraiu__vscode-1772141920918/content.txt#1-1), lines 1 to 200

Read [](file:///Users/danielgoldstein/Library/Application%20Support/Code/User/workspaceStorage/f2da6b8dd02eb5967db586c58a4087f6/GitHub.copilot-chat/chat-session-resources/d737d775-465c-4740-9553-693ea7e89d5c/toolu_bdrk_01ScJYtrx7Y9HMz3vYxYraiu__vscode-1772141920918/content.txt#200-200), lines 200 to 290

Now let me research N|Solid's specific security capabilities and the `nsolid-strict` binary, plus what the NCM agent can do. 

Research nsolid-strict and NCM

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/README.md)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/nsolid-cli)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/share/man/man1/nsolid.1#1-1), lines 1 to 300

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/nsolid-cli/package.json)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/nsolid-cli/cli-bin.js)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/nsolid-cli/help.txt)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/package.json)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/config.json)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/index.js)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/share/man/man1/nsolid.1#300-300), lines 300 to 600

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/share/man/man1/nsolid.1#600-600), lines 600 to 1032

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/agent.js)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/lib)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/workers)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/worker-flows)

Searched for regex `strict|block|security|firewall|deny|allow|policy|permission` (`**/*.{js,json,md,txt,conf,cfg}`), 100 results

Searched for regex `--policies|--experimental-policy|--experimental-permission|nsolid-strict|policies`, 50 results

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/lib/white-listed-packages.js)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/lib/config.js#1-1), lines 1 to 100

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/lib/default-scorer.js#1-1), lines 1 to 100

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/workers/certifyNG)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/workers/certifyBasic)

Searched for files matching `**/*policy*`, 20 matches

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/workers/certifyNG/eslint-ast-checker.js)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/lib/vuln-manager.js#1-1), lines 1 to 100

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/nsolid-cli/lib)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/README.md)

Searched for files matching `**/SECURITY.md`, no matches

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/lib/default-scorer.js#100-100), lines 100 to 300

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/nsolid-cli/lib/client.js)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/lib/eslint-rules)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/lib/default-scorer.js#300-300), lines 300 to 565

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/worker-flows/certifyNG.js)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/worker-flows/default-scorer.js#1-1), lines 1 to 100

Searched for files matching `**/*permissions*`, no matches

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/bin)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/lib/ncm-api.js)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/nsolid-cli/cli_formats.js)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/bin/nsolid-strict)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/README.md)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/nsolid-cli/README.md)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/parallel)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/parallel/agent.js)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/tools)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/parallel/ncm-agent.js)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/parallel/strict.js)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/parallel/nsolid-strict.sh)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/parallel/config.json)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/install.sh)

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/lib/snyk-snapshot.json#1-1), lines 1 to 30

Read [](file:///Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image/usr/local/lib/node_modules/ncm-ng/workers/general)

Read [](file:///Users/danielgoldstein/Library/Application%20Support/Code/User/workspaceStorage/f2da6b8dd02eb5967db586c58a4087f6/GitHub.copilot-chat/chat-session-resources/d737d775-465c-4740-9553-693ea7e89d5c/toolu_bdrk_015TNGu2UaxYvBPqTPRbz9xP__vscode-1772141920975/content.txt)

Excellent — now I have a thorough understanding of the workspace. Let me research what external tools would be needed for the monitoring/dashboard container. 



Fetched 2 resources

User: @agent Try Again

GitHub Copilot: 

User: @agent Try Again

GitHub Copilot: I have a couple quick questions to align on blocking method and dashboard choice before drafting the detailed plan.

Asked 2 questions (Blocking, Dashboard)

## Plan: N|Solid secure test harness with OTLP monitor

TL;DR — Build a 3-service PoC (N|Solid app in “high security” mode, OpenTelemetry Collector + Jaeger/Prometheus, and an Analyzer+UI). The app runs under `nsolid` with strict flags and OTLP enabled; the Collector receives traces/metrics and exports to Jaeger/Prometheus; the Analyzer pulls traces/metrics, applies rule-based detection (blacklists, sustained CPU/event-loop patterns, DNS/HTTP destination checks), and when suspicious activity is found it issues `SIGSTOP` to pause the app, collects artifacts (heap snapshot / CPU profile), shows a detailed alert in a browser UI, and lets you `resume` (`SIGCONT`) or `terminate` the container. Key decisions: we will pause with SIGSTOP (process-level pause) and implement a small custom Node+React UI for alerts and actions.

Steps
1. Bootstrap repo files
   - Add `docker-compose.yml` that defines:
     - `app` service built from a small `Dockerfile.app` that uses `nodesource/nsolid` (or the local extracted filesystem) and exposes Node app.
     - `otel-collector` service (OpenTelemetry Collector) with a config file.
     - `jaeger` service (jaegertracing/all-in-one) and `prometheus` service for metrics.
     - `analyzer` service (Node) that mounts Docker socket docker.sock (for sending signals) and connects to Jaeger & Prometheus.
     - `ui` served by the analyzer (same container) for browser interaction.
   - Files to create:
     - `docker-compose.yml`
     - `app/Dockerfile` and `app/run.sh` + sample `app/untrusted.js`
     - `otel/config.yaml`
     - `analyzer/package.json`, `analyzer/src/server.js`, `analyzer/src/rules.js`, `analyzer/src/docker-control.js`, `analyzer/src/collector.js`, `analyzer/src/ui/*`
     - `prometheus/prometheus.yml` minimal config
   - Reference: runtime binary present at nsolid and strict helper nsolid-strict.

2. Configure the N|Solid app for “high security”
   - App `Dockerfile` entry should run node via `nsolid` with security flags:
     - Enable OTLP: `ENV NSOLID_OTLP=otlp` and `ENV NSOLID_TRACING_ENABLED=true`
     - OTLP endpoints to Collector: `ENV OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317`
     - Add hardening CLI flags: `--experimental-permission --disallow-code-generation-from-strings --no-addons --jitless --experimental-policy` (and mount an explicit `policy.json` if needed)
     - Optionally use `nsolid-strict` preflight: run nsolid-strict when starting to enforce package rules.
   - Files: `app/Dockerfile`, `app/start.sh` (wraps preflight, then exec `nsolid`).

3. OpenTelemetry Collector & backend
   - Provide `otel/config.yaml` with:
     - `receivers`: `otlp`
     - `processors`: `batch`, `memory_limiter`
     - `exporters`: `prometheus` (metrics), `jaeger` (traces)
     - `service` pipelines to send traces -> jaeger, metrics -> prometheus
   - Expose Prometheus scrape endpoint and Jaeger Query UI so Analyzer/UI can query them.

4. Analyzer (detection + control)
   - Implement `analyzer/src/server.js`:
     - Periodically query Prometheus HTTP API for CPU/event-loop metrics for `app` service.
     - Query Jaeger Query API for recent HTTP client and DNS spans (extract destination host/IP).
     - Evaluate rules in `rules.js`:
       - Blacklist lookup: denylist of domains/IPs (configurable)
       - Suspicious CPU pattern: sustained > X% for Y seconds + high loopUtilization
       - IO/network spike patterns
       - Combined heuristics for cryptomining (high CPU + many threads + long-running CPU profiles)
     - On detection: create an alert object, take automated snapshots:
       - `docker exec app nsolid-cli snapshot` (or `docker exec app kill -USR2 <pid>` if configured)
       - `docker exec app nsolid-cli profile` to capture CPU profile
     - Block: call Docker API (via mounted docker.sock) to send `SIGSTOP` to the process:
       - Implementation options: `docker kill --signal=SIGSTOP <container>` or Docker Engine API call to send signal to container PID 1.
       - Save evidence and alert state until operator action.
     - Actions: expose endpoints `/alerts/:id/resume` (sends `SIGCONT`), `/alerts/:id/terminate` (sends `SIGTERM`/`SIGKILL`).
   - Provide `docker-control.js` to talk to Docker socket and send signals safely.

5. UI
   - Minimal React UI served by Analyzer:
     - Shows active alerts with metadata: metrics, spans (destinations), snapshot/profile links, timeline.
     - Buttons: `Resume` (SIGCONT), `Terminate` (SIGTERM), `Ignore` (suppress for interval).
     - Option to whitelist the current package/process (persists in `analyzer/config/whitelist.json`).
   - UI endpoints hit Analyzer server endpoints to perform actions.

6. Rule tuning and persistence
   - Add `analyzer/config/rules.yaml` to tune thresholds and denylist.
   - Store alert history and artifacts under `analyzer/data/` (bind mount so artifacts survive container restarts).

7. Sample untrusted JS and testing harness
   - Add `app/untrusted_examples/` with:
     - benign script (network call to example.com)
     - suspicious script (cryptominer-like busy loop, repeated DNS to suspicious domain)
     - a launcher `run-test.sh` to start container with chosen example.

8. Security / isolation notes
   - Analyzer needs Docker socket to control containers — run it locally only (explicit risk).
   - The PoC mounts: `docker.sock` into Analyzer; document risk and alternatives (use Docker API TLS or a controller VM).
   - Ensure Collector and Analyzer are on an isolated test network in Compose.

Verification
- Bring stack up:
  - docker-compose up --build
- Quick checks:
  - Collector receives spans: open Jaeger UI at http://localhost:16686 and verify traces from `app`
  - Prometheus metrics at http://localhost:9090 -> run queries for `nsolid_*` metrics exported from Collector
  - Trigger suspicious example: `docker-compose exec app node untrusted_examples/miner.js`
  - Confirm Analyzer creates alert, sends `SIGSTOP` (container pauses). Check `docker ps` to see state or `docker inspect`.
  - Use UI to `Resume` — container should continue; `Terminate` forces shutdown.
- Commands:
  - Start stack:
    ```
    docker-compose up --build
    ```
  - Test suspend/continue:
    ```
    docker exec <app_container> ps aux | grep node
    docker kill --signal=STOP <app_container>
    docker kill --signal=CONT <app_container>
    ```

Decisions
- Blocking method: SIGSTOP/SIGCONT (process pause/resume) — chosen for portability and minimal side-effects.
- Dashboard: Custom Node + React UI — gives interactive controls and detailed alert context.
- Telemetry pipeline: N|Solid -> OTLP -> OpenTelemetry Collector -> Jaeger/Prometheus -> Analyzer (queries Jaeger/Prometheus). This avoids writing a custom OTLP receiver.

Key workspace paths referenced
- N|Solid runtime: [usr/local/bin/nsolid](usr/local/bin/nsolid#L1)
- Strict helper & NCM: [usr/local/bin/nsolid-strict](usr/local/bin/nsolid-strict#L1), [usr/local/lib/node_modules/ncm-ng](usr/local/lib/node_modules/ncm-ng#L1)
- Man page (flags): [usr/local/share/man/man1/nsolid.1](usr/local/share/man/man1/nsolid.1#L1)

What I will deliver next (if you approve this DRAFT)
- Generate the actual PoC files: `docker-compose.yml`, `app/Dockerfile`, `otel/config.yaml`, `analyzer` service code + minimal React UI, and Prometheus config — runnable locally.
- Include a short `README.md` with exact run/test commands and safety notes.

If this plan looks good, I’ll create the files and bring up the PoC stack.Decisions
- Blocking method: SIGSTOP/SIGCONT (process pause/resume) — chosen for portability and minimal side-effects.
- Dashboard: Custom Node + React UI — gives interactive controls and detailed alert context.
- Telemetry pipeline: N|Solid -> OTLP -> OpenTelemetry Collector -> Jaeger/Prometheus -> Analyzer (queries Jaeger/Prometheus). This avoids writing a custom OTLP receiver.

Key workspace paths referenced
- N|Solid runtime: [usr/local/bin/nsolid](usr/local/bin/nsolid#L1)
- Strict helper & NCM: [usr/local/bin/nsolid-strict](usr/local/bin/nsolid-strict#L1), [usr/local/lib/node_modules/ncm-ng](usr/local/lib/node_modules/ncm-ng#L1)
- Man page (flags): [usr/local/share/man/man1/nsolid.1](usr/local/share/man/man1/nsolid.1#L1)

What I will deliver next (if you approve this DRAFT)
- Generate the actual PoC files: `docker-compose.yml`, `app/Dockerfile`, `otel/config.yaml`, `analyzer` service code + minimal React UI, and Prometheus config — runnable locally.
- Include a short `README.md` with exact run/test commands and safety notes.

If this plan looks good, I’ll create the files and bring up the PoC stack.