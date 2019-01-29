import * as React from 'react';
import {HorizontalNav, PageHeading} from './utils';
import {SubscriptionsPage} from './operator-lifecycle-manager/subscription';
import {PackageManifestsPage} from './operator-lifecycle-manager/package-manifest';
import {InstallPlansPage} from './operator-lifecycle-manager/install-plan';

const pages = [{
  href: '',
  name: 'Operator Catalogs',
  component: PackageManifestsPage,
}, {
  href: 'subscriptions',
  name: 'Operator Subscriptions',
  component: SubscriptionsPage,
}, {
  href: 'installplans',
  name: 'Install Plans',
  component: InstallPlansPage,
}];

export const OperatorManagementPage: React.SFC<OperatorManagementPageProps> = ({match}) =>
  <React.Fragment>
    <PageHeading detail={true} title="Operator Management" />
    <HorizontalNav pages={pages} match={match} hideDivider noStatusBox={true} />
  </React.Fragment>;

/* eslint-disable no-undef */
export type OperatorManagementPageProps = {
  match: any;
};
