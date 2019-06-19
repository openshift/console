const hostNameValidationParams = {
  pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/,
  maxLength: 253,
};

const pathValidationParams = {
  pattern: /^\/.*$/,
};

export const hostNameErrorMessages = {
  pattern:
    'Hostname must consist of lower-case letters, numbers, periods, and hyphens. It must start and end with a letter or number.',
  maxLength: `Can't be longer than ${hostNameValidationParams.maxLength} characters.`,
};

export const pathErrorMessages = {
  pattern: 'Path must start with /',
};

export const validateHostName = (hostname: string): string => {
  if (hostname) {
    if (!hostNameValidationParams.pattern.test(hostname)) {
      return hostNameErrorMessages.pattern;
    }
    if (hostname.length > hostNameValidationParams.maxLength) {
      return hostNameErrorMessages.maxLength;
    }
  }
  return '';
};

export const validatePath = (path: string): string => {
  if (path && !pathValidationParams.pattern.test(path)) {
    return pathErrorMessages.pattern;
  }
  return '';
};
