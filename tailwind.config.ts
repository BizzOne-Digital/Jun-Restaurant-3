import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#C0392B',
          'red-dark': '#A93226',
          'red-light': '#E74C3C',
          gold: '#D4A017',
          'gold-light': '#F0C040',
          'gold-pale': '#FFF3CD',
        },
        restaurant: {
          bg: '#FFF8F0',
          'bg-warm': '#FFF0E0',
          card: '#FFFFFF',
          border: '#F0E0D0',
          'border-warm': '#E8C9A8',
          text: '#1A1A1A',
          muted: '#7A6A5A',
          'muted-light': '#A89880',
        },
        spice: {
          50:  '#FFF5F0',
          100: '#FFE8D6',
          200: '#FFD0B0',
          300: '#FFB080',
          400: '#FF8C50',
          500: '#E86030',
          600: '#C0392B',
          700: '#A93226',
          800: '#8B2020',
          900: '#6B1515',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        'card-lg': '24px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      maxWidth: {
        content: '1280px',
      },
      boxShadow: {
        'card': '0 2px 12px rgba(192, 57, 43, 0.06), 0 1px 3px rgba(0,0,0,0.04)',
        'card-hover': '0 12px 32px rgba(192, 57, 43, 0.14), 0 4px 8px rgba(0,0,0,0.06)',
        'gold': '0 4px 20px rgba(212, 160, 23, 0.3)',
        'red': '0 4px 20px rgba(192, 57, 43, 0.35)',
        'header': '0 2px 20px rgba(0,0,0,0.08)',
        'inner-warm': 'inset 0 1px 3px rgba(192, 57, 43, 0.08)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #7B1010 0%, #A93226 30%, #C0392B 60%, #8B2020 100%)',
        'warm-gradient': 'linear-gradient(135deg, #FFF8F0 0%, #FFF0E0 100%)',
        'card-gradient': 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.6) 100%)',
        'gold-gradient': 'linear-gradient(135deg, #D4A017 0%, #F0C040 50%, #D4A017 100%)',
        'red-gradient': 'linear-gradient(135deg, #C0392B 0%, #E74C3C 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-up': 'fadeUp 0.5s ease-out',
        'slide-in': 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        shimmer: 'shimmer 1.6s infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'bounce-soft': 'bounceSoft 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
