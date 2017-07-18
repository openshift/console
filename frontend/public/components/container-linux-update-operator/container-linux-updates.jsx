import React from 'react';

import { ContainerLinuxUpdateDetails } from './container-linux-update-details';
import { LoadingInline, Firehose, containerLinuxUpdateOperator } from '../utils';

export const ContainerLinuxUpdates = (props) => {
  return <Firehose kind="Node" isList={true}>
    <ContainerLinuxUpdatesWithData {...props} />
  </Firehose>;
};

export const ContainerLinuxUpdatesWithData = (props) => {
  if (props.loaded) {
    const nodes = props.data;
    const isOperatorInstalled = containerLinuxUpdateOperator.isOperatorInstalled(nodes[0]);
    if (isOperatorInstalled) {
      const nodeListUpdateStatus = containerLinuxUpdateOperator.getNodeListUpdateStatus(nodes);
      return <ContainerLinuxUpdateDetails
        nodeListUpdateStatus={nodeListUpdateStatus}
        isOperatorInstalled={isOperatorInstalled}
      />;
    }
    return null;
  }
  return <div className="co-cluster-updates__component text-center"><LoadingInline /></div>;
};
