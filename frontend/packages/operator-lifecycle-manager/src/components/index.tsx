import * as React from 'react';
import * as _ from 'lodash';
import { Link } from 'react-router-dom';
import {
  K8sResourceKind,
  GroupVersionKind,
  referenceForGroupVersionKind,
  resourceURL,
  referenceFor,
  referenceForModel,
} from '@console/internal/module/k8s';
import { ResourceIcon } from '@console/internal/components/utils/resource-icon';
import { PackageManifestModel, ClusterServiceVersionModel } from '../models';
import {
  ClusterServiceVersionKind,
  CRDDescription,
  APIServiceDefinition,
  PackageManifestKind,
  StepResource,
  ClusterServiceVersionIcon,
} from '../types';
import * as operatorLogo from '../operator.svg';

export const visibilityLabel = 'olm-visibility';

type ProvidedAPIsFor = (
  csv: ClusterServiceVersionKind,
) => (CRDDescription | APIServiceDefinition)[];
export const providedAPIsFor: ProvidedAPIsFor = (csv) =>
  _.get(csv, 'spec.customresourcedefinitions.owned', []).concat(
    _.get(csv, 'spec.apiservicedefinitions.owned', []),
  );

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

export const defaultChannelFor = (pkg: PackageManifestKind) =>
  pkg.status.defaultChannel || pkg?.status?.channels?.[0]?.name;
export const installModesFor = (pkg: PackageManifestKind) => (channel: string) =>
  pkg.status.channels.find((ch) => ch.name === channel)?.currentCSVDesc?.installModes || [];
export const supportedInstallModesFor = (pkg: PackageManifestKind) => (channel: string) =>
  installModesFor(pkg)(channel).filter(({ supported }) => supported);
export const providedAPIsForChannel = (pkg: PackageManifestKind) => (channel: string) =>
  _.compact(
    _.flatten([
      pkg.status.channels.find((ch) => ch.name === channel).currentCSVDesc.customresourcedefinitions
        .owned,
      pkg.status.channels.find((ch) => ch.name === channel).currentCSVDesc.apiservicedefinitions
        .owned,
    ]),
  );

export const iconFor = (pkg: PackageManifestKind) =>
  resourceURL(PackageManifestModel, {
    ns: _.get(pkg.status, 'catalogSourceNamespace'),
    name: pkg.metadata.name,
    path: 'icon',
    queryParams: {
      resourceVersion: [
        pkg.metadata.name,
        _.get(pkg.status, 'channels[0].name'),
        _.get(pkg.status, 'channels[0].currentCSV'),
      ].join('.'),
    },
  });

export const ClusterServiceVersionLogo: React.SFC<ClusterServiceVersionLogoProps> = (props) => {
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

export const OperandLink: React.SFC<OperandLinkProps> = (props) => {
  const { namespace, name } = props.obj.metadata;
  const csvName = () =>
    window.location.pathname
      .split('/')
      .find(
        (part, i, allParts) =>
          allParts[i - 1] === referenceForModel(ClusterServiceVersionModel) ||
          allParts[i - 1] === ClusterServiceVersionModel.plural,
      );

  const reference = referenceFor(props.obj);
  const to = namespace
    ? `/k8s/ns/${namespace}/${ClusterServiceVersionModel.plural}/${csvName()}/${reference}/${name}`
    : `/k8s/cluster/${reference}/${name}`;
  return (
    <span className="co-resource-item">
      <ResourceIcon kind={referenceFor(props.obj)} />
      <Link to={to} className="co-resource-item__resource-name" data-test-operand-link={name}>
        {name}
      </Link>
    </span>
  );
};

export type ClusterServiceVersionLogoProps = {
  displayName: string;
  icon: ClusterServiceVersionIcon | string;
  provider: { name: string } | string;
  version?: string;
};

export type OperandLinkProps = {
  obj: K8sResourceKind;
};

OperandLink.displayName = 'OperandLink';
ClusterServiceVersionLogo.displayName = 'ClusterServiceVersionLogo';
