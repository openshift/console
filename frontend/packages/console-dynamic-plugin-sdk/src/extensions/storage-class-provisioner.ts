import { Extension } from '@console/plugin-sdk/src/typings/base';
import { CodeRef, ExtensionDeclaration } from '../types';
import { StorageClass } from './console-types';

export type ProvisionerProps = {
  onParamChange: (id: string, paramName: string, checkbox: boolean) => void;
  parameterKey: string;
  parameterValue: string;
};

export enum ProvisionerType {
  /** Container Storage Interface provisioner type */
  CSI = 'CSI',
  /** Other provisioner type */
  OTHERS = 'OTHERS',
}

export type ProvisionerDetails = {
  title: string;
  provisioner: string;
  allowVolumeExpansion: CodeRef<(arg) => boolean> | boolean;
  volumeBindingMode?: string;
  documentationLink?: CodeRef<() => string>;
  parameters?: {
    [paramKey: string]: {
      name: string;
      hintText: string;
      value?: string;
      values?: Record<string, string>;
      visible?: CodeRef<(arg) => boolean> | boolean;
      required?: CodeRef<(arg) => boolean> | boolean;
      validation?: CodeRef<(params) => string>;
      format?: CodeRef<(arg) => string>;
      Component?: CodeRef<React.ComponentType<ProvisionerProps>>;
      type?: 'checkbox';
      validationMsg?: string;
    };
  };
  mutator?: CodeRef<(storageClass: StorageClass) => StorageClass>;
};

/** Adds a new storage class provisioner as an option during storage class creation. */
export type StorageClassProvisioner = ExtensionDeclaration<
  'console.storage-class/provisioner',
  {
    [provisionerType in keyof typeof ProvisionerType]?: ProvisionerDetails;
  }
>;

export const isStorageClassProvisioner = (e: Extension): e is StorageClassProvisioner =>
  e.type === 'console.storage-class/provisioner';
