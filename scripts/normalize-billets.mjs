import fs from 'fs/promises';
import path from 'path';
import matterImport from 'gray-matter';

const matter = matterImport;
const CONTENT_DIR = path.join(process.cwd(), 'content', 'billets');

const isValid = (d) => d instanceof Date && !isNaN(d.getTime());
const dateFromSlug = (slug) => (/^\d{4}-\d{2}-\d{2}/.test(slug) ? new Date(slug.slice(0,10)) : null);

function deriveTitle(content, slug, fmTitle) {
  if (typeof fmTitle === 'string' && fmTitle.trim()) return fmTitle.trim();
  const h1 = content.match(/^#\s+(.+)\s*$/m);
  if (h1) return h1[1].trim();
  const first = content.split('\n').map(l => l.trim()).find(Boolean);
  return (first || slug).replace(/^#+\s*/,'').slice(0, 120);
}

function deriveExcerpt(content, fmExcerpt) {
  if (typeof fmExcerpt === 'string' && fmExcerpt.trim()) return fmExcerpt.trim();
  const paragraphs = content.split(/\n{2,}/).map(p => p.trim());
  const first = paragraphs.find(p => p && !p.startsWith('#'));
  if (!first) return undefined;
  return first.replace(/[*_\\`>#$begin:math:display$$end:math:display$]/g, '').slice(0, 240);
}

for (const file of (await fs.readdir(CONTENT_DIR)).filter(f => f.toLowerCase().endsWith('.md'))) {
  const full = path.join(CONTENT_DIR, file);
  const raw = await fs.readFile(full, 'utf8');
  const parsed = matter(raw);
  const slug = file.replace(/\.md$/i, '');
  let data = parsed.data || {};
  const content = parsed.content || '';

  // title
  const title = deriveTitle(content, slug, data.title);

  // date
  let date =
    (data.date ? new Date(data.date) : null) ||
    dateFromSlug(slug);
  if (!isValid(date)) {
    const stat = await fs.stat(full);
    date = stat.mtime; // fallback: date du fichier
  }
  const isoDate = new Date(date).toISOString(); // format ISO complet

  // excerpt
  const excerpt = deriveExcerpt(content, data.excerpt);

  // tags (préserve si déjà un tableau)
  const tags = Array.isArray(data.tags) ? data.tags : [];

  // si rien ne change on passe
  const nextData = { ...data, title, date: isoDate, ...(excerpt ? { excerpt } : {}), ...(tags.length ? { tags } : {}) };
  const same =
    data.title === nextData.title &&
    String(data.date || '') === String(nextData.date || '') &&
    String(data.excerpt || '') === String(nextData.excerpt || '') &&
    JSON.stringify(data.tags || []) === JSON.stringify(nextData.tags || []);

  if (!same) {
    // backup
    await fs.copyFile(full, full + '.bak');
    // ré-écrit proprement
    const output = matter.stringify(content.trim() + '\n', nextData);
    await fs.writeFile(full, output, 'utf8');
    console.log('✅ normalized:', file);
  } else {
    console.log('= already ok  :', file);
  }
}
