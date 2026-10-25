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

## Diagrams and interactive figures
Write these as code blocks (type three backticks and the name). Each becomes a numbered figure on the site.

- ` ```mermaid ` a diagram. Obsidian previews it as you type. Add `%% caption: your caption` on the first line.
- ` ```vp-kanizsa ` the illusory triangle with a rotation control
- ` ```vp-afterimage ` stare at a dot, see the afterimage (settings: `color`, `seconds`, `question`)
- ` ```vp-flash ` show an image or word for a split second (settings: `image` or `text`, `duration` in milliseconds, `question`)
- ` ```vp-choice ` ask readers a question (settings: `question`, `options` as a list, optional `image` per option, `note`)
- ` ```vp-compare ` drag between two images (settings: `before`, `after`, `labels`)
- ` ```vp-blot ` a folding ink blot (settings: `question`)
- ` ```vp-embed ` a custom interactive built for you, kept in **interactives/name** (settings: `name`, `height`)

Every block can also take `caption:`. Example:

    ```vp-flash
    image: my-figure.png
    duration: 120
    question: What did you see?
    caption: A 120 millisecond exposure.
    ```

Want something new? Ask Claude to build an interactive into **interactives/your-name** and place it with ` ```vp-embed `.

## Publish
1. Set `publish: true`.
2. Sync to GitHub (GitHub Desktop: **Commit**, then **Push**).
3. The site rebuilds by itself, usually in under a minute. Drafts never appear on voluspastudio.com.
