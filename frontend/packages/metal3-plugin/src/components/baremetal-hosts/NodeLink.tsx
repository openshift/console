import * as React from 'react';
import { ResourceLink } from '@console/internal/components/utils';
import { NodeModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import { DASH } from '@console/shared';

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
