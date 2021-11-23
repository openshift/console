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
    deployedResources: [{ kind: DeploymentModel.kind, spec: { selector: null, template: null } }],
    route: { kind: RouteModel.kind, spec: { host: 'testURL', to: null } },
  },
  { deployedResources: [{ kind: DeploymentModel.kind, spec: { selector: null, template: null } }] },
];
