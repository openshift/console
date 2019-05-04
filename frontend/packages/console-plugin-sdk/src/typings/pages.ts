import * as React from 'react';
import { Extension } from '.';
import { K8sKind } from '@console/internal/module/k8s';

export interface ResourcePageProperties {
  model: K8sKind;
  loader: () => Promise<React.ComponentType<any>>;
}

export interface ResourceListPage extends Extension<ResourcePageProperties> {
  type: 'ResourcePage/List';
}

export interface ResourceDetailPage extends Extension<ResourcePageProperties> {
  type: 'ResourcePage/Detail';
}

export type ResourcePage = ResourceListPage | ResourceDetailPage;

export function isResourceListPage(e: Extension<any>): e is ResourceListPage {
  return e.type === 'ResourcePage/List';
}

export function isResourceDetailPage(e: Extension<any>): e is ResourceDetailPage {
  return e.type === 'ResourcePage/Detail';
}

export function isResourcePage(e: Extension<any>): e is ResourcePage {
  return isResourceListPage(e) || isResourceDetailPage(e);
}
