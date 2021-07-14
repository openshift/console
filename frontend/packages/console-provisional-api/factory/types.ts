import * as React from 'react';
import { K8sResourceCommon, K8sKind, FirehoseResult, Page } from '../internal-types/types';

export type PageHeadingProps = {
  breadcrumbs?: { name: string; path: string }[];
  breadcrumbsFor?: (obj: K8sResourceCommon) => { name: string; path: string }[];
  buttonActions?: any[];
  children?: React.ReactChildren;
  detail?: boolean;
  // group~version~kind
  kind?: string;
  kindObj?: K8sKind;
  menuActions?: Function[];
  obj?: FirehoseResult<K8sResourceCommon>;
  resourceKeys?: string[];
  style?: object;
  title?: string | JSX.Element;
  titleFunc?: (obj: K8sResourceCommon) => string | JSX.Element;
  customData?: any;
  badge?: React.ReactNode;
  icon?: React.ComponentType<{ obj?: K8sResourceCommon }>;
  getResourceStatus?: (resource: K8sResourceCommon) => string;
  className?: string;
};

export type HorizontalNavProps = {
  className?: string;
  obj?: { loaded: boolean; data: K8sResourceCommon };
  label?: string;
  pages: Page[];
  pagesFor?: (obj: K8sResourceCommon) => Page[];
  match: any;
  resourceKeys?: string[];
  hideNav?: boolean;
  EmptyMsg?: React.ComponentType<any>;
  noStatusBox?: boolean;
  customData?: any;
};
