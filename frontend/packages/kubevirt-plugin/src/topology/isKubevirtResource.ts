import { Model } from '@patternfly/react-topology';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { OdcNodeModel } from '@console/topology/src/topology-types';
import { TYPE_VIRTUAL_MACHINE } from './components/const';

export const isKubevirtResource = (resource: K8sResourceKind, model: Model): boolean => {
  if (!model?.nodes?.length) {
    return false;
  }
  return !!model.nodes.find((node) => {
    if (node.type !== TYPE_VIRTUAL_MACHINE) {
      return false;
    }
    return (node as OdcNodeModel).resource?.metadata?.uid === resource?.metadata?.uid;
  });
};
