# N|Solid Secure Sandbox for Untrusted JavaScript Analysis

> A hardened testing environment for safely analyzing and controlling the execution of untrusted JavaScript code.

## Overview

The N|Solid Secure Sandbox is a comprehensive Docker Compose-based system designed to safely execute and monitor untrusted JavaScript code. It combines N|Solid's enhanced telemetry capabilities with real-time threat detection, automatic process control, and an intuitive browser-based dashboard.

**Use Case:** Engineering teams need a tool to approach unknown JavaScript code with caution, proactively verify it's not malicious or problematic, and have granular control over its execution.

**Not for production use** — this is a local engineering tool for interactive threat analysis and verification.

## Key Features

- **Hardened Runtime**: N|Solid runtime with security flags (permission model, frozen intrinsics, no eval/JIT)
- **Real-Time Telemetry**: OpenTelemetry integration exporting metrics and traces
- **Threat Detection**: Heuristic-based pattern recognition (high CPU, suspicious network, crypto-mining, C2 indicators)
- **Process Control**: Pause (SIGSTOP), resume (SIGCONT), or terminate (SIGTERM) execution via Docker API
- **Interactive Dashboard**: Browser-based UI for viewing alerts and controlling sandbox execution
- **Audit Trail**: Complete record of all detections and operator actions
- **Multiple Examples**: Benign, suspicious crypto-mining, and C2 communication patterns included

## Architecture

```
Untrusted JavaScript (sandbox/app)
    ↓ OTLP telemetry export (CPU, memory, event loop metrics)
    ↓
OpenTelemetry Collector (sandbox/otel)
    ├─→ Prometheus (metrics storage)
    └─→ Jaeger (distributed tracing)
         ↓
Analyzer Service (sandbox/analyzer)
    ├─ Rule evaluation engine
    ├─ Detection logic (CPU, network, patterns)
    ├─ Docker control API (pause/resume/terminate)
    └─ REST API + Web Dashboard
         ↓
Browser Dashboard (http://localhost:8080)
    └─ Operator interaction (review alerts, control execution)
```

### Service Components

| Service | Port | Purpose |
|---------|------|---------|
| **app** | N/A | Hardened N\|Solid container running untrusted code |
| **otel-collector** | 4317/4318 | OTLP receiver, exports to Prometheus & Jaeger |
| **prometheus** | 9090 | Time-series metrics database |
| **jaeger** | 16686 | Distributed tracing UI and query API |
| **analyzer** | 8080 | Detection engine + Control API + Dashboard |

## Quick Start

### Prerequisites

- Docker Engine (v20.10+)
- Docker Compose (v2.0+)
- 2GB+ available memory
- Unix/Linux or macOS (tested on ARM64 and x86_64)

### Installation

```bash
# Clone or navigate to the workspace
cd /Users/danielgoldstein/Documents/VibeCoding/nsolid_docker_image

# Start all services
docker compose up --build -d

# Verify services are healthy
docker compose ps

# Monitor logs
docker compose logs -f
```

### First Run

