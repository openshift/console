import * as React from 'react';
import { K8sKind } from '@console/internal/module/k8s';
import { Extension } from './extension';

namespace ExtensionProperties {
  export interface ResourcePage {
    /** Model associated with the resource page. */
    model: K8sKind;
    /** Loader for the corresponding React page component. */
    loader: () => Promise<React.ComponentType<any>>;
  }
}

export interface ResourceListPage extends Extension<ExtensionProperties.ResourcePage> {
  type: 'ResourcePage/List';
}

export interface ResourceDetailPage extends Extension<ExtensionProperties.ResourcePage> {
  type: 'ResourcePage/Detail';
}

export type ResourcePage = ResourceListPage | ResourceDetailPage;

export const isResourceListPage = (e: Extension<any>): e is ResourceListPage => {
  return e.type === 'ResourcePage/List';
};

export const isResourceDetailPage = (e: Extension<any>): e is ResourceDetailPage => {
  return e.type === 'ResourcePage/Detail';
};

export const isResourcePage = (e: Extension<any>): e is ResourcePage => {
  return isResourceListPage(e) || isResourceDetailPage(e);
};
