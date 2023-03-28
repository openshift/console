export const getcurrentLanguage = (contentType: string) => {
  if (contentType.startsWith('application/json')) {
    return 'json';
  }
  if (contentType.startsWith('text/yaml')) {
    return 'yaml';
  }
  return 'plaintext';
};
