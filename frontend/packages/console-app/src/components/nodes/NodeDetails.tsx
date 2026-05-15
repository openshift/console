import type { FC } from 'react';
import { PROMETHEUS_BASE_PATH } from '@console/internal/components/graphs/consts';
import type { NodeKind } from '@console/internal/module/k8s';
import NodeDetailsConditions from './NodeDetailsConditions';
import NodeDetailsGpuMetrics from './NodeDetailsGpuMetrics';
import NodeDetailsImages from './NodeDetailsImages';
import NodeDetailsOverview from './NodeDetailsOverview';

type NodeDetailsProps = {
  obj: NodeKind;
};

const NodeDetails: FC<NodeDetailsProps> = ({ obj: node }) => (
  <>
    <NodeDetailsOverview node={node} />
    {PROMETHEUS_BASE_PATH && <NodeDetailsGpuMetrics node={node} />}
    <NodeDetailsConditions node={node} />
    <NodeDetailsImages node={node} />
  </>
);

export default NodeDetails;
