import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#06090D',
          900: '#0C1117',
          850: '#111720',
          800: '#17202B',
          700: '#222E3D',
          600: '#344558',
          500: '#4F637A',
          400: '#7B8FA6',
          300: '#A4B4C5',
          200: '#CBD6E2',
          100: '#E4EBF2',
          50: '#F3F6F9',
        },
        stone: {
          surface: '#FAF9F6',
          subtle: '#F4F2EC',
          border: '#E7E3D8',
          card: '#FFFFFF',
        },
        terracotta: {
          50: '#FCF5F0',
          100: '#F8E9DE',
          200: '#F2D3BE',
          300: '#E7B594',
          400: '#DE8E62',
          500: '#D46733', // signature terracotta
          600: '#B85223',
          700: '#943F1A',
          800: '#753218',
          900: '#5F2916',
        },
        emerald: {
          50: '#EDF8F3',
          100: '#D5F0E2',
          500: '#1B7A53', // bespoke executive deep emerald
          600: '#146041',
          700: '#0F4A32',
        },
        amber: {
          50: '#FEF8EB',
          100: '#FCEECC',
          500: '#C78C18', // antique gold
          600: '#A77310',
          700: '#835909',
        },
        crimson: {
          50: '#FDF2F2',
          100: '#FAE1E1',
          500: '#C73838', // executive crimson error
          600: '#AA2C2C',
        }
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['var(--font-mono)', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'tinted-sm': '0 1px 2px 0 rgba(12, 17, 23, 0.05), 0 1px 3px 0 rgba(12, 17, 23, 0.03)',
        'tinted-md': '0 4px 12px -2px rgba(12, 17, 23, 0.08), 0 2px 6px -1px rgba(12, 17, 23, 0.04)',
        'tinted-lg': '0 12px 28px -4px rgba(12, 17, 23, 0.12), 0 4px 12px -2px rgba(12, 17, 23, 0.06)',
        'tinted-xl': '0 20px 40px -6px rgba(12, 17, 23, 0.18), 0 8px 16px -4px rgba(12, 17, 23, 0.08)',
        'accent-glow': '0 0 25px -4px rgba(212, 103, 51, 0.35)',
        'emerald-glow': '0 0 25px -4px rgba(27, 122, 83, 0.35)',
      },
      letterSpacing: {
        tighter: '-0.04em',
        tight: '-0.025em',
      },
    },
  },
  plugins: [],
};

export default config;
