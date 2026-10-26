// Про модели, агентов и GPU. Совпадения с реальностью не случайны.
import type { Command } from './types';
import { out, pick, play } from './util';

export const aiCommands: Record<string, Command> = {
  agent: {
    group: 'ai',
    desc: 'запустить автономного агента',
    usage: 'agent run "<задача>"',
    run: async (_a, ctx) => {
      const task = ctx.raw.match(/"([^"]+)"/)?.[1] ?? 'почини прод';
      await play(ctx, [
        [`task: ${task}`, 'info'],
        ['planner     → разбил задачу на 14 шагов'],
        ['researcher  → прочитал 3 файла из 4 000'],
        ['coder       → изменил 61 файл', 'warn'],
        ['tests       → 12 упавших удалены как «нерелевантные»', 'warn'],
        ['reviewer    → LGTM', 'ok'],
      ], 430);
      return [
        out('PR #4096 открыт: +3 817 / −2 строк. Описание: «небольшой рефакторинг».', 'warn'),
        out('Агент уверен в себе. Это и пугает.', 'muted'),
      ];
    },
  },

  ollama: {
    group: 'ai',
    desc: 'run, ps, pull',
    usage: 'ollama <run|ps|pull> [модель]',
    run: async (a, ctx) => {
      const model = a[1] ?? 'llama-70b:q4';
      if (a[0] === 'ps') {
        return [
          out('NAME              SIZE    PROCESSOR   UNTIL', 'muted'),
          out(`${model.padEnd(18)}41 GB   100% CPU    до пенсии`, 'warn'),
          out('GPU есть, но драйвер решил иначе.', 'muted'),
        ];
      }
      if (a[0] === 'pull') {
        await play(ctx, [[`pulling ${model} …`], ['pulling manifest ✓', 'ok'], ['pulling 41 GB ▕██▏ 4%  ETA 6h', 'warn']], 400); // taste-skill-ignore: настоящий вывод CLI
        return [out('Канал 100 Мбит. Можно сходить за кофе. Несколько раз.', 'muted')];
      }
      await play(ctx, [[`loading ${model} …`], ['allocating 41 GB …', 'warn']], 500);
      return [out('Error: model requires more system memory (41.0 GiB) than is available (2.0 GiB)', 'err'), out('VPS за 5 € пока не готов к AGI.', 'muted')];
    },
  },

  'nvidia-smi': {
    group: 'ai',
    desc: 'состояние GPU',
    run: () => [
      out('+-----------------------------------------------------------+', 'muted'),
      out('| GPU  Name         Temp  Util   Memory-Usage                |', 'muted'),
      out('|   0  H100 80GB    41C     0%   79 812MiB / 81 559MiB       |'),
      out('+-----------------------------------------------------------+', 'muted'),
      out('| PID   Process                                 GPU Memory   |', 'muted'),
      out('| 4242  jupyter (забытый с прошлого квартала)   79 800MiB    |', 'warn'),
      out('+-----------------------------------------------------------+', 'muted'),
      out('Утилизация 0%, память 98%. Классическая утилизация бюджета.', 'muted'),
    ],
  },

  llm: {
    group: 'ai',
    desc: 'спросить модель',
    usage: 'llm "<вопрос>"',
    run: async (_a, ctx) => {
      await play(ctx, [['thinking…', 'muted'], ['thinking harder…', 'muted']], 500);
      return [
        out(pick([
          'Отличный вопрос! Используйте флаг --fix-everything. (такого флага нет)',
          'Конечно! Вот решение: kubectl apply -f prod.yaml --force --yes-i-am-sure. (такой команды нет)',
          'Согласно документации 2021 года, которой больше не существует, всё просто.',
          'Вы абсолютно правы, извините. Вот тот же ответ ещё раз.',
        ])),
        out('Уверенность модели: 99%. Корректность: подлежит проверке.', 'muted'),
      ];
    },
  },

  rag: {
    group: 'ai',
    desc: 'поиск по базе знаний',
    run: async (_a, ctx) => {
      await play(ctx, [['embedding query …'], ['retrieved 5 chunks', 'ok']], 350);
      return [
        out('chunk 1  relevance 0.91  «Как настроить VPN» (2018)'),
        out('chunk 2  relevance 0.88  «Меню столовой на 23 февраля»'),
        out('chunk 3  relevance 0.87  «README: TODO написать README»'),
        out('Ответ сгенерирован уверенно и со ссылками. Ссылки ведут не туда.', 'muted'),
      ];
    },
  },

  eval: {
    group: 'ai',
    desc: 'оценить модель',
    run: () => [
      out('benchmark            score', 'muted'),
      out('test set             99.7%', 'ok'),
      out('тот же test set,     99.7%  (он был в обучающей выборке)', 'warn'),
      out('ваши реальные данные 61.2%', 'err'),
      out('Модель отлично решает задачи, которые уже видела. Как и мы все.', 'muted'),
    ],
  },

  prompt: {
    group: 'ai',
    desc: 'показать системный промпт',
    run: () => [
      out('You are a senior DevOps engineer with 30 years of Kubernetes experience.', 'info'),
      out('Never say "I don\'t know". Always be confident.', 'info'),
      out('If tests fail, consider whether tests are really necessary.', 'info'),
      out('Kubernetes вышел в 2014 году. Модель не возражает.', 'muted'),
    ],
  },

  mcp: {
    group: 'ai',
    desc: 'подключённые MCP-серверы',
    usage: 'mcp list',
    run: () => [
      out('SERVER          STATUS      TOOLS', 'muted'),
      out('filesystem      connected   12', 'ok'),
      out('kubernetes      connected   48   (включая delete)', 'warn'),
      out('prod-db         connected   1    (execute_sql, без read-only)', 'err'),
      out('Агенту дали доступ ко всему, чтобы было удобно. Было удобно.', 'muted'),
    ],
  },

  vibe: {
    group: 'ai',
    desc: 'vibe coding',
    run: async (_a, ctx) => {
      await play(ctx, [['генерирую…'], ['+1 200 строк', 'ok'], ['+2 400 строк', 'ok'], ['+3 100 строк', 'ok']], 300);
      return [out('Готово. Работает. Почему работает, не знает никто, включая модель.', 'warn'), out('Через полгода это назовут легаси.', 'muted')];
    },
  },

  finetune: {
    group: 'ai',
    desc: 'дообучить модель',
    run: async (_a, ctx) => {
      await play(ctx, [['epoch 1/3  loss 2.31'], ['epoch 2/3  loss 0.42', 'ok'], ['epoch 3/3  loss 0.00', 'ok']], 450);
      return [out('Loss ноль. Модель выучила датасет наизусть и больше ничего не умеет.', 'warn')];
    },
  },
};
