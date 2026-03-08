'use strict';

const http = require('http');
const https = require('https');
const os = require('os');

const PORT = process.env.PORT || 3000;
const START_TIME = Date.now();

// ClickHouse connection settings
const CLICKHOUSE_URL = process.env.CLICKHOUSE_URL || 'http://clickhouse:8123';
const CLICKHOUSE_DB = process.env.CLICKHOUSE_DB || 'nsolid';
const CLICKHOUSE_USER = process.env.CLICKHOUSE_USER || 'nsolid';
const CLICKHOUSE_PASSWORD = process.env.CLICKHOUSE_PASSWORD || 'nsolid_password';

/** Query ClickHouse for traces */
async function queryClickHouse(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(CLICKHOUSE_URL);
    // Use query params for auth (like curl does)
    const params = new URLSearchParams({
      user: CLICKHOUSE_USER,
      password: CLICKHOUSE_PASSWORD,
      database: CLICKHOUSE_DB,
    });
    const queryParam = encodeURIComponent(sql + ' FORMAT JSON');

    const options = {
      hostname: url.hostname,
      port: url.port || 8123,
      path: `/?${params}&query=${queryParam}`,
      method: 'POST',
      timeout: 5000,
    };

    const req = (url.protocol === 'https:' ? https : http).request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            resolve([]);
            return;
          }
          const result = JSON.parse(data);
          resolve(result.data || []);
        } catch (e) {
          resolve([]);
        }
      });
    });

    req.on('error', () => resolve([]));
    req.on('timeout', () => { req.destroy(); resolve([]); });
    req.end();
  });
}

/** Get traces from ClickHouse */
async function getTracesFromClickHouse(limit = 50) {
  const sql = `
    SELECT
      TraceId as traceId,
      SpanId as spanId,
      Name as name,
      ServiceName as service,
      DurationMs as duration,
      StartTime as startTime,
      StatusCode as statusCode,
      StatusMessage as statusMessage,
      Attributes as attributes
    FROM nsolid.traces
    ORDER BY StartTime DESC
    LIMIT ${parseInt(limit, 10)}
  `;

  console.log('[traces] SQL:', sql);
  const rows = await queryClickHouse(sql);
  console.log('[traces] Raw rows:', JSON.stringify(rows).substring(0, 500));

  // Transform ClickHouse rows to TraceSpan format
  return rows.map(row => ({
    traceId: row.traceId || '',
    spanId: row.spanId || '',
    name: row.name || 'unknown',
    service: row.service || 'unknown',
    duration: parseFloat(row.duration) || 0,
    startTime: row.startTime ? new Date(row.startTime).toISOString() : new Date().toISOString(),
    status: mapStatusCode(row.statusCode),
    attributes: parseAttributes(row.attributes),
  }));
}

/** Map ClickHouse status code to TraceSpan status */
function mapStatusCode(statusCode) {
  if (statusCode === 0) return 'ok';
  if (statusCode === 1) return 'error';
  return 'unset';
}

/** Parse attributes string to object */
function parseAttributes(attrStr) {
  if (!attrStr) return {};
  try {
    return JSON.parse(attrStr);
  } catch {
    return {};
  }
}

/** Map OpenTelemetry span kind to frontend format */
function mapSpanKind(attributes) {
  const kind = attributes['span.kind'];
  if (kind === 'client') return 'client';
  if (kind === 'server') return 'server';
  if (kind === 'internal') return 'internal';
  if (kind === 'producer') return 'producer';
  if (kind === 'consumer') return 'consumer';
  // Default based on common patterns
  if (attributes['http.method'] || attributes['http.client.method']) return 'client';
  if (attributes['http.route'] || attributes['http.url']) return 'server';
  return 'internal';
}

/** Get trace count per minute for overview */
async function getTracesPerMinute() {
  const sql = `
    SELECT count(*) as cnt
    FROM nsolid.traces
    WHERE StartTime >= now() - INTERVAL 1 MINUTE
  `;

  const rows = await queryClickHouse(sql);
  return rows[0]?.cnt || 0;
}

/** Collect lightweight process metrics */
function getMetrics() {
  const mem = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  const configuredAppName = process.env.NSOLID_APP || process.env.OTEL_SERVICE_NAME;
  return {
    pid: process.pid,
    title: configuredAppName || process.title || 'nsolid-runtime',
    uptime: process.uptime(),
    version: process.version,
    memory: Math.round(mem.rss / 1024 / 1024),
    heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
    heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
    cpu: parseFloat(((cpuUsage.user + cpuUsage.system) / 1e6).toFixed(2)),
    eventLoopDelay: 0,
    hostname: os.hostname(),
    platform: process.platform,
    arch: process.arch,
  };
}

