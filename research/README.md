# Phase 1 research: portfolio survey

The research behind the concept board at `/concepts`. The shortlist with thumbnails and learn/avoid notes is on the board (data in `concepts/research.ts`). This folder holds the method and the raw survey.

## Method

1. **Source.** `feed.json` from [emmabostian/developer-portfolios](https://github.com/emmabostian/developer-portfolios): 2,100 entries (name, URL, optional tagline).
2. **Link check + signal scan** (`tools/probe.py`). Every URL was fetched (48 parallel workers, 8 s connect / 12 s read timeouts). 40 entries were dropped as dead: 4xx/5xx responses (mostly bot-blocking 403/429), TLS errors, timeouts, or parked/empty pages. For the 2,060 live sites, the homepage HTML and up to four same-origin JS bundles (2.5 MB cap each) were scanned for code signals (Three.js, R3F, raw WebGL, Babylon, Pixi, Spline, OGL, GSAP). Name, tagline, `<title>` and meta description were keyword-scored for 3D, Three.js, WebGL, interactive, game, cyberpunk, terminal, retro, Y2K, neon, shader, and similar.
3. **Selection for screenshots.** All 120 sites with strong 3D code signals, then sites whose text hit the theme keywords (terminal, retro, Y2K, cyberpunk, OS metaphors…), then the highest remaining scores, up to 148. jesse-zhou.com was added (bruno-simon.com is already in the feed): **149 sites**.
4. **Screenshots** (`tools/shoot.cjs`). Playwright + Chromium, software WebGL (SwiftShader). Desktop 1440×900 captured at load+4 s and load+12 s; mobile iPhone 13 emulation (390×844) at load+8 s. Runtime metrics: WebGL contexts requested (via a `getContext` hook), transfer size, load time, console errors, horizontal overflow at 390 px.
5. **Trust flags** (`tools/analyze.py`). A render is marked **low-trust** when the page asked for WebGL and the capture is blank or near-uniform, or the console shows WebGL/GPU errors. 13 of 149 were flagged. Gated sites (START / Enter buttons) were re-captured after clicking through.
6. **Shortlist.** I reviewed contact sheets of all 149 by hand and picked 15 for what they teach this concept: 3D scene and navigation (6), mobile/fallback handling (3), loaders and boot sequences (3), and terminal/OS-style 2D UIs for the post-dive interface (3).

## Numbers

| | |
|---|---|
| Feed entries | 2,100 |
| Live | 2,060 |
| 3D/WebGL code found in bundles | 157 |
| Screenshotted (desktop + mobile) | 149 |
| Requested WebGL at runtime | 110 |
| Low-trust renders | 13 |
| Median first-load transfer | 1.4 MB (18 sites over 10 MB) |

## Takeaways that shaped the directions

- **Content first, 3D as the upgrade.** The best sites keep a plain path visible (Carlos Rojas's label bar, Marcos Moura's "Switch to Static Mode"). The worst put a START or "are you a recruiter?" wall in front of everything.
- **Constrain the camera.** Free orbit and scroll-driven cameras make people lose their place. A fixed three-quarter rig with click-to-focus and Esc-to-return is easier to use.
- **Weight is a choice.** 18 of the 149 shipped over 10 MB on first load. Marcos Moura's site works at 0.2 MB. Our scene is procedural (no models), so it can stay small.
- **Terminal UIs work when they are also normal UIs.** Clickable nav plus terminal styling (Kata) beats type-to-navigate (Puja Sridhar's site is charming but hard to discover).
- **Use real data in the chrome.** HUD clocks and "system capacity" bars feel hollow when fake. Ours should show real things: uptime, CCNA progress, last commit.

## Files

- `survey.csv`: all 149 screenshotted sites with signals, runtime WebGL, load time, transfer size, overflow, and trust flags.
- `tools/`: the scripts above, kept for reproducibility. Screenshots are not committed; only the 15 shortlist thumbnails ship, under `public/concepts/img/research/`, for review only.
