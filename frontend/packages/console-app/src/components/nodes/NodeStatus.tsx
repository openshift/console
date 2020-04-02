import * as React from 'react';
import * as _ from 'lodash';
import ConsumerPopover from '@console/shared/src/components/dashboard/utilization-card/TopConsumerPopover';
import { Status, SecondaryStatus, getNodeSecondaryStatus } from '@console/shared';
import { NodeKind } from '@console/internal/module/k8s';
import { humanizeBinaryBytes, humanizeNumber } from '@console/internal/components/utils';
import { nodeStatus } from '../../status/node';
import { PressureQueries, Condition } from '../../queries';

const conditionDescriptionMap = Object.freeze({
  [Condition.DISK_PRESSURE]: 'available memory is low',
  [Condition.MEM_PRESSURE]: 'available disk capacity is low',
  [Condition.PID_PRESSURE]: 'CPU is running a large number of processes',
});

const humanizeMap = Object.freeze({
  [Condition.DISK_PRESSURE]: humanizeBinaryBytes,
  [Condition.MEM_PRESSURE]: humanizeBinaryBytes,
  [Condition.PID_PRESSURE]: humanizeNumber,
});

const isMonitoredCondition = (condition: Condition): boolean =>
  [Condition.DISK_PRESSURE, Condition.MEM_PRESSURE, Condition.PID_PRESSURE].includes(condition);

const getDegradedStates = (node: NodeKind): Condition[] => {
  return node.status.conditions
    .filter(({ status, type }) => status === 'True' && isMonitoredCondition(type as Condition))
    .map(({ type }) => type as Condition);
};

const NodeStatus: React.FC<NodeStatusProps> = ({ node, showPopovers = false, className }) => {
  const status = showPopovers ? getDegradedStates(node) : [];
  return (
    <>
      <Status status={nodeStatus(node)} className={className} />
      <SecondaryStatus status={getNodeSecondaryStatus(node)} />
      {status.length > 0 &&
        status.map((item) => (
          <div key={item}>
            <ConsumerPopover
              title={_.startCase(item)}
              current={_.startCase(item)}
              consumers={PressureQueries[item](node.metadata.name)}
              humanize={humanizeMap[item]}
              description={`This node's ${conditionDescriptionMap[item]}. Performance may be degraded.`}
            />
          </div>
        ))}
    </>
  );
};

type NodeStatusProps = {
  node: NodeKind;
  showPopovers?: boolean;
  className?: string;
};

export default NodeStatus;
