import * as React from 'react';
import * as _ from 'lodash-es';

import { K8sResourceKind, GroupVersionKind, OwnerReference, Selector, referenceForGroupVersionKind } from '../../module/k8s';
import { Descriptor } from './descriptors/types';
import { InstallModeType } from './operator-group';

import * as operatorLogo from '../../imgs/operator.svg';

export { ClusterServiceVersionsDetailsPage, ClusterServiceVersionsPage } from './clusterserviceversion';
export { CatalogSourceDetailsPage, CreateSubscriptionYAML } from './catalog-source';
export { SubscriptionsPage } from './subscription';

export const copiedLabelKey = 'olm.copiedFrom';

export enum AppCatalog {
  rhOperators = 'rh-operators',
}

export enum ClusterServiceVersionPhase {
  CSVPhaseNone = '',
  CSVPhasePending = 'Pending',
  CSVPhaseInstallReady = 'InstallReady',
  CSVPhaseInstalling = 'Installing',
  CSVPhaseSucceeded = 'Succeeded',
  CSVPhaseFailed = 'Failed',
  CSVPhaseUnknown = 'Unknown',
  CSVPhaseReplacing = 'Replacing',
  CSVPhaseDeleting = 'Deleting',
}

export enum CSVConditionReason {
  CSVReasonRequirementsUnknown = 'RequirementsUnknown',
  CSVReasonRequirementsNotMet = 'RequirementsNotMet',
  CSVReasonRequirementsMet = 'AllRequirementsMet',
  CSVReasonOwnerConflict = 'OwnerConflict',
  CSVReasonComponentFailed = 'InstallComponentFailed',
  CSVReasonInvalidStrategy = 'InvalidInstallStrategy',
  CSVReasonWaiting = 'InstallWaiting',
  CSVReasonInstallSuccessful = 'InstallSucceeded',
  CSVReasonInstallCheckFailed = 'InstallCheckFailed',
  CSVReasonComponentUnhealthy = 'ComponentUnhealthy',
  CSVReasonBeingReplaced = 'BeingReplaced',
  CSVReasonReplaced = 'Replaced',
  CSVReasonCopied = 'Copied',
}

export enum InstallPlanApproval {
  Automatic = 'Automatic',
  Manual = 'Manual',
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

export type APIServiceDefinition = {
  name: string;
  group: string;
  version: string;
  kind: string;
  deploymentName: string;
  containerPort: number;
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

export type RequirementStatus = {
  group: string;
  version: string;
  kind: string;
  name: string;
  status: string;
  uuid?: string;
};

export type ClusterServiceVersionKind = {
  apiVersion: 'operators.coreos.com/v1alpha1';
  kind: 'ClusterServiceVersion';
  spec: {
    install: {
      strategy: 'Deployment';
      spec: {
        permissions: {
          serviceAccountName: string;
          rules: {apiGroups: string[], resources: string[], verbs: string[]}[];
        }[];
        deployments: {name: string, spec: any}[];
      };
    };
    customresourcedefinitions?: {owned?: CRDDescription[], required?: CRDDescription[]};
    apiservicedefinitions?: {owned?: APIServiceDefinition[], required?: APIServiceDefinition[]};
    replaces?: string;
    installModes: {type: InstallModeType, supported: boolean}[];
    displayName?: string;
    description?: string;
    provider?: {name: string};
    version?: string;
    icon?: {base64data: string, mediatype: string}[];
  };
  status?: {
    phase: ClusterServiceVersionPhase;
    reason: CSVConditionReason;
    requirementStatus?: RequirementStatus[];
  };
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

export enum InstallPlanPhase {
  InstallPlanPhaseNone = '',
  InstallPlanPhasePlanning = 'Planning',
  InstallPlanPhaseRequiresApproval = 'RequiresApproval',
  InstallPlanPhaseInstalling = 'Installing',
  InstallPlanPhaseComplete = 'Complete',
  InstallPlanPhaseFailed = 'Failed',
}

export type InstallPlanKind = {
  spec: {
    clusterServiceVersionNames: string[];
    approval: InstallPlanApproval;
    approved?: boolean;
  };
  status?: {
    phase: InstallPlanPhase;
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
    sourceNamespace?: string;
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
        displayName: string;
        icon: {mediatype: string, base64data: string}[];
        version: string;
        provider: {
          name: string;
        };
        installModes: {type: InstallModeType, supported: boolean}[];
        customresourcedefinitions?: {owned?: CRDDescription[], required?: CRDDescription[]};
        apiservicedefinitions?: {owned?: APIServiceDefinition[], required?: APIServiceDefinition[]};
      }
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

// TODO(alecmerdler): Shouldn't be needed anymore
export const olmNamespace = 'operator-lifecycle-manager';
export const visibilityLabel = 'olm-visibility';

type ProvidedAPIsFor = (csv: ClusterServiceVersionKind) => (CRDDescription | APIServiceDefinition)[];
export const providedAPIsFor: ProvidedAPIsFor = csv => _.get(csv, 'spec.customresourcedefinitions.owned', [])
  .concat(_.get(csv, 'spec.apiservicedefinitions.owned', []));

export const referenceForProvidedAPI = (desc: CRDDescription | APIServiceDefinition): GroupVersionKind => _.get(desc, 'group')
  ? referenceForGroupVersionKind((desc as APIServiceDefinition).group)(desc.version)(desc.kind)
  : referenceForGroupVersionKind((desc as CRDDescription).name.slice(desc.name.indexOf('.') + 1))(desc.version)(desc.kind);
export const referenceForStepResource = (resource: StepResource): GroupVersionKind => referenceForGroupVersionKind(resource.group || 'core')(resource.version)(resource.kind);

export const defaultChannelFor = (pkg: PackageManifestKind) => pkg.status.defaultChannel || pkg.status.channels[0].name;
export const installModesFor = (pkg: PackageManifestKind) => (channel: string) => pkg.status.channels.find(ch => ch.name === channel).currentCSVDesc.installModes;
export const supportedInstallModesFor = (pkg: PackageManifestKind) => (channel: string) => installModesFor(pkg)(channel).filter(({supported}) => supported);
export const providedAPIsForChannel = (pkg: PackageManifestKind) => (channel: string) => _.compact(_.flatten([
  pkg.status.channels.find(ch => ch.name === channel).currentCSVDesc.customresourcedefinitions.owned,
  pkg.status.channels.find(ch => ch.name === channel).currentCSVDesc.apiservicedefinitions.owned,
]));

export const ClusterServiceVersionLogo: React.SFC<ClusterServiceVersionLogoProps> = (props) => {
  const {icon, displayName, provider, version} = props;
  const imgSrc = _.isEmpty(icon) ? operatorLogo : `data:${icon.mediatype};base64,${icon.base64data}`;

  return <div className="co-clusterserviceversion-logo">
    <div className="co-clusterserviceversion-logo__icon">
      <img className="co-catalog-item-icon__img co-catalog-item-icon__img--large" src={imgSrc} />
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
