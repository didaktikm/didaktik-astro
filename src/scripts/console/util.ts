import type { Ctx, Level, Line } from './types';

export const out = (text: string, level: Level = 'out'): Line => ({ text, level });

export const many = (level: Level, ...texts: string[]): Line[] => texts.map((t) => out(t, level));

export const pick = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

export const kb = (bytes: number) => (bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`);

export const clip = (s: string, n = 140) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Печатает строки по одной с паузой, как будто процесс реально работает */
export async function play(ctx: Ctx, seq: Array<[string, Level?]>, ms = 350) {
  for (const [text, level] of seq) {
    ctx.print([out(text, level ?? 'out')]);
    await ctx.sleep(ms);
  }
}

export const isFriday = () => new Date().getDay() === 5;

/** Русское склонение: plural(2, ['ядро', 'ядра', 'ядер']) → 'ядра' */
export function plural(n: number, forms: [string, string, string]) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

/** Минифицированный HTML приходит одной строкой: разбиваем по тегам. Обычный текст не трогаем. */
export function toRows(text: string): string[] {
  const raw = text.split('\n');
  const minified = raw.length < 4 && text.length > 300;
  return (minified ? text.replace(/></g, '>\n<').split('\n') : raw).map((l) => l.trimEnd()).filter((l) => l.trim());
}

export const fmtDuration = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h} ч ${m} мин`;
  if (m) return `${m} мин ${sec} с`;
  return `${sec} с`;
};

/** Запрос только к своему сайту: CSP всё равно не пустит наружу */
export function sameOriginPath(target: string | undefined): string | null {
  const raw = target && target.length ? target : '/';
  try {
    const url = new URL(raw, location.origin);
    if (url.origin !== location.origin) return null;
    return url.pathname + url.search;
  } catch {
    return null;
  }
}
