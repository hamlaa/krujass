# Asset generation

All illustrations in this project are hand-built SVG character rigs
(`src/scenes/*.tsx`). The sound effects are real CC0 recordings from
Freesound, processed by `scripts/audio/build_sfx.py` (see `SFX_SOURCES.md`).
**No generative-AI service (Gemini or otherwise) was called** to produce the
current assets, and the running presentation never contacts any external
service.

If AI tooling is ever used here to draft new artwork:

- run it on a developer machine only, never in the student's browser;
- read the key from the environment (`GEMINI_API_KEY`) and never write it to a
  file in this repository;
- write generated files to `scripts/asset-generation/output/` (git-ignored),
  review them, then copy the approved, optimised result into `src/` or `public/`;
- the whole `scripts/` directory and every `.env*` file are excluded by
  `.dockerignore`, so neither scripts nor keys can reach the Docker image.
