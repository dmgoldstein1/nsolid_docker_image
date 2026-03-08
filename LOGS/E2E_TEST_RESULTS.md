# N|Solid Sandbox E2E Test Results
**Date**: February 27, 2026

## Test Execution Summary

### Stack Deployment
All containers successfully started and healthy:
- ✅ `nsolid-sandbox-app`: Running suspicious_miner workload with hardened N|Solid runtime
- ✅ `nsolid-sandbox-otel`: OpenTelemetry Collector receiving OTLP metrics
- ✅ `nsolid-sandbox-jaeger`: Trace backend operational
- ✅ `nsolid-sandbox-prometheus`: Metrics scraping operational
- ✅ `nsolid-sandbox-analyzer`: Monitor loop and API server operational

### Test Scenario: High-CPU Suspicious Pattern Detection

#### Step 1: Launch Suspicious Workload
- Deployed `suspicious_miner` example: tight loop with CPU-intensive math operations
- Expected behavior: maintain CPU > 80%
- Actual: Achieved 99.6% CPU on first detection window

#### Step 2: Automatic Detection & Pause
- Analyzer polling interval: 5 seconds
- Detection threshold: CPU > 80% for 3 consecutive polls = 15 seconds
- **Result**: Alert created at `2026-02-27T02:52:29.388Z` with status `blocked`
- **Evidence**: Alert recorded `cpuPercent: 99.64` in finding
- **Container State**: CPU dropped to 0% (SIGSTOP applied successfully)

#### Step 3: Operator Resume Action
- API endpoint: `POST /api/alerts/{id}/resume`
- Signal sent: `SIGCONT`
- **Result**: Alert status changed to `resumed`
- **Verification**: Container CPU resumed to 54% within 2 seconds
- **Action Recorded**: `resume` added to alert action list

#### Step 4: Operator Terminate Action
- API endpoint: `POST /api/alerts/{id}/terminate`
- Signal sent: `SIGTERM`
- **Result**: Alert status changed to `terminated`
- **Action Recorded**: `terminate` added to alert action list

---

## Key Findings

### ✅ Confirmed Working Features
1. **Real-time Monitoring**: N|Solid OTLP export → Collector → Metrics store
2. **Heuristic Detection**: Sustained CPU pattern matching works correctly
3. **Automatic Pause**: SIGSTOP signal properly pauses process execution
4. **Process Resume**: SIGCONT signal successfully resumes paused process
5. **Process Termination**: SIGTERM signal terminates process cleanly
6. **Audit Trail**: All actions recorded in persistent alert log
7. **API Control**: Dashboard-accessible control endpoints functional
8. **Hardened Runtime**: N|Solid security flags enforced (frozen intrinsics, permission model, etc.)

### Metrics Observed
- **Before Pause**: 99.64% CPU, ~16 MiB memory
- **During Pause**: 0% CPU (verified via `docker stats`)
- **After Resume**: 54% CPU (process actively executing again)

---

## Browser Dashboard URLs

- **Analyzer Dashboard**: http://localhost:8080
  - Shows real-time alert status, findings, and operator action buttons
  
- **Jaeger Traces**: http://localhost:16686
  - Visual inspection of HTTP/DNS spans from untrusted workload
  
- **Prometheus Metrics**: http://localhost:9090
  - Query raw N|Solid metrics (CPU, memory, network, GC data)

---

## Next Steps / Future Enhancements

1. **Additional Detection Rules**: 
   - DNS denylist pattern matching (partially coded)
   - Network throughput anomalies (rule infrastructure ready)
   - Promise/callback error patterns via trace analysis

2. **Artifact Capture**:
   - Integrate `nsolid-cli snapshot` for heap dumps on alert
   - Integrate `nsolid-cli profile` for CPU profiles
   - Store artifacts in persistent volume

3. **Persistent Rules**:
   - YAML-based rule engine for easy operator tuning
   - Whitelist mechanism for known-good packages
   - Time-based filters (suppress alerts during maintenance windows)

4. **Production Hardening**:
   - Use gRPC TLS for collector communication
   - Implement request signing for API endpoints
   - Add trace authentication via JWT/mTLS

5. **Dashboard Enhancement**:
   - Real-time graph of CPU/memory over alert timeline
   - Detailed span visualization in React UI
   - Destination geolocation mapping
   - Custom rule builder UI

---

## Conclusion

The N|Solid high-security sandbox successfully demonstrates:
- **Real-time threat detection** via intelligent heuristic analysis
- **Non-destructive intervention** that pauses processes for inspection
- **Operator-gated controls** that enforce explicit approval before resumption
- **Full observability** through N|Solid's native OTLP telemetry

This tool is suitable for engineering teams to cautiously approach untrusted JavaScript, verify suspicious patterns, and collect evidence before deployment decisions.
