// Аудит этого сайта: что было найдено и что сделано. Обновлять вместе с изменениями в репозитории.
export type Score = 'pass' | 'warn' | 'fail';

export interface AuditCheck {
  check: string;
  method: string;
  before: string;
  after: string;
  score: Score;
  label: string;
  keywords: string;
}

export const auditDate = '2026-10-21';

export const audit: AuditCheck[] = [
  {
    check: 'Воспроизводимость сборки',
    keywords: 'сборка воспроизводимость lockfile npm ci кэш зависимости build docker',
    method: 'Сравнение lockfile и команд установки',
    before: 'npm install в Dockerfile и CI, lockfile не обязателен',
    after: 'npm ci по lockfile, кэш npm в CI и в Docker',
    score: 'pass',
    label: 'исправлено',
  },
  {
    check: 'Что задеплоено',
    keywords: 'деплой задеплоено образ ci сервер прод registry ghcr compose тот же',
    method: 'Сравнение образа из CI и образа на сервере',
    before: 'compose собирал образ на сервере, мимо GHCR',
    after: 'compose тянет из GHCR тот же образ, что прошёл CI',
    score: 'pass',
    label: 'исправлено',
  },
  {
    check: 'Версии и откат',
    keywords: 'откат версия тег коммит релиз rollback минута',
    method: 'Связь тега образа с коммитом',
    before: 'тег build-<run_id> не указывает на коммит',
    after: 'теги sha-<коммит> и vX.Y.Z, откат сменой тега',
    score: 'pass',
    label: 'исправлено',
  },
  {
    check: 'Кэширование статики',
    keywords: 'кэш статика заголовки cache-control скорость cdn',
    method: 'Разбор заголовков ответа',
    before: 'нет Cache-Control для хешированных файлов',
    after: '/_astro/* immutable на год, HTML всегда проверяется',
    score: 'pass',
    label: 'исправлено',
  },
  {
    check: 'Здоровье контейнера',
    keywords: 'healthcheck здоровье контейнер 404 ошибка падение',
    method: 'Проверка healthcheck и ошибок',
    before: 'нет healthcheck, нет страницы 404',
    after: 'HEALTHCHECK в образе, 404 оформлена как инцидент',
    score: 'pass',
    label: 'исправлено',
  },
  {
    check: 'Секреты и права CI',
    keywords: 'секрет секреты токен права ci доступ утечка',
    method: 'Поиск секретов, разбор прав токена',
    before: 'packages:write только в задаче publish',
    after: 'без изменений, замечаний нет',
    score: 'pass',
    label: 'в норме',
  },
];
