import type { FC } from 'react';
import type { NodeKind } from '@console/dynamic-plugin-sdk/src';
import { PodsPage } from '@console/internal/components/pod-list';
import type { PageComponentProps } from '@console/internal/components/utils';
import { NodeSubNavPage, WORKLOADS_PAGE_ID } from './NodeSubNavPage';

const NodePodsPage: FC<PageComponentProps<NodeKind>> = ({ obj }) => (
  <PodsPage
    fieldSelector={`spec.nodeName=${obj.metadata.name}`}
    showNamespaceOverride
    hideFavoriteButton
  />
);

type NodeWorkloadProps = {
  obj: NodeKind;
};

const standardPages = [
  {
    tabId: 'pods',
    // t('console-app~Pods')
    nameKey: 'console-app~Pods',
    component: NodePodsPage,
    priority: 30,
  },
];

export const NodeWorkload: FC<NodeWorkloadProps> = ({ obj }) => (
  <NodeSubNavPage obj={obj} pageId={WORKLOADS_PAGE_ID} standardPages={standardPages} />
);
