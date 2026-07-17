import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/renderer/**/*.{ts,tsx}', './src/shared/**/*.ts'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-active': 'var(--color-primary-active)',
        'primary-disabled': 'var(--color-primary-disabled)',
        ink: 'var(--color-ink)',
        body: 'var(--color-body)',
        muted: 'var(--color-muted)',
        'muted-soft': 'var(--color-muted-soft)',
        hairline: 'var(--color-hairline)',
        'hairline-soft': 'var(--color-hairline-soft)',
        canvas: 'var(--color-canvas)',
        'surface-soft': 'var(--color-surface-soft)',
        'surface-card': 'var(--color-surface-card)',
        'surface-strong': 'var(--color-surface-strong)',
        'on-primary': 'var(--color-on-primary)',
        accent: 'var(--color-accent)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)'
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px'
      },
      fontFamily: {
        display: ['"Cal Sans"', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
      },
      fontSize: {
        'display-xl': ['64px', { lineHeight: '1.05', fontWeight: '600', letterSpacing: '-0.02em' }],
        'display-lg': ['48px', { lineHeight: '1.1', fontWeight: '600', letterSpacing: '-0.015em' }],
        'display-md': ['36px', { lineHeight: '1.15', fontWeight: '600', letterSpacing: '-0.01em' }],
        'display-sm': ['28px', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '-0.005em' }],
        'title-lg': ['22px', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.003em' }],
        'title-md': ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        'title-sm': ['16px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-md': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['13px', { lineHeight: '1.4', fontWeight: '500' }],
        button: ['14px', { lineHeight: '1', fontWeight: '600' }]
      },
      spacing: {
        xxs: '4px',
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
        section: '96px'
      },
      minHeight: {
        touch: '44px'
      },
      minWidth: {
        touch: '44px'
      }
    }
  },
  plugins: []
}

export default config
