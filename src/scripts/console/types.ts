export type Level = 'out' | 'info' | 'ok' | 'warn' | 'err' | 'muted';

export interface Line {
  text: string;
  level: Level;
}

export interface LiveBlock {
  set(lines: Line[]): void;
}

export interface Note {
  id: string;
  title: string;
  date: string;
}

export interface Ctx {
  raw: string;
  notes: Note[];
  history: string[];
  buildSha: string;
  /** Срабатывает по Ctrl+C или q во время выполнения */
  signal: AbortSignal;
  print(lines: Line[]): void;
  /** Пауза, прерываемая Ctrl+C; при prefers-reduced-motion короче */
  sleep(ms: number): Promise<void>;
  /** Блок вывода, который можно перерисовывать (top, прогресс) */
  live(): LiveBlock;
  clear(): void;
  close(): void;
}

export type Result = Line[] | void;

export type Group = 'site' | 'devops' | 'ai' | 'fun';

export interface Command {
  group: Group;
  desc: string;
  usage?: string;
  /** Не показывать в help и автодополнении: пасхалка */
  hidden?: boolean;
  run(args: string[], ctx: Ctx): Result | Promise<Result>;
}

export class Aborted extends Error {
  constructor() {
    super('aborted');
    this.name = 'Aborted';
  }
}
