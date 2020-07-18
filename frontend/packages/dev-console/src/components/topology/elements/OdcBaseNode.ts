import { observable } from 'mobx';
import { BaseNode } from '@patternfly/react-topology';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { OdcNodeModel } from '../topology-types';

export class OdcBaseNode extends BaseNode {
  @observable.ref
  private resource?: K8sResourceKind;

  getResource(): K8sResourceKind | undefined {
    return this.resource;
  }

  setResource(resource: K8sResourceKind | undefined): void {
    this.resource = resource;
  }

  setModel(model: OdcNodeModel): void {
    super.setModel(model);

    if ('resource' in model) {
      this.resource = model.resource;
    }
  }
}
