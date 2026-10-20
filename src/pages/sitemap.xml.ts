import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site }) => {
  const origin = String(site).replace(/\/$/, '');
  const notes = await getCollection('notes', ({ data }) => !data.draft);
  const paths = ['/', '/about/'];
  if (notes.length > 0) paths.push('/notes/', ...notes.map((n) => `/notes/${n.id}/`));
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    paths.map((p) => `  <url><loc>${origin}${p}</loc></url>`).join('\n') +
    '\n</urlset>\n';
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
