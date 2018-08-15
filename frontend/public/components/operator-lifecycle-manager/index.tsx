/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';

import { K8sResourceKind, GroupVersionKind, OwnerReference } from '../../module/k8s';
import { Descriptor } from './descriptors/types';
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
  ocs = 'ocs',
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
  specDescriptors?: Descriptor[];
  statusDescriptors?: Descriptor[];
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

// FIXME(alecmerdler): Remove this and just use `K8sResourceKind`
export type ClusterServiceVersionResourceKind = {

} & K8sResourceKind;

export type StepResource = {
  group: string;
  version: string;
  kind: string;
  name: string;
  manifest?: string;
};

export type Step = {
  resolving: string;
  resource: StepResource;
  status: 'Unknown' | 'NotPresent' | 'Present' | 'Created';
};

export type InstallPlanKind = {
  spec: {
    clusterServiceVersionNames: string[];
    approval: InstallPlanApproval;
    approved?: boolean;
  };
  status?: {
    phase: 'Planning' | 'RequiresApproval' | 'Installing' | 'Complete' | 'Failed';
    catalogSources: string[];
    plan: Step[];
  }
} & K8sResourceKind;

export type SubscriptionKind = {
  apiVersion: 'operators.coreos.com/v1alpha1',
  kind: 'Subscription',
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
  apiVersion: 'operators.coreos.com/v1alpha1',
  kind: 'CatalogSource',
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

export const olmNamespace = 'operator-lifecycle-manager';

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
