# andyjiang.dev

Personal site. Jekyll, no theme, one stylesheet inlined in `_layouts/default.html`.

## run it

```
bundle install
bundle exec jekyll serve
```

Then open http://localhost:4000.

## add a blog post

Drop a markdown file in `_posts/` named `YYYY-MM-DD-slug.md`:

```markdown
---
layout: post
title: "the title"
subtitle: "one line under the title (optional)"
---

body goes here, markdown.
```

That's it — it shows up on the home page and at `/blog/`, and the URL is `/blog/<title>/`.

## layout

```
index.html              landing + about + projects + blog + contact
blog.html               full post list at /blog/
_posts/                 blog posts
_layouts/default.html   shell + all the CSS
_layouts/post.html      single post page
_includes/logo.html     the pixel "andy" logo (inline SVG)
assets/favicon.svg
```
