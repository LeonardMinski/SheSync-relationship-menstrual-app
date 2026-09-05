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
      fontFamily: {
        sans: ['var(--font-family)', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      colors: {
        // Design system colors
        bg: 'var(--bg)',
        'bg-surface': 'var(--bg-surface)',
        'bg-elevated': 'var(--bg-elevated)',
        'bg-muted': 'var(--bg-muted)',
        
        // Text colors
        foreground: 'var(--text-foreground)',
        muted: 'var(--text-muted)',
        'muted-foreground': 'var(--text-help)',
        
        // Border colors
        border: 'var(--border)',
        'border-subtle': 'var(--border-subtle)',
        
        // Brand colors
        'cta-start': 'var(--cta-start)',
        'cta-end': 'var(--cta-end)',
        'accent-rose': 'var(--accent-rose)',
        'accent-purple': 'var(--accent-purple)',
        'accent-sage': 'var(--accent-sage)',
        'accent-sage-soft': 'var(--accent-sage-soft)',
        'accent-clay': 'var(--accent-clay)',
        'accent-gold': 'var(--accent-gold)',
        'accent-amber': 'var(--accent-amber)',
        'accent-amber-soft': 'var(--accent-amber-soft)',
        'accent-blue-soft': 'var(--accent-blue-soft)',
        'accent-rose-soft': 'var(--accent-rose-soft)',
        'accent-rose-deep': 'var(--accent-rose-deep)',
        'accent-rose-deepest': 'var(--accent-rose-deepest)',
        'accent-purple-soft': 'var(--accent-purple-soft)',
        'accent-premium': 'var(--accent-premium)',
        'accent-premium-foreground': 'var(--accent-premium-foreground)',

        // Status colors
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
        info: 'var(--info)',
        
        // Focus ring
        ring: 'var(--ring)',
        'ring-offset': 'var(--ring-offset)',
      },
      spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        'cta-rose': 'var(--shadow-cta-rose)',
        'cta-purple': 'var(--shadow-cta-purple)',
      },
      fontSize: {
        xs: 'var(--font-size-xs)',
        sm: 'var(--font-size-sm)',
        base: 'var(--font-size-base)',
        lg: 'var(--font-size-lg)',
        xl: 'var(--font-size-xl)',
        '2xl': 'var(--font-size-2xl)',
        '3xl': 'var(--font-size-3xl)',
        '4xl': 'var(--font-size-4xl)',
      },
    },
  },
  plugins: [],
  important: false, // Ensure dark mode styles can override
}
