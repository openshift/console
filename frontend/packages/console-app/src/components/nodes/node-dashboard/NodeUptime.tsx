import type { FC } from 'react';
import type { NodeKind } from '@console/internal/module/k8s';
import { getNodeUptime } from '@console/shared/src';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';

type NodeUptimeProps = {
  obj: NodeKind;
};

const NodeUptime: FC<NodeUptimeProps> = ({ obj }) => <Timestamp timestamp={getNodeUptime(obj)} />;

export default NodeUptime;
