import type { K8sModel } from '../api/common-types';
import type { Extension, CodeRef } from '../types';

export type DetailsPageBreadCrumbsHook = (
  kind: K8sModel,
  urlMatch: any,
) => { name: string; path: string }[];

export type DetailPageBreadCrumbs = Extension<
  'dev-console.detailsPage/breadcrumbs',
  {
    /**
     * array of models(kindObj) against which bread crumb is needed
     */
    getModels: CodeRef<() => K8sModel[] | K8sModel>;
    /**
     * returns breadcrumb for the given kindref
     */
    breadcrumbsProvider: CodeRef<DetailsPageBreadCrumbsHook>;
  }
>;

// Type guards

export const isDetailPageBreadCrumbs = (e: Extension): e is DetailPageBreadCrumbs =>
  e.type === 'dev-console.detailsPage/breadcrumbs';
