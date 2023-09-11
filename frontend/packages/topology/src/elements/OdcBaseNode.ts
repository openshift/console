import { observable, makeObservable } from 'mobx';
import {
  K8sResourceKind,
  K8sResourceKindReference,
  referenceFor,
} from '@console/internal/module/k8s';
import { OdcNodeModel } from '../topology-types';
//
// Import from @patternfly/react-topology when updated to a branch containing https://github.com/patternfly/patternfly-react/pull/7573
//
import BaseNode from './BaseNode';

class OdcBaseNode extends BaseNode {
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
