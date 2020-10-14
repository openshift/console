export const reloadModule = (request: string) => {
  delete require.cache[require.resolve(request)];
  // eslint-disable-next-line
  return require(request);
};
