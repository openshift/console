import { Location } from 'react-router-dom-v5-compat';
import { CodeRef } from '@console/dynamic-plugin-sdk/src/types';
import { K8sKind } from '@console/internal/module/k8s';
import { Extension } from './base';

export type DetailsPageBreadCrumbsHook = (
  kind: K8sKind,
  urlMatch: any,
) => ({ name: string; path: string } | { name: string; path: Location })[];

namespace ExtensionProperties {
  export interface DetailPageBreadCrumbs {
    /**
     * array of models(kindObj) against which bread crumb is needed
     */
    getModels: CodeRef<() => K8sKind[] | K8sKind>;
    /**
     * returns breadcrumb for the given kindref
     */
    breadcrumbsProvider: CodeRef<DetailsPageBreadCrumbsHook>;
  }
}

export interface DetailPageBreadCrumbs
  extends Extension<ExtensionProperties.DetailPageBreadCrumbs> {
  type: 'DetailPageBreadCrumbs';
}

export const isDetailPageBreadCrumbs = (e: Extension): e is DetailPageBreadCrumbs => {
  return e.type === 'DetailPageBreadCrumbs';
};
