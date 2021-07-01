import * as React from 'react';
import { DASH } from '@console/dynamic-plugin-sdk';
import { ResourceLink } from '@console/internal/components/utils';
import { NodeModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';

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
