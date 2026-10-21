// DevOps-юмор. Всё вымышлено, кроме боли.
import type { Command } from './types';
import { fmtDuration, isFriday, many, out, pick, play } from './util';

const CAUSES = [
  'DNS. Всегда DNS.',
  'сертификат истёк вчера в 03:12.',
  'лишний пробел в YAML на 412-й строке.',
  'кто-то «быстро поправил руками» в проде.',
  'часовые пояса. Конечно же часовые пояса.',
  'диск заполнился логами, которые логировали сами себя.',
  'cron, написанный в 2017 году, наконец сработал.',
  '«это же временный костыль».',
  'агент починил тест, удалив assert.',
  'retry без backoff положил соседний сервис.',
];

export const devopsCommands: Record<string, Command> = {
  docker: {
    group: 'devops',
    desc: 'ps, logs, build, images, compose, system prune',
    usage: 'docker <ps|logs|build|images|compose|system prune>',
    run: async (a, ctx) => {
      const sub = a[0];
      if (sub === 'ps') {
        const row = (id: string, image: string, status: string, name: string) =>
          `${id.padEnd(14)}${image.padEnd(46)}${status.padEnd(30)}${name}`;
        const id = /^[0-9a-f]+$/.test(ctx.buildSha) ? `${ctx.buildSha}a1b2c3d4e5f6`.slice(0, 12) : '3f2a1b9c0d4e';
        return [
          out(row('CONTAINER', 'IMAGE', 'STATUS', 'NAMES'), 'muted'),
          out(row(id, `ghcr.io/didaktikm/didaktik-astro:sha-${ctx.buildSha}`, `Up ${fmtDuration(performance.now())} (healthy)`, 'didaktik'), 'ok'),
          out(row('9f8e7d6c5b4a', 'caddy:2-alpine', 'Up 41 days', 'proxy')),
          out(row('0c1d2e3f4a5b', 'agent:latest', 'Restarting (1) 3 sec ago', 'agent-reviewer'), 'warn'),
          out(row('7a6b5c4d3e2f', 'nginx:latest', 'Exited (0) 2 years ago', 'do-not-delete'), 'muted'),
          out('Первая строка — этот сайт. Остальные контейнеры тоже настоящие, просто живут не здесь.', 'muted'),
        ];
      }
      if (sub === 'logs') {
        await play(ctx, [
          ['[info]  starting…'],
          ['[info]  ready'],
          ['[warn]  deprecated, will be removed in v2 (написано в 2019)', 'warn'],
          ['[error] connection refused: db:5432', 'err'],
          ['[info]  retrying in 1s… (бесконечно)'],
        ], 320);
        return [];
      }
      if (sub === 'build') {
        await play(ctx, [
          ['Sending build context to Docker daemon  4.2GB', 'warn'],
          ['Step 1/9 : FROM ubuntu:latest'],
          ['Step 4/9 : RUN apt-get install -y everything', 'warn'],
          ['Step 7/9 : COPY . .   (вместе с node_modules и .git)', 'warn'],
        ], 420);
        return many('out', 'Successfully built 3f2a1b9c. Размер образа: 4,7 ГБ. Для статического сайта.')
          .concat(out('Образ этого сайта: Caddy на alpine и статика. А .dockerignore, представьте, есть.', 'muted'));
      }
      if (sub === 'images') {
        return [
          out('REPOSITORY   TAG       SIZE', 'muted'),
          out('app          latest    4.7GB'),
          out('app          latest2   4.7GB'),
          out('app          final     4.7GB'),
          out('<none>       <none>    4.7GB   (призраки прошлых релизов)', 'muted'),
        ];
      }
      if (sub === 'compose') {
        return [
          out('[+] Running 3/4'),
          out(' ✔ Container db     Healthy', 'ok'),
          out(' ✔ Container proxy  Started', 'ok'),
          out(' ✘ Container app    Exited (1)', 'err'),
          out('db: «у меня всё хорошо». Healthcheck проверяет только, что процесс жив.', 'muted'),
        ];
      }
      if (sub === 'system' && a[1] === 'prune') {
        return [out('Deleted 214 objects. Reclaimed 38GB.', 'ok'), out('И один volume, который, как выяснилось, был нужен.', 'err')];
      }
      return [out('docker: попробуйте ps, logs, build, images, compose или system prune', 'muted')];
    },
  },

  kubectl: {
    group: 'devops',
    desc: 'get pods|nodes, describe, logs, delete, scale, rollout',
    usage: 'kubectl <get pods|get nodes|describe|logs|delete|scale|rollout>',
    run: (a) => {
      const [verb, what] = a;
      if (verb === 'get' && /^po/.test(what ?? '')) {
        return [
          out('NAME             READY  STATUS             RESTARTS     AGE', 'muted'),
          out('api-7d9f8        1/1    Running            0            12d', 'ok'),
          out('worker-5c4b2     0/1    CrashLoopBackOff   47 (2m ago)  3h', 'err'),
          out('agent-6f1a0      1/1    Running            3            2d'),
          out('llm-gateway-0    0/1    Pending            0            5h', 'warn'),
          out('legacy-0         1/1    Running            0            1104d'),
          out('legacy-0 никто не трогает. Он единственный, кто ни разу не падал.', 'muted'),
        ];
      }
      if (verb === 'get' && /^no/.test(what ?? '')) {
        return [
          out('NAME     STATUS     ROLES          AGE', 'muted'),
          out('node-1   Ready      worker         400d', 'ok'),
          out('node-2   NotReady   worker         400d   (никто не заметил)', 'err'),
          out('gpu-1    Ready      worker,$$$     3d     (стоит как первые два вместе)', 'warn'),
        ];
      }
      if (verb === 'describe') {
        return [
          out('Events:', 'muted'),
          out('  Warning  FailedScheduling  0/3 nodes available: 3 Insufficient nvidia.com/gpu.', 'warn'),
          out('  Warning  BackOff           Back-off restarting failed container', 'warn'),
          out('Коротко: кластер вас не любит. Подробности на 4000 строк YAML.', 'muted'),
        ];
      }
      if (verb === 'logs') return [out('Error from server: container is waiting to start: CrashLoopBackOff', 'err'), out('Контейнер умер, не оставив записки.', 'muted')];
      if (verb === 'delete') return [out('Error from server (Forbidden): namespaces "production" is forbidden', 'err'), out('Спасибо, RBAC. Вы только что избежали строчки «удалил прод» в резюме.', 'muted')];
      if (verb === 'scale') return [out('deployment.apps/api scaled to 0', 'ok'), out('Нулевой даунтайм достигнут. Нулевой аптайм тоже.', 'muted')];
      if (verb === 'rollout') return [out('deployment.apps/api restarted', 'ok'), out('Хорошая новость: перезапустилось. Плохая: проблема тоже.', 'muted')];
      return [out('The connection to the server localhost:8080 was refused - did you specify the right host or port?', 'err')];
    },
  },

  helm: {
    group: 'devops',
    desc: 'upgrade, rollback',
    run: (a) =>
      a[0] === 'rollback'
        ? [out('Rollback was a success! Happy Helming!', 'ok'), out('Хелм счастлив. Про базу данных он не знает.', 'muted')]
        : [
            out('Error: UPGRADE FAILED: another operation (install/upgrade/rollback) is in progress', 'err'),
            out('Релиз завис в pending-upgrade. Лечится: helm rollback, молитва или удаление секрета релиза.', 'muted'),
          ],
  },

  terraform: {
    group: 'devops',
    desc: 'plan, apply, destroy',
    usage: 'terraform <plan|apply|destroy>',
    run: async (a, ctx) => {
      if (a[0] === 'plan') return [out('Plan: 1 to add, 0 to change, 47 to destroy.', 'warn'), out('47 к удалению? Это точно то, чего мы хотели?', 'muted')];
      if (a[0] === 'apply') {
        await play(ctx, [
          ['aws_instance.prod: Modifying…'],
          ['aws_instance.prod: Still modifying… [10m elapsed]', 'warn'],
          ['aws_instance.prod: Still modifying… [20m elapsed]', 'warn'],
        ], 600);
        return [out('Error: state lock held by «ci-runner-2021». Его никто не освободит.', 'err')];
      }
      if (a[0] === 'destroy') return [out('Error: это не учения.', 'err'), out('Terraform отказывается. Он знает вас лучше, чем вы себя.', 'muted')];
      return [out('terraform: попробуйте plan, apply или destroy (последнее на свой страх)', 'muted')];
    },
  },

  git: {
    group: 'devops',
    desc: 'status, log, blame, commit, push --force',
    run: (a) => {
      const s = a[0];
      if (s === 'status') return [out('On branch main'), out('Changes not staged for commit:'), out('        modified:   everything.yaml', 'err'), out('Untracked files:'), out('        final_FINAL_v3_real.yaml', 'err')];
      if (s === 'log') return [out('a1b2c3d  fix'), out('9e8d7c6  fix fix'), out('5f4e3d2  please work'), out('77aa11b  revert "please work"'), out('1a2b3c4  initial commit (это был хороший день)', 'muted')];
      if (s === 'blame') return [out('a1b2c3d (you  2023-03-14)  // TODO: убрать до релиза'), out('a1b2c3d (you  2023-03-14)  // не трогать, не знаю почему работает'), out('Всё написали вы. Как обычно.', 'muted')];
      if (s === 'push' && a.some((x) => /^(-f|--force)/.test(x))) return [out('! [remote rejected] main -> main (protected branch hook declined)', 'err'), out('Вовремя защитили ветку. Выдохните.', 'muted')];
      if (s === 'commit') return [out('[main f00ba12] wip'), out(' 1 file changed, 4821 insertions(+)  (это был не wip)', 'warn')];
      return [out('git: попробуйте status, log, blame, commit или push --force', 'muted')];
    },
  },

  deploy: {
    group: 'devops',
    desc: 'выкатить в прод',
    run: async (_a, ctx) => {
      await play(ctx, [['build   ✓', 'ok'], ['test    ✓  (3 skipped, 12 flaky)', 'ok'], ['push    ✓', 'ok'], ['canary  …']], 380);
      if (isFriday()) return [out('production: ОТКАЗАНО. Сегодня пятница.', 'err'), out('Это не баг. Это политика выживания.', 'muted')];
      return [out('production: выкачено.', 'ok'), out('Следите за дашбордом. Желательно, чтобы смотрели не только вы.', 'muted')];
    },
  },

  rollback: {
    group: 'devops',
    desc: 'откатить релиз',
    run: async (_a, ctx) => {
      await play(ctx, [['revert to v1.8.3 …', 'warn'], ['revert to v1.2.0 …', 'warn'], ['revert to v0.0.1 …', 'warn']], 420);
      return [out('Откатились до initial commit. Продукт снова стабилен: он ничего не умеет.', 'muted')];
    },
  },

  incident: {
    group: 'devops',
    desc: 'сгенерировать постмортем',
    run: async (_a, ctx) => {
      await play(ctx, [['Собираем таймлайн…'], ['Impact: пользователи недовольны, коллеги тоже', 'warn']], 450);
      return [
        out(`Root cause: ${pick(CAUSES)}`, 'err'),
        out('Action items: добавить мониторинг, обновить runbook, никому не говорить.'),
        out('Blameless, конечно. Но все знают, кто.', 'muted'),
      ];
    },
  },

  oncall: {
    group: 'devops',
    desc: 'ночное дежурство за 3 секунды',
    run: async (_a, ctx) => {
      await play(ctx, [
        ['PagerDuty  03:12  CRITICAL  disk usage > 99% on prod-db-1', 'err'],
        ['you        03:14  ack', 'ok'],
        ['you        03:15  ssh prod-db-1 …'],
        ['PagerDuty  03:15  RESOLVED  (само)', 'ok'],
      ], 520);
      return [out('Это был /var/log. Это всегда /var/log. Спокойной ночи (нет).', 'muted')];
    },
  },

  ansible: {
    group: 'devops',
    desc: 'запустить плейбук',
    run: () => [out('PLAY [all] ******************************'), out('ok: [prod]', 'ok'), out('PLAY RECAP: changed=0  ok=1  failed=0', 'ok'), out('Идемпотентно. Ничего не изменилось, и это пугает.', 'muted')],
  },

  crontab: {
    group: 'devops',
    desc: 'что запускается по расписанию',
    usage: 'crontab -l',
    run: () => [
      out('*/5 * * * *  /opt/scripts/fix_it_again.sh'),
      out('0 3 * * 1    /opt/scripts/dont_touch_me.sh'),
      out('@reboot      /opt/scripts/why.sh'),
      out('# автор всех трёх уволился в 2019', 'muted'),
    ],
  },

  systemctl: {
    group: 'devops',
    desc: 'status',
    run: () => [
      out('● caddy.service - Caddy', 'ok'),
      out('     Active: active (running) since 41 days ago'),
      out('● friday-deploy.service', 'err'),
      out('     Active: failed (Result: exit-code)  (по пятницам всегда failed)', 'err'),
    ],
  },

  journalctl: {
    group: 'devops',
    desc: 'системный журнал',
    run: () => [
      out('-- Logs begin at Mon 2019-03-04 --', 'muted'),
      out('prod systemd[1]: Started nightly-miracle.service.'),
      out('prod app[777]: panic: not implemented  (но как-то же работало)', 'err'),
      out('prod kernel: Out of memory: Killed process 777 (app)', 'err'),
      out('OOM killer снова принял за вас сложное решение.', 'muted'),
    ],
  },

  certbot: {
    group: 'devops',
    desc: 'продлить сертификат',
    run: () => [
      out('Certificate expires in 2 days.', 'warn'),
      out('Renewal failed: порт 80 занят прокси, который вы настроили полгода назад.', 'err'),
      out('Здесь сертификаты продлевает Caddy. Сам. Без напоминаний.', 'muted'),
    ],
  },

  aws: {
    group: 'devops',
    desc: 'облако',
    run: () => [
      out('An error occurred (AccessDenied) when calling the Everything operation:', 'err'),
      out('User guest is not authorized to perform: быть счастливым'),
      out('Зато IAM-политика на 4000 строк написана с любовью.', 'muted'),
    ],
  },

  cost: {
    group: 'devops',
    desc: 'счёт за облако',
    run: () => [
      out('Cloud bill, текущий месяц: $48 213.07', 'warn'),
      out('Топ: GPU-инстанс, забытый в 2023 · NAT Gateway · «временный» бакет с логами'),
      out('Экономить страшно: вдруг это кто-то использует.', 'muted'),
      out('Этот сайт: один контейнер со статикой. Счёт за него вас не напугает.', 'ok'),
    ],
  },

  backup: {
    group: 'devops',
    desc: 'статус бэкапов',
    run: () => [out('Последний бэкап: 14 месяцев назад', 'warn'), out('Проверка восстановления: не проводилась', 'err'), out('Статус: надежда.', 'muted')],
  },

  iptables: {
    group: 'devops',
    desc: 'правила файрвола',
    run: (a) =>
      a.some((x) => /^(-F|--flush)$/.test(x))
        ? [out('iptables: правила сброшены.', 'warn'), out('Connection to prod closed by remote host.', 'err'), out('SSH тоже был правилом. Ищите KVM-консоль.', 'muted')]
        : [out('iptables: попробуйте iptables -F (здесь безопасно, на проде это резюме)', 'muted')],
  },

  standup: {
    group: 'devops',
    desc: 'дейли за 10 секунд',
    run: () => [out('Вчера: чинил то, что сломал позавчера.'), out('Сегодня: чиню то, что сломал вчера.'), out('Блокеры: хочу в отпуск.', 'muted')],
  },
};
