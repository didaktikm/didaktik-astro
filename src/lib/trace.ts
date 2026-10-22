// Трассировка загрузки страницы по Navigation Timing API: реальные тайминги посетителя.

export type SpanKey = 'dns' | 'tcp' | 'tls' | 'ttfb' | 'download' | 'render';

export interface Span {
  key: SpanKey;
  label: string;
  start: number;
  duration: number;
}

export interface Trace {
  spans: Span[];
  total: number;
  slowest: SpanKey;
  real: boolean;
}

export const SPAN_ORDER: SpanKey[] = ['dns', 'tcp', 'tls', 'ttfb', 'download', 'render'];

export const SPAN_META: Record<SpanKey, { label: string; name: string; text: string; hops: string[] }> = {
  dns: {
    label: 'dns',
    name: 'DNS',
    text: 'Браузер ищет IP-адрес по имени didaktik.dev. Если этот шаг самый долгий, виновник уже известен.',
    hops: ['dns'],
  },
  tcp: {
    label: 'tcp',
    name: 'TCP-соединение',
    text: 'Трёхстороннее рукопожатие TCP, без лишних эмоций. Ноль значит, что соединение уже открыто и переиспользуется.',
    hops: ['caddy'],
  },
  tls: {
    label: 'tls',
    name: 'TLS',
    text: 'Шифрование TLS. Сертификат выпускает и продлевает Caddy: ни cron, ни напоминаний в календаре не нужно.',
    hops: ['caddy'],
  },
  ttfb: {
    label: 'caddy → astro',
    name: 'Первый байт',
    text: 'Caddy передаёт запрос контейнеру со статикой. Ни базы данных, ни серверного рендеринга, поэтому ждать почти нечего.',
    hops: ['caddy', 'astro'],
  },
  download: {
    label: 'download',
    name: 'Загрузка HTML',
    text: 'Сжатый HTML страницы. Ни трекеров, ни cookies и ни баннера с просьбой их принять.',
    hops: ['astro'],
  },
  render: {
    label: 'dom ready',
    name: 'Разбор страницы',
    text: 'Браузер собирает DOM. Здесь моя зона ответственности заканчивается и начинается ваша.',
    hops: ['browser'],
  },
};

// Пример на случай, когда браузер не отдал тайминги (например, файл открыт локально).
const SAMPLE: Record<SpanKey, [number, number]> = {
  dns: [0, 12],
  tcp: [12, 18],
  tls: [30, 31],
  ttfb: [61, 47],
  download: [108, 9],
  render: [117, 67],
};

const build = (raw: Record<SpanKey, [number, number]>, real: boolean): Trace => {
  let total = 0;
  let slowest: SpanKey = 'dns';
  let slowMs = -1;
  const spans = SPAN_ORDER.map((key) => {
    const [s, d] = raw[key];
    const start = Math.max(0, s);
    const duration = Math.max(0, d);
    total = Math.max(total, start + duration);
    if (duration > slowMs) { slowMs = duration; slowest = key; }
    return { key, label: SPAN_META[key].label, start, duration };
  });
  return { spans, total: total || 1, slowest, real };
};

export function readTrace(): Trace {
  try {
    const e = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (!e || e.responseStart <= 0 || !/^https?:$/.test(location.protocol)) return build(SAMPLE, false);
    const b = e.startTime || 0;
    const tlsStart = e.secureConnectionStart > 0 ? e.secureConnectionStart : e.connectEnd;
    const domReady = e.domContentLoadedEventEnd || e.domInteractive || e.responseEnd;
    return build(
      {
        dns: [e.domainLookupStart - b, e.domainLookupEnd - e.domainLookupStart],
        tcp: [e.connectStart - b, tlsStart - e.connectStart],
        tls: [tlsStart - b, e.connectEnd - tlsStart],
        ttfb: [e.requestStart - b, e.responseStart - e.requestStart],
        download: [e.responseStart - b, e.responseEnd - e.responseStart],
        render: [e.responseEnd - b, domReady - e.responseEnd],
      },
      true,
    );
  } catch {
    return build(SAMPLE, false);
  }
}

export const fmtMs = (ms: number) => (ms < 1 ? '<1 мс' : `${Math.round(ms)} мс`);

// Тайминг разбора DOM готов только после DOMContentLoaded
export function whenTraceReady(cb: (t: Trace) => void) {
  const run = () => setTimeout(() => cb(readTrace()), 0);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
}
