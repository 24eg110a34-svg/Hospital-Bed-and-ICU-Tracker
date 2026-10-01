module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        hospital: {
          dark: '#0f172a',
          primary: '#2563eb',
          secondary: '#64748b',
          accent: '#059669',
          danger: '#e11d48',
          warning: '#d97706',
          cleaning: '#d97706',
          maintenance: '#64748b',
        },
        canvas: '#f5f7fa',
      },
      borderRadius: {
        card: '14px',
        panel: '18px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(15,23,42,.08), 0 1px 2px rgba(15,23,42,.04)',
        lift: '0 4px 12px rgba(15,23,42,.08), 0 2px 4px rgba(15,23,42,.04)',
        panel: '0 12px 28px rgba(15,23,42,.10), 0 4px 8px rgba(15,23,42,.04)',
      },
      transitionTimingFunction: {
        calm: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
      keyframes: {
        pageIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        feedIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        livePulse: {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '.55', transform: 'scale(.88)' },
        },
        bedFlip: {
          '0%': { transform: 'perspective(900px) rotateX(-88deg)', opacity: '.25' },
          '60%': { transform: 'perspective(900px) rotateX(9deg)', opacity: '1' },
          '100%': { transform: 'perspective(900px) rotateX(0deg)', opacity: '1' },
        },
        sweep: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(220%)' },
        },
      },
      animation: {
        'page-in': 'pageIn .3s cubic-bezier(0.22,0.61,0.36,1) backwards',
        'feed-in': 'feedIn .32s cubic-bezier(0.22,0.61,0.36,1) backwards',
        'live-pulse': 'livePulse 2s ease-in-out infinite',
        'bed-flip': 'bedFlip .46s cubic-bezier(0.22,0.61,0.36,1) backwards',
        sweep: 'sweep 1.9s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
