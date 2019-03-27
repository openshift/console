/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import { match } from 'react-router-dom';

import { SectionHeading, Firehose, MsgBox, LoadingBox, Kebab, navFactory } from '../utils';
import { withFallback } from '../utils/error-boundary';
import { CreateYAML } from '../create-yaml';
import { CatalogSourceKind, SubscriptionKind, PackageManifestKind, visibilityLabel, OperatorGroupKind } from './index';
import { requireOperatorGroup } from './operator-group';
import { PackageManifestList } from './package-manifest';
import { SubscriptionModel, CatalogSourceModel, PackageManifestModel, OperatorGroupModel } from '../../models';
import { referenceForModel, K8sResourceKind, referenceForModelCompatible } from '../../module/k8s';
import { DetailsPage } from '../factory';

export const CatalogSourceDetails: React.SFC<CatalogSourceDetailsProps> = ({obj, packageManifests, subscriptions, operatorGroups}) => {
  const toData = <T extends K8sResourceKind>(data: T[]) => ({loaded: true, data});

  return !_.isEmpty(obj)
    ? <div className="co-catalog-details co-m-pane">
      <div className="co-m-pane__body">
        <div className="col-xs-4">
          <dl className="co-m-pane__details">
            <dt>Name</dt>
            <dd>{obj.spec.displayName}</dd>
          </dl>
        </div>
        <div className="col-xs-4">
          <dl className="co-m-pane__details">
            <dt>Publisher</dt>
            <dd>{obj.spec.publisher}</dd>
          </dl>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Packages" />
        <PackageManifestList loaded={true} data={packageManifests} operatorGroup={toData(operatorGroups)} subscription={toData(subscriptions)} />
      </div>
    </div>
    : <div />;
};

export const CatalogSourceDetailsPage: React.SFC<CatalogSourceDetailsPageProps> = (props) => <DetailsPage
  {...props}
  namespace={props.match.params.ns}
  kind={referenceForModel(CatalogSourceModel)}
  name={props.match.params.name}
  pages={[
    navFactory.details(CatalogSourceDetails),
    navFactory.editYaml(),
  ]}
  menuActions={Kebab.factory.common}
  resources={[{
    kind: referenceForModelCompatible(PackageManifestModel)('packages.apps.redhat.com~v1alpha1~PackageManifest'),
    isList: true,
    namespace: props.match.params.ns,
    selector: {matchLabels: {catalog: props.match.params.name}, matchExpressions: [{key: visibilityLabel, operator: 'DoesNotExist'}]},
    prop: 'packageManifests',
  }, {
    kind: referenceForModel(SubscriptionModel),
    isList: true,
    namespace: props.match.params.ns,
    prop: 'subscriptions',
  }, {
    kind: referenceForModelCompatible(OperatorGroupModel)('operators.coreos.com~v1alpha2~OperatorGroup'),
    isList: true,
    namespace: props.match.params.ns,
    prop: 'operatorGroups',
  }]}
/>;

export const CreateSubscriptionYAML: React.SFC<CreateSubscriptionYAMLProps> = (props) => {
  type CreateProps = {packageManifest: {loaded: boolean, data?: PackageManifestKind}, operatorGroup: {loaded: boolean, data?: OperatorGroupKind[]}};
  const Create = requireOperatorGroup(
    withFallback<CreateProps>((createProps) => {
      if (createProps.packageManifest.loaded && createProps.packageManifest.data) {
        const pkg = createProps.packageManifest.data;
        const channel = pkg.status.defaultChannel
          ? pkg.status.channels.find(({name}) => name === pkg.status.defaultChannel)
          : pkg.status.channels[0];

        const template = `
          apiVersion: ${SubscriptionModel.apiGroup}/${SubscriptionModel.apiVersion}
          kind: ${SubscriptionModel.kind},
          metadata:
            generateName: ${pkg.metadata.name}-
            namespace: default
          spec:
            source: ${new URLSearchParams(props.location.search).get('catalog')}
            sourceNamespace: ${pkg.status.catalogSourceNamespace}
            name: ${pkg.metadata.name}
            startingCSV: ${channel.currentCSV}
            channel: ${channel.name}
        `;
        // TODO(alecmerdler): Show which namespaces will receive this new CSV via `OperatorGroups`
        return <CreateYAML {...props as any} plural={SubscriptionModel.plural} template={template} />;
      }
      return <LoadingBox />;
    }, () => <MsgBox title="Package Not Found" detail="Cannot create a Subscription to a non-existent package." />)
  );

  return <Firehose resources={[{
    kind: referenceForModelCompatible(PackageManifestModel)('packages.apps.redhat.com~v1alpha1~PackageManifest'),
    isList: false,
    name: new URLSearchParams(props.location.search).get('pkg'),
    namespace: new URLSearchParams(props.location.search).get('catalogNamespace'),
    prop: 'packageManifest',
  }, {
    kind: referenceForModelCompatible(OperatorGroupModel)('operators.coreos.com~v1alpha2~OperatorGroup'),
    isList: true,
    namespace: props.match.params.ns,
    prop: 'operatorGroup',
  }]}>
    {/* FIXME(alecmerdler): Hack because `Firehose` injects props without TypeScript knowing about it */}
    <Create {...props as any} />
  </Firehose>;
};

export type CatalogSourceDetailsProps = {
  obj: CatalogSourceKind;
  subscriptions: SubscriptionKind[];
  packageManifests: PackageManifestKind[];
  operatorGroups: OperatorGroupKind[];
};

export type CatalogSourceDetailsPageProps = {
  match: match<{ns?: string, name: string}>;
};

export type CreateSubscriptionYAMLProps = {
  match: match<{ns: string, pkgName: string}>;
  location: Location;
};

CatalogSourceDetails.displayName = 'CatalogSourceDetails';
CatalogSourceDetailsPage.displayName = 'CatalogSourceDetailPage';
CreateSubscriptionYAML.displayName = 'CreateSubscriptionYAML';
