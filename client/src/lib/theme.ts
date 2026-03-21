export function applyTheme(theme: string) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (theme === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', isDark);
  }
}

export function applyAccentColor(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  const hsl = `hsl(${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const fg = luminance > 0.5 ? 'hsl(222.2 84% 4.9%)' : 'hsl(210 40% 98%)';

  document.documentElement.style.setProperty('--color-primary', hsl);
  document.documentElement.style.setProperty('--color-primary-foreground', fg);
  document.documentElement.style.setProperty('--color-ring', hsl);
  document.documentElement.style.setProperty('--color-sidebar-primary', hsl);
}
