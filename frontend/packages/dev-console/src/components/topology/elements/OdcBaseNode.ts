import { observable } from 'mobx';
import { BaseNode } from '@patternfly/react-topology';
import {
  K8sResourceKind,
  K8sResourceKindReference,
  referenceFor,
} from '@console/internal/module/k8s';
import { OdcNodeModel } from '../topology-types';

export class OdcBaseNode extends BaseNode {
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
    return this.resourceKind || referenceFor(this.resource);
  }

  setResourceKind(kind: K8sResourceKindReference | undefined): void {
    this.resourceKind = kind;
  }

  setModel(model: OdcNodeModel): void {
    super.setModel(model);

    if ('resource' in model) {
      this.resource = model.resource;
    }
    if ('resourceKind' in model) {
      this.resourceKind = model.resourceKind;
    }
  }
}