/** Transform metrics into Process format expected by frontend */
function getProcess() {
  const metrics = getMetrics();
  const now = Date.now();
  const startTime = START_TIME;
  
  // Determine N|Solid version from process.version or default
  const nodeVersion = process.version || 'unknown';
  const nsolidVersion = process.versions?.nsolid || 'n/a';
  
  // Determine process status based on uptime
  let status = 'active';
  const timeSinceLastSeen = now - now; // Always 0 since we're live
  if (timeSinceLastSeen > 60000) {
    status = 'degraded';
  }
  if (timeSinceLastSeen > 300000) {
    status = 'dead';
  }
  
  return {
    id: `${metrics.pid}`,
    appName: metrics.title,
    hostname: metrics.hostname,
    threadId: '0', // Main thread
    startTime: startTime,
    lastSeen: now,
    status: status,
    version: {
      node: nodeVersion,
      nsolid: nsolidVersion,
    },
    tags: {
      platform: metrics.platform,
      arch: metrics.arch,
    },
  };
}

/** Wrap response in ApiResponse format */
function apiResponse(data, success = true, error = null) {
  const response = { success };
  if (data !== undefined) {
    response.data = data;
  }
  if (error) {
    response.error = error;
  }
  if (Array.isArray(data)) {
    response.count = data.length;
  }
  return response;
}

/** Get detailed metrics in the format expected by frontend */
function getDetailedMetrics() {
  const mem = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  const now = Date.now();
  
  return {
    timestamp: now,
    processId: `${process.pid}`,
    cpuPercent: parseFloat(((cpuUsage.user + cpuUsage.system) / 1e6).toFixed(2)),
    cpuSystemPercent: parseFloat((cpuUsage.system / 1e6).toFixed(2)),
    cpuUserPercent: parseFloat((cpuUsage.user / 1e6).toFixed(2)),
    heapUsed: mem.heapUsed,
    heapTotal: mem.heapTotal,
    heapLimit: mem.heapTotal * 2, // Approximate
    rss: mem.rss,
    external: mem.external || 0,
    loopUtilization: 0.5,
    loopAvgTasks: 1,
    loopIdlePercent: 50,
    gcCount: 0,
    gcMajor: 0,
    gcFull: 0,
    gcForced: 0,
    gcDurUs99Ptile: 0,
    httpClientCount: 0,
    httpServerCount: 1,
    dnsCount: 0,
    activeHandles: process._getActiveHandles ? process._getActiveHandles().length : 0,
    activeRequests: process._getActiveRequests ? process._getActiveRequests().length : 0,
    eventLoopLag: 0,
    httpClientDurationAvg: 0,
    httpServerDurationAvg: 10,
  };
}

function getNumericMetricValue(metricName) {
  const mem = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  switch (metricName) {
    case 'process.cpu.percent':
      return parseFloat(((cpuUsage.user + cpuUsage.system) / 1e6).toFixed(2));
    case 'process.memory.heap_used':
      return mem.heapUsed;
    case 'process.memory.rss':
      return mem.rss;
    case 'nodejs.eventloop.lag':
      return 0;
    case 'nodejs.active_handles':
      return process._getActiveHandles ? process._getActiveHandles().length : 0;
    case 'http.server.duration':
      return 10;
    default:
      return 0;
  }
}

