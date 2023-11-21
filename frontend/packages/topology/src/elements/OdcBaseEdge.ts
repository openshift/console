import { BaseEdge } from '@patternfly/react-topology';
import { observable, makeObservable } from 'mobx';
import { K8sResourceKind, K8sResourceKindReference } from '@console/internal/module/k8s';
import { OdcEdgeModel } from '../topology-types';

class OdcBaseEdge extends BaseEdge {
  public resource?: K8sResourceKind | undefined = undefined;

  public resourceKind?: K8sResourceKindReference | undefined = undefined;

  constructor() {
    super();

    makeObservable(this, {
      resource: observable.ref,
      resourceKind: observable,
    });
  }

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

export default OdcBaseEdge;
