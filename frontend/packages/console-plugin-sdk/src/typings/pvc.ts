import { K8sResourceCommon } from '@console/internal/module/k8s';
import { Extension, LazyLoader } from './base';

namespace ExtensionProperties {
  export interface PVCAlert<T> {
    /** Loader for the corresponding Alert component. */
    loader: LazyLoader<T>;
  }

  export interface PVCStatus<T> {
    /** Loader for the corresponding Status component. */
    loader: LazyLoader<T>;
    /** predicate that tells if to render the status or not */
    predicate: (pvc: K8sResourceCommon) => boolean;
    /** priority for the corresponding Status component. bigger is prioritized */
    priority: number;
  }

  export interface PVCCreateProp {
    /** label for the create prop */
    label: string;
    /** path for the create prop */
    path: string;
  }
}

export interface PVCAlert<R = any> extends Extension<ExtensionProperties.PVCAlert<R>> {
  type: 'PVCAlert';
}

export interface PVCStatus<R = any> extends Extension<ExtensionProperties.PVCStatus<R>> {
  type: 'PVCStatus';
}

export interface PVCCreateProp extends Extension<ExtensionProperties.PVCCreateProp> {
  type: 'PVCCreateProp';
}

export const isPVCAlert = (e: Extension): e is PVCAlert => {
  return e.type === 'PVCAlert';
};

export const isPVCStatus = (e: Extension): e is PVCStatus => {
  return e.type === 'PVCStatus';
};

export const isPVCCreateProp = (e: Extension): e is PVCCreateProp => {
  return e.type === 'PVCCreateProp';
};
