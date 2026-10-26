/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ODIN V2 — Neural Command Interface (J.A.R.V.I.S. Inspired Palette)
        odin: {
          // Base surfaces
          black: '#050608',
          surface: '#0A0D12',
          'surface-elevated': '#10151E',
          'surface-glass': 'rgba(10, 13, 18, 0.75)',

          // Technical graphite shades for borders, dividers, subtle text
          graphite: {
            50: '#F1F4F7',
            100: '#E1E6EB',
            200: '#C4CCD4',
            300: '#A2ACB8',
            400: '#8E98A5',   // Secondary technical text
            500: '#647080',
            600: '#424C59',
            700: '#2A3340',
            800: '#1A212B',   // Subtle HUD borders
            900: '#10151E',
            950: '#0A0D12',
          },

          // Primary Dominant Brand: Holographic Orange / Stark Arc
          orange: {
            50: '#FFF4EB',
            100: '#FFE6D1',
            200: '#FFCCA3',
            300: '#FFAF70',
            400: '#FF9A3D',   // Luminous Orange / Glow
            500: '#FF6A00',   // PRIMARY IDENTITY DOMINANT
            600: '#E65500',
            700: '#BF4200',
            800: '#993300',
            900: '#732600',
            950: '#401500',
          },

          // Secondary Technical Accent: Holographic Cyan
          cyan: {
            50: '#E8FAFF',
            100: '#C7F3FF',
            200: '#9CE8FF',
            300: '#67DFFF',   // TECHNICAL SECONDARY ACCENT
            400: '#38CEFA',
            500: '#00B8EB',
            600: '#0093BE',
            700: '#007094',
            800: '#00516C',
            900: '#003649',
          },

          // Semantic Success: Operational Completed & Healthy
          emerald: {
            50: '#ECFDF5',
            100: '#D1FAE5',
            200: '#A7F3D0',
            300: '#6EE7B7',
            400: '#34D399',
            500: '#10B981',   // SUCCESS
            600: '#059669',
            700: '#047857',
            800: '#065F46',
            900: '#064E3B',
          },

          // Semantic Amber: Pending Approvals & Operational Attention
          amber: {
            50: '#FFFBEB',
            100: '#FEF3C7',
            200: '#FDE68A',
            300: '#FCD34D',
            400: '#FBBF24',
            500: '#F59E0B',   // ATTENTION / APPROVAL REQUIRED
            600: '#D97706',
            700: '#B45309',
            800: '#92400E',
            900: '#78350F',
          },

          // Semantic Crimson: Critical Alarms & Errors
          crimson: {
            50: '#FEF2F2',
            100: '#FEE2E2',
            200: '#FECACA',
            300: '#FCA5A5',
            400: '#F87171',
            500: '#EF4444',   // CRITICAL / ERROR
            600: '#DC2626',
            700: '#B91C1C',
            800: '#991B1B',
            900: '#7F1D1D',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        hud: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'hud-glow-orange': '0 0 20px -5px rgba(255, 106, 0, 0.35)',
        'hud-glow-cyan': '0 0 20px -5px rgba(103, 223, 255, 0.30)',
        'hud-panel': '0 8px 32px -4px rgba(0, 0, 0, 0.65)',
        'hud-border': 'inset 0 0 0 1px rgba(255, 106, 0, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
        'spin-slow': 'spin 12s linear infinite',
        'reverse-spin': 'reverseSpin 18s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.9' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
        reverseSpin: {
          'from': { transform: 'rotate(360deg)' },
          'to': { transform: 'rotate(0deg)' },
        },
      },
    },
  },
  plugins: [],
}