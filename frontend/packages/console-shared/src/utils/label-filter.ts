import { K8sResourceKind } from '@console/internal/module/k8s';

export const getLabelsAsString = (obj: K8sResourceKind): string[] => {
  const { labels } = obj.metadata;
  const stringify = (labelObj) =>
    JSON.stringify(labelObj)
      .replace(/[{}"]/g, '')
      .split(',');
  const flatLabels = stringify(labels);
  const set = new Set(flatLabels);
  return Array.from(set);
};
