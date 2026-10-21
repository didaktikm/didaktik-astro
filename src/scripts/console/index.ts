// Реестр команд консоли: настоящие, DevOps, ИИ, развлечения и служебные.
import { aiCommands } from './ai';
import { devopsCommands } from './devops';
import { funCommands } from './fun';
import { realCommands } from './real';
import type { Command, Group, Line } from './types';
import { out } from './util';

const GROUPS: Array<[Group, string]> = [
  ['site', 'По-настоящему'],
  ['devops', 'DevOps'],
  ['ai', 'Модели и агенты'],
  ['fun', 'Прочее'],
];

const base: Record<string, Command> = { ...realCommands, ...devopsCommands, ...aiCommands, ...funCommands };

const ALIASES: Record<string, string> = {
  htop: 'top',
  traceroute: 'trace',
  head: 'cat',
  more: 'less',
  postmortem: 'incident',
  contact: 'hire',
  netstat: 'top',
  k: 'kubectl',
  tf: 'terraform',
};

const service: Record<string, Command> = {
  help: {
    group: 'site',
    desc: 'список команд',
    run: () => {
      const lines: Line[] = [];
      for (const [g, title] of GROUPS) {
        const names = Object.entries(COMMANDS)
          .filter(([, c]) => c.group === g && !c.hidden)
          .map(([n]) => n)
          .sort();
        lines.push(out(title, 'info'));
        for (let i = 0; i < names.length; i += 6) lines.push(out(`  ${names.slice(i, i + 6).map((n) => n.padEnd(12)).join('')}`));
      }
      lines.push(out('man <команда> подробнее · tab дополняет · ↑↓ история · q или Ctrl+C прерывает', 'muted'));
      lines.push(out('Есть и скрытые команды. Ищите.', 'muted'));
      return lines;
    },
  },
  man: {
    group: 'site',
    desc: 'справка по команде',
    usage: 'man <команда>',
    run: (a) => {
      const name = a[0]?.toLowerCase();
      if (!name) return [out('What manual page do you want?', 'err'), out('Например: man top', 'muted')];
      const key = ALIASES[name] ?? name;
      const c = COMMANDS[key];
      if (!c || c.hidden) return [out(`No manual entry for ${name}`, 'err'), out('Попробуйте прочитать исходники. Они, кстати, открыты.', 'muted')];
      return [out(`${name}: ${c.desc}`, 'info'), ...(c.usage ? [out(`использование: ${c.usage}`)] : [])];
    },
  },
  history: {
    group: 'site',
    desc: 'история команд',
    run: (_a, ctx) => (ctx.history.length ? ctx.history.map((h, i) => out(`${String(i + 1).padStart(4)}  ${h}`)) : [out('пусто, как после git clean -fdx', 'muted')]),
  },
  clear: { group: 'site', desc: 'очистить экран (Ctrl+L)', run: (_a, ctx) => { ctx.clear(); } },
  exit: { group: 'site', desc: 'закрыть консоль (Esc)', run: (_a, ctx) => { ctx.close(); } },
  echo: { group: 'site', desc: 'повторить текст', run: (_a, ctx) => [out(ctx.raw.replace(/^\s*echo\s*/i, ''))] },
  pwd: { group: 'site', desc: 'где вы', run: () => [out(location.pathname)] },
  cd: { group: 'site', desc: 'перейти на страницу', usage: 'cd / | cd notes | cd about', hidden: false, run: (a) => {
    const target = (a[0] ?? '/').replace(/^\/+|\/+$/g, '');
    const map: Record<string, string> = { '': '/', '~': '/', '..': '/', notes: '/notes/', about: '/about/' };
    const dest = map[target];
    if (!dest) return [out(`cd: ${a[0]}: нет такой страницы. Попробуйте ls /`, 'err')];
    if (dest === location.pathname) return [out('вы уже здесь', 'muted')];
    setTimeout(() => location.assign(dest), 300);
    return [out(`→ ${dest}`, 'info')];
  } },
};

export const COMMANDS: Record<string, Command> = { ...base, ...service };

export function resolve(name: string): Command | null {
  const key = name.toLowerCase();
  const real = ALIASES[key] ?? key;
  return Object.prototype.hasOwnProperty.call(COMMANDS, real) ? COMMANDS[real] : null;
}

export const VISIBLE_NAMES = Object.entries(COMMANDS)
  .filter(([, c]) => !c.hidden)
  .map(([n]) => n)
  .sort();

/** Пасхалки, которые не являются командами в привычном смысле */
export function special(raw: string) {
  if (/:\(\)\s*\{\s*:\|:&\s*\};\s*:/.test(raw.replace(/\s+/g, ' ')) || /:\(\)\s*\{/.test(raw)) {
    return [
      out('bash: fork: retry: Resource temporarily unavailable', 'err'),
      out('ulimit -u спас вас от позора. И браузер тоже.', 'muted'),
    ];
  }
  if (/^\s*(сделай|почини|fix)\b/i.test(raw)) {
    return [out('Это консоль, а не агент. Для магии попробуйте: agent run "почини прод"', 'muted')];
  }
  return null;
}
