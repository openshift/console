import { apiVersionForModel, K8sKind } from '@console/internal/module/k8s';

export const buildNodeMaintenance = ({
  generateName,
  nodeName,
  reason,
  model,
}: {
  nodeName: string;
  model: K8sKind;
  generateName?: string;
  reason?: string;
}) => ({
  apiVersion: apiVersionForModel(model),
  kind: model.kind,
  metadata: {
    generateName: `${generateName || nodeName}-`,
  },
  spec: {
    nodeName,
    reason,
  },
});
