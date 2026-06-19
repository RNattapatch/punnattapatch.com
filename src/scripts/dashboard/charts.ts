// Shared ApexCharts config helpers for dashboard.
// ApexCharts is loaded via CDN <script> in DashboardLayout.astro → exposed on window.

declare global {
  interface Window {
    ApexCharts: any;
  }
}

export function waitForApex(): Promise<any> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return;
    if (window.ApexCharts) return resolve(window.ApexCharts);
    let tries = 0;
    const check = setInterval(() => {
      tries++;
      if (window.ApexCharts) {
        clearInterval(check);
        resolve(window.ApexCharts);
      } else if (tries > 100) {
        clearInterval(check);
        console.error('ApexCharts failed to load');
      }
    }, 50);
  });
}

export const PALETTE = {
  cyan: '#22d3ee',
  coral: '#f97a89',
  violet: '#a78bfa',
  emerald: '#34d399',
  amber: '#fbbf24',
  rose: '#fb7185',
  navy: '#3b82f6',
};

export const PALETTE_ARRAY = [
  PALETTE.coral,
  PALETTE.cyan,
  PALETTE.violet,
  PALETTE.emerald,
  PALETTE.amber,
  PALETTE.rose,
  PALETTE.navy,
];

const FONT = '"Sukhumvit Set", Tahoma, "Helvetica Neue", sans-serif';

// Theme-aware chart colors — pundark (dark) vs punpaper (light/ivory). Read the
// live data-theme so text/grid stay readable in both modes. Charts re-init on
// the 'pun-theme-change' event (see each chart component).
export function themeColors() {
  const dark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'pundark';
  return dark
    ? { fore: '#cbd5e1', faint: '#94a3b8', strong: '#f1f5f9', grid: '#1f2937', mode: 'dark' as const, tooltip: 'dark' as const }
    : { fore: '#44403a', faint: '#78716c', strong: '#072b4e', grid: '#e0dac9', mode: 'light' as const, tooltip: 'light' as const };
}

export function baseOptions() {
  const tc = themeColors();
  return {
    chart: {
      fontFamily: FONT,
      foreColor: tc.fore,
      toolbar: { show: false },
      animations: { enabled: true, speed: 300 },
      background: 'transparent',
    },
    grid: {
      borderColor: tc.grid,
      strokeDashArray: 3,
    },
    legend: {
      fontFamily: FONT,
      fontSize: '11px',
      labels: { colors: tc.fore },
      markers: { size: 6, strokeWidth: 0 },
      itemMargin: { horizontal: 6, vertical: 2 },
    },
    tooltip: {
      theme: tc.tooltip,
      style: { fontFamily: FONT, fontSize: '12px' },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    theme: { mode: tc.mode },
  };
}
