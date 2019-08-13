import * as React from 'react';
import { ResourceLink } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { NodeModel } from '@console/internal/models';
import { DASH } from '@console/shared';

type NodeCellProps = {
  nodeName?: string;
  namespace: string;
};

const NodeCell: React.FC<NodeCellProps> = ({ nodeName, namespace }) => {
  if (nodeName) {
    return (
      <ResourceLink
        kind={referenceForModel(NodeModel)}
        name={nodeName}
        namespace={namespace}
        title={nodeName}
      />
    );
  }
  return <>{DASH}</>;
};

export default NodeCell;
