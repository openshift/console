export const getHelmWatchedResources = (namespace: string) => {
  return {
    secrets: {
      isList: true,
      kind: 'Secret',
      namespace,
      optional: true,
    },
  };
};
