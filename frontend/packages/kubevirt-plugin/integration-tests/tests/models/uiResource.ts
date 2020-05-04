import { K8sKind } from '@console/internal/module/k8s/types';
import { resourceTitle } from '@console/internal-integration-tests/views/crud.view';
import { click } from '@console/shared/src/test-utils/utils';
import { getResourceObject } from '../utils/utils';
import * as view from '../../views/uiResource.view';
import { apiVersionForModel } from '../utils/selectors';

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
