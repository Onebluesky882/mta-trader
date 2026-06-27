DESIGN_SYSTEM.md

Status: ACTIVE
Owner: CONDUCTOR

---

## Core Principle

**Design for humans, not for AI output.**

Every UI must feel intentional, crafted, and considered — not generated.
If it looks like a ChatGPT scaffold or a default Tailwind starter, it is not acceptable.

Reference quality bar: https://railway.com / https://mobbin.com/discover/sites/latest

---

## Non-Negotiable Rules

### 1. Mobile First — Always

- Build for 375px width first, scale up to desktop
- Touch targets minimum 44×44px
- No horizontal scroll on mobile
- Test every component at 375px, 768px, 1280px before shipping

### 2. No AI-Generated Look

Forbidden patterns:
- Generic hero with "Welcome to [App]" + blue gradient
- Default card grids with emoji icons
- Placeholder lorem ipsum in any shipped UI
- Centered layout with max-width 800px and nothing else
- Cookie-cutter navbar: Logo | Nav links | Button

What "not AI-generated" looks like:
- Deliberate whitespace — not just padding: 16px everywhere
- Type hierarchy that guides the eye — one dominant element per screen
- Micro-interactions: hover states, transitions (150–250ms), focus rings
- Real content in demos — not "Card Title" and "Description here"

### 3. Typography

- Font scale: 12 / 14 / 16 / 20 / 24 / 32 / 48px
- Line height: 1.5 for body, 1.2 for headings
- Max line length: 65ch for body text
- Weight: 400 body, 500 UI labels, 600–700 headings
- Never more than 2 font sizes on one screen unless intentional

## Approved Libraries

- **Tailwind CSS** — use for all styling (utility classes preferred over inline styles)
- **shadcn/ui** — use as component base, but always customize to match the design intent — never ship default shadcn without visual customization
- **Radix UI** — use for accessible primitives (Dialog, Dropdown, Tooltip, etc.)

These tools are building blocks, not a finished design. The goal is still a UI that feels crafted — not a default shadcn template.

---

### 4. Color

