// Реальные метрики страницы для top, neofetch и uptime. Ничего не уходит наружу.

let longTasks = 0;
let longTaskMs = 0;

try {
  if (PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        longTasks += 1;
        longTaskMs += e.duration;
      }
    }).observe({ type: 'longtask', buffered: true });
  }
} catch {
  /* браузер не поддерживает, показываем н/д */
}

export interface ResourceRow {
  name: string;
  type: string;
  size: number;
  duration: number;
}

export function resources(): ResourceRow[] {
  return (performance.getEntriesByType('resource') as PerformanceResourceTiming[]).map((r) => {
    const url = new URL(r.name, location.origin);
    const sameOrigin = url.origin === location.origin;
    return {
      name: sameOrigin ? url.pathname : url.host + url.pathname,
      type: r.initiatorType,
      size: r.transferSize || r.encodedBodySize || 0,
      duration: r.duration,
    };
  });
}

export function pageWeight(): number {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  return (nav?.transferSize ?? 0) + resources().reduce((s, r) => s + r.size, 0);
}

export function snapshot() {
  const mem = (performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
  const conn = (navigator as Navigator & { connection?: { effectiveType?: string; rtt?: number } }).connection;
  const devMem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return {
    uptimeMs: performance.now(),
    domNodes: document.getElementsByTagName('*').length,
    heapUsed: mem?.usedJSHeapSize,
    heapLimit: mem?.jsHeapSizeLimit,
    cores: navigator.hardwareConcurrency || undefined,
    deviceMemory: devMem,
    net: conn?.effectiveType,
    rtt: conn?.rtt,
    longTasks,
    longTaskMs,
  };
}

export function browserName(): string {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\//.test(ua)) return 'Opera';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Chrome\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua)) return 'Safari';
  return 'неизвестный браузер';
}

export function platformName(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return 'iOS';
  if (/Android/.test(ua)) return 'Android';
  if (/Mac OS X/.test(ua)) return 'macOS';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Linux/.test(ua)) return 'Linux';
  return 'неизвестная ОС';
}
