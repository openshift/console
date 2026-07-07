const DURATION_TOKEN_PATTERN = /(\d+)([smhd]?)/gi;

export const parseDurationToSeconds = (raw: string | undefined): number | undefined => {
  const value = raw?.trim();
  if (!value) {
    return undefined;
  }
  const matches = [...value.matchAll(DURATION_TOKEN_PATTERN)];
  if (matches.length === 0) {
    return undefined;
  }
  const consumed = matches.map((match) => match[0]).join('');
  if (consumed !== value) {
    return undefined;
  }
  return matches.reduce((total, match) => {
    const amount = Number(match[1]);
    const unit = (match[2] || 's').toLowerCase();
    switch (unit) {
      case 'm':
        return total + amount * 60;
      case 'h':
        return total + amount * 3600;
      case 'd':
        return total + amount * 86400;
      case 's':
      default:
        return total + amount;
    }
  }, 0);
};
