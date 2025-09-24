import { DeploymentModel, RouteModel } from '@console/internal/models';
import { RouteKind, K8sResourceKind } from '@console/internal/module/k8s';

type DeployedResource = K8sResourceKind & {
  spec: {
    selector?: string;
    template: string;
  };
};

export const mockResources: { deployedResources: DeployedResource[]; route?: RouteKind }[] = [
  {
    deployedResources: [{ kind: DeploymentModel.kind, spec: { selector: '', template: '' } }],
    route: {
      kind: RouteModel.kind,
      spec: { host: 'testURL', to: { kind: 'Service', name: 'test-app', weight: 0 } },
    },
  },
  {
    deployedResources: [{ kind: DeploymentModel.kind, spec: { selector: '', template: '' } }],
    route: {
      kind: RouteModel.kind,
      spec: { host: 'testURL', to: { kind: 'Service', name: 'test-app', weight: 0 } },
    },
  },
];
