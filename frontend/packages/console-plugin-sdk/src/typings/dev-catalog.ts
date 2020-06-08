import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { Extension } from './base';

namespace ExtensionProperties {
  export interface DevCatalogModel {
    model: K8sKind;
    normalize: (data: K8sResourceKind[]) => K8sResourceKind[];
  }
}

export interface DevCatalogModel extends Extension<ExtensionProperties.DevCatalogModel> {
  type: 'DevCatalogModel';
}

export const isDevCatalogModel = (e: Extension): e is DevCatalogModel => {
  return e.type === 'DevCatalogModel';
};
