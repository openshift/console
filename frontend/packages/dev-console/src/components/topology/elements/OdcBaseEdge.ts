import { observable } from 'mobx';
import { BaseEdge } from '@patternfly/react-topology';
import { OdcEdgeModel } from '../topology-types';
import { K8sResourceKind, K8sResourceKindReference } from '@console/internal/module/k8s';

export class OdcBaseEdge extends BaseEdge {
  @observable.ref
  private resource?: K8sResourceKind;

  @observable
  private resourceKind?: K8sResourceKindReference;

  getResource(): K8sResourceKind | undefined {
    return this.resource;
  }

  setResource(resource: K8sResourceKind | undefined): void {
    this.resource = resource;
  }

  getResourceKind(): K8sResourceKindReference | undefined {
    return this.resourceKind;
  }

  setResourceKind(kind: K8sResourceKindReference | undefined): void {
    this.resourceKind = kind;
  }

  setModel(model: OdcEdgeModel): void {
    super.setModel(model);

    if ('resource' in model) {
      this.resource = model.resource;
    }
    if ('resourceKind' in model) {
      this.resourceKind = model.resourceKind;
    }
  }
}
