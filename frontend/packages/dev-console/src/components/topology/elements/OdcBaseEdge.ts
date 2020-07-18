import { observable } from 'mobx';
import { BaseEdge } from '@patternfly/react-topology';
import { OdcEdgeModel } from '../topology-types';
import { K8sResourceKind } from '@console/internal/module/k8s';

export class OdcBaseEdge extends BaseEdge {
  @observable.ref
  private resource?: K8sResourceKind;

  getResource(): K8sResourceKind | undefined {
    return this.resource;
  }

  setResource(resource: K8sResourceKind | undefined): void {
    this.resource = resource;
  }

  setModel(model: OdcEdgeModel): void {
    super.setModel(model);

    if ('resource' in model) {
      this.resource = model.resource;
    }
  }
}
