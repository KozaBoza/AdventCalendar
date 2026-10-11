// delikatne "potrząśnięcie" polem, które ma błąd (pomijane przy prefers-reduced-motion)
export const shake = (el) => {
  if (!el?.animate) return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  el.animate(
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-5px)' },
      { transform: 'translateX(5px)' },
      { transform: 'translateX(-3px)' },
      { transform: 'translateX(0)' },
    ],
    { duration: 300, easing: 'ease-out' },
  );
};
