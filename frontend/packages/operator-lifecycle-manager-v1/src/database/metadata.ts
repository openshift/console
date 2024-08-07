/* eslint-disable no-console */
import * as _ from 'lodash';
import { OperatorHubCSVAnnotationKey } from '@console/operator-lifecycle-manager/src/components/operator-hub';
import { normalizedInfrastructureFeatures } from '@console/operator-lifecycle-manager/src/components/operator-hub/operator-hub-utils';
import {
  CommaSeparatedList,
  ExtensionCatalogItemMetadata,
  FileBasedCatalogBundle,
  FileBasedCatalogMetadata,
  CSVMetadataKey,
  SerializedJSONArray,
  NormalizedCSVMetadataKey,
} from './types';

const aggregateNestedValue = (
  acc: ExtensionCatalogItemMetadata,
  key: string,
  value: any,
  nestedPath,
): ExtensionCatalogItemMetadata => ({ ...acc, [key]: _.get(value, nestedPath, value) });

const aggregateArray = (
  acc: ExtensionCatalogItemMetadata,
  key: string,
  value: string[],
): ExtensionCatalogItemMetadata => ({
  ...acc,
  [key]: [...(acc[key] ?? []), ...(value ?? [])],
});

const aggregateSerialJSONArray = (
  acc: ExtensionCatalogItemMetadata,
  key: string,
  value: SerializedJSONArray,
): ExtensionCatalogItemMetadata => {
  if (!value) return acc;
  try {
    return aggregateArray(acc, key, JSON.parse(value));
  } catch (e) {
    console.warn(
      `[Extension Catalog Database] Malformed FBC metadata property: "${key}". Expected serialized JSON array, got "${value}".`,
    );
    return aggregateArray(acc, key, [value]);
  }
};

const aggregateCommaSeparatedList = (
  acc: ExtensionCatalogItemMetadata,
  key: string,
  value: CommaSeparatedList,
): ExtensionCatalogItemMetadata => {
  if (!value) return acc;
  try {
    const newValues = value
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e);
    return newValues.length > 0 ? aggregateArray(acc, key, newValues) : acc;
  } catch (e) {
    console.warn(
      `[Extension Catalog Database] Malformed FBC metadata property: "${key}". Expected comma-separated list, got "${value}".`,
    );
    return aggregateArray(acc, key, [value]);
  }
};

const aggregateLegacyInfrastructureFeatures = (acc, key, value) => {
  const { infrastructureFeatures } = aggregateSerialJSONArray(acc, key, value);
  if (!infrastructureFeatures) return acc;
  return {
    ...acc,
    infrastructureFeatures: infrastructureFeatures.map(
      (i) => normalizedInfrastructureFeatures[i] ?? i,
    ),
  };
};

const aggregateAnnotations = (
  extensionMetadata: ExtensionCatalogItemMetadata,
  annotations: FileBasedCatalogMetadata['annotations'],
): ExtensionCatalogItemMetadata => {
  return Object.entries(annotations).reduce((acc, [key, value]) => {
    if (!value) return acc;
    switch (key) {
      case CSVMetadataKey.description:
      case CSVMetadataKey.displayName:
      case CSVMetadataKey.capabilities:
        return {
          [key]: value,
          ...acc,
        };
      case CSVMetadataKey.validSubscription:
        return aggregateSerialJSONArray(acc, NormalizedCSVMetadataKey.validSubscription, value);
      case CSVMetadataKey.legacyInfrastructureFeatures:
        return aggregateLegacyInfrastructureFeatures(
          acc,
          NormalizedCSVMetadataKey.infrastructureFeatures,
          value,
        );
      case CSVMetadataKey.categories:
        return aggregateCommaSeparatedList(acc, key, value);
      case OperatorHubCSVAnnotationKey.disconnected:
      case OperatorHubCSVAnnotationKey.fipsCompliant:
      case OperatorHubCSVAnnotationKey.proxyAware:
      case OperatorHubCSVAnnotationKey.cnf:
      case OperatorHubCSVAnnotationKey.cni:
      case OperatorHubCSVAnnotationKey.csi:
      case OperatorHubCSVAnnotationKey.tlsProfiles:
      case OperatorHubCSVAnnotationKey.tokenAuthAWS:
      case OperatorHubCSVAnnotationKey.tokenAuthAzure:
      case OperatorHubCSVAnnotationKey.tokenAuthGCP:
        return value === 'true'
          ? aggregateArray(acc, NormalizedCSVMetadataKey.infrastructureFeatures, [
              normalizedInfrastructureFeatures[key],
            ])
          : acc;
      default:
        return acc;
    }
  }, extensionMetadata);
};

const aggregateMetadata = (
  fbcMetadata: FileBasedCatalogMetadata,
  extensionMetadata?: ExtensionCatalogItemMetadata,
): ExtensionCatalogItemMetadata => {
  if (!fbcMetadata) return extensionMetadata;
  return Object.keys(fbcMetadata)
    .sort() // ensure annotations are handled first
    .reduce((acc, key) => {
      const value = fbcMetadata[key];
      if (!value) return acc;
      switch (key) {
        case CSVMetadataKey.annotations:
          return {
            ...acc,
            ...aggregateAnnotations(acc, value),
          };
        case CSVMetadataKey.description:
          return {
            ...acc,
            [NormalizedCSVMetadataKey.longDescription]: value,
          };
        case CSVMetadataKey.displayName:
          return { ...acc, [key]: value };
        case CSVMetadataKey.provider:
          return aggregateNestedValue(acc, key, value, 'name');
        case CSVMetadataKey.keywords:
          return aggregateArray(acc, key, value);
        default:
          return acc;
      }
    }, extensionMetadata ?? {});
};

export const getBundleMetadata = (bundle: FileBasedCatalogBundle): ExtensionCatalogItemMetadata => {
  return bundle.properties.reduce((acc, property) => {
    switch (property.type) {
      case 'olm.csv.metadata':
        return aggregateMetadata(property.value, acc);
      default:
        return acc;
    }
  }, {});
};
