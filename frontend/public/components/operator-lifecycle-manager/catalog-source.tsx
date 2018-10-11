/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import { match } from 'react-router-dom';

import { SectionHeading, Firehose, MsgBox, LoadingBox, Cog, navFactory } from '../utils';
import { withFallback } from '../utils/error-boundary';
import { CreateYAML } from '../create-yaml';
import { CatalogSourceKind, SubscriptionKind, PackageManifestKind } from './index';
import { PackageManifestList } from './package-manifest';
import { SubscriptionModel, CatalogSourceModel, PackageManifestModel } from '../../models';
import { referenceForModel } from '../../module/k8s';
import { DetailsPage } from '../factory';

export const CatalogSourceDetails: React.SFC<CatalogSourceDetailsProps> = ({obj, packageManifests, subscriptions}) => !_.isEmpty(obj)
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
      <PackageManifestList loaded={true} data={packageManifests} catalogSource={obj} subscription={{loaded: true, data: subscriptions}} />
    </div>
  </div>
  : <div />;

export const CatalogSourceDetailsPage: React.SFC<CatalogSourceDetailsPageProps> = (props) => <DetailsPage
  {...props}
  namespace={props.match.params.ns}
  kind={referenceForModel(CatalogSourceModel)}
  name={props.match.params.name}
  pages={[
    navFactory.details(CatalogSourceDetails),
    navFactory.editYaml(),
  ]}
  menuActions={Cog.factory.common}
  resources={[{
    kind: referenceForModel(PackageManifestModel),
    isList: true,
    namespace: props.match.params.ns,
    selector: {matchLabels: {catalog: props.match.params.name}},
    prop: 'packageManifests'
  }, {
    kind: referenceForModel(SubscriptionModel),
    isList: true,
    namespace: props.match.params.ns,
    prop: 'subscriptions',
  }]}
/>;

export const CreateSubscriptionYAML: React.SFC<CreateSubscriptionYAMLProps> = (props) => {
  type CreateProps = {packageManifest: {loaded: boolean, data: PackageManifestKind}};
  const Create = withFallback<CreateProps>((createProps) => {
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
          name: ${pkg.metadata.name}
          startingCSV: ${channel.currentCSV}
          channel: ${channel.name}
      `;
      return <CreateYAML {...props as any} plural={SubscriptionModel.plural} template={template} />;
    }
    return <LoadingBox />;
  }, () => <MsgBox title="Package Not Found" detail="Cannot create a Subscription to a non-existent package." />);

  return <Firehose resources={[{
    kind: referenceForModel(PackageManifestModel),
    isList: false,
    name: new URLSearchParams(props.location.search).get('pkg'),
    namespace: new URLSearchParams(props.location.search).get('catalogNamespace'),
    prop: 'packageManifest',
  }]}>
    {/* FIXME(alecmerdler): Hack because `Firehose` injects props without TypeScript knowing about it */}
    <Create {...props as any} />
  </Firehose>;
};

export type CatalogSourceDetailsProps = {
  obj: CatalogSourceKind;
  subscriptions: SubscriptionKind[];
  packageManifests: PackageManifestKind[];
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
