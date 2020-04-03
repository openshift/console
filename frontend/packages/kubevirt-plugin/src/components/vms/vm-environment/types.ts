import { EnvVarSource } from '../../../../../../public/module/k8s/index';

export enum SOURCES {
  configMapKind = 'configMap',
  secretKind = 'secret',
  serviceAccountKind = 'serviceAccount',
}

export type EnvDisk = [string, EnvVarSource, number];

export type NameValuePairs = {
  nameValuePairs: EnvDisk[];
};
