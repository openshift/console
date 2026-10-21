import type { Extension, CodeRef } from '../types';
import type { K8sResourceCommon } from './console-types';

/** This extension can be used to specify additional properties that will be used when creating PVC resources on the PVC list page. */
export type PVCCreateProp = Extension<
  'console.pvc/create-prop',
  {
    /** Label for the create prop action. */
    label: string;
    /** Path for the create prop action. */
    path: string;
  }
>;

/** This extension can be used to contribute custom alerts on the PVC details page. */
export type PVCAlert = Extension<
  'console.pvc/alert',
  {
    /** The alert component. */
    alert: CodeRef<React.ComponentType<{ pvc: K8sResourceCommon }>>;
  }
>;

/** This extension can be used to contribute an additional status component for PVC resources on the cluster dashboard page. */
export type PVCStatus = Extension<
  'console.pvc/status',
  {
    /** Priority for the status component. Bigger value means higher priority. */
    priority: number;
    /** The status component. */
    status: CodeRef<React.ComponentType<{ pvc: K8sResourceCommon }>>;
    /** Predicate that tells whether to render the status component or not. */
    predicate: CodeRef<(pvc: K8sResourceCommon) => boolean>;
  }
>;

/** This extension allows hooking into deleting PVC resources. It can provide an alert with additional information and custom PVC delete logic. */
export type PVCDelete = Extension<
  'console.pvc/delete',
  {
    /** Predicate that tells whether to use the extension or not. */
    predicate: CodeRef<(pvc: K8sResourceCommon) => boolean>;
    /** Method for the PVC delete operation. */
    onPVCKill: CodeRef<(pvc: K8sResourceCommon) => Promise<void>>;
    /** Alert component to show additional information. */
    alert: CodeRef<React.ComponentType<{ pvc: K8sResourceCommon }>>;
  }
>;

// Type guards

export const isPVCCreateProp = (e: Extension): e is PVCCreateProp =>
  e.type === 'console.pvc/create-prop';

export const isPVCAlert = (e: Extension): e is PVCAlert => e.type === 'console.pvc/alert';

export const isPVCStatus = (e: Extension): e is PVCStatus => e.type === 'console.pvc/status';

export const isPVCDelete = (e: Extension): e is PVCDelete => e.type === 'console.pvc/delete';