1. **Open Dashboard**: Navigate to [http://localhost:8080](http://localhost:8080)
2. **View Metrics**: Check [http://localhost:9090](http://localhost:9090) (Prometheus)
3. **View Traces**: Check [http://localhost:16686](http://localhost:16686) (Jaeger)
4. **Check API Status**: `curl http://localhost:8080/api/status`

### Testing with Examples

The sandbox includes three test scenarios. Edit `docker-compose.yml` to change `SANDBOX_EXAMPLE`:

#### 1. Benign Workload (Safe Code)
```yaml
environment:
  SANDBOX_EXAMPLE: benign  # HTTP request + light CPU loop
```
- Makes simple HTTP requests
- Light CPU consumption
- Should not trigger alerts

#### 2. Suspicious Crypto-Mining Pattern
```yaml
environment:
  SANDBOX_EXAMPLE: suspicious_miner  # High CPU loop (99%+)
```
- Sustained CPU usage above 80%
- Triggers detection within ~15 seconds
- Dashboard shows "Blocked" alert
- Demonstrates pause/resume workflow

#### 3. Suspicious C2 Communication
```yaml
environment:
  SANDBOX_EXAMPLE: suspicious_c2  # DNS queries + outbound calls
```
- DNS lookups to denylist domains
- Outbound connections to suspicious IPs
- Triggers network-based detections

**To test:** Rebuild and watch the dashboard for alerts:
```bash
docker compose up --build -d
# Open http://localhost:8080 in your browser
```

## Directory Structure

```
nsolid_docker_image/
├── docker-compose.yml              # Multi-service orchestration
├── README.md                        # This file
├── .gitignore                       # Git ignore rules
│
├── sandbox/                         # Core sandbox implementation
│   ├── app/                         # Hardened N|Solid runtime
│   │   ├── Dockerfile
│   │   ├── start.sh                # N|Solid startup with security flags
│   │   ├── untrusted.js            # Entry point dispatcher
│   │   └── untrusted_examples/
│   │       ├── benign.js           # Safe HTTP + light CPU
│   │       ├── suspicious_miner.js # High-CPU pattern
│   │       └── suspicious_c2.js    # DNS + outbound calls
│   │
│   ├── otel/                        # OpenTelemetry configuration
│   │   └── config.yaml             # OTLP receiver → Prometheus/Jaeger
│   │
│   ├── prometheus/                  # Metrics database config
│   │   └── prometheus.yml          # Scrape targets
│   │
│   └── analyzer/                    # Detection + Control service
│       ├── Dockerfile
│       ├── package.json            # Node.js dependencies
│       ├── src/
│       │   ├── server.js           # HTTP API + monitoring loop
│       │   ├── rules.js            # Rule evaluation engine
│       │   ├── docker-control.js   # Docker socket wrapper
│       │   └── jaeger.js           # Jaeger query client
│       ├── config/
│       │   └── rules.json          # Detection rules & thresholds
│       ├── public/                 # Browser dashboard
│       │   ├── index.html
│       │   ├── app.js              # React component
│       │   └── styles.css
│       └── data/                   # Persistent alert storage
│
├── LOGS/                            # Documentation & test results
│   ├── IMPLEMENTATION_SUMMARY.txt  # Complete implementation details
│   ├── E2E_TEST_RESULTS.md        # Verified test results
│   └── *.log                       # Operational logs
│
└── [System directories]/            # Docker image filesystem (bin, etc, usr, var, etc.)
```

## Analyzer API Reference

The analyzer provides a REST API for querying status and controlling execution.

### Endpoints

#### `GET /api/status`
Returns current system status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-27T02:52:30Z",
  "containerStatus": "running",
  "alertCount": 1,
  "lastAlert": "2026-02-27T02:52:29.388Z"
}
```

#### `GET /api/alerts`
List all detected alerts with full details.

**Query Parameters:**
- `limit` (number): Max alerts to return (default: 50)
- `offset` (number): Pagination offset (default: 0)

**Response:**
```json
{
  "alerts": [
    {
      "id": "alert_1772160749388",
      "timestamp": "2026-02-27T02:52:29.388Z",
      "severity": "high",
      "type": "cpu_threshold_exceeded",
      "message": "High CPU usage detected: 99.64%",
      "details": {
        "cpu_percent": 99.64,
        "threshold": 80,
        "consecutive_polls": 3
      },
      "status": "blocked",
      "actions": ["auto_pause"],
      "operator_actions": [
        {
          "action": "resume",
          "timestamp": "2026-02-27T02:52:35Z"
        }
      ]
    }
  ],
  "total": 1
}
```

#### `POST /api/alerts/{id}/resume`
Resume a paused container (send SIGCONT).

**Response:**
```json
{
  "success": true,
  "message": "Container resumed",
  "alertId": "alert_1772160749388",
  "action": "resume",
  "timestamp": "2026-02-27T02:52:35Z"
}
```

#### `POST /api/alerts/{id}/terminate`
Terminate the container (send SIGTERM).

**Response:**
```json
{
  "success": true,
  "message": "Container terminated",
  "alertId": "alert_1772160749388",
  "action": "terminate",
  "timestamp": "2026-02-27T02:52:40Z"
}
```

## Configuration

### Detection Rules

Edit `sandbox/analyzer/config/rules.json` to customize threat detection:

```json
{
  "cpu_threshold": {
    "enabled": true,
    "percent": 80,
    "consecutive_polls": 3,
    "poll_interval_ms": 5000,
    "severity": "high"
  },
  "denylist": {
    "domains": [
      "evil-c2.example.com",
      "malware-repo.net"
    ],
    "ips": [
      "10.0.0.1",
      "192.168.1.1"
    ]
  },
  "network_thresholds": {
    "tx_bytes_per_sec": 250000,
    "severity": "medium"
  }
}
```

### Environment Variables

**N|Solid App Container:**
- `SANDBOX_EXAMPLE`: Which test scenario to run (`benign`, `suspicious_miner`, `suspicious_c2`)
- `NSOLID_TRACING_ENABLED`: Enable OTLP telemetry export
- `SANDBOX_ALLOW_FS_READ`: Whitelist directories for file read access
- `SANDBOX_ALLOW_FS_WRITE`: Whitelist directories for file write access

**Analyzer Service:**
- `POLL_INTERVAL_MS`: How often to query metrics (default: 5000ms)
- `CPU_ALERT_THRESHOLD`: CPU percentage threshold (default: 80)
- `AUTO_PAUSE_ON_ALERT`: Auto-pause on detection (default: true)
- `RULES_FILE`: Path to rules configuration (default: `/app/config/rules.json`)

## Security Considerations

### Hardened N|Solid Runtime Flags

The app container starts with these security flags:

```bash
--experimental-permission         # Enable permission model
--allow-fs-read={paths}          # Restrict file access
--disallow-code-generation-from-strings  # Block eval/new Function
--disable-proto=throw            # Block __proto__ access
--frozen-intrinsics              # Freeze built-in objects
--no-addons                       # Disable native extensions
--jitless                         # Disable JIT compilation
```

### Security Layers

1. **Runtime Level**: N|Solid hardened flags prevent dangerous APIs
2. **Container Level**: Read-only filesystem, dropped capabilities, tmpfs for temp files
3. **Network Level**: OTel collector isolated to internal compose network
4. **Audit Level**: All actions logged to persistent alert storage
5. **Control Level**: Operator-gated resumption (no automatic recovery)

### Known Limitations & Risks

⚠️ **Docker Socket Access**: Analyzer has direct access to Docker socket (privileged)  
⚠️ **No API Authentication**: Endpoints are unauthenticated  
⚠️ **SIGSTOP Risks**: Process paused indefinitely may cause resource leaks  
⚠️ **Local Only**: Assumes trusted local network, no encryption in transit  
⚠️ **Alert Storage**: Alerts stored in container (lost on restart without bind mount)  

## Usage Examples

### Example 1: Detect & Pause Suspicious Code

```bash
# 1. Start sandbox with suspicious miner
docker compose up --build -d

# 2. Watch for detection (15-30 seconds)
curl http://localhost:8080/api/alerts | jq .

# 3. Review alert details
curl http://localhost:8080/api/alerts | jq '.alerts[0]'

# 4. Resume execution for observation
curl -X POST http://localhost:8080/api/alerts/alert_{ID}/resume

# 5. Check updated status
curl http://localhost:8080/api/alerts | jq '.alerts[0].status'
```

### Example 2: Monitor Metrics

```bash
# Query CPU metrics in Prometheus
curl 'http://localhost:9090/api/v1/query?query=nsolid_process_cpu_user_percent'

# View event loop utilization
curl 'http://localhost:9090/api/v1/query?query=nsolid_env_event_loop_utilization'

# Get recent traces in Jaeger
open http://localhost:16686
# Select service: nsolid-sandbox-app
# View HTTP spans and DNS queries
```

### Example 3: Clean Up & Restart

```bash
# Stop services and remove volumes
docker compose down -v

# Restart fresh
docker compose up --build -d

# View analyzer logs
docker compose logs analyzer -f
```

## Threat Detection Patterns

The analyzer evaluates rules using real-time telemetry:

| Pattern | Detection Method | Signal |
|---------|------------------|--------|
| Crypto-Mining | Sustained high CPU (>80% for 3+ polls) | Performance degradation |
| Bot-Netting | DNS queries to denylist + outbound connections | Network telemetry |
| C2 Communication | Connections to suspicious IPs/domains + data exfil | Trace inspection + metrics |
| Resource Exhaustion | Memory spike + event loop block | Memory metrics + latency |

## Development

### Building Custom Examples

Create a new test scenario in `sandbox/app/untrusted_examples/your_example.js`:

```javascript
// Generated by Copilot (Claude 3 Haiku): Example custom test scenario
// Description: Brief description of what this code does
// Context: Use case or threat pattern it demonstrates

// Your code here
```

Update `sandbox/app/untrusted.js` dispatcher to include your example:

```javascript
case 'your_example':
  require('./untrusted_examples/your_example.js');
  break;
```

Set in `docker-compose.yml`:

```yaml
SANDBOX_EXAMPLE: your_example
```

### Modifying Detection Rules

1. Edit `sandbox/analyzer/config/rules.json`
2. Restart analyzer: `docker compose restart analyzer`
3. Monitor for changes in `/api/alerts` endpoint

### Running Tests

The completed implementation includes verified E2E tests:

```bash
# View test results
cat LOGS/E2E_TEST_RESULTS.md

# View implementation summary
cat LOGS/IMPLEMENTATION_SUMMARY.txt
```

## Troubleshooting

### Alerts Not Appearing

1. Check analyzer logs: `docker compose logs analyzer`
2. Verify Prometheus is scraping: `http://localhost:9090/targets`
3. Ensure rules are loaded: `curl http://localhost:8080/api/status`

### Dashboard Not Loading

1. Check analyzer service: `docker compose ps`
2. Verify port 8080 is accessible
3. Check browser console for errors (F12)

### High Memory Usage

The OTel collector batches telemetry. To reduce memory:
- Lower `POLL_INTERVAL_MS` in compose
- Reduce `NSOLID_OTLP_INTERVAL` in app container
- Reduce Prometheus retention period

### Container Won't Resume

1. Check if SIGCONT was received: `docker compose logs app | tail -20`
2. Force restart: `docker compose restart app`
3. Check Docker socket permissions: `ls -la /var/run/docker.sock`

## Production Readiness

⚠️ **This is NOT production-ready.** Before any extended use, consider:

1. **Authentication**: Add JWT or OAuth2 to API endpoints
2. **Encryption**: Use gRPC TLS for OTel collector communication
3. **Authorization**: Implement fine-grained RBAC for control actions
4. **Request Signing**: Add signatures to Docker API calls
5. **Secrets Management**: Use sealed secrets or HashiCorp Vault
6. **Rate Limiting**: Implement API rate limiting for metrics/alerts
7. **Testing**: Add comprehensive unit and integration tests
8. **Graceful Shutdown**: Add proper timeout handling
9. **Health Checks**: Configure compose health checks
10. **Threat Model**: Document assumptions and limitations
11. **Metrics Security**: Encrypt metrics in transit and at rest
12. **Audit Logging**: Centralize logs to external system

## Performance Characteristics

**Detection Latency**: ~15 seconds (3 × 5-second poll window)  
**Pause Effectiveness**: CPU drops to 0% within 1 second  
**Resume Speed**: Process resumes execution within 2 seconds  
**API Response Time**: 50-200ms depending on endpoint  
**Dashboard Update Frequency**: 3-second interval  

## Resources

- [N|Solid Documentation](https://docs.nsolid.io/)
- [OpenTelemetry Specification](https://opentelemetry.io/docs/)
- [Docker API Reference](https://docs.docker.com/engine/api/)
- [Prometheus Query Language](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Jaeger UI Guide](https://www.jaegertracing.io/docs/)

## Contributing

### Reporting Issues

If you find bugs or have feature requests:

1. Check existing issues in the workspace
2. Document reproduction steps
3. Include relevant logs from `LOGS/` directory
4. Describe expected vs. actual behavior

### Code Standards

All generated code includes:
- Clear Copilot attribution comment at the top
- Brief description of purpose
- Relevant context for future developers
- Error handling and logging

## License

See `LICENSE_NSOLID` for N|Solid licensing information.

## Support

For questions or issues:

1. Review implementation summary: `LOGS/IMPLEMENTATION_SUMMARY.txt`
2. Check test results: `LOGS/E2E_TEST_RESULTS.md`
3. Consult N|Solid documentation
4. Examine analyzer logs: `docker compose logs analyzer`

---

**Created**: February 27, 2026  
**Status**: Complete & Verified (E2E tested)  
**Architecture**: Docker Compose v2 (ARM64 & x86_64)  
**Author**: Generated by GitHub Copilot  
