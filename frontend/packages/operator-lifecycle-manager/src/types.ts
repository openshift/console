import {
  APIServiceDefinition,
  CRDDescription,
  InstallModeType,
} from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { K8sResourceKind, Selector } from '@console/internal/module/k8s';

export {
  APIServiceDefinition,
  CRDDescription,
  InstallModeType,
} from '@console/dynamic-plugin-sdk/src/api/internal-types';

export enum AppCatalog {
  rhOperators = 'rh-operators',
}

export enum ClusterServiceVersionStatus {
  Failed = 'Failed',
  OK = 'OK',
  Pending = 'Pending',
  Unknown = 'Unknown',
}

export type ProvidedAPI = CRDDescription | APIServiceDefinition;

export type PackageManifestKind = {
  apiVersion: 'packages.operators.coreos.com/v1';
  kind: 'PackageManifest';
  spec: {};
  status: {
    catalogSource: string;
    catalogSourceNamespace: string;
    catalogSourceDisplayName: string;
    catalogSourcePublisher: string;
    provider: {
      name: string;
    };
    packageName: string;
    channels: {
      name: string;
      currentCSV: string;
      currentCSVDesc: {
        annotations?: any;
        description?: string;
        displayName: string;
        icon: { mediatype: string; base64data: string }[];
        keywords?: string[];
        version: string;
        provider: {
          name: string;
        };
        installModes: { type: InstallModeType; supported: boolean }[];
        customresourcedefinitions?: { owned?: CRDDescription[]; required?: CRDDescription[] };
        apiservicedefinitions?: {
          owned?: APIServiceDefinition[];
          required?: APIServiceDefinition[];
        };
      };
    }[];
    defaultChannel: string;
  };
} & K8sResourceKind;

export type OperatorGroupKind = {
  apiVersion: 'operators.coreos.com/v1';
  kind: 'OperatorGroup';
  spec?: {
    selector?: Selector;
    targetNamespaces?: string[];
    serviceAccount?: K8sResourceKind;
  };
  status?: {
    namespaces?: string[];
    lastUpdated: string;
  };
} & K8sResourceKind;
