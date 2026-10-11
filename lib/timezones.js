const FALLBACK = ['Europe/Warsaw', 'Europe/London', 'America/New_York'];

export const TIMEZONES = (() => {
  try {
    const list = Intl.supportedValuesOf('timeZone');
    return list.includes('UTC') ? list : ['UTC', ...list];
  } catch {
    return FALLBACK;
  }
})();

export const browserTimezone = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
};
