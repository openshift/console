import type { FC } from 'react';
import { useMemo } from 'react';
import { Stack, StackItem } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { PopoverStatus, NodeStatus } from '@console/dynamic-plugin-sdk';
import { humanizeBinaryBytes, humanizeNumber } from '@console/internal/components/utils/units';
import type { NodeKind } from '@console/internal/module/k8s';
import ConsumerPopover from '@console/shared/src/components/dashboard/utilization-card/TopConsumerPopover';
import { ErrorBoundary } from '@console/shared/src/components/error';
import SecondaryStatus from '@console/shared/src/components/status/SecondaryStatus';
import { Status } from '@console/shared/src/components/status/Status';
import { PressureQueries, Condition } from '../../queries';
import { nodeStatus } from '../../status/node';
import type { GetNodeStatusExtensions } from './useNodeStatusExtensions';
import { useNodeStatusExtensions } from './useNodeStatusExtensions';

const conditionDescriptionMap = Object.freeze({
  [Condition.DISK_PRESSURE]: 'available disk capacity is low',
  [Condition.MEM_PRESSURE]: 'available memory is low',
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
  return (node.status?.conditions ?? [])
    .filter(({ status, type }) => status === 'True' && isMonitoredCondition(type as Condition))
    .map(({ type }) => type as Condition);
};

type NodeStatusWithExtensionsProps = {
  node: NodeKind;
  statusExtensions: GetNodeStatusExtensions;
  className?: string;
};

export const NodeStatusWithExtensions: FC<NodeStatusWithExtensionsProps> = ({
  node,
  className,
  statusExtensions,
}) => {
  const { t } = useTranslation();

  const { popoverContent, secondaryStatuses } = useMemo(() => statusExtensions(node), [
    statusExtensions,
    node,
  ]);

  const mainStatus = <Status status={nodeStatus(node)} className={className} />;

  return (
    <>
      {popoverContent.length ? (
        <PopoverStatus title={t('console-app~Node status')} statusBody={mainStatus}>
          <Stack>
            {popoverContent.map(({ content, uid }) => (
              <ErrorBoundary key={uid}>
                <StackItem>{content}</StackItem>
              </ErrorBoundary>
            ))}
          </Stack>
        </PopoverStatus>
      ) : (
        mainStatus
      )}
      <SecondaryStatus status={secondaryStatuses} />
      {getDegradedStates(node)?.map((item) => (
        <div key={item}>
          <ConsumerPopover
            title={_.startCase(item)}
            current={_.startCase(item)}
            consumers={PressureQueries[item](node.metadata.name)}
            humanize={humanizeMap[item]}
            description={t(
              "console-app~This node's {{conditionDescription}}. Performance may be degraded.",
              { conditionDescription: conditionDescriptionMap[item] },
            )}
          />
        </div>
      ))}
    </>
  );
};

type NodeStatusProps = {
  node: NodeKind;
  className?: string;
};

const NodeStatus: FC<NodeStatusProps> = ({ node, className }) => {
  const statusExtensions = useNodeStatusExtensions();

  return (
    <NodeStatusWithExtensions
      node={node}
      className={className}
      statusExtensions={statusExtensions}
    />
  );
};

export default NodeStatus;
