export const helmPageTab = (kind: string) => {
  switch (kind) {
    case 'Repositories':
      return 'repositories';
    default:
      return null;
  }
};
