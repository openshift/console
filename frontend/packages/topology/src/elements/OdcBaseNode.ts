import type { Node } from '@patternfly/react-topology';
import { BaseNode } from '@patternfly/react-topology';
import { observable, makeObservable } from 'mobx';
import type { OdcBaseNodeInterface } from '@console/dynamic-plugin-sdk/src/extensions/topology-types';
import type { K8sResourceKind, K8sResourceKindReference } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import type { OdcNodeModel } from '../topology-types';

class OdcBaseNode extends BaseNode implements OdcBaseNodeInterface {
  public resource?: K8sResourceKind | undefined = undefined;

  public resourceKind?: K8sResourceKindReference | undefined = undefined;

  constructor() {
    super();

    makeObservable(this, {
      resource: observable.ref,
      resourceKind: observable,
    });
  }

  getPositionableChildren(): Node[] {
    return [];
  }

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

export default OdcBaseNode;
