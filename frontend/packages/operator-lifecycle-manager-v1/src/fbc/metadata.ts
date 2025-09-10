// This file will be removed as part of https://issues.redhat.com//browse/CONSOLE-4668
/* eslint-disable no-console */
import * as _ from 'lodash';
import {
  NormalizedOLMAnnotation,
  OLMAnnotation,
} from '@console/operator-lifecycle-manager/src/components/operator-hub';
import { getProviderValue } from '@console/operator-lifecycle-manager/src/components/operator-hub/operator-hub-items';
import { infrastructureFeatureMap } from '@console/operator-lifecycle-manager/src/components/operator-hub/operator-hub-utils';
import {
  CommaSeparatedList,
  PackageMetadata,
  FileBasedCatalogBundle,
  CSVMetadata,
  SerializedJSONArray,
  ProviderMetadataValue,
} from './types';

const aggregateValue = <T = any>(acc: PackageMetadata, key: string, value: T): PackageMetadata => ({
  ...acc,
  [key]: value,
});

const aggregateArray = <T = any>(acc: PackageMetadata, key: string, value: T[]): PackageMetadata =>
  aggregateValue<T[]>(acc, key, _.uniq([...(acc[key] ?? []), ...(value ?? [])]));

const aggregateSerializedJSONArray = <T = any>(
  acc: PackageMetadata,
  key: string,
  value: SerializedJSONArray,
): PackageMetadata => {
  if (!value) return acc;
  try {
    return aggregateArray<T>(acc, key, JSON.parse(value) as T[]);
  } catch (e) {
    console.warn(
      `[Extension Catalog Database] Malformed FBC metadata property: "${key}". Expected serialized JSON array, got "${value}".`,
    );
    return aggregateArray<string>(acc, key, [value]);
  }
};

const aggregateCommaSeparatedList = (
  acc: PackageMetadata,
  key: string,
  value: CommaSeparatedList,
): PackageMetadata => {
  if (!value) return acc;
  try {
    const newValues = value
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e);
    return newValues.length > 0 ? aggregateArray<string>(acc, key, newValues) : acc;
  } catch (e) {
    console.warn(
      `[Extension Catalog Database] Malformed FBC metadata property: "${key}". Expected comma-separated list, got "${value}".`,
    );
    return aggregateArray<string>(acc, key, [value]);
  }
};

const aggregateLegacyInfrastructureFeatures = (acc, key, value) => {
  const { infrastructureFeatures } = aggregateSerializedJSONArray({}, key, value);
  if (!infrastructureFeatures) return acc;
  const newFeatures = infrastructureFeatures.reduce(
    (featureAcc, feature) =>
      infrastructureFeatureMap[feature]
        ? [...featureAcc, infrastructureFeatureMap[feature]]
        : featureAcc,
    [],
  );
  return aggregateArray(acc, NormalizedOLMAnnotation.InfrastructureFeatures, newFeatures);
};

const aggregateInfrastructureFeature = (
  acc: PackageMetadata,
  key: string,
  value: string,
): PackageMetadata =>
  value === 'true' && infrastructureFeatureMap[key]
    ? aggregateArray(acc, NormalizedOLMAnnotation.InfrastructureFeatures, [
        infrastructureFeatureMap[key],
      ])
    : acc;

const aggregateProvider = (acc: PackageMetadata, providerValue: ProviderMetadataValue) => {
  const provider = typeof providerValue === 'string' ? providerValue : providerValue?.name ?? '';
  const normalizedProvider = getProviderValue(provider);
  return aggregateValue(acc, 'provider', normalizedProvider);
};

const aggregateAnnotations = (
  packageMetadata: PackageMetadata,
  annotations: CSVMetadata['annotations'],
): PackageMetadata => {
  return Object.entries(annotations).reduce((acc, [key, value]) => {
    if (!value) return acc;
    switch (key) {
      case OLMAnnotation.Capabilities:
      case OLMAnnotation.CreatedAt:
      case OLMAnnotation.Description:
      case OLMAnnotation.DisplayName:
      case OLMAnnotation.Repository:
      case OLMAnnotation.Support:
      case OLMAnnotation.ActionText:
      case OLMAnnotation.RemoteWorkflow:
      case OLMAnnotation.SupportWorkflow:
        return aggregateValue(acc, key, value);
      case OLMAnnotation.ContainerImage:
        return aggregateValue(acc, NormalizedOLMAnnotation.ContainerImage, value);
      case OLMAnnotation.ValidSubscription:
        return aggregateSerializedJSONArray(acc, NormalizedOLMAnnotation.ValidSubscription, value);
      case OLMAnnotation.InfrastructureFeatures:
        return aggregateLegacyInfrastructureFeatures(
          acc,
          NormalizedOLMAnnotation.InfrastructureFeatures,
          value,
        );
      case OLMAnnotation.Categories:
        return aggregateCommaSeparatedList(acc, key, value);
      case OLMAnnotation.Disconnected:
      case OLMAnnotation.FIPSCompliant:
      case OLMAnnotation.ProxyAware:
      case OLMAnnotation.CNF:
      case OLMAnnotation.CNI:
      case OLMAnnotation.CSI:
      case OLMAnnotation.TLSProfiles:
      case OLMAnnotation.TokenAuthAWS:
      case OLMAnnotation.TokenAuthAzure:
      case OLMAnnotation.TokenAuthGCP:
        return aggregateInfrastructureFeature(acc, key, value);
      default:
        return acc;
    }
  }, packageMetadata);
};

const aggregateMetadata = (
  csvMetadata: CSVMetadata,
  packageMetadata?: PackageMetadata,
): PackageMetadata => {
  if (!csvMetadata) return packageMetadata ?? {};
  return Object.keys(csvMetadata)
    .sort() // ensure annotations are handled first
    .reduce((acc, key) => {
      const value = csvMetadata[key];
      if (!value) return acc;
      switch (key) {
        case 'annotations':
          return aggregateAnnotations(acc, value);
        case 'description':
          return aggregateValue(acc, 'longDescription', value);
        case 'displayName':
        case 'image':
          return aggregateValue(acc, key, value);
        case 'provider':
          return aggregateProvider(acc, value);
        case 'keywords':
          return aggregateArray(acc, key, value);
        default:
          return acc;
      }
    }, packageMetadata ?? {});
};

export const getBundleMetadata = (bundle: FileBasedCatalogBundle): PackageMetadata => {
  return bundle.properties.reduce((acc, property) => {
    switch (property.type) {
      case 'olm.csv.metadata':
        return aggregateMetadata(property.value, acc);
      default:
        return acc;
    }
  }, {});
};
