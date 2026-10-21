// Развлечения и пасхалки. Скрытые команды не видны в help: их находят сами.
import type { Command, Line } from './types';
import { out, pick, play } from './util';

const FORTUNES = [
  'Бэкап, который не проверяли на восстановление, это не бэкап, а надежда.',
  'Если работает, не трогай. Если не работает, не трогай в пятницу.',
  '«Временное решение» живёт в проде дольше всех.',
  'Мониторинг молчит. Либо всё хорошо, либо мониторинг тоже упал.',
  'Документация актуальна ровно до первого коммита после неё.',
  'Любая достаточно сложная инфраструктура содержит скрипт, который все боятся удалить.',
  'Нет ничего более постоянного, чем feature flag «на одну неделю».',
  'ИИ не заменит инженера. Инженера заменит инженер, который проверяет за ИИ.',
  'Самый надёжный распределённый консенсус: «давайте не будем деплоить».',
];

const cow = (text: string): Line[] => {
  const t = text.length > 48 ? `${text.slice(0, 47)}…` : text;
  const bar = '-'.repeat(t.length + 2);
  return [
    ` ${bar}`,
    `< ${t} >`,
    ` ${bar}`,
    '        \\   ^__^',
    '         \\  (oo)\\_______',
    '            (__)\\       )\\/\\',
    '                ||----w |',
    '                ||     ||',
  ].map((l) => out(l));
};

const TRAIN = [
  '      ====        ________                ___________ ',
  '  _D _|  |_______/        \\__I_I_____===__|_________| ',
  '   |(_)---  |   H\\________/ |   |        =|___ ___|   ',
  '   /     |  |   H  |  |     |   |         ||_| |_||   ',
  '  |      |  |   H  |__--------------------| [___] |   ',
  '  | ________|___H__/__|_____/[][]~\\_______|       |   ',
  '  |/ |   |-----------I_____I [][] []  D   |=======|__ ',
];

export const funCommands: Record<string, Command> = {
  fortune: { group: 'fun', desc: 'мудрость дня', run: () => [out(pick(FORTUNES))] },

  cowsay: {
    group: 'fun',
    desc: 'корова говорит',
    usage: 'cowsay <текст>',
    run: (_a, ctx) => cow(ctx.raw.replace(/^\s*cowsay\s*/i, '') || 'работает на моей машине'),
  },

  coffee: {
    group: 'fun',
    desc: 'сварить кофе',
    run: () => [
      ...['    ( (', '     ) )', '  ........', '  |      |]', '  \\      /', "   `----'"].map((l) => out(l)),
      out('HTTP 418: я чайник. Но кофе сварил.', 'warn'),
    ],
  },

  hire: {
    group: 'fun',
    desc: 'как со мной связаться',
    run: () => [out('hello@didaktik.dev', 'info'), out('Беру интересные задачи. Скучных у всех и так хватает.', 'muted')],
  },

  works: {
    group: 'fun',
    desc: 'классика',
    run: () => [out('Работает на моей машине.'), out('Тогда отправляем в прод вашу машину.', 'muted')],
  },

  sl: {
    group: 'fun',
    desc: 'вы опечатались в ls',
    run: async (_a, ctx) => {
      const block = ctx.live();
      const width = 44;
      for (let x = width; x >= -TRAIN[0].length; x -= 3) {
        block.set(TRAIN.map((row) => out(x >= 0 ? ' '.repeat(x) + row : row.slice(-x), 'muted')));
        await ctx.sleep(70);
      }
      block.set([out('Поезд ушёл. Как и дедлайн.', 'muted')]);
    },
  },

  yes: {
    group: 'fun',
    desc: 'согласиться со всем',
    run: async (_a, ctx) => {
      for (let i = 0; i < 6; i++) {
        ctx.print([out('y')]);
        await ctx.sleep(120);
      }
      return [out('(остановлено здравым смыслом)', 'muted')];
    },
  },

  // ---------- скрытые ----------
  sudo: {
    group: 'fun',
    desc: '',
    hidden: true,
    run: async (_a, ctx) => {
      if (/make me a sandwich/i.test(ctx.raw)) return [out('Okay.', 'ok')];
      if (/rm\s+-\w*r\w*f|rm\s+-\w*f\w*r/.test(ctx.raw)) return funCommands.rm.run([], ctx);
      return [out('guest is not in the sudoers file. This incident will be reported.', 'err'), out('Отчёт уже ушёл в /dev/null.', 'muted')];
    },
  },

  rm: {
    group: 'fun',
    desc: '',
    hidden: true,
    run: async (_a, ctx) => {
      if (!/-\w*r\w*f|-\w*f\w*r/.test(ctx.raw)) return [out('rm: missing operand', 'err')];
      await play(ctx, [['removing /usr …', 'warn'], ['removing /var …', 'warn'], ['removing /home …', 'warn']], 450);
      return [out('Шучу. Контейнер запущен с read_only, файловая система не даст.', 'ok')];
    },
  },

  chmod: {
    group: 'fun',
    desc: '',
    hidden: true,
    run: (_a, ctx) => (/777/.test(ctx.raw) ? [out('chmod: служба безопасности уже в курсе.', 'err')] : [out('chmod: ok', 'ok')]),
  },

  kill: {
    group: 'fun',
    desc: '',
    hidden: true,
    run: (_a, ctx) => (/-9/.test(ctx.raw) ? [out('Killed. Без шансов на graceful shutdown.', 'err')] : [out('kill: попробуйте kill -9, но сначала подумайте', 'muted')]),
  },

  vim: { group: 'fun', desc: '', hidden: true, run: () => [out('~'), out('~'), out('-- INSERT --', 'info'), out('Вы в vim. Выход: Esc, затем :q! (но это не точно).', 'muted')] },
  ':q': { group: 'fun', desc: '', hidden: true, run: () => [out('Вы не в vim. Но приятно, что вы готовы.', 'muted')] },
  ':q!': { group: 'fun', desc: '', hidden: true, run: () => [out('Вы не в vim. Но решительность ценим.', 'muted')] },
  ':wq': { group: 'fun', desc: '', hidden: true, run: () => [out('Сохранять нечего. Выходить некуда. Вы уже в проде.', 'muted')] },
  emacs: { group: 'fun', desc: '', hidden: true, run: () => [out('Загрузка… ещё загрузка… это операционная система, а не редактор.', 'muted')] },
  nano: { group: 'fun', desc: '', hidden: true, run: () => [out('GNU nano 7.2'), out('^X Exit  (тут всё подписано, это же nano)', 'muted')] },
  '42': { group: 'fun', desc: '', hidden: true, run: () => [out('Ответ найден. Вопрос потерян при миграции.', 'info')] },
  make: {
    group: 'fun',
    desc: '',
    hidden: true,
    run: (a, ctx) => (a[0] === 'coffee' ? (funCommands.coffee.run([], ctx) as Line[]) : [out("make: *** No rule to make target. Stop.", 'err')]),
  },
  please: { group: 'fun', desc: '', hidden: true, run: () => [out('Вежливость не повышает привилегии. Но мне приятно.', 'muted')] },
  hello: { group: 'fun', desc: '', hidden: true, run: () => [out('Привет. Попробуйте help или top.', 'info')] },
  matrix: { group: 'fun', desc: '', hidden: true, run: () => [out('Wake up, Neo… а, нет, это просто CrashLoopBackOff.', 'ok')] },
};
