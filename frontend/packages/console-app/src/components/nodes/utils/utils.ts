export const formatDurationForDisplay = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  return /[smhd]$/i.test(trimmed) ? trimmed : `${trimmed}s`;
};

export const parseDurationToSeconds = (raw: string | undefined): number | undefined => {
  const value = raw?.trim();
  if (!value) {
    return undefined;
  }
  const match = value.match(/^(\d+)([smhd]?)$/i);
  if (!match) {
    return undefined;
  }
  const amount = Number(match[1]);
  const unit = (match[2] || 's').toLowerCase();
  switch (unit) {
    case 'm':
      return amount * 60;
    case 'h':
      return amount * 3600;
    case 'd':
      return amount * 86400;
    case 's':
    default:
      return amount;
  }
};

export const formatTimeoutForDisplay = (seconds: number): string => {
  if (seconds % 60 === 0) {
    return `${seconds / 60}m`;
  }
  return `${seconds}s`;
};

export const getMaxTimeoutFromConditions = (
  conditions: { timeout?: string; duration?: string }[],
): number | undefined =>
  conditions.reduce<number | undefined>((maxValue, condition) => {
    const rawTimeout = 'timeout' in condition ? condition.timeout : condition.duration;
    const timeoutInSeconds = parseDurationToSeconds(rawTimeout);

    if (timeoutInSeconds === undefined) {
      return maxValue;
    }

    if (maxValue === undefined || timeoutInSeconds > maxValue) {
      return timeoutInSeconds;
    }

    return maxValue;
  }, undefined);
