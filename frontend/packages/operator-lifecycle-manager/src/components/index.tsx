import * as React from 'react';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import {
  GroupVersionKind,
  referenceForGroupVersionKind,
  resourceURL,
  referenceFor,
  referenceForModel,
  K8sKind,
  K8sResourceKind,
  apiVersionCompare,
} from '@console/internal/module/k8s';
import { PackageManifestModel } from '../models';
import {
  APIServiceDefinition,
  ClusterServiceVersionIcon,
  ClusterServiceVersionKind,
  CRDDescription,
  InstallPlanApproval,
  InstallPlanKind,
  PackageManifestKind,
  ProvidedAPI,
  StepResource,
  SubscriptionKind,
} from '../types';
import * as operatorLogo from '../operator.svg';
import { getInternalObjects } from '../utils';

export const visibilityLabel = 'olm-visibility';

const filteredAPIs = (providedAPIs: ProvidedAPI[], internalObjects: string[]): ProvidedAPI[] => {
  const filteredAndSorted = providedAPIs
    .filter((api) => !internalObjects.includes(api.name))
    .sort((a, b) => apiVersionCompare(a.version, b.version));
  return _.uniqBy(filteredAndSorted, 'name');
};

// Returns provided apis for a given csv, excluding internal objects and duplicate
export const providedAPIsForCSV = (csv: ClusterServiceVersionKind): ProvidedAPI[] => {
  const allProvidedAPIs: ProvidedAPI[] = [
    ...(csv?.spec?.apiservicedefinitions?.owned ?? []),
    ...(csv?.spec?.customresourcedefinitions?.owned ?? []),
  ];
  const internalObjects = getInternalObjects(csv?.metadata?.annotations);
  return filteredAPIs(allProvidedAPIs, internalObjects);
};

export const providedAPIsForChannel = (pkg: PackageManifestKind) => (channel: string) => {
  const { currentCSVDesc } = pkg.status.channels.find((ch) => ch.name === channel);
  const allProvidedAPIs: ProvidedAPI[] = [
    ...(currentCSVDesc?.customresourcedefinitions?.owned ?? []),
    ...(currentCSVDesc?.apiservicedefinitions?.owned ?? []),
  ];
  const internalObjects = getInternalObjects(currentCSVDesc?.annotations);
  return filteredAPIs(allProvidedAPIs, internalObjects);
};

export const referenceForProvidedAPI = (
  desc: CRDDescription | APIServiceDefinition,
): GroupVersionKind =>
  _.get(desc, 'group')
    ? referenceForGroupVersionKind((desc as APIServiceDefinition).group)(desc.version)(desc.kind)
    : referenceForGroupVersionKind((desc as CRDDescription).name.slice(desc.name.indexOf('.') + 1))(
        desc.version,
      )(desc.kind);
export const referenceForStepResource = (resource: StepResource): GroupVersionKind =>
  referenceForGroupVersionKind(resource.group || 'core')(resource.version)(resource.kind);

export const defaultChannelFor = (packageManifest: PackageManifestKind) => {
  const channel = !_.isEmpty(packageManifest.status.defaultChannel)
    ? packageManifest.status.channels.find(
        (ch) => ch.name === packageManifest.status.defaultChannel,
      )
    : packageManifest.status.channels[0];
  return channel;
};
export const defaultChannelNameFor = (pkg: PackageManifestKind) =>
  pkg.status.defaultChannel || pkg?.status?.channels?.[0]?.name;
export const installModesFor = (pkg: PackageManifestKind) => (channel: string) =>
  pkg.status.channels.find((ch) => ch.name === channel)?.currentCSVDesc?.installModes || [];
export const supportedInstallModesFor = (pkg: PackageManifestKind) => (channel: string) =>
  installModesFor(pkg)(channel).filter(({ supported }) => supported);

export const iconFor = (pkg: PackageManifestKind) => {
  const defaultChannel = pkg?.status?.defaultChannel
    ? pkg.status.channels?.find((ch) => ch.name === pkg.status.defaultChannel)
    : pkg?.status?.channels?.[0];
  if (!defaultChannel) {
    return null;
  }

  return resourceURL(PackageManifestModel, {
    ns: pkg?.status?.catalogSourceNamespace,
    name: pkg.metadata.name,
    path: 'icon',
    queryParams: {
      resourceVersion: [pkg.metadata.name, defaultChannel.name, defaultChannel.currentCSV].join(
        '.',
      ),
    },
  });
};

