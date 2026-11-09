// Phase 1 research: survey numbers and the 15-site shortlist shown on the concept board.
// Full survey data lives in research/survey.csv.

export const SURVEY = {
  feed: 2100,
  live: 2060,
  dead: 40,
  candidates: 201,
  codeSignals: 157,
  screenshotted: 149,
  webglAtRuntime: 110,
  lowTrust: 13,
  medianMB: 1.4,
  over10MB: 18,
};

export interface Pick {
  name: string;
  url: string;
  img: string; // desktop thumbnail, /concepts/img/research/
  mimg: string; // mobile thumbnail
  one: string;
  learn: string;
  avoid: string;
  fav?: boolean;
  lowTrust?: string;
}

export const SHORTLIST: Pick[] = [
  {
    name: 'Jesse Zhou',
    url: 'https://jesse-zhou.com',
    img: 'jesse-zhou-d.webp',
    mimg: 'jesse-zhou-m.webp',
    fav: true,
    lowTrust: 'Mobile never got past START in headless',
    one: 'A neon ramen-stand diorama on black. A street signpost (projects, articles, about me, credits) is the menu.',
    learn: 'One hero object, baked neon light, readable at any size. Navigation is a prop that still works as a plain menu, and the camera flies to screens inside the scene for content.',
    avoid: 'A blank START gate before anything is visible, ~9 MB first load, and content locked inside 3D screens (not crawlable). Its models and code stay off-limits; we take only the lessons.',
  },
  {
    name: 'Bruno Simon',
    url: 'https://bruno-simon.com',
    img: 'bruno-simon-d.webp',
    mimg: 'bruno-simon-m.webp',
    fav: true,
    lowTrust: 'Software WebGL never got past the loading ring',
    one: 'A drivable toy world where the portfolio is something you physically play with.',
    learn: 'Physics and humour keep people around: every object reacts, so the world feels alive. Even the loader (a glowing ring on the world\'s own grid floor) already lives in the scene.',
    avoid: 'Content is gated behind driving, and finding one specific section takes effort. A résumé site needs a 10-second path for recruiters.',
  },
  {
    name: 'Carlos Rojas',
    url: 'https://carlos-rojas-portfolio.vercel.app',
    img: 'carlos-rojas-d.webp',
    mimg: 'carlos-rojas-m.webp',
    one: 'A pegboard workbench: laptop, phone, oscilloscope and so on are the sections, mirrored by a plain label bar along the bottom.',
    learn: 'The closest match to our racks-as-sections idea. An always-visible HTML index for people who won\'t hunt, plus a "View the classic site" link up front.',
    avoid: 'At 4 s the desktop canvas was still empty, with no progress shown (the bench arrived by 12 s). We show a POST-style loader and keep the 2D content underneath it.',
  },
  {
    name: 'Deep Saha',
    url: 'https://deepsaha.com',
    img: 'deepsaha-d.webp',
    mimg: 'deepsaha-m.webp',
    one: 'A floating, circular "journey" diorama with a one-line hint ("Tap a model · Drag to orbit") and a Reset view button.',
    learn: 'A diorama on a plinth reads instantly, and our cut-away room uses the same framing. A tiny hint line and a reset button are cheap, essential affordances. Same composition on phones.',
    avoid: 'Free orbit lets people spin into ugly angles, and 7.5 MB of scanned models. Our camera rig is constrained.',
  },
  {
    name: 'Marcos Moura',
    url: 'https://marcos-moura97.github.io',
    img: 'marcos-moura-d.webp',
    mimg: 'marcos-moura-m.webp',
    one: 'A record player whose labels on the floor grid are the menu, with a "Switch to Static Mode" button always on screen.',
    learn: 'An always-visible static-mode switch: our 2D fallback, offered rather than forced. At a 0.2 MB transfer, it shows 3D doesn\'t have to be heavy.',
    avoid: 'Menu text laid flat in perspective is hard to read. Our labels stay in HTML.',
  },
  {
    name: 'Muhammad Rashid',
    url: 'https://iamrashy.netlify.app',
    img: 'iamrashy-d.webp',
    mimg: 'iamrashy-m.webp',
    one: 'A 3D desk setup under the hero text, with a monitor showing live code.',
    learn: 'A monitor in the scene with real text on it sells "this person builds things." It\'s the same job our console CRT does.',
    avoid: '21 MB transferred and 32 WebGL context requests for a scene that is decoration, not navigation.',
  },
  {
    name: 'Wesker Shek',
    url: 'https://weskershek.com',
    img: 'weskershek-d.webp',
    mimg: 'weskershek-m.webp',
    one: 'Desktop gets an isometric 3D scene with a "press and hold here" pad. Phones get "3D scene disabled · optimized for mobile performance" and a "Mobile mode" switch.',
    learn: 'Honest fallbacks: tell phone visitors plainly that 3D is off and why, and give them a switch.',
    avoid: 'The notice takes the hero spot. Our 2D page leads with content and mentions the room in one line.',
  },
  {
    name: 'Pavithran S',
    url: 'https://pavithran26.net',
    img: 'pavithran-d.webp',
    mimg: 'pavithran-m.webp',
    one: 'The front door asks you to pick: "Animation" or "Professional."',
    learn: 'Letting visitors choose the experience is respectful, and "Professional" is a clean recruiter fast path.',
    avoid: 'A choice wall before any content. We show content first and offer the 3D room as an upgrade.',
  },
  {
    name: 'techinz.dev',
    url: 'https://www.techinz.dev',
    img: 'techinz-d.webp',
    mimg: 'techinz-m.webp',
    one: 'A galaxy you scroll through: planets are sections, with a planet rail on the side and a "Swipe to navigate" hint.',
    learn: 'An honest loader ("76% Loaded · Loading textures…") and a persistent section rail that doubles as a progress indicator.',
    avoid: 'Scroll drives the camera, so scrolling stops meaning "page." We keep scroll for HTML panels only.',
  },
  {
    name: 'Rohit Kumar Ranjan',
    url: 'https://rohitkumarranjan.in',
    img: 'rohitkumarranjan-d.webp',
    mimg: 'rohitkumarranjan-m.webp',
    one: 'Boots with a "CYBER | LINK" authentication sequence: progress bar, secure-channel ID, scrolling init log.',
    learn: 'A boot/auth sequence doubles as loader and personality. A reference for our POST loader and the /apps ACCESS DENIED screen.',
    avoid: 'Theatre with fake progress. Ours is driven by real asset loading and can be skipped.',
  },
  {
    name: 'Pedro Fabian Owono',
    url: 'https://myportfolio-b-type.onrender.com',
    img: 'cyber-portfolio-d.webp',
    mimg: 'cyber-portfolio-m.webp',
    one: 'A cyberpunk HUD entry: live clock, coordinates, a "system capacity" bar, and an ACCESS FULL SYSTEMS button.',
    learn: 'HUD chrome (clock, status bars) frames a scene well, and it can be plain CSS over the canvas.',
    avoid: 'Telemetry that means nothing. Our status bits should be real: uptime, last commit, CCNA progress.',
  },
  {
    name: 'Kata',
    url: 'https://katatnt.github.io/portfolio/',
    img: 'kata-d.webp',
    mimg: 'kata-m.webp',
    one: 'A terminal of stacked windows: a boot log with [OK] lines, then whoami, then projects written as command output.',
    learn: 'A terminal skin with ordinary clickable nav (./about ./projects…): readable, crawlable, 0.2 MB. A strong reference for the post-dive 2D UI.',
    avoid: 'Long, dense green-on-black blocks get tiring. We need shorter lines and clearer hierarchy.',
  },
  {
    name: 'Puja Sridhar',
    url: 'https://pujasridhar.github.io',
    img: 'pujasridhar-d.webp',
    mimg: 'pujasridhar-m.webp',
    one: 'A calm, paper-light terminal that boots "Cogsworth" and invites you to type help.',
    learn: 'Boot copy with personality, and proof a terminal can be quiet rather than green-on-black. Tiny (0.1 MB).',
    avoid: 'Type-to-navigate is undiscoverable. Every command needs a clickable twin.',
  },
  {
    name: 'Tirth Dhedhi',
    url: 'https://www.tirthdhedhi.dev',
    img: 'tirthdhedhi-d.webp',
    mimg: 'tirthdhedhi-m.webp',
    one: 'A giant pixel-type name over "Login successful. Press Enter to continue."',
    learn: 'A retro login beat is a cheap, memorable transition, and a good model for leaving the dive or hitting /apps.',
    avoid: 'Keyboard-only prompts. "Press Enter" means nothing on a phone, so we always add tap.',
  },
  {
    name: 'Vaibhav Singh',
    url: 'https://www.vaibhavspace.tech',
    img: 'vaibhavspace-d.webp',
    mimg: 'vaibhavspace-m.webp',
    one: 'An OS-style lock screen (big clock) with "Swipe up to enter / press Enter / click anywhere."',
    learn: 'It spells out all three input methods. A lock screen is a natural metaphor for /apps and the private dashboards.',
    avoid: 'Locking the whole portfolio behind it. Our lock applies to /apps only.',
  },
];
