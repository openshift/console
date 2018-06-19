/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';

import { K8sResourceKind, CustomResourceDefinitionKind, GroupVersionKind, OwnerReference } from '../../module/k8s';
import { SpecDescriptor } from './spec-descriptors';
import { StatusDescriptor } from './status-descriptors';

import * as appsLogoImg from '../../imgs/apps-logo.svg';

export { ClusterServiceVersionsDetailsPage, ClusterServiceVersionsPage } from './clusterserviceversion';
export { ClusterServiceVersionResourcesDetailsPage, ClusterServiceVersionResourceLink } from './clusterserviceversion-resource';
export { CatalogSourceDetailsPage, CreateSubscriptionYAML } from './catalog-source';
export { SubscriptionsPage } from './subscription';

export const catalogEntryVisibilityLabel = 'tectonic-visibility';
export enum CatalogEntryVisibility {
  catalogEntryVisibilityTectonicFeature = 'tectonic-feature',
  catalogEntryVisibilityOCS = 'ocs',
}

export const appCatalogLabel = 'alm-catalog';
export enum AppCatalog {
  tectonicOCS = 'tectonic-ocs',
}

export enum ALMSpecDescriptors {
  podCount = 'urn:alm:descriptor:com.tectonic.ui:podCount',
  endpointList = 'urn:alm:descriptor:com.tectonic.ui:endpointList',
  label = 'urn:alm:descriptor:com.tectonic.ui:label',
  resourceRequirements = 'urn:alm:descriptor:com.tectonic.ui:resourceRequirements',
  selector = 'urn:alm:descriptor:com.tectonic.ui:selector:',
  namespaceSelector = 'urn:alm:descriptor:com.tectonic.ui:namespaceSelector',
  k8sResourcePrefix = 'urn:alm:descriptor:io.kubernetes:',
}

export enum ALMStatusDescriptors {
  metrics = 'urn:alm:descriptor:com.tectonic.ui:metrics',
  podStatuses = 'urn:alm:descriptor:com.tectonic.ui:podStatuses',
  podCount = 'urn:alm:descriptor:com.tectonic.ui:podCount',
  w3Link = 'urn:alm:descriptor:org.w3:link',
  tectonicLink = 'urn:alm:descriptor:com.tectonic.ui:important.link',
  conditions = 'urn:alm:descriptor:io.kubernetes.conditions',
  importantMetrics = 'urn:alm:descriptor:com.tectonic.ui:metrics',
  text = 'urn:alm:descriptor:text',
  prometheus = 'urn:alm:descriptor:io.prometheus:api.v1',
  k8sPhase = 'urn:alm:descriptor:io.kubernetes.phase',
  k8sPhaseReason = 'urn:alm:descriptor:io.kubernetes.phase:reason',
  // Prefix for all kubernetes resource status descriptors.
  k8sResourcePrefix = 'urn:alm:descriptor:io.kubernetes:',
}

export enum ClusterServiceVersionPhase {
  CSVPhaseNone = '',
  CSVPhasePending = 'Pending',
  CSVPhaseInstalling = 'Installing',
  CSVPhaseSucceeded = 'Succeeded',
  CSVPhaseFailed = 'Failed',
  CSVPhaseUnknown = 'Unknown',
}

export enum CSVConditionReason {
  CSVReasonRequirementsUnknown = 'RequirementsUnknown',
  CSVReasonRequirementsNotMet = 'RequirementsNotMet',
  CSVReasonRequirementsMet = 'AllRequirementsMet',
  CSVReasonComponentFailed = 'InstallComponentFailed',
  CSVReasonInstallSuccessful = 'InstallSucceeded',
  CSVReasonInstallCheckFailed = 'InstallCheckFailed',
}

export enum InstallPlanApproval {
  Automatic = 'Automatic',
  Manual = 'Manual',
  UpdateOnly = 'Update-Only',
}

export enum SubscriptionState {
  SubscriptionStateNone = '',
  SubscriptionStateUpgradeAvailable = 'UpgradeAvailable',
  SubscriptionStateUpgradePending = 'UpgradePending',
  SubscriptionStateAtLatest = 'AtLatestKnown',
}

export type CRDDescription = {
  name: string;
  version: string;
  kind: string;
  displayName: string;
  description?: string;
  specDescriptors?: SpecDescriptor[];
  statusDescriptors?: StatusDescriptor[];
  resources?: {
    name?: string;
    version: string;
    kind: string;
  }[];
};

export type ClusterServiceVersionKind = {
  spec: {
    customresourcedefinitions: {owned?: CRDDescription[], required?: CRDDescription[]};
    replaces?: string;
  };
  status?: {
    phase: ClusterServiceVersionPhase;
    reason: CSVConditionReason;
  };
} & K8sResourceKind;

export type ClusterServiceVersionResourceKind = {

} & K8sResourceKind;

export type InstallPlanKind = {
  spec: {
    clusterServiceVersionNames: string[];
    approval: InstallPlanApproval;
    approved?: boolean;
  };
  status?: {
    phase: 'Planning' | 'RequiresApproval' | 'Installing' | 'Complete' | 'Failed';
    catalogSources: string[];
    plan: {
      resolving: string;
      resource: CustomResourceDefinitionKind;
    }[];
  }
} & K8sResourceKind;

export type SubscriptionKind = {
  apiVersion: 'app.coreos.com/v1alpha1',
  kind: 'Subscription-v1',
  spec: {
    source: string;
    name: string;
    channel?: string;
    startingCSV?: string;
    installPlanApproval?: InstallPlanApproval;
  },
  status?: {
    installedCSV?: string;
    installplan?: OwnerReference;
    state?: SubscriptionState;
  },
} & K8sResourceKind;

export type CatalogSourceKind = {
  apiVersion: 'app.coreos.com/v1alpha1',
  kind: 'CatalogSource-v1',
  spec: {
    name: string;
    sourceType: 'internal';
    configMap?: string;
    secrets?: string[];
    displayName?: string;
    description?: string;
    publisher?: string;
    icon?: {mediatype: string, data: string};
  },
} & K8sResourceKind;

export type Package = {
  packageName: string;
  channels: {name: string, currentCSV: string}[];
  defaultChannel?: string;
};

export const isEnabled = (namespace: K8sResourceKind) => _.has(namespace, ['metadata', 'annotations', 'alm-manager']);

export const referenceForCRDDesc = (desc: CRDDescription): GroupVersionKind => `${desc.name.slice(desc.name.indexOf('.') + 1)}:${desc.version}:${desc.kind}`;

export const ClusterServiceVersionLogo: React.SFC<ClusterServiceVersionLogoProps> = (props) => {
  const {icon, displayName, provider, version} = props;

  return <div className="co-clusterserviceversion-logo">
    <div className="co-clusterserviceversion-logo__icon">{ _.isEmpty(icon)
      ? <img src={appsLogoImg} height="40" width="40" />
      : <img src={`data:${icon.mediatype};base64,${icon.base64data}`} height="40" width="40" /> }
    </div>
    <div className="co-clusterserviceversion-logo__name">
      <h1 className="co-clusterserviceversion-logo__name__clusterserviceversion">{displayName}</h1>
      { provider && <span className="co-clusterserviceversion-logo__name__provider text-muted">{`${version || ''} provided by ${_.get(provider, 'name', provider)}`}</span> }
    </div>
  </div>;
};

export type ClusterServiceVersionLogoProps = {
  displayName: string;
  icon: {base64data: string, mediatype: string};
  provider: {name: string} | string;
  version?: string;
};

ClusterServiceVersionLogo.displayName = 'ClusterServiceVersionLogo';
