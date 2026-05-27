/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#07090f',
        surface: '#0e1118',
        surface2: '#141820',
        border: '#1c2230',
        border2: '#222a3a',
        muted: '#5a6b85',
        text: '#dce6f5',
        accent: '#2563eb',
        accent2: '#3b82f6',
        teal: '#0ea5e9',
        amber: '#f59e0b',
        green: '#10b981',
        red: '#ef4444',
        orange: '#f97316'
      },
      fontFamily: {
        mono: ['"DM Mono"', 'monospace'],
        display: ['Syne', 'sans-serif'],
        serif: ['Lora', 'serif']
      }
    }
  },
  plugins: []
}
