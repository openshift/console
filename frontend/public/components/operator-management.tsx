import * as React from 'react';
import * as _ from 'lodash-es';
import {Firehose, HorizontalNav, PageHeading} from './utils';
import { referenceForModel } from '../module/k8s';
import {SubscriptionsPage} from './operator-lifecycle-manager/subscription';
import {PackageManifestsPage} from './operator-lifecycle-manager/package-manifest';
import {InstallPlansPage} from './operator-lifecycle-manager/install-plan';
import {
  PackageManifestModel,
  InstallPlanModel,
  SubscriptionModel,
} from '../models';

const pages = [{
  href: '',
  name: 'Enabled Operators',
  component: PackageManifestsPage,
}, {
  href: 'subscriptions',
  name: 'Subscriptions',
  component: SubscriptionsPage,
}, {
  href: 'installplans',
  name: 'Install Plans',
  component: InstallPlansPage,
}];

export const OperatorManagementPage: React.SFC<OperatorManagementPageProps> = ({match}) => {
  const namespace = _.get(match, 'params.ns');
  const title = 'Operator Management';
  const resources = [
    {kind: referenceForModel(PackageManifestModel), namespace, isList: true, prop: 'obj'},
    {kind: referenceForModel(SubscriptionModel), namespace, isList: true, prop: 'subscriptions'},
    {kind: referenceForModel(InstallPlanModel), namespace, isList: true, prop: 'installplans'},
  ];
  const resourceKeys = _.map(resources, 'prop');

  return <React.Fragment>
    <PageHeading
      detail={true}
      title={title}
    />
    <Firehose forceUpdate resources={resources}>
      <HorizontalNav pages={pages} match={match} resourceKeys={resourceKeys} hideDivider noStatusBox={true} />
    </Firehose>
  </React.Fragment>;
};

/* eslint-disable no-undef */
export type OperatorManagementPageProps = {
  match: any;
};
