import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = async ({ site }) => {
  const origin = String(site).replace(/\/$/, '');
  const notes = (await getCollection('notes', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  const items = notes
    .map(
      (n) =>
        `<item><title>${esc(n.data.title)}</title><link>${origin}/notes/${n.id}/</link>` +
        `<guid>${origin}/notes/${n.id}/</guid><pubDate>${n.data.date.toUTCString()}</pubDate>` +
        `<description>${esc(n.data.description)}</description></item>`,
    )
    .join('');
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    `<rss version="2.0"><channel><title>didaktik</title><link>${origin}/</link>` +
    '<description>Инфраструктура для эпохи автономных агентов</description>' +
    `${items}</channel></rss>`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