export const ClusterServiceVersionLogo: React.FC<ClusterServiceVersionLogoProps> = (props) => {
  const { icon, displayName, provider, version } = props;
  const imgSrc: string = _.isString(icon)
    ? icon
    : _.isEmpty(icon)
    ? operatorLogo
    : `data:${icon.mediatype};base64,${icon.base64data}`;

  return (
    <div className="co-clusterserviceversion-logo">
      <div className="co-clusterserviceversion-logo__icon">
        <img
          className="co-catalog-item-icon__img co-catalog-item-icon__img--large"
          src={imgSrc}
          alt={displayName}
          aria-hidden
        />
      </div>
      <div className="co-clusterserviceversion-logo__name">
        <h1 className="co-clusterserviceversion-logo__name__clusterserviceversion">
          {displayName}
        </h1>
        {provider && (
          <span className="co-clusterserviceversion-logo__name__provider text-muted">{`${version ||
            ''} provided by ${_.get(provider, 'name', provider)}`}</span>
        )}
      </div>
    </div>
  );
};

export const providedAPIForReference = (csv, reference) => {
  const providedAPIs = providedAPIsForCSV(csv) ?? [];
  return providedAPIs.find((api) => referenceForProvidedAPI(api) === reference);
};

export const providedAPIForModel = (csv: ClusterServiceVersionKind, model: K8sKind): ProvidedAPI =>
  providedAPIForReference(csv, referenceForModel(model));

export const parseALMExamples = (
  csv: ClusterServiceVersionKind,
  useInitializationResource: boolean,
) => {
  try {
    if (useInitializationResource) {
      const resource = JSON.parse(
        csv?.metadata?.annotations?.['operatorframework.io/initialization-resource'],
      );
      return [resource];
    }
    return JSON.parse(csv?.metadata?.annotations?.['alm-examples'] ?? '[]');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Unable to parse ALM expamples\n', e);
    return [];
  }
};

export const exampleForModel = (csv: ClusterServiceVersionKind, model: K8sKind) =>
  _.defaultsDeep(
    {},
    {
      kind: model.kind,
      apiVersion: `${model.apiGroup}/${model.apiVersion}`,
    },
    _.find(
      parseALMExamples(
        csv,
        new URLSearchParams(window.location.search).has('useInitializationResource'),
      ),
      (s: K8sResourceKind) => referenceFor(s) === referenceForModel(model),
    ),
  );

export const getManualSubscriptionsInNamespace = (
  subscriptions: SubscriptionKind[],
  namespace: string,
) => {
  return subscriptions?.filter(
    (subscription) =>
      subscription.metadata.namespace === namespace &&
      subscription.spec.installPlanApproval === InstallPlanApproval.Manual,
  );
};

export const OperatorsWithManualApproval: React.FC<OperatorsWithManualApprovalProps> = ({
  subscriptions,
}) => {
  const { t } = useTranslation();
  const subs = subscriptions
    ?.map((subscription) => (
      <strong key={subscription.metadata.uid}>{subscription.metadata.name}</strong>
    ))
    .map((sub, i) => (i > 0 ? [', ', sub] : sub));
  return (
    <>
      {t('olm~operator', { count: subscriptions?.length })} {subs}
    </>
  );
};

export const NamespaceIncludesManualApproval: React.FC<NamespaceIncludesManualApprovalProps> = ({
  subscriptions,
  namespace,
}) => (
  <Trans ns="olm">
    Installation namespace <strong>{{ namespace }}</strong> contains{' '}
    <OperatorsWithManualApproval subscriptions={subscriptions} /> installed with manual approval,
    and all operators installed in the same namespace will function as manual approval strategy. To
    allow automatic approval, all operators installed in the namespace must use automatic approval
    strategy.
  </Trans>
);

const InstallPlanCSVNames: React.FC<InstallPlanReviewProps> = ({ installPlan }) =>
  installPlan?.spec.clusterServiceVersionNames
    .sort()
    .map((CSVName, i) => <strong key={`${CSVName}-${i}`}>{CSVName}</strong>)
    .map((CSVName, i) => (i > 0 ? <span key={`${CSVName}-${i}`}>, {CSVName}</span> : CSVName));

export const InstallPlanReview: React.FC<InstallPlanReviewProps> = ({ installPlan }) => (
  <p>
    <Trans ns="olm">
      Review the manual install plan for operators <InstallPlanCSVNames installPlan={installPlan} />
      . Once approved, the following resources will be created in order to satisfy the requirements
      for the components specified in the plan. Click the resource name to view the resource in
      detail.
    </Trans>
  </p>
);

export type ClusterServiceVersionLogoProps = {
  displayName: string;
  icon: ClusterServiceVersionIcon | string;
  provider: { name: string } | string;
  version?: string;
};

export type OperatorsWithManualApprovalProps = {
  subscriptions: SubscriptionKind[];
};

export type NamespaceIncludesManualApprovalProps = {
  namespace: string;
  subscriptions: SubscriptionKind[];
};

export type InstallPlanReviewProps = {
  installPlan: ClusterServiceVersionKind | InstallPlanKind;
};

ClusterServiceVersionLogo.displayName = 'ClusterServiceVersionLogo';
OperatorsWithManualApproval.displayName = 'OperatorsWithManualApproval';
NamespaceIncludesManualApproval.displayName = 'NamespaceIncludesManualApproval';
InstallPlanReview.displayName = 'InstallPlanReview';
