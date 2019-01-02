import * as React from 'react';
import * as _ from 'lodash-es';
import {Firehose, HorizontalNav, PageHeading} from './utils';
import {ServiceInstancesPage} from './service-instance';
import {ServiceBindingsPage} from './service-binding';

const pages = [{
  href: '',
  name: 'Service Instances',
  component: ServiceInstancesPage,
}, {
  href: 'servicebindings',
  name: 'Service Bindings',
  component: ServiceBindingsPage,
}];

export const ProvisionedServicesPage: React.SFC<ProvisionedServicesPageProps> = ({match}) => {
  const namespace = _.get(match, 'params.ns');
  const title = 'Provisioned Services';
  const resources = [
    {kind: 'ServiceInstance', namespace, namespaced: true, isList: true, prop: 'obj'},
    {kind: 'ServiceBinding', namespace, namespaced: true, isList: true, prop: 'bindings'},
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
export type ProvisionedServicesPageProps = {
  match: any;
};
