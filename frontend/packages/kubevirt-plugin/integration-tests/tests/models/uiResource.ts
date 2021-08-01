import { resourceTitle } from '@console/internal-integration-tests/views/crud.view';
import { apiVersionForModel } from '@console/internal/module/k8s/k8s-ref';
import { K8sKind } from '@console/internal/module/k8s/types';
import { click } from '../../utils/shared-utils';
import * as view from '../../views/uiResource.view';
import { getResourceObject } from '../utils/utils';

export class UIResource {
  readonly name: string;

  readonly namespace: string;

  readonly model: K8sKind;

  constructor(instance) {
    this.name = instance.name;
    this.namespace = instance.namespace;
    this.model = instance.model;
  }

  getResource() {
    return getResourceObject(this.name, this.namespace, this.model.kind);
  }

  async getResourceTitle(): Promise<string> {
    if (await resourceTitle.isPresent()) {
      return resourceTitle.getText();
    }
    return '';
  }

  async closeModalDialog(): Promise<void> {
    if (await view.modalDialog.isPresent()) {
      await click(view.cancelDialog);
    }
  }

  asResource() {
    return {
      kind: this.model.kind,
      apiVersion: apiVersionForModel(this.model),
      metadata: {
        namespace: this.namespace,
        name: this.name,
      },
    };
  }
}
