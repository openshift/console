import { Extension } from '@console/plugin-sdk/src/typings/base';
import { CodeRef, ExtensionDeclaration } from '../types';

export type ProvisionerProps = {
  onParamChange: (id: string, paramName: string, checkbox: boolean) => void;
  parameterKey: string;
  parameterValue: string;
};

export enum ProvisionerType {
  CSI = 'csi',
  OTHERS = 'others',
}

export type StorageClassProvisioner = ExtensionDeclaration<
  'console.storage-class/provisioner',
  {
    [provisionerType: string]: {
      [provisioner: string]: {
        title: string;
        provisioner: string;
        allowVolumeExpansion: CodeRef<(arg) => boolean>;
        volumeBindingMode?: string;
        documentationLink?: string;
        parameters: {
          [paramKey: string]: {
            name: string;
            hintText: string;
            value?: string;
            values?: {
              [key: string]: string;
            };
            visible?: CodeRef<(arg) => boolean>;
            required?: CodeRef<(arg) => boolean>;
            validation?: CodeRef<(params) => string>;
            format?: CodeRef<(arg) => string>;
            Component?: CodeRef<React.ComponentType<ProvisionerProps>>;
          };
        };
      };
    };
  }
>;

export const isStorageClassProvisioner = (e: Extension): e is StorageClassProvisioner =>
  e.type === 'console.storage-class/provisioner';
