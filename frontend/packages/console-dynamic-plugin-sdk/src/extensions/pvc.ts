import { Extension } from '@console/plugin-sdk/src/typings/base';
import { ExtensionDeclaration, CodeRef } from '../types';
import { ExtensionCommonK8sResource as PVCResource } from '../utils/common';

export type PVCCreateProp = ExtensionDeclaration<
  'console.pvc/create-prop',
  {
    /** Label for the create prop action. */
    label: string;
    /** Path for the create prop action. */
    path: string;
  }
>;

export type PVCAlert = ExtensionDeclaration<
  'console.pvc/alert',
  {
    /** The alert component. */
    alert: CodeRef<React.ComponentType<{ pvc: PVCResource }>>;
  }
>;

export type PVCStatus = ExtensionDeclaration<
  'console.pvc/status',
  {
    /** Priority for the status component. Bigger value means higher priority. */
    priority: number;
    /** The status component. */
    status: CodeRef<React.ComponentType<{ pvc: PVCResource }>>;
    /** Predicate that tells whether to render the status component or not. */
    predicate: CodeRef<(pvc: PVCResource) => boolean>;
  }
>;

export type PVCDelete = ExtensionDeclaration<
  'console.pvc/delete',
  {
    /** Predicate that tells whether to use the extension or not. */
    predicate: CodeRef<(pvc: PVCResource) => boolean>;
    /** Method for the PVC delete operation. */
    onPVCKill: CodeRef<(pvc: PVCResource) => Promise<void>>;
    /** Alert component to show additional information. */
    alert: CodeRef<React.ComponentType<{ pvc: PVCResource }>>;
  }
>;

// Type guards

export const isPVCCreateProp = (e: Extension): e is PVCCreateProp =>
  e.type === 'console.pvc/create-prop';

export const isPVCAlert = (e: Extension): e is PVCAlert => e.type === 'console.pvc/alert';

export const isPVCStatus = (e: Extension): e is PVCStatus => e.type === 'console.pvc/status';

export const isPVCDelete = (e: Extension): e is PVCDelete => e.type === 'console.pvc/delete';
