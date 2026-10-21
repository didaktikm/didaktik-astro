// Аудит этого сайта: что было найдено и что сделано. Обновлять вместе с изменениями в репозитории.
export type Score = 'pass' | 'warn' | 'fail';

export interface AuditCheck {
  check: string;
  method: string;
  before: string;
  after: string;
  score: Score;
}

export const auditDate = '2026-10-21';

export const audit: AuditCheck[] = [
  {
    check: 'Воспроизводимость сборки',
    method: 'Сравнение lockfile и команд установки',
    before: 'npm install в Dockerfile и CI, lockfile не обязателен',
    after: 'npm ci по lockfile, кэш npm в CI и в Docker',
    score: 'pass',
  },
  {
    check: 'Что задеплоено',
    method: 'Сравнение образа из CI и образа на сервере',
    before: 'compose собирал образ на сервере, мимо GHCR',
    after: 'compose тянет из GHCR тот же образ, что прошёл CI',
    score: 'pass',
  },
  {
    check: 'Версии и откат',
    method: 'Связь тега образа с коммитом',
    before: 'тег build-<run_id> не указывает на коммит',
    after: 'теги sha-<коммит> и vX.Y.Z, откат сменой тега',
    score: 'pass',
  },
  {
    check: 'Кэширование статики',
    method: 'Разбор заголовков ответа',
    before: 'нет Cache-Control для хешированных файлов',
    after: '/_astro/* immutable на год, HTML всегда проверяется',
    score: 'pass',
  },
  {
    check: 'Здоровье контейнера',
    method: 'Проверка healthcheck и ошибок',
    before: 'нет healthcheck, нет страницы 404',
    after: 'HEALTHCHECK в образе, 404 оформлена как инцидент',
    score: 'pass',
  },
  {
    check: 'Секреты и права CI',
    method: 'Поиск секретов, разбор прав токена',
    before: 'packages:write только в задаче publish',
    after: 'без изменений, замечаний нет',
    score: 'pass',
  },
];
