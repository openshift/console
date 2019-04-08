import React from 'react';
import { ClusterOverview } from '../cluster/cluster-overview';
import { HorizontalNav, PageHeading } from '../utils/okdutils';
import { StorageOverview } from '../../../storage/components/storage-overview/storage-overview';

const pages = [
  {
    href: '',
    name: 'Overview',
    component: ClusterOverview,
  },
  {
    href: 'storage',
    name: 'Storage',
    component: StorageOverview,
  },
];

export const Dashboards = props => (
  <React.Fragment>
    <PageHeading title="Dashboards" detail={true} />
    <HorizontalNav match={props.match} pages={pages} noStatusBox />
  </React.Fragment>
);
