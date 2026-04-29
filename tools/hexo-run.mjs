import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Hexo = require('hexo');

const command = process.argv[2] || 'generate';
const args = {};
const hexo = new Hexo(process.cwd(), {});
hexo.env.init = true;
hexo.env.cmd = command;

try {
  await hexo.init();
  await hexo.call(command, args);
  await hexo.exit();
} catch (error) {
  console.error(error);
  await hexo.exit(error);
  process.exit(1);
}
