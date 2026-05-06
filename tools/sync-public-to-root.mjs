import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');

const generatedPaths = [
  '2023', '2026', 'archives', 'categories', 'tags', 'page', 'about', 'friends',
  'css', 'js', 'lib', 'font', 'img', 'images',
  '404.html', 'index.html', 'atom.xml', 'sitemap.xml', 'sitemap.txt',
  'search.xml', 'search.json', 'content.json'
];

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) copyRecursive(path.join(src, entry), path.join(dest, entry));
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

if (!fs.existsSync(publicDir)) {
  throw new Error('public directory does not exist. Run hexo generate first.');
}

for (const rel of generatedPaths) fs.rmSync(path.join(root, rel), { recursive: true, force: true });
for (const entry of fs.readdirSync(publicDir)) copyRecursive(path.join(publicDir, entry), path.join(root, entry));
console.log('Synced Hexo public output to repository root.');
