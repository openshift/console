import * as React from 'react';
import * as classNames from 'classnames';

import { ALMStatusDescriptors, ALMSpecDescriptors } from './index';
import { Donut } from '../graphs';
import { ResourceLink } from '../utils';

export const PodStatusChart: React.StatelessComponent<PodStatusChartProps> = (props) => {
  const {statusDescriptor, fetcher} = props;
  const donutFetcher = () => {
    const fetched = fetcher();
    const values = Object.keys(fetched).map((key) => fetched[key].length);
    const labels = Object.keys(fetched);
    return Promise.resolve([values, labels]);
  };

  return <Donut fetch={donutFetcher} kind={statusDescriptor.path} title={statusDescriptor.displayName} />;
};

export const isFilledStatusValue = (value: string) => value !== undefined && value !== null && value !== '';

export const Phase: React.StatelessComponent<PhaseProps> = ({status}) => <span>
  <i className={classNames('fa', {'fa-ban phase-failed-icon': status === 'Failed'})} /> {status}
</span>;

export const ClusterServiceVersionResourceStatus: React.StatelessComponent<ClusterServiceVersionResourceStatusProps> = (props) => {
  const {statusDescriptor, statusValue, namespace} = props;
  const descriptors = statusDescriptor['x-descriptors'] || [];
  if (!isFilledStatusValue(statusValue)) {
    return <dl>
      <dt>{statusDescriptor.displayName}</dt>
      <dd>None</dd>
    </dl>;
  }

  const valueElm = descriptors.reduce((result, statusCapability) => {
    switch (statusCapability) {
      case ALMStatusDescriptors.conditions:
        return <span>
          {statusValue.reduce((latest, next) => new Date(latest.lastUpdateTime) < new Date(next.lastUpdateTime) ? latest : next).phase}
        </span>;
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
        if (statusCapability.startsWith(ALMStatusDescriptors.k8sResourcePrefix)) {
          let kind = statusCapability.substr(ALMStatusDescriptors.k8sResourcePrefix.length);
          return <ResourceLink kind={kind} name={statusValue} namespace={namespace} title={statusValue}/>;
        }

        return result;
    }
  }, <span>{statusValue || 'None'}</span>);

  return <dl>
    <dt>{statusDescriptor.displayName}</dt>
    <dd>{valueElm}</dd>
  </dl>;
};

/* eslint-disable no-undef */
export type ClusterServiceVersionResourceStatusDescriptor = {
  path: string;
  displayName: string;
  description: string;
  'x-descriptors': string[];
  value?: any;
};

export type PodStatusChartProps = {
  statusDescriptor: ClusterServiceVersionResourceStatusDescriptor;
  fetcher: () => any;
};

export type ClusterServiceVersionResourceStatusProps = {
  statusDescriptor: ClusterServiceVersionResourceStatusDescriptor;
  statusValue: any;
  namespace?: string;
};

export type PhaseProps = {
  status: string;
};
/* eslint-enable no-undef */

ClusterServiceVersionResourceStatus.displayName = 'ClusterServiceVersionResourceStatus';
Phase.displayName = 'Phase';
