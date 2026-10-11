// Motywy = zestawy okienek w PNG: src/assets/doors/<prefix><dzień>.png (np. b1.png ... b24.png)
//
// Tryb ciemny: jeśli obok jest wariant `<prefix><dzień>-dark.png` (np. b1-dark.png), zostanie użyty
// automatycznie. Gdy go nie ma, używany jest zwykły PNG delikatnie przyciemniony (żeby nie "świecił").
const doorImages = import.meta.glob('../assets/doors/*.png', { eager: true, import: 'default' });
const byName = Object.fromEntries(
  Object.entries(doorImages).map(([path, url]) => [path.split('/').pop(), url]),
);

// Dodając nowy motyw dopisz wpis tutaj.
export const THEMES = [
  { id: 'classic', prefix: 'b' },
  { id: 'elegant', prefix: 'c' },
  { id: 'gifts', prefix: 'a' },
];

export const DEFAULT_THEME = 'classic';

export const getTheme = (id) => THEMES.find((th) => th.id === id) || THEMES[0];

// Zwraca { src, dim }: adres obrazka (albo null → zapasowy znaczek z numerem)
// oraz informację, czy w trybie ciemnym trzeba go przyciemnić (brak wariantu -dark).
export const getDoorArt = (themeId, day, colorMode = 'light') => {
  const base = `${getTheme(themeId).prefix}${day}`;
  if (colorMode === 'dark') {
    const dark = byName[`${base}-dark.png`];
    if (dark) return { src: dark, dim: false };
  }
  const src = byName[`${base}.png`] || null;
  return { src, dim: colorMode === 'dark' && !!src };
};

export const getDoorSrc = (themeId, day, colorMode = 'light') => getDoorArt(themeId, day, colorMode).src;
