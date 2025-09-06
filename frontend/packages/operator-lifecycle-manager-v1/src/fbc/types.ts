// This file will be removed as part of https://issues.redhat.com//browse/CONSOLE-4668
import {
  InfrastructureFeature,
  OLMAnnotation,
} from '@console/operator-lifecycle-manager/src/components/operator-hub';

export enum FileBasedCatalogSchema {
  Package = 'olm.package',
  Channel = 'olm.channel',
  Bundle = 'olm.bundle',
}

export enum FileBasedCatalogPropertyType {
  Package = 'olm.package',
  CSVMetadata = 'olm.csv.metadata',
}

export type CommaSeparatedList = string; // foo,bar,baz
export type SerializedJSONArray = string; // '["foo","bar","baz"]'
export type ProviderMetadataValue = { name: string } | string;

export type CSVMetadata = {
  annotations: {
    [OLMAnnotation.Capabilities]?: string;
    [OLMAnnotation.Categories]?: CommaSeparatedList;
    [OLMAnnotation.ContainerImage]?: string;
    [OLMAnnotation.CreatedAt]?: string;
    [OLMAnnotation.Description]?: string;
    [OLMAnnotation.DisplayName]?: string;
    [OLMAnnotation.InfrastructureFeatures]?: SerializedJSONArray;
    [OLMAnnotation.Repository]?: string;
    [OLMAnnotation.Support]?: string;
    [OLMAnnotation.ValidSubscription]?: SerializedJSONArray;
    [key: string]: any;
  };
  description?: string;
  displayName?: string;
  keywords?: string[];
  provider?: ProviderMetadataValue;
  [key: string]: any;
};

export type FileBasedCatalogObject = {
  schema: string;
  name: string;
  package: string;
  [key: string]: any;
};

export type FileBasedCatalogProperty<Value = any> = {
  type: string;
  value: Value;
};

export type FileBasedCatalogBundle = FileBasedCatalogObject & {
  properties: FileBasedCatalogProperty[];
};

export type FileBasedCatalogChannelEntry = {
  name: string;
};

export type FileBasedCatalogChannel = FileBasedCatalogObject & {
  entries: FileBasedCatalogChannelEntry[];
};

export type FileBasedCatalogPackage = FileBasedCatalogObject & {
  icon: {
    base64data: string;
    mediatype: string;
  };
};

export type PackageMetadata = {
  capabilities?: string;
  categories?: string[];
  createdAt?: string;
  description?: string;
  displayName?: string;
  image?: string;
  infrastructureFeatures?: InfrastructureFeature[];
  keywords?: string[];
  longDescription?: string;
  provider?: string;
  repository?: string;
  source?: string;
  support?: string;
  validSubscription?: string[];
};

type SemverCoercableString = string;

export type ExtensionCatalogItemChannels = {
  [key: SemverCoercableString]: SemverCoercableString[];
};

export type ExtensionCatalogItem = {
  catalog: string;
  channels?: ExtensionCatalogItemChannels;
  icon: {
    mediatype: string;
    base64data: string;
  };
  id: string;
  name: string;
} & PackageMetadata;
