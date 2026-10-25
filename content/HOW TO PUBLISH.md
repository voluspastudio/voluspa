---
publish: false
---
# How to publish to voluspastudio.com

This folder is your Obsidian vault. Every file in **articles** is one investigation.

## Write
1. New article: use the **Article** template (command palette › "Templates: Insert template").
2. Fill in the fields at the top. Leave `publish: false` while drafting.
3. Drag images straight into the note. They save into **images** and appear as numbered figures.

## Fields at the top
- **category**: Perception, Attention, Memory, Cognition, Emotion or Experimental work (or P, A, M, C, E, X)
- **type**: Essay, Experiment, Study, Note, Artwork, Design investigation
- **layout**: `long-read` (title, then image), `spread` (title and image face each other), `plate` (image leads, title becomes a caption)
- **cover**: the image file name, for example `my-image.jpg`
- **treatment**: `halftone` prints the cover like an old journal plate, or `none`
- **figure** (optional): set your own figure number, for example `07`
- **accent** (optional): override the color, for example `#C2321A`

## Special blocks
- `> [!note]` or `> [!observation]` or `> [!try]`: sits in the margin
- `> [!finding]`: an established result (solid box, cite a source)
- `> [!speculation]`: your interpretation (dashed box)
- `[^1]` footnotes become the References list
- `[[Another article title]]` links to that article on the site

## Publish
1. Set `publish: true`.
2. Sync to GitHub (GitHub Desktop: **Commit**, then **Push**).
3. The site rebuilds by itself, usually in under a minute. Drafts never appear on voluspastudio.com.
