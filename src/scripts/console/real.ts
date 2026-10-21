// Команды, которые работают по-настоящему: запросы к сайту, метрики браузера, расчёты.
import { readTrace, fmtMs } from '../trace';
import { browserName, pageWeight, platformName, resources, snapshot } from './metrics';
import type { Command, Line } from './types';
import { clip, fmtDuration, kb, out, plural, sameOriginPath, toRows } from './util';

const fileType = (name: string, fallback: string) => {
  const ext = name.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  if (['woff2', 'woff', 'ttf', 'otf'].includes(ext)) return 'font';
  if (['js', 'mjs'].includes(ext)) return 'script';
  if (ext === 'css') return 'style';
  if (['svg', 'png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'ico'].includes(ext)) return 'image';
  return fallback;
};
const cores = (n?: number) => (n ? `${n} ${plural(n, ['ядро', 'ядра', 'ядер'])}` : '? ядер');

const FILES: Record<string, string[]> = {
  'about.txt': [
    'Платформенная инженерия, аудит и архитектура.',
    'Пишу о том, как системы ведут себя на самом деле, а не на слайдах.',
  ],
  'stack.txt': [
    'сайт       astro 5 · статика · 0 KB серверного кода',
    'отдача     caddy 2 · zstd · CSP без unsafe-inline',
    'доставка   github actions → ghcr → docker compose',
    'шрифты     unbounded · onest · martian mono (свои, не google)',
  ],
  'contact.txt': ['hello@didaktik.dev'],
};

// Файлы, которые реально лежат на сервере и читаются запросом
const REMOTE = ['robots.txt', 'sitemap.xml', 'rss.xml', 'favicon.svg'];

const csp = (what: string): Line[] => [
  out(`${what}: наружу не хожу.`, 'err'),
  out("CSP connect-src 'self' запрещает. Мы её сами настроили, так что всё честно.", 'muted'),
];

async function readRemote(path: string, signal: AbortSignal): Promise<Line[]> {
  const res = await fetch(path, { cache: 'no-store', credentials: 'omit', signal });
  if (!res.ok) return [out(`${path}: HTTP ${res.status}`, 'err')];
  const text = await res.text();
  const rows = toRows(text);
  const shown = rows.slice(0, 24).map((l) => out(clip(l)));
  const rest = rows.length - 24;
  if (rest > 0) shown.push(out(`… ещё ${rest} ${plural(rest, ['строка', 'строки', 'строк'])}, ${kb(text.length)}`, 'muted'));
  return shown;
}

async function readFile(name: string | undefined, signal: AbortSignal, notes: { id: string; title: string }[]): Promise<Line[] | null> {
  if (!name) return null;
  const clean = name.replace(/^\.\//, '');
  if (FILES[clean]) return FILES[clean].map((t) => out(t));
  if (REMOTE.includes(clean.replace(/^\//, ''))) return readRemote(`/${clean.replace(/^\//, '')}`, signal);
  const note = notes.find((n) => clean === `notes/${n.id}` || clean === n.id);
  if (note) {
    setTimeout(() => location.assign(`/notes/${note.id}/`), 500);
    return [out(note.title, 'info'), out('открываю заметку…', 'muted')];
  }
  if (clean.startsWith('/')) {
    const path = sameOriginPath(clean);
    return path ? readRemote(path, signal) : csp('cat');
  }
  return [out(`cat: ${name}: нет такого файла. Попробуйте ls`, 'err')];
}

export const realCommands: Record<string, Command> = {
  trace: {
    group: 'site',
    desc: 'трасса вашего запроса к этой странице',
    run: () => {
      const t = readTrace();
      const lines = t.spans.map((s) =>
        out(`${s.label.padEnd(16)}${fmtMs(s.duration).padStart(9)}`, s.key === t.slowest ? 'warn' : 'out'),
      );
      lines.push(out(`${'total'.padEnd(16)}${fmtMs(t.total).padStart(9)}`, 'info'));
      lines.push(out(t.real ? 'источник: Navigation Timing API, ваш запрос' : 'источник: пример, браузер не отдал тайминги', 'muted'));
      if (t.slowest === 'dns') lines.push(out('Самый долгий шаг: DNS. Как всегда.', 'warn'));
      return lines;
    },
  },

  curl: {
    group: 'site',
    desc: 'запрос к сайту: тело или заголовки',
    usage: 'curl [-I] [/путь]',
    run: async (args, ctx) => {
      const head = args.includes('-I') || args.includes('--head');
      const target = args.find((a) => !a.startsWith('-'));
      const path = sameOriginPath(target);
      if (!path) return csp('curl');
      const t0 = performance.now();
      const res = await fetch(path, { method: head ? 'HEAD' : 'GET', cache: 'no-store', credentials: 'omit', signal: ctx.signal });
      const ms = performance.now() - t0;
      if (head) {
        const lines = [out(`HTTP ${res.status} ${res.statusText}`.trim(), res.ok ? 'ok' : 'err')];
        res.headers.forEach((v, k) => lines.push(out(`${k}: ${v}`)));
        if (!res.headers.has('set-cookie')) lines.push(out('set-cookie: нет и не будет', 'muted'));
        lines.push(out(`${Math.round(ms)} мс`, 'muted'));
        return lines;
      }
      const text = await res.text();
      const rows = toRows(text);
      const lines = rows.slice(0, 18).map((l) => out(clip(l)));
      const more = rows.length > 18 ? `показано 18 из ${rows.length} строк, ` : '';
      lines.push(out(`… ${more}${kb(text.length)}, HTTP ${res.status}, ${Math.round(ms)} мс`, 'muted'));
      return lines;
    },
  },

  ls: {
    group: 'site',
    desc: 'файлы, страницы сайта (ls /) и заметки (ls notes)',
    usage: 'ls [-l] [/ | notes]',
    run: async (args, ctx) => {
      const long = args.some((a) => /^-\w*l/.test(a));
      const target = args.find((a) => !a.startsWith('-'));
      if (target?.replace(/\/$/, '') === 'notes') {
        if (ctx.notes.length === 0) return [out('notes/: пусто. Первые заметки в работе.', 'muted')];
        return ctx.notes.map((n) => out(`${n.date}  ${n.id}`));
      }
      if (target === '/') {
        const res = await fetch('/sitemap.xml', { cache: 'no-store', signal: ctx.signal });
        const xml = await res.text();
        const paths = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => new URL(m[1]).pathname);
        const lines = paths.map((p) => out(long ? `drwxr-xr-x  guest  ${p}` : p));
        lines.push(out(`${paths.length} ${plural(paths.length, ['страница', 'страницы', 'страниц'])}, источник: /sitemap.xml`, 'muted'));
        return lines;
      }
      const names = [...Object.keys(FILES), ...REMOTE, 'notes/'];
      if (!long) return [out(names.join('   '))];
      return names.map((n) => out(`${n.endsWith('/') ? 'drwxr-xr-x' : '-r--r--r--'}  guest  ${n}`));
    },
  },

  cat: {
    group: 'site',
    desc: 'показать файл (about.txt, robots.txt, sitemap.xml, rss.xml)',
    usage: 'cat <файл>',
    run: async (args, ctx) => (await readFile(args[0], ctx.signal, ctx.notes)) ?? [out('cat: укажите файл, например cat about.txt', 'err')],
  },

  less: {
    group: 'site',
    desc: 'то же, что cat, только less',
    usage: 'less <файл>',
    run: async (args, ctx) => {
      const lines = (await readFile(args[0], ctx.signal, ctx.notes)) ?? [out('less: укажите файл', 'err')];
      return [...lines, out('(END)  less is more. more is less. q не нужен, мы уже вышли.', 'muted')];
    },
  },

  ping: {
    group: 'site',
    desc: 'настоящий HTTP RTT до этого сервера',
    usage: 'ping [didaktik.dev]',
    run: async (args, ctx) => {
      const host = args.find((a) => !a.startsWith('-'));
      if (host && host !== location.hostname && host !== 'didaktik.dev') return csp('ping');
      ctx.print([out(`PING ${location.hostname} (HTTP HEAD, ICMP из браузера не отправить)`, 'muted')]);
      const times: number[] = [];
      for (let i = 1; i <= 4; i++) {
        const t0 = performance.now();
        const res = await fetch('/', { method: 'HEAD', cache: 'no-store', credentials: 'omit', signal: ctx.signal });
        const ms = performance.now() - t0;
        times.push(ms);
        ctx.print([out(`reply from ${location.hostname}: seq=${i} status=${res.status} time=${ms.toFixed(1)} ms`, 'ok')]);
        await ctx.sleep(400);
      }
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      return [
        out(`4 отправлено, 4 получено, 0% потерь. Пока не пятница.`, 'info'),
        out(`rtt min/avg/max = ${Math.min(...times).toFixed(1)}/${avg.toFixed(1)}/${Math.max(...times).toFixed(1)} ms`),
      ];
    },
  },

  top: {
    group: 'site',
    desc: 'живые метрики этой вкладки: FPS, DOM, память, ресурсы',
    run: async (_a, ctx) => {
      const block = ctx.live();
      let frames = 0;
      let fps = 0;
      let last = performance.now();
      let raf = 0;
      const tick = (now: number) => {
        frames += 1;
        if (now - last >= 1000) {
          fps = Math.round((frames * 1000) / (now - last));
          frames = 0;
          last = now;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      const render = () => {
        const s = snapshot();
        const res = resources().sort((a, b) => b.duration - a.duration).slice(0, 6);
        const clock = new Date().toLocaleTimeString('ru-RU');
        const lines: Line[] = [
          out(`top - ${clock}  up ${fmtDuration(s.uptimeMs)}  1 user (вы)  fps: ${fps || '…'}`, 'info'),
          out(`DOM: ${s.domNodes} узлов   ресурсы: ${resources().length}   long tasks: ${s.longTasks} (${Math.round(s.longTaskMs)} мс)`),
          out(
            s.heapUsed
              ? `Mem: JS heap ${(s.heapUsed / 1048576).toFixed(1)} / ${((s.heapLimit ?? 0) / 1048576).toFixed(0)} MB`
              : 'Mem: браузер не показывает размер кучи (это Chrome-only API)',
          ),
          out(
            `CPU: ${cores(s.cores)}   RAM: ${s.deviceMemory ? `${s.deviceMemory}+ GB` : 'не скажет'}   сеть: ${s.net ?? 'н/д'}${s.rtt ? `, rtt ~${s.rtt} ms` : ''}`,
          ),
          out(''),
          out(`${'PID'.padEnd(6)}${'TYPE'.padEnd(10)}${'SIZE'.padStart(10)}${'TIME'.padStart(10)}  NAME`, 'muted'),
          ...res.map((r, i) =>
            out(`${String(101 + i).padEnd(6)}${fileType(r.name, r.type).padEnd(10)}${kb(r.size).padStart(10)}${`${Math.round(r.duration)}ms`.padStart(10)}  ${clip(r.name, 60)}`),
          ),
          out(`${'1'.padEnd(6)}${'caddy'.padEnd(10)}${'0 B'.padStart(10)}${'0ms'.padStart(10)}  спит: всё уже отдано`, 'muted'),
          out(''),
          out('q или Ctrl+C: выход', 'muted'),
        ];
        block.set(lines);
      };
      try {
        while (!ctx.signal.aborted) {
          render();
          await ctx.sleep(1000);
        }
      } finally {
        cancelAnimationFrame(raf);
      }
    },
  },

  tail: {
    group: 'site',
    desc: 'tail -f access.log: запросы, которые сделала эта страница',
    usage: 'tail -f access.log',
    run: async (_a, ctx) => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const rows = [
        ...(nav ? [{ name: location.pathname, size: nav.transferSize, duration: nav.duration, type: 'document' }] : []),
        ...resources(),
      ];
      for (const r of rows) {
        const status = r.size === 0 ? '304' : '200';
        ctx.print([out(`GET ${clip(r.name, 70).padEnd(56)} ${status}  ${kb(r.size).padStart(9)}  ${Math.round(r.duration)}ms`, status === '200' ? 'out' : 'muted')]);
        await ctx.sleep(220);
      }
      ctx.print([out('(новых запросов нет: это статика, ей скучно. Ctrl+C для выхода)', 'muted')]);
      while (!ctx.signal.aborted) await ctx.sleep(1000);
    },
  },

  uptime: {
    group: 'site',
    desc: 'сколько вы здесь',
    run: () => [
      out(`up ${fmtDuration(performance.now())} с момента, как вы открыли страницу`),
      out('аптайм сервера не скажу: это OPSEC, а не скромность', 'muted'),
    ],
  },

  date: {
    group: 'site',
    desc: 'текущее время',
    run: () => [
      out(new Date().toString()),
      out(`UTC: ${new Date().toISOString()}  (в логах только так)`, 'muted'),
    ],
  },

  whoami: {
    group: 'site',
    desc: 'кто вы с точки зрения этой страницы',
    run: () => {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const motion = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduce' : 'no-preference';
      return [
        out('guest  (права: только чтение, как на аудите)'),
        out(`${browserName()} · ${platformName()} · ${navigator.language} · ${tz}`, 'muted'),
        out(`экран ${screen.width}×${screen.height} @${devicePixelRatio}x · motion: ${motion}`, 'muted'),
        out('всё это знает только ваш браузер. Сюда ничего не отправляется.', 'muted'),
      ];
    },
  },

  uname: {
    group: 'site',
    desc: 'что за система',
    usage: 'uname [-a]',
    run: (_a, ctx) => [out(`didaktik.dev astro-5 static #${ctx.buildSha} SMP PREEMPT_RT caddy/2 x86_64 GNU/Not-Linux`)],
  },

  neofetch: {
    group: 'site',
    desc: 'системная информация, красиво',
    run: (_a, ctx) => {
      const s = snapshot();
      const art = ['   ___ ', '  / _ \\', ' | | | |', ' | |_| |', '  \\___/_', '        '];
      const info = [
        'guest@didaktik.dev',
        '──────────────────',
        `OS:       didaktik.dev (static)`,
        `Kernel:   Astro 5 · Caddy 2`,
        `Build:    ${ctx.buildSha}`,
        `Shell:    didaktik shell 0.4`,
        `Fonts:    Unbounded, Onest, Martian Mono`,
        `Weight:   ${kb(pageWeight())}, трекеров 0, cookies 0`,
        `Client:   ${browserName()} на ${platformName()}, ${cores(s.cores)}`,
        `Uptime:   ${fmtDuration(s.uptimeMs)}`,
      ];
      return info.map((t, i) => out(`${(art[i] ?? '').padEnd(10)}${t}`, i === 0 ? 'info' : 'out'));
    },
  },

  env: {
    group: 'site',
    desc: 'переменные окружения',
    run: (_a, ctx) => [
      out(`SHELL=/bin/didaktik-sh`),
      out(`USER=guest`),
      out(`LANG=${navigator.language}`),
      out(`TZ=${Intl.DateTimeFormat().resolvedOptions().timeZone}`),
      out(`BUILD_SHA=${ctx.buildSha}`),
      out('EDITOR=vim  (выход пока не найден)', 'muted'),
      out('OPENAI_API_KEY=sk-…  (шутка, ключей в браузере не храним)', 'muted'),
    ],
  },

  dig: {
    group: 'site',
    desc: 'DNS для didaktik.dev',
    usage: 'dig [didaktik.dev]',
    run: () => {
      const t = readTrace();
      const dns = t.spans.find((s) => s.key === 'dns')!;
      return [
        out(';; QUESTION SECTION:', 'muted'),
        out(`;${location.hostname}.            IN  A`),
        out(';; ANSWER SECTION:', 'muted'),
        out(`${location.hostname}.   300  IN  A   (браузер не показывает IP, и правильно делает)`),
        out(`;; Query time: ${fmtMs(dns.duration)}  ${t.real ? '(из Navigation Timing)' : '(пример)'}`, 'info'),
        dns.duration < 1
          ? out(';; Меньше миллисекунды: ответ был в кэше. Это был не DNS. На этот раз.', 'muted')
          : out(';; It IS the DNS.', 'warn'),
      ];
    },
  },

  slo: {
    group: 'site',
    desc: 'бюджет ошибок для SLO, считает по-настоящему',
    usage: 'slo [99.9]',
    run: (args) => {
      const target = Number((args[0] ?? '99.9').replace(',', '.').replace('%', ''));
      if (!Number.isFinite(target) || target <= 0 || target >= 100) return [out('slo: укажите процент от 0 до 100, например slo 99.95', 'err')];
      const budget = 1 - target / 100;
      const f = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = Math.round(sec % 60);
        return [h && `${h} ч`, m && `${m} мин`, `${s} с`].filter(Boolean).join(' ');
      };
      const nines = target.toString().split('.')[1]?.length ?? 0;
      return [
        out(`SLO ${target}%: бюджет ошибок ${(budget * 100).toFixed(nines + 1)}%`, 'info'),
        out(`за день      ${f(86400 * budget)}`),
        out(`за неделю    ${f(604800 * budget)}`),
        out(`за 30 дней   ${f(2592000 * budget)}`),
        out(`за год       ${f(31536000 * budget)}`),
        out(
          target >= 99.99
            ? 'Это меньше, чем занимает один перезапуск пода. Удачи.'
            : 'Обычно весь бюджет уходит на одну выкатку в пятницу.',
          'muted',
        ),
      ];
    },
  },

  tokens: {
    group: 'ai',
    desc: 'примерно сколько токенов в тексте',
    usage: 'tokens <текст>',
    run: (_a, ctx) => {
      const text = ctx.raw.replace(/^\s*tokens\s*/i, '');
      if (!text) return [out('tokens: передайте текст, например tokens почему упал прод', 'err')];
      const cyr = (text.match(/[а-яё]/gi) ?? []).length;
      const lat = text.length - cyr;
      const est = Math.max(1, Math.round(cyr / 2.6 + lat / 4));
      return [
        out(`~${est} токенов (${text.length} символов)`, 'info'),
        out('Оценка грубая: точное число знает только токенизатор конкретной модели.', 'muted'),
        cyr > lat ? out('По-русски токенов уходит больше. Краткость теперь ещё и экономия.', 'muted') : out('', 'muted'),
      ].filter((l) => l.text);
    },
  },
};
