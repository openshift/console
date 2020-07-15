import { K8sResourceKind } from '@console/internal/module/k8s';
import { Model } from '@patternfly/react-topology';
import { TYPE_OPERATOR_WORKLOAD } from './components/const';
import { OdcNodeModel } from '../topology-types';

export const isOperatorResource = (resource: K8sResourceKind, model: Model): boolean => {
  if (!model?.nodes?.length) {
    return false;
  }
  return !!model.nodes.find((node) => {
    if (node.type !== TYPE_OPERATOR_WORKLOAD) {
      return false;
    }
    return (node as OdcNodeModel).resource?.metadata?.uid === resource?.metadata?.uid;
  });
};
