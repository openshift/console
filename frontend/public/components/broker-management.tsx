import * as React from 'react';
import * as _ from 'lodash-es';
import {Firehose, HorizontalNav, PageHeading} from './utils';
import {ClusterServiceBrokerPage} from './cluster-service-broker';
import {ClusterServiceClassPage} from './cluster-service-class';

const pages = [{
  href: '',
  name: 'Service Brokers',
  component: ClusterServiceBrokerPage,
}, {
  href: 'serviceclasses',
  name: 'Service Classes',
  component: ClusterServiceClassPage,
}];

export const BrokerManagementPage: React.SFC<BrokerManagementPageProps> = ({match}) => {
  const title = 'Broker Management';
  const resources = [
    {kind: 'ClusterServiceBroker', isList: true, prop: 'obj'},
    {kind: 'ClusterServiceClass', isList: true, prop: 'serviceclasses'},
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
export type BrokerManagementPageProps = {
  match: any;
};
