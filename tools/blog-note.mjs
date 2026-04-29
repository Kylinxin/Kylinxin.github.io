import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const postsDir = path.join(root, 'source', '_posts');
const command = process.argv[2];
const title = process.argv[3];

function usage() {
  console.log('Usage: npm run new:post -- "Title" [category] [tag1,tag2]');
  console.log('       npm run edit:post -- "Title" "replacement text appended to the post"');
}

function slugify(value) {
  return value.trim().replace(/[\\/:*?"<>|#]+/g, '-').replace(/\s+/g, '-');
}

function nowText() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function findPost(titleOrSlug) {
  if (!fs.existsSync(postsDir)) return null;
  const direct = path.join(postsDir, `${titleOrSlug}.md`);
  if (fs.existsSync(direct)) return direct;
  const slug = slugify(titleOrSlug);
  const slugPath = path.join(postsDir, `${slug}.md`);
  if (fs.existsSync(slugPath)) return slugPath;
  return fs.readdirSync(postsDir)
    .filter(name => name.endsWith('.md'))
    .map(name => path.join(postsDir, name))
    .find(file => fs.readFileSync(file, 'utf8').includes(`title: "${titleOrSlug}"`));
}

if (!command || !title) {
  usage();
  process.exit(1);
}

if (command === 'new') {
  fs.mkdirSync(postsDir, { recursive: true });
  const category = process.argv[4] || '未分类';
  const tags = (process.argv[5] || '').split(',').map(tag => tag.trim()).filter(Boolean);
  const slug = slugify(title);
  const file = path.join(postsDir, `${slug}.md`);
  if (fs.existsSync(file)) throw new Error(`Post already exists: ${file}`);
  const tagYaml = tags.length ? `\n${tags.map(tag => `  - ${JSON.stringify(tag)}`).join('\n')}` : ' []';
  const createdAt = nowText();
  const text = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `date: ${createdAt}`,
    `updated: ${createdAt}`,
    `categories:\n  - ${JSON.stringify(category)}`,
    `tags:${tagYaml}`,
    '---',
    '',
    '这里写正文。',
    ''
  ].join('\n');
  fs.writeFileSync(file, text, 'utf8');
  console.log(`Created ${path.relative(root, file)}`);
} else if (command === 'edit') {
  const file = findPost(title);
  if (!file) throw new Error(`Post not found: ${title}`);
  const addition = process.argv[4] || '\n\n编辑测试通过。';
  let text = fs.readFileSync(file, 'utf8');
  text = text.replace(/^updated:.*$/m, `updated: ${nowText()}`);
  text += `\n${addition}\n`;
  fs.writeFileSync(file, text, 'utf8');
  console.log(`Edited ${path.relative(root, file)}`);
} else {
  usage();
  process.exit(1);
}
