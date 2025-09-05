/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Legacy
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        
        // New design tokens
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        elevated: 'var(--color-elevated)',
        border: 'var(--color-border)',
        foreground: 'var(--text-primary)',
        muted: 'var(--text-secondary)',
        help: 'var(--text-muted)',
        brand: {
          start: 'var(--cta-start)',
          end: 'var(--cta-end)',
        },
        link: 'var(--link)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
        ring: 'var(--ring)',
      },
    },
  },
  plugins: [],
  important: false, // Ensure dark mode styles can override
}
