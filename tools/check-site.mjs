import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePosts = path.join(root, 'source', '_posts');
const publicDir = path.join(root, 'public');
const themePackage = path.join(root, 'node_modules', 'hexo-theme-redefine', 'package.json');
const themeConfig = path.join(root, '_config.redefine.yml');
const expectedCount = 32;

function fail(message) {
  console.error(`CHECK FAILED: ${message}`);
  process.exitCode = 1;
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function postFiles() {
  return fs.existsSync(sourcePosts)
    ? fs.readdirSync(sourcePosts).filter(name => name.endsWith('.md')).sort()
    : [];
}

function frontMatter(file) {
  const text = read(path.join(sourcePosts, file));
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const result = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (m) result[m[1]] = m[2].replace(/^"|"$/g, '');
  }
  return result;
}

const posts = postFiles();
if (posts.length < expectedCount) fail(`expected at least ${expectedCount} source posts, found ${posts.length}`);

if (!fs.existsSync(themePackage)) {
  fail('missing hexo-theme-redefine package; run npm install');
} else {
  const themeMeta = JSON.parse(read(themePackage));
  if (themeMeta.name !== 'hexo-theme-redefine') fail(`theme package is ${themeMeta.name}, expected hexo-theme-redefine`);
  if (!fs.existsSync(themeConfig)) fail('missing root _config.redefine.yml theme override file');
}

const dated = posts.map(file => ({ file, meta: frontMatter(file) })).filter(item => item.meta.date);
const existing = dated.filter(item => item.meta.date.startsWith('2023-')).sort((a, b) => a.meta.date.localeCompare(b.meta.date));
if (existing.length !== expectedCount) fail(`expected ${expectedCount} recovered 2023 posts, found ${existing.length}`);

const start = new Date('2023-04-09T00:00:00Z');
for (let i = 0; i < existing.length; i += 1) {
  const want = new Date(start);
  want.setUTCDate(start.getUTCDate() + i * 7);
  const wantText = want.toISOString().slice(0, 10);
  const got = existing[i].meta.date.slice(0, 10);
  if (got !== wantText) fail(`post ${existing[i].file} has date ${got}, expected ${wantText}`);
}

for (const rel of ['index.html', 'archives/index.html', 'categories/index.html', 'tags/index.html', 'atom.xml', 'sitemap.xml']) {
  if (!fs.existsSync(path.join(publicDir, rel))) fail(`missing generated ${rel}`);
}

const index = fs.existsSync(path.join(publicDir, 'index.html')) ? read(path.join(publicDir, 'index.html')) : '';
if (!index.includes('hexo-theme-redefine') && !index.includes('Redefine')) fail('generated home page does not look like Redefine output');
if (index.includes('arknights.css')) fail('generated home page still references Arknights theme CSS');
if (!index.includes('Kylinxin')) fail('generated home page does not include site identity');
if (!index.includes('search.xml')) fail('generated home page does not expose local search data');

const sitemap = fs.existsSync(path.join(publicDir, 'sitemap.xml')) ? read(path.join(publicDir, 'sitemap.xml')) : '';
if (!sitemap.includes('/2023/11/12/')) fail('sitemap does not include final weekly post path');

if (!process.exitCode) console.log(`CHECK PASSED: ${existing.length} recovered posts, Redefine output, feed, sitemap, archives, categories, tags, and search verified.`);
