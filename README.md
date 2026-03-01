# ridulian.md

A sleek, developer-friendly static site generator and world-building engine using Next.js App Router. It allows creators to map out expansive fictional universes, timelines, and relationships using simple Markdown files.

## Features

- **Markdown & MDX Support**: Write your lore in standard markdown or use MDX to embed interactive React components directly into your articles.
- **Interactive Force Graph**: Automatically build a relationship web of your universe using YAML frontmatter. Traverse your characters, factions, and events visually in the full-screen Graph view.
- **Premium Aesthetics**: Fully responsive dark mode interface with glassmorphism touches, fluid typography, and Framer Motion micro-animations. 
- **SEO Optimized**: Static generation (SSG) with automatic Next.js metadata compilation for every entity in your universe.

## Getting Started

1. Install the dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Creating Content

Lore entries live in the `content/` directory. Create subfolders for categories like `characters/`, `factions/`, or `events/`. 

### Example Entry (`content/factions/the-empire.mdx`)

```markdown
---
title: "The Sol Empire"
tags: ["faction", "authoritarian"]
relationships:
  - target: "events/the-great-war"
    type: "participant"
    description: "Instigators of the war."
---

# The Sol Empire

The Sol Empire rules the central galaxies with an iron fist.
```

Include `<Timeline events={[{year: "3042", description: "Event Name"}]} />` within an `.mdx` file to add a stylish chronological tracker to any article!
