import fs from 'fs/promises';
import path from 'path';
import matterImport from 'gray-matter';

// ——— AJOUTER EN HAUT DU FICHIER, après les imports ———
const FR_STOPWORDS = new Set([
  "alors","au","aucun","aussi","autre","avant","avec","avoir","bon","car","ce","cela","ces","cet","cette","ceci","comme","comment",
  "dans","de","des","du","donc","dos","déjà","elle","elles","en","encore","entre","er","est","et","eu","façon","faire","fois","font",
  "hors","ici","il","ils","je","jusqu","l","la","le","les","leur","là","ma","mais","me","même","mes","moi","mon","ne","ni","non",
  "nos","notre","nous","on","ou","où","par","parce","pas","peu","peut","plutôt","pour","pourquoi","qu","quand","que","quel","quelle",
  "quelles","quels","qui","quoi","sans","se","ses","si","sien","son","sont","sous","sur","ta","te","tes","toi","ton","toujours",
  "tout","tous","très","tu","un","une","vos","votre","vous","ça","c’est","c'", "d'", "l'", "n'", "qu'", "s'", "t'", "y","être","avoir"
]);

function tokenize(s) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter(w => w && w.length >= 3 && !FR_STOPWORDS.has(w));
}

// capture les [[liens]] comme tags utiles
function backlinksAsTags(content) {
  const tags = new Set();
  const re = /\[\[([^\]]+)\]\]/g;
  let m;
  while ((m = re.exec(content))) {
    const label = m[1].trim();
    if (label) tags.add(label);
  }
  return Array.from(tags);
}

function deriveTags(content, title, existingTags = []) {
  if (Array.isArray(existingTags) && existingTags.length) return existingTags;

  const fromBacklinks = backlinksAsTags(content);
  const bag = new Map();
  // booster le titre
  for (const t of tokenize(title)) bag.set(t, (bag.get(t) || 0) + 3);
  // premier ~500 caractères du contenu
  const first = content.slice(0, 1200);
  for (const t of tokenize(first)) bag.set(t, (bag.get(t) || 0) + 1);

  // top N
  const top = Array.from(bag.entries())
    .sort((a,b) => b[1] - a[1])
    .map(([w]) => w)
    .filter(w => !/^\d+$/.test(w))
    .slice(0, 6);

  // fusion backlinks + top
  const merged = Array.from(new Set([...fromBacklinks, ...top]));
  // garde 3–6 tags
  const limited = merged.slice(0, Math.max(3, Math.min(6, merged.length)));
  return limited;
}
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
// ancien:
// const tags = Array.isArray(data.tags) ? data.tags : [];

// nouveau:
const tags = Array.isArray(data.tags) ? data.tags : [];
const autoTags = deriveTags(content, title, tags);
const finalTags = (Array.isArray(tags) && tags.length) ? tags : autoTags;

// ...
const nextData = {
  ...data,
  title,
  date: isoDate,
  ...(excerpt ? { excerpt } : {}),
  ...(finalTags.length ? { tags: finalTags } : {}),
};

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
