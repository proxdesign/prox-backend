import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-raleway)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        oak: {
          50: '#FAF8F5',
          100: '#F0EBE3',
          200: '#E3D5C8',
          400: '#B39D82',
          500: '#9A7B59',
          600: '#876A4D',
          700: '#6F5840',
        },
        sage: {
          50: '#F4F7F5',
          100: '#E8EFEB',
          500: '#8B9C92',
          600: '#768A80',
        },
        warm: {
          50: '#FDFCFA',
          100: '#FAF8F5',
        },
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out forwards',
        fadeInUp: 'fadeInUp 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
} satisfies Config;