function json(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    return json(res, 200, { status: 'ok', uptime: process.uptime() });
  }

  if (req.method === 'GET' && url.pathname === '/api/overview') {
    const metrics = getMetrics();
    const tracesPerMinute = await getTracesPerMinute();
    return json(res, 200, apiResponse({
      totalProcesses: 1,
      avgCpu: metrics.cpu,
      avgMemory: metrics.memory,
      avgHeapUsed: metrics.heapUsed,
      avgEventLoopDelay: metrics.eventLoopDelay,
      tracesPerMinute,
      errorRate: 0,
    }));
  }

  if (req.method === 'GET' && url.pathname === '/api/processes') {
    // Query ClickHouse for all active processes from OTel metrics
    const sql = `
      WITH ranked_sessions AS (
        SELECT
          ResourceAttributes['process.pid'] AS process_id,
          ResourceAttributes['service.name'] AS app_name,
          ResourceAttributes['host.name'] AS hostname,
          ResourceAttributes['process.runtime.version'] AS node_version,
          max(StartTimeUnix) AS first_seen,
          max(TimeUnix) AS last_seen,
          ResourceAttributes AS tags,
          ROW_NUMBER() OVER (PARTITION BY ResourceAttributes['service.name'], ResourceAttributes['host.name'] ORDER BY max(StartTimeUnix) DESC) AS session_rank
        FROM otel_metrics_gauge
        WHERE TimeUnix >= now() - INTERVAL 30 SECOND
        GROUP BY process_id, app_name, hostname, node_version, tags
      )
      SELECT process_id, app_name, hostname, node_version, first_seen, last_seen, tags
      FROM ranked_sessions
      WHERE session_rank = 1
      ORDER BY last_seen DESC LIMIT 100
    `;

    try {
      const queryParams = new URLSearchParams({
        user: 'nsolid',
        password: 'nsolid_password',
        database: 'nsolid',
        query: sql + ' FORMAT JSON',
      });

      const response = await fetch(`http://clickhouse:8123/?${queryParams.toString()}`, {
        method: 'GET',
      });

      const result = await response.json();
      const processes = (result.data || []).map(row => {
        const lastSeenMs = parseInt(row.last_seen) / 1000;
        const now = Date.now();
        const timeSinceSeen = now - lastSeenMs;

        let status = 'active';
        if (timeSinceSeen > 30000) status = 'degraded';
        if (timeSinceSeen > 120000) status = 'dead';

        return {
          id: row.process_id || '0',
          appName: row.app_name || 'unknown',
          hostname: row.hostname || os.hostname(),
          threadId: '0',
          startTime: parseInt(row.first_seen) / 1000,
          lastSeen: lastSeenMs,
          status: status,
          version: {
            node: row.node_version || 'unknown',
            nsolid: '6.2.0',
          },
          tags: {
            platform: process.platform,
            arch: process.arch,
          },
        };
      });

      return json(res, 200, apiResponse(processes));
    } catch (error) {
      console.error('Error querying processes:', error);
      return json(res, 500, apiResponse([]));
    }
  }

  if (req.method === 'GET' && url.pathname === '/api/scatterplot') {
    const xMetric = url.searchParams.get('xMetric') || 'process.cpu.percent';
    const yMetric = url.searchParams.get('yMetric') || 'process.memory.heap_used';
    const process = getProcess();

    return json(
      res,
      200,
      apiResponse([
        {
          processId: process.id,
          appName: process.appName,
          x: getNumericMetricValue(xMetric),
          y: getNumericMetricValue(yMetric),
          metadata: {
            hostname: process.hostname,
            uptime: Date.now() - process.startTime,
            status: process.status,
          },
        },
      ])
    );
  }

  if (req.method === 'GET' && url.pathname === '/api/events') {
    const process = getProcess();
    return json(
      res,
      200,
      apiResponse([
        {
          timestamp: Date.now(),
          processId: process.id,
          severity: 'info',
          message: 'Runtime telemetry heartbeat',
          traceId: undefined,
          spanId: undefined,
          attributes: {
            source: 'nsolid-runtime',
          },
          serviceName: process.appName,
          appName: process.appName,
          hostname: process.hostname,
        },
      ])
    );
  }

  if (req.method === 'GET' && url.pathname === '/api/assets/summaries') {
    const process = getProcess();
    return json(
      res,
      200,
      apiResponse([
        {
          serviceName: process.appName,
          processId: process.id,
          hostname: process.hostname,
          nodeVersion: process.version.node,
          nsolidVersion: process.version.nsolid,
          sdkName: 'opentelemetry',
          sdkVersion: process.version.nsolid,
          lastSeen: process.lastSeen,
        },
      ])
    );
  }

  if (req.method === 'GET' && url.pathname === '/api/security') {
    const process = getProcess();
    return json(
      res,
      200,
      apiResponse([
        {
          serviceName: process.appName,
          processId: process.id,
          hostname: process.hostname,
          nodeVersion: process.version.node,
          totalVulnerabilities: 0,
          critical: 0,
          high: 0,
          moderate: 0,
          low: 0,
          vulnerabilities: [],
          lastScanned: Date.now(),
        },
      ])
    );
  }

  // Match /api/processes/:id/metrics/latest
  const metricsLatestMatch = url.pathname.match(/^\/api\/processes\/([^\/]+)\/metrics\/latest$/);
  if (req.method === 'GET' && metricsLatestMatch) {
    const processId = metricsLatestMatch[1];
    // Verify it's our process
    if (processId === `${process.pid}` || processId === '1') {
      return json(res, 200, apiResponse(getDetailedMetrics()));
    }
    return json(res, 404, apiResponse(null, false, 'Process not found'));
  }

  // Match /api/processes/:id/metrics?startTime=...&endTime=...
  const metricsMatch = url.pathname.match(/^\/api\/processes\/([^\/]+)\/metrics$/);
  if (req.method === 'GET' && metricsMatch) {
    const processId = metricsMatch[1];
    // Verify it's our process
    if (processId === `${process.pid}` || processId === '1') {
      // Return array with just current metrics (mock historical data)
      return json(res, 200, apiResponse([getDetailedMetrics()]));
    }
    return json(res, 404, apiResponse(null, false, 'Process not found'));
  }

  // Match /api/processes/:id
  const processMatch = url.pathname.match(/^\/api\/processes\/([^\/]+)$/);
  if (req.method === 'GET' && processMatch) {
    const processId = processMatch[1];
    // Verify it's our process
    if (processId === `${process.pid}` || processId === '1') {
      return json(res, 200, apiResponse(getProcess()));
    }
    return json(res, 404, apiResponse(null, false, 'Process not found'));
  }

  if (req.method === 'GET' && url.pathname === '/api/traces') {
    const limit = url.searchParams.get('limit') || '50';
    console.log('[traces] Fetching traces with limit:', limit);
    const traces = await getTracesFromClickHouse(limit);
    console.log('[traces] Found traces:', traces.length);
    return json(res, 200, apiResponse(traces));
  }

  // Network spans endpoint - returns HTTP and DNS spans for network analysis
  if (req.method === 'GET' && url.pathname === '/api/network') {
    const limit = parseInt(url.searchParams.get('limit') || '200', 10);
    const serviceName = url.searchParams.get('serviceName');

    let sql = `
      SELECT
        TraceId as traceId,
        SpanId as spanId,
        ParentSpanId as parentSpanId,
        Name as name,
        ServiceName as serviceName,
        StartTime as startTime,
        EndTime as endTime,
        DurationMs as durationMs,
        StatusCode as statusCode,
        StatusMessage as statusMessage,
        Attributes as attributes
      FROM nsolid.traces
    `;

    if (serviceName) {
      sql += ` WHERE ServiceName = '${serviceName.replace(/'/g, "''")}'`;
    }

    sql += ` ORDER BY StartTime DESC LIMIT ${limit}`;

    const rows = await queryClickHouse(sql);

    // Transform to Span format for Network view
    const spans = rows.map(row => {
      const attrs = parseAttributes(row.attributes);
      const startTime = row.startTime ? new Date(row.startTime).getTime() : Date.now();
      const endTime = row.endTime ? new Date(row.endTime).getTime() : startTime + (row.durationMs || 0);

      // Extract HTTP attributes
      const http = attrs['http.method'] || attrs['http.client.method'] ? {
        method: attrs['http.method'] || attrs['http.client.method'] || 'GET',
        url: attrs['http.url'] || attrs['http.client.url'] || '',
        statusCode: parseInt(attrs['http.status_code'] || attrs['http.response.status_code'] || '0', 10),
        statusText: '',
        protocolVersion: '1.1',
      } : undefined;

      // Extract DNS attributes
      const dns = attrs['dns.op_type'] ? {
        hostname: attrs['dns.name'] || attrs['server.address'] || '',
        opType: attrs['dns.op_type'] || 'lookup',
        rrtype: attrs['dns.rr_type'] || undefined,
        port: attrs['server.port'] ? parseInt(String(attrs['server.port']), 10) : undefined,
        address: attrs['dns.ip_addresses'] ? String(attrs['dns.ip_addresses']).split(',') : undefined,
      } : undefined;

      return {
        traceId: row.traceId || '',
        spanId: row.spanId || '',
        parentSpanId: row.parentSpanId || undefined,
        name: row.name || 'unknown',
        kind: mapSpanKind(attrs),
        startTime,
        endTime,
        duration: parseFloat(row.durationMs) || 0,
        status: {
          code: mapStatusCode(row.statusCode),
          message: row.statusMessage || undefined,
        },
        attributes: attrs,
        events: [],
        threadId: '0',
        threadName: 'main',
        serviceName: row.serviceName || 'unknown',
        http,
        dns,
      };
    });

    return json(res, 200, apiResponse(spans));
  }

  json(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`[nsolid-runtime] Listening on port ${PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
