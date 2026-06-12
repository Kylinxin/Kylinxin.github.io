import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const Hexo = require('hexo');

const command = process.argv[2] || 'generate';
const args = {};
const root = process.cwd();
const redefineTheme = path.join(root, 'themes', 'redefine');
const redefinePackage = path.join(root, 'node_modules', 'hexo-theme-redefine');

if (!fs.existsSync(redefineTheme) && fs.existsSync(redefinePackage)) {
  fs.symlinkSync('../node_modules/hexo-theme-redefine', redefineTheme, 'dir');
}

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
