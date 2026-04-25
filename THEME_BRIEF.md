# UoH Design System & Theme — Claude Code Brief

**Project:** UoH Placement Management System — Frontend
**Goal:** Replace the current blue/generic styling with an institutional UoH design system grounded in the university's real brand identity.
**Companion brief:** `SPRINT_1_CLEANUP_BRIEF.md` (backend changes). This brief focuses purely on the frontend design system.
**Estimated work:** 4–6 hours.

---

## How to use this brief

Work through the tasks in order. Tasks 1–4 are foundation — they have to be done before Tasks 5+ because the later tasks reference the utilities defined in earlier ones. Unlike the backend brief, there aren't discrete verify-curl-commands here; verification is visual. After each task, run `npm run dev` and look at the result in the browser.

**If a section says "retain existing structure" — do not rewrite the JSX wholesale.** Preserve the existing layout skeleton of `LoginPage.jsx` and `RegisterPage.jsx` (the two-panel split, form fields, etc.) and only swap colors, typography, and component references.

---

## Aesthetic direction (read first)

This is not a generic SaaS onboarding theme. The target is **institutional, editorial, dignified** — this is a 50-year-old Central University with the Institution of Eminence tag. Think "university press" rather than "startup landing page."

**The non-negotiable choices:**

1. **UoH maroon (#7A0019)** is the primary colour, used sparingly and purposefully. Not background-gradient-everywhere. Primary CTAs, headings, emblem, active navigation, interactive accents.
2. **Cream off-white (#FBF9F4)** is the default page background, never pure white. Gives a subtle paper-like warmth that matches institutional print materials.
3. **Serif display + humanist sans body.** Display = Fraunces (free, Google Fonts). Body = Source Sans 3 (free, Google Fonts). This pairing gives academic publishing feel without being stuffy.
4. **Editorial layouts.** Generous whitespace, one primary action per page, clear hierarchy. Not dashboards-with-20-tiles.
5. **Colour ratio rule:** 70% cream/white backgrounds, 20% dark text, 8% maroon, 2% gold accent. Maroon is precious — don't wallpaper with it.

**What we're deliberately avoiding:**

- Blue gradients (current login page has this — remove)
- Purple (generic AI aesthetic)
- Heavy shadows (too Material Design)
- Glassmorphism (too 2022)
- Full-bleed gradient hero sections

---

## Task 1 — Replace the AI-generated logo with the real UoH emblem

**Important: the current `Gemini_Generated_Image_lkoyazlkoyazlkoy.png` is AI-generated, which is a real submission risk.** UoH faculty will recognise that it's not the real emblem.

**Steps:**

1. In the repo, locate `src/frontend/src/assets/Gemini_Generated_Image_lkoyazlkoyazlkoy.png`.
2. Replace it with the official UoH emblem. The user should save the real emblem image (the one with atom/book/lightning/wheel motifs and Sanskrit motto "सा विद्या या विमुच्यते") as `src/frontend/src/assets/uoh-logo.png`.
3. Delete `Gemini_Generated_Image_lkoyazlkoyazlkoy.png` entirely.
4. Update every `import ... from '../assets/Gemini_Generated_Image_lkoyazlkoyazlkoy.png'` reference across the codebase (currently in `LoginPage.jsx` and `RegisterPage.jsx`) to:
   ```javascript
   import uohLogo from '../assets/uoh-logo.png';
   ```
5. Also add a second asset: `src/frontend/src/assets/uoh-logo-white.png` — a white version for dark backgrounds (if the user doesn't have one, Claude Code should document this as a follow-up for the user to produce with an image editor, and for now use a CSS filter `filter: brightness(0) invert(1)` on the maroon logo as a stopgap).

**Verify:**
- Run `npm run dev`. Login and register pages should still render (not broken by the file swap).
- Check Dev Tools → Network → Images. The logo URL should resolve.

---

## Task 2 — Install fonts and configure Google Fonts

**File:** `src/frontend/index.html`

In the `<head>`, add the Google Fonts link (before the existing `<title>`):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,400&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
```

Fraunces is a modern "serif with character" — has optical sizing so it looks different at display sizes vs body sizes. Source Sans 3 is a clean, neutral humanist sans that Adobe open-sourced. Both are free and self-serving no licensing problems.

**Verify:** load the page, DevTools → Computed → `font-family` on a heading should show Fraunces falling back through the stack.

---

## Task 3 — Rewrite `tailwind.config.js` with the full UoH design tokens

**File:** `src/frontend/tailwind.config.js`

Replace entire contents:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      // ====================================================================
      // UoH Colour System
      // ====================================================================
      colors: {
        // Primary — UoH Maroon, derived from the official crest
        maroon: {
          50:  '#FCF3F5',
          100: '#F8E1E6',
          200: '#EDB5C0',
          300: '#DC8393',
          400: '#C35365',
          500: '#A83245',   // light accent / hover
          600: '#7A0019',   // primary brand
          700: '#5A0012',   // darker press state
          800: '#3D000C',
          900: '#260007',
        },

        // Accent — refined gold (matches the "50 Years" and IoE badge style)
        gold: {
          50:  '#FDF9EF',
          100: '#FAF0D4',
          200: '#F3DFA1',
          300: '#EACB6A',
          400: '#D9B547',
          500: '#C9A227',   // accent
          600: '#A5831A',
          700: '#7D6313',
          800: '#574311',
          900: '#37290B',
        },

        // Surface — warm paper cream, not pure white
        cream: {
          50:  '#FEFDFB',
          100: '#FBF9F4',   // page background
          200: '#F6F1E6',
          300: '#EEE5D1',
          400: '#E2D3B0',
          500: '#D4C08F',
        },

        // Neutral ink — warm greys, not blue-cold
        ink: {
          50:  '#F7F5F2',
          100: '#EEEAE3',
          200: '#D8D1C6',
          300: '#B5AB9C',
          400: '#8A7F6F',
          500: '#655B4D',
          600: '#48403A',
          700: '#2E2924',   // body text
          800: '#1A1714',   // headings
          900: '#0D0B09',
        },

        // Semantic — restrained, not neon
        success: { DEFAULT: '#2D6A4F', bg: '#E8F2ED', ring: '#74C69D' },
        warning: { DEFAULT: '#B45309', bg: '#FDF3E0', ring: '#F59E0B' },
        danger:  { DEFAULT: '#991B1B', bg: '#FDEAEA', ring: '#DC2626' },
        info:    { DEFAULT: '#1E4A7B', bg: '#E8EEF5', ring: '#4A7AB0' },
      },

      // ====================================================================
      // Typography
      // ====================================================================
      fontFamily: {
        // Display — serif with optical sizing, used for page titles & big UI
        display: ['Fraunces', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        // Body — humanist sans
        sans: ['Source Sans 3', 'Inter', '-apple-system', 'system-ui', 'sans-serif'],
        // Monospace — for codes, IDs, OTP inputs
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },

      fontSize: {
        // Fluid-ish scale; keep to known steps
        '2xs':  ['0.6875rem', { lineHeight: '1rem' }],       // 11px
        xs:     ['0.75rem',    { lineHeight: '1.1rem' }],    // 12px
        sm:     ['0.875rem',   { lineHeight: '1.35rem' }],   // 14px
        base:   ['1rem',       { lineHeight: '1.55rem' }],   // 16px
        lg:     ['1.125rem',   { lineHeight: '1.65rem' }],   // 18px
        xl:     ['1.25rem',    { lineHeight: '1.75rem' }],   // 20px
        '2xl':  ['1.5rem',     { lineHeight: '2rem' }],      // 24px
        '3xl':  ['1.875rem',   { lineHeight: '2.3rem' }],    // 30px
        '4xl':  ['2.25rem',    { lineHeight: '2.6rem' }],    // 36px
        '5xl':  ['3rem',       { lineHeight: '1.1' }],       // 48px — display
        '6xl':  ['3.75rem',    { lineHeight: '1.05' }],      // 60px — hero
      },

      // ====================================================================
      // Spacing / sizing
      // ====================================================================
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '128': '32rem',
      },
      maxWidth: {
        '2xs': '16rem',
        '8xl': '88rem',
        'prose-sm': '32rem',
      },

      // ====================================================================
      // Borders & radius
      // ====================================================================
      borderRadius: {
        'sm':  '0.25rem',
        'md':  '0.375rem',
        'lg':  '0.5rem',
        'xl':  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },

      // ====================================================================
      // Shadows — restrained, institutional
      // ====================================================================
      boxShadow: {
        'crest':   '0 2px 0 0 #7A0019',
        'card':    '0 1px 2px 0 rgba(26, 23, 20, 0.04), 0 1px 3px 0 rgba(26, 23, 20, 0.06)',
        'lifted':  '0 4px 6px -1px rgba(26, 23, 20, 0.08), 0 2px 4px -2px rgba(26, 23, 20, 0.06)',
        'focused': '0 0 0 3px rgba(168, 50, 69, 0.18)',
        'glow':    '0 0 0 4px rgba(201, 162, 39, 0.25)',
      },

      // ====================================================================
      // Background images — subtle paper texture and branded gradient
      // ====================================================================
      backgroundImage: {
        'paper':        "linear-gradient(180deg, #FBF9F4 0%, #F6F1E6 100%)",
        'maroon-deep':  "linear-gradient(135deg, #7A0019 0%, #5A0012 55%, #3D000C 100%)",
        'gold-wash':    "linear-gradient(180deg, #FDF9EF 0%, #FAF0D4 100%)",
        'crest-line':   "linear-gradient(90deg, transparent 0%, #7A0019 50%, transparent 100%)",
      },

      // ====================================================================
      // Animation
      // ====================================================================
      keyframes: {
        'fade-in':    { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'slide-up':   { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        'pulse-ring': { '0%': { boxShadow: '0 0 0 0 rgba(168, 50, 69, 0.35)' }, '100%': { boxShadow: '0 0 0 14px rgba(168, 50, 69, 0)' } },
      },
      animation: {
        'fade-in':   'fade-in 240ms ease-out both',
        'slide-up':  'slide-up 360ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'pulse-ring': 'pulse-ring 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
```

**Verify:** `npm run dev` should still run. Nothing uses these new classes yet, so the UI looks identical — that's fine.

---

## Task 4 — Rewrite `src/index.css` with the global layer + component classes

**File:** `src/frontend/src/index.css`

Replace entire contents:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ==========================================================================
   Base layer — global resets & root typography
   ========================================================================== */
@layer base {
  html {
    font-family: theme('fontFamily.sans');
    color: theme('colors.ink.700');
    background-color: theme('colors.cream.100');
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  body {
    min-height: 100dvh;
  }

  /* Selection */
  ::selection {
    background-color: theme('colors.maroon.100');
    color: theme('colors.maroon.800');
  }

  /* Headings — always display serif */
  h1, h2, h3, h4, h5, h6 {
    font-family: theme('fontFamily.display');
    color: theme('colors.ink.800');
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  /* Focus ring — consistent across all interactive elements */
  *:focus-visible {
    outline: none;
    box-shadow: theme('boxShadow.focused');
    border-radius: theme('borderRadius.md');
  }

  /* Remove default button styles; we style via .btn-* classes */
  button {
    font-family: inherit;
    cursor: pointer;
  }

  button:disabled {
    cursor: not-allowed;
  }

  /* Consistent input baseline */
  input, select, textarea {
    font-family: inherit;
    color: inherit;
  }

  /* Links default to maroon */
  a {
    color: theme('colors.maroon.600');
    text-underline-offset: 2px;
  }
  a:hover {
    color: theme('colors.maroon.700');
  }
}

/* ==========================================================================
   Components layer — reusable utility-class composites
   ========================================================================== */
@layer components {

  /* ---------- Buttons ---------- */
  .btn {
    @apply inline-flex items-center justify-center gap-2
           font-medium text-sm leading-none
           transition-all duration-150
           rounded-md select-none
           disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-sm  { @apply px-3  py-1.5 text-xs; }
  .btn-md  { @apply px-4  py-2.5 text-sm; }
  .btn-lg  { @apply px-6  py-3   text-base; }

  .btn-primary {
    @apply btn btn-md text-white bg-maroon-600
           hover:bg-maroon-700 active:bg-maroon-800
           shadow-sm hover:shadow;
  }

  .btn-secondary {
    @apply btn btn-md text-maroon-700 bg-white border border-maroon-200
           hover:border-maroon-400 hover:bg-maroon-50;
  }

  .btn-ghost {
    @apply btn btn-md text-ink-700 bg-transparent
           hover:bg-cream-200;
  }

  .btn-danger {
    @apply btn btn-md text-white bg-danger
           hover:bg-danger-ring;
  }

  /* ---------- Form fields ---------- */
  .form-label {
    @apply block text-sm font-medium text-ink-700 mb-1.5;
  }

  .form-hint {
    @apply text-xs text-ink-400 font-normal;
  }

  .form-error {
    @apply text-xs text-danger mt-1.5 flex items-center gap-1;
  }

  .input-field {
    @apply w-full px-3.5 py-2.5 text-sm
           bg-white border border-ink-200
           rounded-md text-ink-800 placeholder-ink-300
           transition-colors duration-150
           focus:border-maroon-500 focus:outline-none
           disabled:bg-cream-100 disabled:text-ink-400;
  }

  .input-field.input-error {
    @apply border-danger focus:border-danger;
  }

  /* ---------- Cards ---------- */
  .card {
    @apply bg-white rounded-xl shadow-card
           border border-ink-100;
  }

  .card-header {
    @apply px-6 py-4 border-b border-ink-100;
  }

  .card-body {
    @apply px-6 py-5;
  }

  .card-maroon {
    @apply card border-l-4 border-l-maroon-600;
  }

  /* ---------- Page header / section title ---------- */
  .page-title {
    @apply font-display text-3xl font-semibold text-ink-800 tracking-tight;
  }

  .page-subtitle {
    @apply font-sans text-base text-ink-500 mt-1;
  }

  .section-title {
    @apply font-display text-xl font-semibold text-ink-800;
  }

  /* ---------- Alerts / banners ---------- */
  .alert {
    @apply flex items-start gap-3 px-4 py-3 rounded-md text-sm;
  }

  .alert-success { @apply alert bg-success-bg text-success border border-success-ring/30; }
  .alert-warning { @apply alert bg-warning-bg text-warning border border-warning-ring/30; }
  .alert-danger  { @apply alert bg-danger-bg  text-danger  border border-danger-ring/30; }
  .alert-info    { @apply alert bg-info-bg    text-info    border border-info-ring/30; }

  /* ---------- Status badges ---------- */
  .badge {
    @apply inline-flex items-center gap-1 px-2 py-0.5
           text-xs font-medium rounded-full;
  }
  .badge-success    { @apply badge bg-success-bg text-success; }
  .badge-warning    { @apply badge bg-warning-bg text-warning; }
  .badge-danger     { @apply badge bg-danger-bg  text-danger; }
  .badge-neutral    { @apply badge bg-ink-100    text-ink-600; }
  .badge-maroon     { @apply badge bg-maroon-50  text-maroon-700; }

  /* ---------- Decorative: UoH bar separator ---------- */
  .uoh-bar {
    @apply h-[3px] w-16 bg-maroon-600 rounded-full;
  }
  .uoh-bar-gold {
    @apply h-[3px] w-16 bg-gold-500 rounded-full;
  }

  /* ---------- Logo display ---------- */
  .uoh-logo-mark {
    @apply object-contain drop-shadow-sm;
    /* Consistent baseline sizing — override with w-X h-Y in consumers */
  }
}

/* ==========================================================================
   Utilities layer — one-off tweaks
   ========================================================================== */
@layer utilities {

  .text-balance { text-wrap: balance; }
  .text-pretty  { text-wrap: pretty; }

  /* Subtle paper-like grain background */
  .bg-paper-texture {
    background-color: theme('colors.cream.100');
    background-image:
      radial-gradient(circle at 1px 1px, rgba(122, 0, 25, 0.035) 1px, transparent 0);
    background-size: 24px 24px;
  }

  /* Decorative divider — thin line with UoH maroon tick in the middle */
  .divider-uoh::before,
  .divider-uoh::after {
    content: '';
    flex: 1;
    height: 1px;
    background: theme('colors.ink.200');
  }
  .divider-uoh {
    @apply flex items-center gap-3 text-xs text-ink-400 uppercase tracking-widest;
  }
}
```

**Verify:** `npm run dev`. The page-wide body should now have a warm cream background instead of white. Most other things remain unstyled — that's expected; we apply them in Tasks 5+.

---

## Task 5 — Build reusable React primitives

**Goal:** Create a small component library the whole app uses. No more ad-hoc Tailwind classes scattered across 20 files.

**Directory:** `src/frontend/src/components/ui/` (new)

Create each of these files:

### `src/frontend/src/components/ui/Button.jsx`

```jsx
/**
 * Button — primary interactive element.
 *
 * Props:
 *   variant: 'primary' (default) | 'secondary' | 'ghost' | 'danger'
 *   size:    'sm' | 'md' (default) | 'lg'
 *   loading: boolean — shows spinner, disables button
 *   icon:    ReactNode — optional leading icon
 *   iconRight: ReactNode — optional trailing icon
 *   fullWidth: boolean
 *   ...buttonProps (onClick, type, disabled, children, etc.)
 */
import clsx from 'clsx';

const VARIANTS = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  ghost:     'btn-ghost',
  danger:    'btn-danger',
};

const SIZES = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  iconRight = null,
  fullWidth = false,
  className = '',
  children,
  type = 'button',
  ...rest
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={clsx(
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {loading ? (
        <Spinner size={size} />
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {!loading && iconRight && <span className="flex-shrink-0">{iconRight}</span>}
    </button>
  );
}

function Spinner({ size }) {
  const dim = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <svg className={clsx('animate-spin', dim)} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}
```

**Note:** `clsx` needs to be installed. Add this to dependencies by running `npm install clsx` in `src/frontend/`.

### `src/frontend/src/components/ui/Input.jsx`

```jsx
/**
 * Input — labeled text input with built-in error/hint/icon slots.
 *
 * Props:
 *   label:     string
 *   error:     string | undefined
 *   hint:      string | undefined
 *   icon:      ReactNode — leading icon (e.g. HiOutlineMail)
 *   trailing:  ReactNode — trailing element (e.g. show-password button)
 *   containerClassName: className for the wrapper
 *   ...inputProps (id, name, type, value, onChange, placeholder, etc.)
 */
import clsx from 'clsx';
import { forwardRef } from 'react';

const Input = forwardRef(function Input({
  label,
  error,
  hint,
  icon = null,
  trailing = null,
  containerClassName = '',
  id,
  className = '',
  ...rest
}, ref) {
  const inputId = id || rest.name;

  return (
    <div className={clsx('w-full', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {hint && <span className="form-hint ml-1.5">{hint}</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'input-field',
            icon      && 'pl-10',
            trailing  && 'pr-10',
            error     && 'input-error',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...rest}
        />
        {trailing && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">
            {trailing}
          </span>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="form-error">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
});

export default Input;
```

### `src/frontend/src/components/ui/Select.jsx`

```jsx
/**
 * Select — styled dropdown with label/error/hint/icon support.
 */
import clsx from 'clsx';
import { forwardRef } from 'react';

const Select = forwardRef(function Select({
  label,
  error,
  hint,
  icon = null,
  placeholder = 'Select…',
  options = [],   // [{value, label, disabled?}, ...]
  containerClassName = '',
  id,
  className = '',
  ...rest
}, ref) {
  const inputId = id || rest.name;
  return (
    <div className={clsx('w-full', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {hint && <span className="form-hint ml-1.5">{hint}</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">
            {icon}
          </span>
        )}
        <select
          ref={ref}
          id={inputId}
          className={clsx(
            'input-field appearance-none pr-10 cursor-pointer',
            icon  && 'pl-10',
            error && 'input-error',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...rest}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* Chevron */}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </div>
      {error && (
        <p id={`${inputId}-error`} className="form-error">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
});

export default Select;
```

### `src/frontend/src/components/ui/Card.jsx`

```jsx
/**
 * Card — bordered container for content sections.
 *
 * Props:
 *   variant: 'default' | 'maroon'  (maroon adds left accent bar)
 *   header, children (body), footer
 */
import clsx from 'clsx';

export default function Card({ variant = 'default', header, footer, className = '', children }) {
  return (
    <div className={clsx(
      variant === 'maroon' ? 'card-maroon' : 'card',
      className
    )}>
      {header && <div className="card-header">{header}</div>}
      <div className="card-body">{children}</div>
      {footer && <div className="card-header border-b-0 border-t">{footer}</div>}
    </div>
  );
}
```

### `src/frontend/src/components/ui/Alert.jsx`

```jsx
/**
 * Alert — inline notification banner.
 *
 * Props:
 *   variant: 'success' | 'warning' | 'danger' | 'info'
 *   title:    optional bolded title line
 *   icon:     optional override (defaults provided)
 */
import clsx from 'clsx';
import { HiCheckCircle, HiExclamation, HiXCircle, HiInformationCircle } from 'react-icons/hi';

const VARIANTS = {
  success: { cls: 'alert-success', Icon: HiCheckCircle },
  warning: { cls: 'alert-warning', Icon: HiExclamation },
  danger:  { cls: 'alert-danger',  Icon: HiXCircle },
  info:    { cls: 'alert-info',    Icon: HiInformationCircle },
};

export default function Alert({ variant = 'info', title, icon, className = '', children }) {
  const { cls, Icon } = VARIANTS[variant];
  const Glyph = icon || <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />;

  return (
    <div className={clsx(cls, className)} role="alert">
      {Glyph}
      <div className="flex-1">
        {title && <p className="font-semibold leading-tight mb-0.5">{title}</p>}
        <p className="text-sm leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
```

### `src/frontend/src/components/ui/Badge.jsx`

```jsx
/**
 * Badge — status pill.
 *
 * Usage: <Badge status="PENDING_APPROVAL" /> — auto-maps to semantic colour.
 * Or:   <Badge variant="success">Custom</Badge>
 */
import clsx from 'clsx';

const STATUS_MAP = {
  ACTIVE:           { variant: 'success', label: 'Active' },
  UNVERIFIED:       { variant: 'warning', label: 'Awaiting verification' },
  PENDING_APPROVAL: { variant: 'warning', label: 'Pending approval' },
  SUSPENDED:        { variant: 'danger',  label: 'Suspended' },
  DEACTIVATED:      { variant: 'neutral', label: 'Deactivated' },
  REJECTED:         { variant: 'danger',  label: 'Rejected' },
  OPEN:             { variant: 'success', label: 'Open' },
  CLOSED:           { variant: 'neutral', label: 'Closed' },
  APPLIED:          { variant: 'maroon',  label: 'Applied' },
  SHORTLISTED:      { variant: 'maroon',  label: 'Shortlisted' },
  SELECTED:         { variant: 'success', label: 'Selected' },
  WITHDRAWN_STUDENT:{ variant: 'neutral', label: 'Withdrawn' },
};

const VARIANT_CLASS = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger:  'badge-danger',
  neutral: 'badge-neutral',
  maroon:  'badge-maroon',
};

export default function Badge({ status, variant, children, className = '' }) {
  if (status && STATUS_MAP[status]) {
    const { variant: v, label } = STATUS_MAP[status];
    return (
      <span className={clsx(VARIANT_CLASS[v], className)}>
        {children || label}
      </span>
    );
  }

  return (
    <span className={clsx(VARIANT_CLASS[variant || 'neutral'], className)}>
      {children}
    </span>
  );
}
```

### `src/frontend/src/components/ui/PageHeader.jsx`

```jsx
/**
 * PageHeader — standard page title block with optional subtitle and right-side actions.
 * Includes the UoH maroon bar accent.
 */
export default function PageHeader({ title, subtitle, actions, className = '' }) {
  return (
    <header className={`flex items-start justify-between gap-6 pb-6 mb-6 ${className}`}>
      <div>
        <div className="uoh-bar mb-3"></div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="flex-shrink-0 flex items-center gap-2">{actions}</div>}
    </header>
  );
}
```

### `src/frontend/src/components/ui/Logo.jsx`

```jsx
/**
 * Logo — UoH emblem + wordmark.
 *
 * Props:
 *   variant: 'full' (logo + wordmark) | 'mark' (just emblem)
 *   theme:   'light' (for maroon/dark backgrounds) | 'dark' (default)
 *   size:    'sm' | 'md' | 'lg'
 */
import clsx from 'clsx';
import uohLogo from '../../assets/uoh-logo.png';

const SIZES = {
  sm: { mark: 'w-8 h-8',  text: 'text-sm' },
  md: { mark: 'w-12 h-12', text: 'text-base' },
  lg: { mark: 'w-20 h-20', text: 'text-lg' },
};

export default function Logo({ variant = 'full', theme = 'dark', size = 'md', className = '' }) {
  const { mark, text } = SIZES[size];
  const textCls = theme === 'light' ? 'text-white' : 'text-ink-800';

  // If theme is light and we don't have a white logo asset, filter the maroon one to white
  const maskCls = theme === 'light' ? 'filter brightness-0 invert' : '';

  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <img
        src={uohLogo}
        alt="University of Hyderabad"
        className={clsx('uoh-logo-mark object-contain', mark, maskCls)}
      />
      {variant === 'full' && (
        <div className={clsx('leading-tight', textCls)}>
          <div className={clsx('font-display font-semibold', text)}>University of Hyderabad</div>
          <div className="text-xs font-medium opacity-80 uppercase tracking-wider">Placement Portal</div>
        </div>
      )}
    </div>
  );
}
```

### `src/frontend/src/components/ui/index.js` (barrel export)

```javascript
export { default as Button }      from './Button';
export { default as Input }       from './Input';
export { default as Select }      from './Select';
export { default as Card }        from './Card';
export { default as Alert }       from './Alert';
export { default as Badge }       from './Badge';
export { default as PageHeader }  from './PageHeader';
export { default as Logo }        from './Logo';
```

**Verify:** Run `npm install clsx`, then `npm run dev`. Components aren't used anywhere yet, so the UI is unchanged. If there are import errors, those will surface when you start using them in Task 6.

---

## Task 6 — Redesign `LoginPage.jsx` as the reference implementation

**File:** `src/frontend/src/pages/LoginPage.jsx`

This is the page other pages will pattern themselves after. Replace entire contents with:

```jsx
/**
 * LoginPage — UoH PMS sign-in.
 *
 * Layout: editorial two-column.
 *   Left (60%) — cream background with UoH branding, stats, and motto.
 *   Right (40%) — maroon gradient with the sign-in form.
 *
 * Responsive: below lg, the left panel hides; form fills the viewport.
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlineEye, HiOutlineEyeOff,
  HiOutlineMail, HiOutlineLockClosed,
} from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';

import { Button, Input, Alert, Logo } from '../components/ui';

const LoginPage = () => {
  const { startLogin, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState('');

  const infoMessage = location.state?.message;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await startLogin(email.trim().toLowerCase(), password);
      toast.success('Code sent. Check your inbox.');
      navigate('/verify-otp', { replace: true });
    } catch (err) {
      setError(err?.message || 'Sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    try {
      const response = await loginWithGoogle();
      toast.success(`Welcome, ${response.data.fullName || response.data.name}!`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err?.message || 'Google sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-cream-100">
      {/* =================== LEFT PANEL — branding =================== */}
      <div className="hidden lg:flex lg:w-3/5 bg-paper-texture flex-col justify-between p-12 xl:p-16 relative">
        {/* Top bar with logo */}
        <div>
          <Logo variant="full" size="md" />
        </div>

        {/* Centre: emblem + headline */}
        <div className="max-w-xl">
          <div className="uoh-bar mb-6"></div>
          <h2 className="font-display text-5xl xl:text-6xl font-semibold text-ink-800 leading-[1.05] text-balance">
            The bridge between<br />
            <span className="text-maroon-600 italic">your degree</span> and<br />
            your first offer.
          </h2>
          <p className="mt-8 text-lg text-ink-500 max-w-md leading-relaxed">
            The University of Hyderabad Placement Management System connects students,
            faculty coordinators, the TPO, and recruiters in one institutional workflow.
          </p>
        </div>

        {/* Bottom: stats + motto */}
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-6 max-w-lg">
            {[
              ['Students',  '5,000+'],
              ['Recruiters', '300+'],
              ['Schools',   '12'],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="font-display text-3xl font-semibold text-maroon-600">{val}</p>
                <p className="text-xs uppercase tracking-wider text-ink-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-ink-100">
            <p className="font-display text-lg text-ink-700 italic">सा विद्या या विमुच्यते</p>
            <p className="text-xs text-ink-400 mt-1">&ldquo;That which liberates is knowledge.&rdquo;</p>
          </div>
        </div>
      </div>

      {/* =================== RIGHT PANEL — form =================== */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-maroon-deep relative overflow-hidden">
        {/* decorative gold accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="w-full max-w-md mx-auto relative">
          {/* Mobile logo — visible only below lg */}
          <div className="lg:hidden mb-8">
            <Logo variant="full" size="sm" theme="light" />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-semibold text-white">Sign in</h1>
            <p className="mt-1.5 text-sm text-white/70">
              Don&rsquo;t have an account?{' '}
              <Link to="/register" className="text-gold-300 font-semibold hover:text-gold-200 underline-offset-4 hover:underline">
                Register here
              </Link>
            </p>
          </div>

          {/* Info banner from previous route */}
          {infoMessage && (
            <Alert variant="info" className="mb-6">
              {infoMessage}
            </Alert>
          )}

          {/* Inline error */}
          {error && (
            <Alert variant="danger" className="mb-6">
              {error}
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            <div className="relative">
              {/* We override the generic Input styling here because we're on a dark background */}
              <label htmlFor="email" className="block text-sm font-medium text-white mb-1.5">
                Email address
              </label>
              <div className="relative">
                <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@uohyd.ac.in"
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-white/10 border border-white/20 rounded-md text-white placeholder-white/40 focus:border-gold-400 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-white">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-gold-300 font-medium hover:text-gold-200">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-white/10 border border-white/20 rounded-md text-white placeholder-white/40 focus:border-gold-400 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={submitting}
              className="!bg-white !text-maroon-700 hover:!bg-cream-100 mt-2"
            >
              Continue
            </Button>

            <div className="divider-uoh !text-white/40 before:!bg-white/20 after:!bg-white/20">
              <span>or</span>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="md"
              fullWidth
              onClick={handleGoogle}
              disabled={submitting}
              icon={<FcGoogle className="w-5 h-5" />}
              className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20"
            >
              Continue with Google
            </Button>
          </form>

          <p className="mt-10 text-xs text-white/40 text-center">
            © 2026 University of Hyderabad · Placement Guidance and Advisory Bureau
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
```

**Why the form uses bespoke inputs instead of the `<Input>` primitive:** the form sits on a maroon dark background, where the standard `<Input>` (designed for cream backgrounds) would look wrong. This is an acceptable exception; regular forms on cream backgrounds should use the primitive.

**Verify:** Run `npm run dev` and load `/login`. Expected:
- Left panel: cream background with subtle dot texture, UoH logo top-left, large serif headline with "your degree" in maroon italic, three stats (Students/Recruiters/Schools), Sanskrit motto at the bottom.
- Right panel: deep maroon gradient with a soft gold halo in the top-right, white sign-in form, gold "forgot password" link, white primary button, white "Continue with Google" secondary button.

---

## Task 7 — Redesign `RegisterPage.jsx`

**File:** `src/frontend/src/pages/RegisterPage.jsx`

The registration page is longer because it needs schools/departments. Apply the same visual language as LoginPage (cream-left, maroon-right) but with an editable form on the right instead of a pure sign-in form.

The key functional changes from Task 15 of the Sprint 1 brief:
- Role dropdown only shows Student and Company (Faculty and TPO are admin-provisioned)
- Schools and Departments load from `/api/reference/schools` and `/api/reference/departments`
- When role is Student, both schoolId and departmentId are required
- Password validator matches SRS FR-1.14 (8 chars, upper, lower, digit — drop special-char requirement)

Replace entire contents:

```jsx
import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  HiEye, HiEyeOff, HiOutlineMail, HiOutlineLockClosed,
  HiOutlineUser, HiOutlineAcademicCap, HiOutlineOfficeBuilding,
} from 'react-icons/hi';

import { Button, Input, Select, Alert, Logo } from '../components/ui';

const UNIVERSITY_DOMAIN = import.meta.env.VITE_UNIVERSITY_EMAIL_DOMAIN || 'uohyd.ac.in';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ROLE_OPTIONS = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'COMPANY', label: 'Company / Recruiter' },
];

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    role:            '',
    fullName:        '',
    email:           '',
    password:        '',
    confirmPassword: '',
    schoolId:        '',
    departmentId:    '',
    companyName:     '',
    website:         '',
  });
  const [errors, setErrors]     = useState({});
  const [showPwd, setShowPwd]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reference data
  const [schools, setSchools]         = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/reference/schools`)
      .then((r) => r.json()).then((d) => d.success && setSchools(d.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.schoolId) { setDepartments([]); return; }
    fetch(`${API_URL}/reference/departments?schoolId=${encodeURIComponent(form.schoolId)}`)
      .then((r) => r.json()).then((d) => d.success && setDepartments(d.data))
      .catch(() => {});
  }, [form.schoolId]);

  const schoolOptions = useMemo(
    () => schools.map((s) => ({ value: s.id, label: s.name })),
    [schools]
  );
  const deptOptions = useMemo(
    () => departments.map((d) => ({ value: d.id, label: d.name })),
    [departments]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({
      ...p,
      [name]: value,
      // Reset departmentId if school changes
      ...(name === 'schoolId' ? { departmentId: '' } : {}),
    }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.role) errs.role = 'Please pick who you are.';
    if (!form.fullName.trim() || form.fullName.trim().length < 2) errs.fullName = 'Full name required.';

    if (!form.email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Invalid email format.';
    } else if (form.role === 'STUDENT') {
      const domain = form.email.split('@')[1];
      if (domain !== UNIVERSITY_DOMAIN) {
        errs.email = `Students must register with a @${UNIVERSITY_DOMAIN} email.`;
      }
    }

    if (!form.password) {
      errs.password = 'Password required.';
    } else if (!PASSWORD_REGEX.test(form.password)) {
      errs.password = 'Use at least 8 characters with one uppercase, one lowercase, and one digit.';
    }

    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    if (form.role === 'STUDENT') {
      if (!form.schoolId)     errs.schoolId     = 'Please select your School.';
      if (!form.departmentId) errs.departmentId = 'Please select your Department.';
    }

    if (form.role === 'COMPANY') {
      if (!form.companyName.trim()) errs.companyName = 'Company name required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        role:     form.role,
        name:     form.fullName.trim(),
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        ...(form.role === 'STUDENT' ? {
          schoolId:     form.schoolId,
          departmentId: form.departmentId,
        } : {
          companyName: form.companyName.trim(),
          website:     form.website.trim() || undefined,
        }),
      };
      await register(payload);
      toast.success(
        form.role === 'STUDENT'
          ? 'Registration successful. Check your email to verify your account.'
          : 'Registration submitted. You will be notified after TPO approval.'
      );
      navigate('/login', {
        state: {
          message: form.role === 'STUDENT'
            ? 'Check your email to verify your account, then sign in.'
            : 'Your company registration is pending TPO approval.',
        },
      });
    } catch (err) {
      if (err?.data?.errors) {
        const fieldErrors = {};
        err.data.errors.forEach((e) => { if (e.path) fieldErrors[e.path] = e.msg; });
        setErrors((p) => ({ ...p, ...fieldErrors }));
      }
      toast.error(err?.data?.message || err?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-cream-100">
      {/* =================== LEFT PANEL — branding =================== */}
      <div className="hidden lg:flex lg:w-2/5 bg-maroon-deep flex-col justify-between p-12 xl:p-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <Logo variant="full" size="md" theme="light" />

        <div className="relative">
          <div className="w-16 h-[3px] bg-gold-500 rounded-full mb-6"></div>
          <h2 className="font-display text-4xl xl:text-5xl font-semibold text-white leading-[1.1] text-balance">
            Join the <span className="text-gold-300 italic">UoH placement</span> network.
          </h2>
          <p className="mt-6 text-white/70 text-base leading-relaxed max-w-sm">
            Register as a student with a university email, or as a recruiter from a
            hiring organisation. Faculty and TPO accounts are provisioned by the
            Administrator.
          </p>
        </div>

        <p className="relative text-xs text-white/40">
          © 2026 University of Hyderabad · Placement Guidance and Advisory Bureau
        </p>
      </div>

      {/* =================== RIGHT PANEL — form =================== */}
      <div className="flex-1 overflow-y-auto flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="w-full max-w-xl mx-auto">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Logo variant="full" size="sm" />
          </div>

          <div className="mb-7">
            <div className="uoh-bar mb-3"></div>
            <h1 className="font-display text-3xl font-semibold text-ink-800">Create your account</h1>
            <p className="mt-1.5 text-sm text-ink-500">
              Already registered?{' '}
              <Link to="/login" className="text-maroon-600 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Role selector — segmented control */}
            <div>
              <label className="form-label">I am registering as</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {ROLE_OPTIONS.map((r) => {
                  const active = form.role === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => {
                        setForm((p) => ({ ...p, role: r.value }));
                        if (errors.role) setErrors((p) => ({ ...p, role: '' }));
                      }}
                      className={`py-3 px-4 rounded-md border text-sm font-medium transition-all duration-150 ${
                        active
                          ? 'bg-maroon-600 text-white border-maroon-600 shadow-sm'
                          : 'bg-white text-ink-700 border-ink-200 hover:border-maroon-300 hover:text-maroon-700'
                      }`}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
              {errors.role && <p className="form-error mt-2">⚠ {errors.role}</p>}
            </div>

            {/* Common fields */}
            <Input
              label="Full name"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              error={errors.fullName}
              icon={<HiOutlineUser className="w-4 h-4" />}
              placeholder="e.g. Priya Sharma"
            />

            <Input
              label="Email address"
              hint={form.role === 'STUDENT' ? `(@${UNIVERSITY_DOMAIN} required)` : undefined}
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              icon={<HiOutlineMail className="w-4 h-4" />}
              placeholder={form.role === 'STUDENT' ? `yourname@${UNIVERSITY_DOMAIN}` : 'you@company.com'}
            />

            {/* Student-specific */}
            {form.role === 'STUDENT' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up">
                <Select
                  label="School"
                  name="schoolId"
                  value={form.schoolId}
                  onChange={handleChange}
                  error={errors.schoolId}
                  icon={<HiOutlineAcademicCap className="w-4 h-4" />}
                  options={schoolOptions}
                  placeholder="Select your School"
                />
                <Select
                  label="Department"
                  name="departmentId"
                  value={form.departmentId}
                  onChange={handleChange}
                  error={errors.departmentId}
                  icon={<HiOutlineAcademicCap className="w-4 h-4" />}
                  options={deptOptions}
                  placeholder={form.schoolId ? 'Select Department' : 'Pick a School first'}
                  disabled={!form.schoolId}
                />
              </div>
            )}

            {/* Company-specific */}
            {form.role === 'COMPANY' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up">
                <Input
                  label="Company name"
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  error={errors.companyName}
                  icon={<HiOutlineOfficeBuilding className="w-4 h-4" />}
                  placeholder="e.g. Acme Technologies"
                />
                <Input
                  label="Website"
                  hint="(optional)"
                  name="website"
                  type="url"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </div>
            )}

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Password"
                hint="min 8, upper/lower/digit"
                name="password"
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                error={errors.password}
                icon={<HiOutlineLockClosed className="w-4 h-4" />}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="text-ink-400 hover:text-ink-700"
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                  >
                    {showPwd ? <HiEyeOff className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
                  </button>
                }
              />
              <Input
                label="Confirm password"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                icon={<HiOutlineLockClosed className="w-4 h-4" />}
              />
            </div>

            {form.role === 'COMPANY' && (
              <Alert variant="info" title="Company accounts require approval">
                Your registration will be reviewed by the TPO before sign-in is enabled.
                You will receive an email once approved.
              </Alert>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={submitting}
              className="mt-2"
            >
              Create account
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
```

**Verify:** Register page should load with the two-panel layout. Role switcher should reveal School/Department or Company Name/Website. Password validation should fire on invalid entries. If the backend is running, school and department dropdowns should populate from `/api/reference/*`.

---

## Task 8 — Create the VerifyOTPPage

**File:** `src/frontend/src/pages/VerifyOTPPage.jsx` (new)

Referenced by the Sprint 1 brief Task 5. Now we give it the theme.

```jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Button, Alert, Logo } from '../components/ui';

const OTP_LENGTH = 6;

const VerifyOTPPage = () => {
  const { completeLogin, startLogin } = useAuth();   // completeLogin from Sprint 1 brief Task 15
  const navigate = useNavigate();

  const [code, setCode]           = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [attempts, setAttempts]   = useState(null);
  const inputs = useRef([]);

  const pendingUid = typeof window !== 'undefined'
    ? sessionStorage.getItem('pms_pending_uid')
    : null;

  useEffect(() => {
    if (!pendingUid) navigate('/login', { replace: true });
    inputs.current[0]?.focus();
  }, [pendingUid, navigate]);

  const handleChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[idx] = val;
    setCode(next);
    setError('');
    if (val && idx < OTP_LENGTH - 1) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && idx > 0) inputs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < OTP_LENGTH - 1) inputs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted.length === 0) return;
    const next = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setCode(next);
    inputs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const joined = code.join('');
    if (joined.length !== OTP_LENGTH) {
      setError('Please enter all 6 digits.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await completeLogin(joined);
      toast.success(`Welcome, ${response.data.fullName || 'back'}!`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err?.message || err?.data?.message || 'Verification failed.';
      setError(msg);
      if (err?.data?.code === 'WRONG-CODE' && typeof err?.data?.attemptsRemaining === 'number') {
        setAttempts(err.data.attemptsRemaining);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    // Resending requires the original email/password combo; for simplicity
    // we send the user back to sign in again. A richer flow is Sprint 2+.
    sessionStorage.removeItem('pms_pending_uid');
    sessionStorage.removeItem('pms_pending_token');
    navigate('/login', {
      state: { message: 'Please sign in again to receive a new code.' },
    });
  };

  return (
    <div className="min-h-screen bg-paper-texture flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo variant="full" size="md" />
        </div>

        <div className="card p-8">
          <div className="uoh-bar mb-4"></div>
          <h1 className="font-display text-3xl font-semibold text-ink-800">Enter your code</h1>
          <p className="mt-2 text-sm text-ink-500">
            We sent a 6-digit code to your registered email. It expires in 10 minutes.
          </p>

          {error && (
            <Alert variant="danger" className="mt-6">
              {error}
              {attempts !== null && attempts > 0 && (
                <span className="block mt-1 text-xs">
                  {attempts} attempt{attempts === 1 ? '' : 's'} remaining.
                </span>
              )}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="mt-6">
            <div className="flex gap-2 justify-between" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center font-mono text-xl font-semibold bg-white border-2 border-ink-200 rounded-md text-ink-800 focus:border-maroon-500 focus:outline-none transition-colors"
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={submitting}
              className="mt-6"
            >
              Verify &amp; sign in
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-ink-100 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={handleResend}
              className="text-maroon-600 hover:text-maroon-700 font-medium"
            >
              Resend code
            </button>
            <Link to="/login" className="text-ink-500 hover:text-ink-700">
              Back to sign in
            </Link>
          </div>
        </div>

        <p className="mt-6 text-xs text-ink-400 text-center">
          Didn&rsquo;t get a code? Check your spam folder, or resend above.
        </p>
      </div>
    </div>
  );
};

export default VerifyOTPPage;
```

**Verify:** After completing the Sprint 1 brief Task 5 (OTP backend), manually test the login → OTP → dashboard flow. The OTP page should auto-advance between digits, support paste, and show attempts-remaining on wrong code.

---

## Task 9 — Update `App.jsx` router with the new route

**File:** `src/frontend/src/App.jsx`

Add the route. Inside the `<Routes>` block:

```jsx
import VerifyOTPPage from './pages/VerifyOTPPage';

// ... inside <Routes>:
<Route path="/verify-otp" element={<VerifyOTPPage />} />
```

---

## Task 10 — Update `AuthContext` to match the new login split

The Sprint 1 brief already describes this (Task 15). For completeness, the relevant snippet:

**File:** `src/frontend/src/contexts/AuthContext.jsx`

Replace the existing `login` function with `startLogin` and `completeLogin`:

```jsx
const startLogin = async (email, password) => {
  setError(null);
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  if (!user.emailVerified) {
    await signOut(auth);
    throw new Error('Please verify your email before signing in.');
  }

  const token = await user.getIdToken();
  const response = await authAPI.login(token);
  sessionStorage.setItem('pms_pending_uid',   response.data.uid);
  sessionStorage.setItem('pms_pending_token', token);
  return response;
};

const completeLogin = async (otp) => {
  setError(null);
  const token = sessionStorage.getItem('pms_pending_token');
  if (!token) throw new Error('Session expired. Please sign in again.');
  const response = await authAPI.verifyLoginOTP(token, otp);
  setUserProfile(response.data);
  sessionStorage.removeItem('pms_pending_uid');
  sessionStorage.removeItem('pms_pending_token');
  return response;
};
```

Export `startLogin` and `completeLogin` in the context value (not `login`).

---

## Task 11 — Check every remaining file for residual blue styling

Run this check from the `src/frontend/` folder:

```bash
grep -r "blue-[0-9]" src/ --include="*.jsx" --include="*.js" --include="*.css"
```

Any match (e.g. `bg-blue-500`, `text-blue-600`) needs to be either:
- Replaced with a `maroon-*` equivalent, or
- Replaced with an `ink-*` neutral, or
- (Rarely) retained if it's semantically meaningful as info-blue — use `info` tokens in that case.

Known suspects: `Navbar.jsx`, `ProtectedRoute.jsx`, any existing dashboard placeholder pages.

**Replace common patterns:**
| Old | New |
|---|---|
| `bg-blue-600` → | `bg-maroon-600` |
| `from-blue-600 via-blue-700 to-blue-900` → | `bg-maroon-deep` (utility) |
| `text-blue-600` → | `text-maroon-600` |
| `border-blue-*` → | `border-maroon-*` |
| `bg-white/20 border-white/30` (on dark) → | `bg-white/10 border-white/20` (keep, it's fine) |
| `shadow-glow` if defined for blue → | already defined in `tailwind.config.js` as gold |
| `bg-surface-*` (old naming) → | `bg-cream-*` or `bg-ink-*` depending on meaning |

---

## Task 12 — Toast theming

**File:** Where `<Toaster />` is mounted (likely `src/frontend/src/App.jsx` or `main.jsx`).

Replace the existing `<Toaster />` with themed defaults:

```jsx
import { Toaster } from 'react-hot-toast';

// ... inside your top-level component:
<Toaster
  position="top-right"
  toastOptions={{
    duration: 4000,
    style: {
      fontFamily: 'Source Sans 3, system-ui, sans-serif',
      fontSize: '14px',
      borderRadius: '6px',
      padding: '12px 16px',
      background: '#fff',
      color: '#2E2924',
      border: '1px solid #EEEAE3',
      boxShadow: '0 4px 6px -1px rgba(26,23,20,0.08), 0 2px 4px -2px rgba(26,23,20,0.06)',
    },
    success: {
      iconTheme: { primary: '#2D6A4F', secondary: '#fff' },
    },
    error: {
      iconTheme: { primary: '#991B1B', secondary: '#fff' },
      style: { borderColor: '#FDEAEA' },
    },
  }}
/>
```

---

## Task 13 — Visual sanity check

Run `npm run dev` and visit each route:

| Route | Expected |
|---|---|
| `/login` | Two-panel layout; left = cream with UoH emblem + serif headline + stats + Sanskrit motto; right = maroon gradient with white form |
| `/register` | Left = maroon panel with logo + gold "UoH placement" headline; right = cream with the segmented role picker + form |
| `/verify-otp` | Single card on cream-textured background; 6-digit code input with monospace font |
| `/forgot-password` | Should inherit the new theme. If it was blue, apply Task 11 patterns. |

---

## What to tell the reviewer

> "We built a design system grounded in the official UoH brand identity rather than a generic SaaS theme. The primary colour is UoH Maroon, derived from the university emblem (#7A0019). The page background is a warm cream (#FBF9F4) to match the institutional print aesthetic. Typography pairs Fraunces — a modern serif with optical sizing — for display, with Source Sans 3 for body, giving an academic-publishing feel appropriate to the institution.
>
> The design tokens live in `tailwind.config.js` and are exposed through Tailwind's standard class names (e.g. `bg-maroon-600`, `text-gold-500`, `bg-cream-100`). Reusable React primitives — Button, Input, Select, Card, Alert, Badge, PageHeader, Logo — live in `src/components/ui/` so every feature page inherits the theme consistently. A status Badge component, for example, auto-maps the 5-state account-status enum from SRS v2.0 to the right semantic colour without consumers having to pick it manually.
>
> We replaced the AI-generated placeholder logo with the official UoH emblem. The sign-in page uses a two-panel editorial layout: a cream panel with the emblem, a serif headline, key statistics, and the Sanskrit motto; and a maroon panel housing the form. This is intentionally closer to university-press design than to Silicon Valley SaaS."

---

*End of brief. Visual verification is via `npm run dev`; there are no unit tests for pure design-system changes.*
