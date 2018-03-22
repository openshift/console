import * as _ from 'lodash-es';
import * as React from 'react';

import { ContainerLinuxUpdateDetails } from './container-linux-update-details';
import { LoadingInline, Firehose, containerLinuxUpdateOperator, StatusBox } from '../utils';

const firehoseResources = [
  {
    kind: 'Node',
    isList: true,
    prop: 'nodes'
  },
  {
    kind: 'ConfigMap',
    namespace: 'tectonic-system',
    name: 'tectonic-config',
    prop: 'configMap'

  },
];

export const ContainerLinuxUpdates = () =>
  <Firehose resources={firehoseResources}>
    <ContainerLinuxUpdatesWithData />
  </Firehose>;


export const ContainerLinuxUpdatesWithData = (props) => {
  if (props.loadError) {
    return <div className="co-cluster-updates__component">
      <div className="co-cluster-updates__heading--name-wrapper">
        <span className="co-cluster-updates__heading--name">Container Linux</span>
      </div>
      <StatusBox loadError={props.loadError} />
    </div>;
  }
  if (!_.isEmpty(props.nodes.data)) {
    const nodes = props.nodes.data;
    const isOperatorInstalled = containerLinuxUpdateOperator.isOperatorInstalled(nodes[0]);
    const isSandbox = _.includes(_.get(props.configMap.data, 'data.installerPlatform', ''), 'sandbox');
    if (isOperatorInstalled || isSandbox) {
      const nodeListUpdateStatus = containerLinuxUpdateOperator.getNodeListUpdateStatus(nodes);
      return <ContainerLinuxUpdateDetails
        nodeListUpdateStatus={nodeListUpdateStatus}
        isOperatorInstalled={isOperatorInstalled}
        isSandbox={isSandbox}
      />;
    }
    return null;
  }
  return <div className="co-cluster-updates__component text-center"><LoadingInline /></div>;
};
