import { InfrastructureFeature } from '@console/operator-lifecycle-manager/src/components/operator-hub';

export enum FileBasedCatalogSchema {
  package = 'olm.package',
  channel = 'olm.channel',
  bundle = 'olm.bundle',
  csvMetadata = 'olm.csv.metadata',
}

export enum CSVMetadataKey {
  annotations = 'annotations',
  capabilities = 'capabilities',
  description = 'description',
  displayName = 'displayName',
  provider = 'provider',
  categories = 'categories',
  keywords = 'keywords',
  validSubscription = 'operators.openshift.io/valid-subscription',
  legacyInfrastructureFeatures = 'operators.openshift.io/infrastructure-features',
}

export enum NormalizedCSVMetadataKey {
  validSubscription = 'validSubscription',
  infrastructureFeatures = 'infrastructureFeatures',
  longDescription = 'longDescription',
}

export type CommaSeparatedList = string; // foo,bar,baz
export type SerializedJSONArray = string; // '["foo","bar","baz"]'
export type ProviderMetadataValue = { name: string } | string;

export type FileBasedCatalogMetadata = {
  annotations: {
    [CSVMetadataKey.categories]?: CommaSeparatedList;
    [CSVMetadataKey.capabilities]?: string;
    [CSVMetadataKey.description]?: string;
    [CSVMetadataKey.displayName]?: string;
    [CSVMetadataKey.legacyInfrastructureFeatures]?: SerializedJSONArray;
    [CSVMetadataKey.validSubscription]?: SerializedJSONArray;
    [key: string]: any;
  };
  [CSVMetadataKey.description]?: string;
  [CSVMetadataKey.displayName]?: string;
  [CSVMetadataKey.keywords]?: string[];
  [CSVMetadataKey.provider]?: ProviderMetadataValue;
  [key: string]: any;
};

export type FileBasedCatalogItem = {
  catalog: string;
  id: string;
  name: string;
  package: string;
  schema: string;
  [key: string]: any;
};

export type FileBasedCatalogProperty<Value = any> = {
  type: string;
  value: Value;
};

export type FileBasedCatalogBundle = FileBasedCatalogItem & {
  properties: FileBasedCatalogProperty[];
};

export type FileBasedCatalogChannelEntry = {
  name: string;
};

export type FileBasedCatalogChannel = FileBasedCatalogItem & {
  entries: FileBasedCatalogChannelEntry[];
};

export type FileBasedCatalogPackage = FileBasedCatalogItem & {
  icon: {
    base64data: string;
    mediatype: string;
  };
};

export type ExtensionCatalogItemMetadata = {
  capabilities?: string;
  categories?: string[];
  description?: string;
  displayName?: string;
  infrastructureFeatures?: InfrastructureFeature[];
  keywords?: string[];
  longDescription?: string;
  provider?: string;
  source?: string;
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
} & ExtensionCatalogItemMetadata;
