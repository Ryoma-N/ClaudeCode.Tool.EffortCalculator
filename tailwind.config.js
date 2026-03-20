/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          base:    '#0a0a0f',
          DEFAULT: '#12121a',
          raised:  '#1c1c28',
          high:    '#22223a',
        },
        edge: {
          DEFAULT: '#2a2a3d',
          light:   '#3a3a55',
        },
        ink: {
          DEFAULT: '#e0e0e0',
          muted:   '#888888',
          subtle:  '#555555',
        },
        brand: {
          DEFAULT: '#7c3aed',
          blue:    '#3b82f6',
          light:   '#a78bfa',
        },
        ok:      '#10b981',
        warn:    '#f59e0b',
        danger:  '#ef4444',
        working: '#3b82f6',
      },
    },
  },
  plugins: [],
}
