/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  safelist: [
    // Force-generate custom color utilities so @apply can resolve them
    { pattern: /^(bg|text|border|ring|from|to|via|fill|stroke|shadow|ring-offset|outline|caret|accent|decoration)-(maroon|gold|cream|ink)-(50|100|200|300|400|500|600|700|800|900)$/ },
    { pattern: /^(bg|text|border|ring)-(success|warning|danger|info)$/ },
    { pattern: /^(bg|text|border|ring)-(success|warning|danger|info)-(bg|ring)$/ },
    { pattern: /^hover:(bg|text|border|ring|shadow)-(maroon|gold|cream|ink)-(50|100|200|300|400|500|600|700|800|900)$/, variants: ['hover'] },
    { pattern: /^active:(bg|text|border)-(maroon|gold|cream|ink)-(50|100|200|300|400|500|600|700|800|900)$/, variants: ['active'] },
    { pattern: /^focus:(border|ring)-(maroon|gold|cream|ink)-(50|100|200|300|400|500|600|700|800|900)$/, variants: ['focus'] },
    { pattern: /^placeholder-(maroon|gold|cream|ink)-(50|100|200|300|400|500|600|700|800|900)$/ },
    { pattern: /^divide-(maroon|gold|cream|ink)-(50|100|200|300|400|500|600|700|800|900)$/ },
    'shadow-card', 'shadow-lifted', 'shadow-focused', 'shadow-glow', 'shadow-crest',
    'bg-maroon-deep', 'bg-paper', 'bg-gold-wash', 'bg-paper-texture',
  ],
  theme: {
    extend: {
      // ── UoH Colour System ──────────────────────────────────────────────
      colors: {
        maroon: {
          50:  '#FCF3F5',
          100: '#F8E1E6',
          200: '#EDB5C0',
          300: '#DC8393',
          400: '#C35365',
          500: '#A83245',
          600: '#7A0019',   // primary brand
          700: '#5A0012',
          800: '#3D000C',
          900: '#260007',
        },
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
        cream: {
          50:  '#FEFDFB',
          100: '#FBF9F4',   // page background
          200: '#F6F1E6',
          300: '#EEE5D1',
          400: '#E2D3B0',
          500: '#D4C08F',
        },
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
        success: { DEFAULT: '#2D6A4F', bg: '#E8F2ED', ring: '#74C69D' },
        warning: { DEFAULT: '#B45309', bg: '#FDF3E0', ring: '#F59E0B' },
        danger:  { DEFAULT: '#991B1B', bg: '#FDEAEA', ring: '#DC2626' },
        info:    { DEFAULT: '#1E4A7B', bg: '#E8EEF5', ring: '#4A7AB0' },
      },

      // ── Typography ──────────────────────────────────────────────────────
      fontFamily: {
        display:  ['Playfair Display', 'Fraunces', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans:     ['DM Sans', 'Source Sans 3', 'Inter', '-apple-system', 'system-ui', 'sans-serif'],
        fraunces: ['Fraunces', 'Georgia', 'serif'],
        mono:     ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        xs:    ['0.75rem',   { lineHeight: '1.1rem' }],
        sm:    ['0.875rem',  { lineHeight: '1.35rem' }],
        base:  ['1rem',      { lineHeight: '1.55rem' }],
        lg:    ['1.125rem',  { lineHeight: '1.65rem' }],
        xl:    ['1.25rem',   { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem',    { lineHeight: '2rem' }],
        '3xl': ['1.875rem',  { lineHeight: '2.3rem' }],
        '4xl': ['2.25rem',   { lineHeight: '2.6rem' }],
        '5xl': ['3rem',      { lineHeight: '1.1' }],
        '6xl': ['3.75rem',   { lineHeight: '1.05' }],
      },

      // ── Spacing / sizing ────────────────────────────────────────────────
      spacing: {
        '18':  '4.5rem',
        '22':  '5.5rem',
        '128': '32rem',
      },
      maxWidth: {
        '2xs':     '16rem',
        '8xl':     '88rem',
        'prose-sm':'32rem',
      },

      // ── Borders ─────────────────────────────────────────────────────────
      borderRadius: {
        sm:   '0.25rem',
        md:   '0.375rem',
        lg:   '0.5rem',
        xl:   '0.75rem',
        '2xl':'1rem',
        '3xl':'1.5rem',
      },

      // ── Shadows ─────────────────────────────────────────────────────────
      boxShadow: {
        crest:   '0 2px 0 0 #7A0019',
        card:    '0 1px 2px 0 rgba(26, 23, 20, 0.04), 0 1px 3px 0 rgba(26, 23, 20, 0.06)',
        lifted:  '0 4px 6px -1px rgba(26, 23, 20, 0.08), 0 2px 4px -2px rgba(26, 23, 20, 0.06)',
        focused: '0 0 0 3px rgba(168, 50, 69, 0.18)',
        glow:    '0 0 0 4px rgba(201, 162, 39, 0.25)',
      },

      // ── Backgrounds ──────────────────────────────────────────────────────
      backgroundImage: {
        'paper':       'linear-gradient(180deg, #FBF9F4 0%, #F6F1E6 100%)',
        'maroon-deep': 'linear-gradient(135deg, #7A0019 0%, #5A0012 55%, #3D000C 100%)',
        'gold-wash':   'linear-gradient(180deg, #FDF9EF 0%, #FAF0D4 100%)',
        'crest-line':  'linear-gradient(90deg, transparent 0%, #7A0019 50%, transparent 100%)',
      },

      // ── Animation ───────────────────────────────────────────────────────
      keyframes: {
        'fade-in':    { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'slide-up':   { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        'pulse-ring': { '0%': { boxShadow: '0 0 0 0 rgba(168, 50, 69, 0.35)' }, '100%': { boxShadow: '0 0 0 14px rgba(168, 50, 69, 0)' } },
      },
      animation: {
        'fade-in':    'fade-in 240ms ease-out both',
        'slide-up':   'slide-up 360ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'pulse-ring': 'pulse-ring 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
