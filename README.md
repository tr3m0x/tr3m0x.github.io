# tr3m0x's blog

A Jekyll blog using the [Chirpy theme](https://github.com/cotes2020/jekyll-theme-chirpy), published at https://tr3m0x.github.io.

## Local development

Install Ruby (see `.ruby-version`) and Bundler, then run:

```sh
bundle config set --local path vendor/bundle
bundle install
bundle exec jekyll serve
```

Open http://127.0.0.1:4000. On systems with versioned Ruby executables, use `bundle3.2` in place of `bundle`.

## Writing

Add posts to `_posts/YYYY-MM-DD-slug.md`:

```yaml
---
title: "Post title"
date: 2026-09-05
categories: [Writeups, Hack The Box]
tags: [linux, web]
author: tr3m0x
description: "A short summary."
image: /assets/img/posts/slug/cover.png
---
```

Store screenshots in `assets/img/posts/slug/` and reference them using absolute paths. New posts use `/posts/slug/`; migrated posts have explicit permalinks preserving their original `/blog/writeups/.../` URLs. Set `published: false` to hide an unfinished post. Liquid processing is disabled for posts so security payloads such as `{{7*7}}` remain literal; use Markdown for images and links.

Edit `_config.yml` for site settings, `_data/contact.yml` for social links, and `_tabs/` for navigation pages. Add PDFs to `static/cheatsheets/htb/` and link them from `cheatsheets/htb.md`. The RSS feed stays at `/rss.xml`. Sharing a post uses that post’s title, description, and `image` from its front matter. Pages without a cover use the site avatar as a fallback. Share the individual post URL for its specific preview.

## Validation and deployment

```sh
JEKYLL_ENV=production bundle exec jekyll build
bundle exec htmlproofer _site --disable-external --ignore-urls '/^http:\/\/127.0.0.1/,/^http:\/\/0.0.0.0/,/^http:\/\/localhost/'
```

GitHub Actions builds and checks pull requests. Pushes to `main` build, check, and deploy `_site` to GitHub Pages. In the repository's **Settings → Pages**, the source must be **GitHub Actions**.

The previous Astro implementation is available in Git history. Node.js and PNPM are no longer needed.

See the [Chirpy documentation](https://chirpy.cotes.page/posts/getting-started/) for further customization.
