// Данные сборки. PUBLIC_BUILD_SHA передаётся из CI через build-arg Docker.
const rawSha = (import.meta.env.PUBLIC_BUILD_SHA ?? '').trim();

export const buildSha = rawSha ? rawSha.slice(0, 7) : 'local';

export const buildDate = new Date().toISOString().slice(0, 10);

export const contactEmail = 'hello@didaktik.dev';
