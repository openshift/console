import { Extension } from '@console/plugin-sdk/src/typings/base';
import { CodeRef, EncodedCodeRef, UpdateExtensionProperties } from '../types';
import { ExtensionCommonK8sResource } from '../utils/common';

namespace ExtensionProperties {
  export type PVCCreateProp = {
    /** label for the create prop */
    label: string;
    /** path for the create prop */
    path: string;
  };

  export type PVCAlert = {
    /** CodeRef for the corresponding Alert component. */
    alert: EncodedCodeRef;
  };
  export type PVCAlertCodeRefs<T extends ExtensionCommonK8sResource> = {
    alert: CodeRef<React.ComponentType<{ pvc: T }>>;
  };

  export type PVCStatus = {
    /** priority for the corresponding Status component. bigger is prioritized */
    priority: number;
    /** CodeRef for the corresponding Status component. */
    status: EncodedCodeRef;
    /** predicate that tells if to render the status or not */
    predicate: EncodedCodeRef;
  };
  export type PVCStatusCodeRefs<T extends ExtensionCommonK8sResource> = {
    status: CodeRef<React.ComponentType<{ pvc: T }>>;
    predicate: CodeRef<(pvc: T) => boolean>;
  };

  export type PVCDelete = {
    /** predicate that tells if to use the extension or not */
    predicate: EncodedCodeRef;
    /** method for the pvc delete operation */
    onPVCKill: EncodedCodeRef; // (pvc) => Promise<void>;
    /** alert for additional info */
    alert: EncodedCodeRef;
  };
  export type PVCDeleteCodeRefs<T extends ExtensionCommonK8sResource> = {
    predicate: CodeRef<(pvc: T) => boolean>;
    onPVCKill: CodeRef<(pvc: T) => Promise<void>>;
    alert: CodeRef<React.ComponentType<{ pvc: T }>>;
  };
}

// Extension types

export type PVCCreateProp = Extension<ExtensionProperties.PVCCreateProp> & {
  type: 'console.pvc/create-prop';
};

export type PVCAlert = Extension<ExtensionProperties.PVCAlert> & {
  type: 'console.pvc/alert';
};
export type ResolvedPVCAlert<
  T extends ExtensionCommonK8sResource = ExtensionCommonK8sResource
> = UpdateExtensionProperties<PVCAlert, ExtensionProperties.PVCAlertCodeRefs<T>>;

export type PVCStatus = Extension<ExtensionProperties.PVCStatus> & {
  type: 'console.pvc/status';
};
export type ResolvedPVCStatus<
  T extends ExtensionCommonK8sResource = ExtensionCommonK8sResource
> = UpdateExtensionProperties<PVCStatus, ExtensionProperties.PVCStatusCodeRefs<T>>;

export type PVCDelete = Extension<ExtensionProperties.PVCDelete> & {
  type: 'console.pvc/delete';
};
export type ResolvedPVCDelete<
  T extends ExtensionCommonK8sResource = ExtensionCommonK8sResource
> = UpdateExtensionProperties<PVCDelete, ExtensionProperties.PVCDeleteCodeRefs<T>>;

// Type guards

export const isPVCCreateProp = (e: Extension): e is PVCCreateProp =>
  e.type === 'console.pvc/create-prop';

export const isPVCAlert = (e: Extension): e is ResolvedPVCAlert => e.type === 'console.pvc/alert';

export const isPVCStatus = (e: Extension): e is ResolvedPVCStatus =>
  e.type === 'console.pvc/status';

export const isPVCDelete = (e: Extension): e is ResolvedPVCDelete =>
  e.type === 'console.pvc/delete';
