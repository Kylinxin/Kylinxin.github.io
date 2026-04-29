# Kylinxin Blog

This repository publishes `https://kylinxin.github.io` as a Hexo blog using the NexT theme.

NexT is installed with the official clone-style layout:

```text
themes/next
```

The theme directory was copied from `/Volumes/storage/GithubProject/hexo-theme-next`, matching the upstream installation requirement to place `next-theme/hexo-theme-next` under `themes/next` and set `theme: next` in `_config.yml`. Keep site-specific settings in `_config.next.yml`; do not modify files inside `themes/next` for normal blog configuration.

## Daily Workflow

Install dependencies once:

```bash
npm install
```

Create a new note:

```bash
npm run new:post -- "文章标题" "分类名" "tag1,tag2"
```

Edit an existing note:

```bash
npm run edit:post -- "文章标题或文件名" "追加或替换测试文字"
```

For normal editing, directly edit files under `source/_posts/`, then update the `updated:` field in the front matter.

Generate the site into `public/`:

```bash
npm run generate
```

Build the deployable GitHub Pages files into the repository root:

```bash
npm run build
```

Verify the recovered posts, weekly dates, NexT output, archives, categories, tags, feed, and sitemap:

```bash
npm run check
```

Publish after verification:

```bash
git add -A
git commit -m "..."
git push origin main
```

## Repository Layout

- `source/_posts/`: editable note sources.
- `_config.yml`: Hexo site configuration.
- `_config.next.yml`: NexT theme configuration.
- `themes/next/`: local clone of `next-theme/hexo-theme-next`.
- `tools/`: local maintenance scripts for build/check/new/edit.
- Root `index.html`, `2023/`, `archives/`, `categories/`, `tags/`, `atom.xml`, and `sitemap.xml`: generated GitHub Pages output.

Do not edit generated root HTML by hand for normal note work. Edit `source/_posts/`, run `npm run build`, then verify with `npm run check`.
