import { K8sKind } from '@console/internal/module/k8s/types';
import { resourceTitle } from '@console/internal-integration-tests/views/crud.view';
import { click } from '@console/shared/src/test-utils/utils';

import { getResourceObject } from '../utils/utils';
import * as view from '../../views/uiResource.view';

export class UIResource {
  readonly name: string;

  readonly namespace: string;

  readonly kind: K8sKind;

  constructor(instance) {
    this.name = instance.name;
    this.namespace = instance.namespace;
    this.kind = instance.kind;
  }

  getResource() {
    return getResourceObject(this.name, this.namespace, this.kind.kind);
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
      kind: this.kind.plural,
      metadata: {
        namespace: this.namespace,
        name: this.name,
      },
    };
  }
}
