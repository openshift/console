import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants/common';

export enum Flags {
  OPERATOR_LIFECYCLE_METADATA = 'OPERATOR_LIFECYCLE_METADATA',
}

export enum DefaultCatalogSource {
  RedHatOperators = 'redhat-operators',
  RedHatMarketPlace = 'redhat-marketplace',
  CertifiedOperators = 'certified-operators',
  CommunityOperators = 'community-operators',
}

export enum DefaultClusterCatalog {
  OpenShiftRedHatOperators = 'openshift-redhat-operators',
  OpenShiftRedHatMarketPlace = 'openshift-redhat-marketplace',
  OpenShiftCertifiedOperators = 'openshift-certified-operators',
  OpenShiftCommunityOperators = 'openshift-community-operators',
}

export enum OperatorSource {
  RedHatOperators = 'Red Hat',
  RedHatMarketplace = 'Marketplace',
  CertifiedOperators = 'Certified',
  CommunityOperators = 'Community',
  Custom = 'Custom',
}

export const DEFAULT_GLOBAL_OPERATOR_INSTALLATION_NAMESPACE = 'openshift-operators';
export const DEFAULT_SOURCE_NAMESPACE = 'openshift-marketplace';
export const GLOBAL_COPIED_CSV_NAMESPACE = 'openshift';
export const NON_STANDALONE_ANNOTATION_VALUE = 'non-standalone';
export const OPERATOR_NAMESPACE_ANNOTATION = 'olm.operatorNamespace';

/** Shared Software Catalog type for Classic and Next-Gen operators. */
export const OPERATOR_TYPE = 'operator';

export enum OLMGeneration {
  Classic = 'Classic',
  NextGen = 'Next-Gen',
}

/** Software Catalog, pre-filtered to Classic (OLMv0) operators. */
export const CLASSIC_CATALOG_PATH = `/catalog/all-namespaces?catalogType=${OPERATOR_TYPE}&olmGeneration=${encodeURIComponent(JSON.stringify([OLMGeneration.Classic]))}`;
/** Software Catalog, pre-filtered to Next-Gen (OLMv1) operators. */
export const NEXT_GEN_CATALOG_PATH = `/catalog/all-namespaces?catalogType=${OPERATOR_TYPE}&olmGeneration=${encodeURIComponent(JSON.stringify([OLMGeneration.NextGen]))}`;
export const INSTALLED_OPERATORS_PATH = '/installed-operators';
/** Tab href of the Classic (OLMv0) list on the Installed Operators page. */
export const CLASSIC_INSTALLED_TAB = 'classic';

export const GLOBAL_OPERATOR_NAMESPACES = [
  DEFAULT_GLOBAL_OPERATOR_INSTALLATION_NAMESPACE,
  GLOBAL_COPIED_CSV_NAMESPACE,
  ALL_NAMESPACES_KEY,
];
