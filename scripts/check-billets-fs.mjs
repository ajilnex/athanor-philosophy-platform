import path from 'path';
import fs from 'fs/promises';

const cwd = process.cwd();
const CONTENT_DIR = path.join(cwd, 'content', 'billets');
const matter = (await import('gray-matter')).default;

console.log({ cwd, CONTENT_DIR });

try {
  const entries = await fs.readdir(CONTENT_DIR);
  const md = entries.filter(f => f.toLowerCase().endsWith('.md'));
  console.log('md files:', md.length, md);
  if (md.length) {
    const first = path.join(CONTENT_DIR, md[0]);
    const raw = await fs.readFile(first, 'utf8');
    const { data } = matter(raw);
    console.log('first frontmatter title:', data.title);
  }
} catch (e) {
  console.error('ERROR reading FS:', e);
  process.exit(1);
}
