import * as React from 'react';
import * as _ from 'lodash-es';

import { ALMStatusDescriptors, ALMSpecDescriptors } from './index';
import { Donut } from '../graphs';
import { ResourceLink } from '../utils';

export const PodStatusChart: React.SFC<PodStatusChartProps> = (props) => {
  const {statusDescriptor, fetcher} = props;
  const donutFetcher = () => {
    const fetched = fetcher();
    const values = Object.keys(fetched).map((key) => fetched[key].length);
    const labels = Object.keys(fetched);
    return Promise.resolve([values, labels]);
  };

  return <Donut fetch={donutFetcher} kind={statusDescriptor.path} title={statusDescriptor.displayName} />;
};

export const Phase: React.SFC<PhaseProps> = ({status}) => <span className={status === 'Failed' ? 'co-error' : ''}>
  { status === 'Failed' && <i className="fa fa-ban" /> } {status}
</span>;

export const ClusterServiceVersionResourceStatus: React.SFC<ClusterServiceVersionResourceStatusProps> = (props) => {
  const {statusDescriptor, statusValue, namespace} = props;
  const descriptors = statusDescriptor['x-descriptors'] || [];
  if (_.isEmpty(statusValue) && !_.isNumber(statusValue)) {
    return <dl>
      <dt>{statusDescriptor.displayName}</dt>
      <dd className="text-muted">None</dd>
    </dl>;
  }

  const valueElm = descriptors.reduce((result, statusCapability) => {
    switch (statusCapability) {
      case ALMStatusDescriptors.conditions:
        return <span>{statusValue.reduce((latest, next) => new Date(latest.lastUpdateTime) < new Date(next.lastUpdateTime) ? latest : next).phase}</span>;
      case ALMStatusDescriptors.tectonicLink:
      case ALMStatusDescriptors.w3Link:
        return <a href={statusValue}>{statusValue.replace(/https?:\/\//, '')}</a>;
      case ALMStatusDescriptors.k8sPhase:
        return <Phase status={statusValue} />;
      case ALMStatusDescriptors.k8sPhaseReason:
        return <pre>{statusValue}</pre>;
      case ALMSpecDescriptors.podCount:
        return <span>{statusValue} pods</span>;
      default:
        return statusCapability.startsWith(ALMStatusDescriptors.k8sResourcePrefix)
          ? <ResourceLink kind={statusCapability.substr(ALMStatusDescriptors.k8sResourcePrefix.length)} name={statusValue} namespace={namespace} title={statusValue} />
          : result;
    }
  }, <span>{_.isEmpty(statusValue) && !_.isNumber(statusValue) ? 'None' : statusValue}</span>);

  return <dl>
    <dt>{statusDescriptor.displayName}</dt>
    <dd>{valueElm}</dd>
  </dl>;
};

/* eslint-disable no-undef */
export type StatusDescriptor = {
  path: string;
  displayName: string;
  description: string;
  'x-descriptors': string[];
  value?: any;
};

export type PodStatusChartProps = {
  statusDescriptor: StatusDescriptor;
  fetcher: () => any;
};

export type ClusterServiceVersionResourceStatusProps = {
  statusDescriptor: StatusDescriptor;
  statusValue: any;
  namespace?: string;
};

export type PhaseProps = {
  status: string;
};
/* eslint-enable no-undef */

ClusterServiceVersionResourceStatus.displayName = 'ClusterServiceVersionResourceStatus';
Phase.displayName = 'Phase';
