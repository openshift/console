import * as React from 'react';
import { DASH } from '@console/shared';
import { ResourceLink } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { NodeModel } from '@console/internal/models';

type NodeLinkProps = {
  nodeName?: string;
};

const NodeLink: React.FC<NodeLinkProps> = ({ nodeName }) => {
  if (nodeName) {
    return <ResourceLink kind={referenceForModel(NodeModel)} name={nodeName} />;
  }
  return <>{DASH}</>;
};

export default NodeLink;
