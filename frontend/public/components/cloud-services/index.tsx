/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash';

import './ocs-templates';
import { K8sResourceKind, CustomResourceDefinitionKind } from '../../module/k8s';

import * as appsLogoImg from '../../imgs/apps-logo.svg';

export { ClusterServiceVersionsDetailsPage, ClusterServiceVersionsPage } from './clusterserviceversion';
export { ClusterServiceVersionResourcesDetailsPage } from './clusterserviceversion-resource';
export { CatalogsDetailsPage } from './catalog';

export enum ALMSpecDescriptors {
  podCount = 'urn:alm:descriptor:com.tectonic.ui:podCount',
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

export type CRDDescription = {
  name: string;
  version: string;
  kind: string;
  displayName: string;
  description?: string;
  statusDescriptors?: {
    path: string;
    displayName: string;
    description?: string;
    'x-descriptors': ALMStatusDescriptors[];
    value?: any;
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

export type CatalogEntryKind = {

} & K8sResourceKind;

export type InstallPlanKind = {
  spec: {
    clusterServiceVersionNames: string[];
    approval: 'Automatic' | 'Manual' | 'Update-Only';
  };
  status?: {
    status: 'Planning' | 'Requires Approval' | 'Installing' | 'Complete';
    plan: {
      resolving: string;
      resource: CustomResourceDefinitionKind;
    }[];
  }
} & K8sResourceKind;

export const isEnabled = (namespace: K8sResourceKind) => _.has(namespace, ['metadata', 'annotations', 'alm-manager']);

export const ClusterServiceVersionLogo: React.StatelessComponent<ClusterServiceVersionLogoProps> = (props) => {
  const {icon, displayName, provider, version} = props;

  return <div className="co-clusterserviceversion-logo">
    <div className="co-clusterserviceversion-logo__icon">{ _.isEmpty(icon)
      ? <img src={appsLogoImg} height="40" width="40" />
      : <img src={`data:${icon.mediatype};base64,${icon.base64data}`} height="40" width="40" /> }
    </div>
    <div className="co-clusterserviceversion-logo__name">
      <h1 className="co-clusterserviceversion-logo__name__clusterserviceversion">{displayName}</h1>
      { provider && <span className="co-clusterserviceversion-logo__name__provider">{`${version || ''} by ${_.get(provider, 'name', provider)}`}</span> }
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
