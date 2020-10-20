import { K8sKind } from '@console/internal/module/k8s';
import { RevisionModel, ServiceModel, RouteModel } from '../models';

export const servingTab = (kindObj: K8sKind) => {
  switch (kindObj.kind) {
    case ServiceModel.kind:
      return '';
    case RevisionModel.kind:
      return 'revisions';
    case RouteModel.kind:
      return 'routes';
    default:
      return null;
  }
};
