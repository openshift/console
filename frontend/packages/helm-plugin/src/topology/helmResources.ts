export const getHelmWatchedResources = (namespace: string) => {
  return {
    secrets: {
      isList: true,
      kind: 'Secret',
      namespace,
      optional: true,
      selector: {
        matchLabels: { owner: 'helm' },
        matchExpressions: [{ key: 'status', operator: 'NotEquals', values: ['superseded'] }],
      },
      partialMetadata: true,
    },
  };
};
