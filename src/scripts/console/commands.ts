// Команды консоли. Каждая возвращает строки вывода; асинхронные могут ходить в сеть (только same-origin).
import { readTrace, fmtMs } from '../trace';

export type Level = 'out' | 'info' | 'warn' | 'err' | 'muted';
export interface Line { text: string; level: Level }

export interface Ctx {
  notes: { id: string; title: string; date: string }[];
  history: string[];
  close: () => void;
  clear: () => void;
}

type Cmd = (args: string[], ctx: Ctx) => Line[] | Promise<Line[]>;

const out = (text: string, level: Level = 'out'): Line => ({ text, level });

const FILES: Record<string, string[]> = {
  'about.txt': [
    'Платформенная инженерия, аудит и архитектура.',
    'Пишу о том, как системы ведут себя на самом деле.',
  ],
  'stack.txt': ['astro · caddy · docker compose · github actions · ghcr'],
  'contact.txt': ['hello@didaktik.dev'],
};

const FORTUNES = [
  'Бэкап, который не проверяли на восстановление, это не бэкап, а надежда.',
  'Если работает, не трогай. Если не работает, не трогай в пятницу.',
  '«Временное решение» живёт в проде дольше всех.',
  'Мониторинг молчит. Либо всё хорошо, либо мониторинг тоже упал.',
  'Документация актуальна ровно до первого коммита после неё.',
];

export const COMMANDS: Record<string, Cmd> = {
  help: () => [
    out('trace              трасса вашего запроса к этой странице', 'info'),
    out('curl -I [путь]     настоящие заголовки ответа сервера', 'info'),
    out('ls, cat <файл>     файлы и заметки (ls notes)', 'info'),
    out('whoami, fortune    остальное', 'info'),
    out('history, clear, exit', 'info'),
  ],

  trace: () => {
    const t = readTrace();
    const lines = t.spans.map((s) =>
      out(`${s.label.padEnd(16)}${fmtMs(s.duration).padStart(9)}`, s.key === t.slowest ? 'warn' : 'out'),
    );
    lines.push(out(`${'total'.padEnd(16)}${fmtMs(t.total).padStart(9)}`, 'info'));
    lines.push(out(t.real ? 'источник: Navigation Timing API, ваш запрос' : 'источник: пример, браузер не отдал тайминги', 'muted'));
    if (t.slowest === 'dns') lines.push(out('Самый долгий шаг: DNS. Как всегда.', 'warn'));
    return lines;
  },

  curl: async (args) => {
    if (!args.includes('-I')) return [out('curl: попробуйте curl -I или curl -I /about/', 'muted')];
    const target = args.find((a) => a.startsWith('/')) ?? location.pathname;
    try {
      const res = await fetch(target, { method: 'HEAD', cache: 'no-store', credentials: 'omit' });
      const lines = [out(`HTTP ${res.status} ${res.statusText}`.trim(), res.ok ? 'info' : 'err')];
      res.headers.forEach((v, k) => lines.push(out(`${k}: ${v}`)));
      if (!res.headers.has('set-cookie')) lines.push(out('set-cookie: нет, и не будет', 'muted'));
      return lines;
    } catch {
      return [out('curl: запрос не прошёл. Офлайн или вы открыли файл локально.', 'err')];
    }
  },

  ls: (args, ctx) => {
    if (args[0]?.replace(/\/$/, '') === 'notes') {
      if (ctx.notes.length === 0) return [out('notes/: пусто. Первые заметки в работе.', 'muted')];
      return ctx.notes.map((n) => out(`${n.date}  ${n.id}`));
    }
    return [out(`${Object.keys(FILES).join('   ')}   notes/`)];
  },

  cat: (args, ctx) => {
    const f = args[0];
    if (!f) return [out('cat: укажите файл, например cat about.txt', 'err')];
    if (FILES[f]) return FILES[f].map((t) => out(t));
    const note = ctx.notes.find((n) => `notes/${n.id}` === f || n.id === f);
    if (note) {
      setTimeout(() => location.assign(`/notes/${note.id}/`), 400);
      return [out(`${note.title}`, 'info'), out('открываю…', 'muted')];
    }
    return [out(`cat: ${f}: нет такого файла`, 'err')];
  },

  whoami: () => [out('guest. Права только на чтение, как и положено на аудите.')],
  fortune: () => [out(FORTUNES[Math.floor(Math.random() * FORTUNES.length)])],
  history: (_a, ctx) => (ctx.history.length ? ctx.history.map((h, i) => out(`${String(i + 1).padStart(3)}  ${h}`)) : [out('пусто', 'muted')]),
  sudo: () => [out('guest не в sudoers. Об инциденте будет доложено.', 'err')],
  rm: () => [out('rm: файловая система только для чтения. Контейнер запущен с read_only.', 'err')],
  dig: () => [out('ANSWER: it IS the DNS.', 'warn')],
  clear: (_a, ctx) => { ctx.clear(); return []; },
  exit: (_a, ctx) => { ctx.close(); return []; },
};

export const COMMAND_NAMES = Object.keys(COMMANDS).sort();
