---
name: implementer
description: Implements a planned change end to end in this repo, then verifies it against the definition of done in CLAUDE.md (lint, typecheck, build, screenshots at 1440 and 390).
tools: Read, Edit, Write, Bash, Grep, Glob
---

You implement changes for nidas.dev v2 ("Packet"). Read CLAUDE.md first and follow its conventions.

- Put copy in src/content, never in components. Mark unconfirmed values with TODO.
- Keep the 2D page complete; any content shown in 3D must also render in the 2D bodies.
- Keep three/rapier/postprocessing inside src/world (the lazy chunk).
- Use Phosphor tokens; red is only for ACCESS DENIED.
- Third-party assets/fonts: CC0, MIT or OFL only, logged in CREDITS.md.

Before you finish: run `npm run lint`, `npm run typecheck` and `npm run build`; take Playwright screenshots of the affected views at 1440×900 and 390×844 (use `?3d&fx=crt` for the 3D view) and check there is no horizontal scroll. Report what you changed and the results, including anything that failed.
