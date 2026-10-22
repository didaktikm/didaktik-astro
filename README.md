# didaktik.dev

Персональный сайт о платформенной инженерии, аудите и архитектуре.

Статический сайт на Astro. На главной трассировка загрузки страницы по реальным таймингам посетителя (Navigation Timing API), пример аудита этого же сайта и консоль-шторка (`⌘K` / `Ctrl K` или `/`). Шрифты лежат в проекте, внешних запросов, трекеров и cookies нет.

## Структура проекта

```text
.
├── src/
│   ├── components/        # Header, Footer, Hero, Trace, Work, Audit, LatestNotes, Console
│   ├── content/notes/     # заметки в Markdown (draft: true скрывает заметку)
│   ├── data/audit.ts      # данные блока «Пример аудита»
│   ├── layouts/Base.astro # общий каркас страницы и SEO-теги
│   ├── lib/
│   │   ├── build.ts       # коммит и дата сборки для футера
│   │   └── trace.ts       # измерение и модель трассы
│   ├── pages/             # главная, заметки, «Обо мне», 404, rss.xml, sitemap.xml
│   ├── scripts/
│   │   └── console/       # консоль: real.ts (настоящие), devops.ts, ai.ts, fun.ts, index.ts
│   └── styles/            # токены, базовые стили, стили внутренних страниц
├── deploy/
│   ├── Caddyfile                # раздача статики в контейнере, кэш, CSP, 404
│   ├── compose.yaml             # запуск образа из GHCR в сети proxy
│   └── proxy-snippet.Caddyfile  # блок для общего Caddy-прокси
├── Dockerfile
└── .github/workflows/ci.yml     # проверка, сборка, публикация образа
```

## Локальная разработка

Нужен Node.js 22.

```bash
npm ci
npm run dev       # http://localhost:4321
npm run check     # проверка типов
npm run build     # статический сайт в dist/
npm run preview   # просмотр собранной версии
```

В режиме `dev` трассировка показывает тайминги локального сервера, на проде — настоящие.

## Публикация образа

GitHub Actions на push в `dev` и на теги `v*` проверяет типы, собирает сайт (стадия `check`) и публикует образ в GHCR (стадия `image`):

```text
ghcr.io/didaktikm/didaktik-astro:dev-<короткий коммит>   # сборка из ветки dev, например dev-a40db62
ghcr.io/didaktikm/didaktik-astro:dev                    # последняя сборка ветки dev
ghcr.io/didaktikm/didaktik-astro:v1.2.3                 # для git-тега v1.2.3
ghcr.io/didaktikm/didaktik-astro:v1.2
```

Коммит сборки передаётся в образ через `PUBLIC_BUILD_SHA` и выводится в футере.

## Развёртывание

Нужны Docker с Compose и общая сеть `proxy`:

```bash
docker network create proxy   # если её ещё нет
DIDAKTIK_TAG=dev-1a2b3c4 docker compose -f deploy/compose.yaml up -d
```

На сервер попадает тот же образ, что прошёл CI. Откат: указать предыдущий тег и повторить команду. Контейнер работает с `read_only`, без лишних capabilities и с лимитами CPU и памяти. Порты наружу не публикуются: добавьте `deploy/proxy-snippet.Caddyfile` в общий Caddy-прокси.

Собрать образ локально:

```bash
docker build --build-arg PUBLIC_BUILD_SHA=$(git rev-parse HEAD) -t didaktik-astro:local .
```

## Содержимое

- Тексты главной: `src/components/Hero.astro`, `Work.astro`, `Audit.astro` (данные в `src/data/audit.ts`).
- Заметки: `src/content/notes/*.md`.
- Команды консоли: `src/scripts/console/` (настоящие в `real.ts`, шутки в `devops.ts`, `ai.ts`, `fun.ts`, реестр и справка в `index.ts`). Код консоли грузится лениво, при первом открытии.