- Use a 2-color palette max per surface (background + text + 1 accent)
- Dark mode ready from day one — use CSS variables or Tailwind dark: variants, never hardcoded hex
- Accent color must have 4.5:1 contrast ratio on its background (WCAG AA)
- Avoid full black (#000) and full white (#fff) — use near-black and off-white

Recommended base:
```css
--color-bg: #0a0a0a;
--color-surface: #111111;
--color-border: #222222;
--color-text: #ededed;
--color-text-muted: #888888;
--color-accent: #7c3aed;        /* purple — change per project */
--color-accent-hover: #6d28d9;
```

### 5. Spacing

Use an 8px grid. All spacing values must be multiples of 4 or 8.
- 4px — micro (icon gap, input padding-y)
- 8px — small (between related elements)
- 16px — base (card padding, section gap)
- 24px — medium (between sections)
- 32–48px — large (page sections)
- 64–96px — hero / section breaks

Never: `padding: 13px` or `margin: 7px`

### 6. Components

Every component must have:
- Default state
- Hover state (cursor: pointer where clickable)
- Focus state (visible ring — never `outline: none` without replacement)
- Loading state (skeleton or spinner where async)
- Empty state (never a blank screen)
- Error state

### 7. Interactions

- Transitions: 150ms ease for color/opacity, 200ms ease for transform
- No janky layout shifts — reserve space before async content loads
- Button clicks must have immediate visual feedback (active state scale or color)
- Forms: validate on blur, show inline error below the field

### 8. Animation & Background Effects — MANDATORY after every UI build

Every page and feature UI must include subtle background animation to feel like a real technology product.

**Required on every page:**

```css
/* Dot grid background — hero sections and CTA */
background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
background-size: 28px 28px;

/* Accent orb glow — behind hero or key sections */
background: radial-gradient(ellipse at center, rgba(124,58,237,0.12) 0%, transparent 70%);
animation: orb-move 12s ease-in-out infinite;
```

**Opacity rules:**
- Background dot grid: **5–8% opacity** — visible but never dominant
- Glow orbs / radial gradients: **10–15% opacity** — felt, not seen
- Animated rings / pulses: start at **60% opacity**, fade to 0
- Never exceed 20% opacity on background effects — they must stay subtle

**Required animations:**
- Page load: `fadeInUp` stagger on hero content (0.1s delay per element)
- Badge / status indicators: `pulse-ring` on the dot before text
- CTA buttons: `box-shadow` glow on hover (accent color, 0.4 opacity)
- Cards: `translateY(-2px)` + border accent on hover (200ms ease)
- Hero headline: `shimmer` on the accent phrase (4s loop, subtle)

**Keyframes to include in every project's globals.css:**
```css
@keyframes fadeInUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
@keyframes orb-move { 0%,100% { transform:translate(0,0) scale(1) } 33% { transform:translate(40px,-30px) scale(1.05) } 66% { transform:translate(-20px,20px) scale(0.97) } }
@keyframes pulse-ring { 0% { transform:scale(0.95); opacity:0.6 } 100% { transform:scale(1.4); opacity:0 } }
@keyframes shimmer { 0% { background-position:-200% center } 100% { background-position:200% center } }
```

**What NOT to do:**
- No full-screen particle systems or canvas animations
- No animations longer than 12s loop (feels laggy)
- No opacity above 20% on background effects
- No animations that cause layout shift or jank
- No animations on text that users need to read quickly

### 9. Layout Patterns (preferred)

- Navigation: sticky top bar max-height 56px, or side nav on desktop
- Cards: 1 column mobile → 2–3 columns tablet/desktop
- Forms: full-width on mobile, max-width 480px centered on desktop
- Dashboard: sidebar (240px) + content area

---

## What Workers Must Do

Before shipping any UI:

1. View the component at 375px width — does it work?
2. Check: does this look like a default Tailwind/shadcn template? If yes, redesign.
3. Verify every interactive element has hover + focus + loading states
4. Use real placeholder content (not "Lorem ipsum" or "Card Title")
5. Confirm color contrast passes WCAG AA
6. **Reference first** — before writing any UI code, identify one real product to reference. Never design from scratch. Tell the AI: "design like linear.app" not "design a dashboard." AI copies style better than it invents one.
7. **Strip AI defaults** — after generating any UI, remove the following before shipping:

| AI puts in automatically | Replace with |
|--------------------------|--------------|
| Gradient hero section | Flat color or white background |
| Icon on every list item | Text only, or icon only on hover |
| Box-shadow on every card | Border (`1px solid var(--border)`) only |
| Large centered CTA button | Smaller button, left-aligned or inline |
| Rounded corners everywhere (≥12px) | 4–6px radius max on components |
| Subtitle under every heading | One dominant line — remove the subtitle |

8. **Add micro-interactions manually** — AI-generated UI rarely has personality in hover states. Add these after every component:

```css
/* Card hover */
transition: border-color 150ms ease, transform 150ms ease;
&:hover { border-color: var(--color-accent); transform: translateY(-2px); }

/* Button active */
&:active { transform: scale(0.97); }

/* Link / clickable row */
transition: background 120ms ease;
&:hover { background: var(--color-surface); }
```

---

## What Workers Must NOT Do

- Use MUI, Chakra, Bootstrap, or other opinionated design systems — they override the design intent
- Ship a UI with only default browser styles
- Use gradients unless explicitly approved — solid colors first
- Center everything — use intentional alignment
- Add animations that last longer than 300ms (unless explicit request)

---

## Inspiration References

Study these before designing any page:
- https://railway.com — clean, dark, confident, minimal
- https://mobbin.com/discover/sites/latest — see what real products look like
- Linear, Vercel, Resend, Supabase dashboards — study the detail

The goal: someone looking at the UI should think "this was designed by someone who cares" — not "this was generated."
