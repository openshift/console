import type { FC } from 'react';
import type { NodeKind } from '@console/dynamic-plugin-sdk/src';
import NodeLogs from '../NodeLogs';
import { HEALTH_PAGE_ID, NodeSubNavPage } from '../NodeSubNavPage';
import NodePerformance from './NodePerformance';

type NodeHealthProps = {
  obj: NodeKind;
};

const standardPages = [
  {
    tabId: 'performance',
    // t('console-app~Performance')
    nameKey: 'console-app~Performance',
    component: NodePerformance,
    priority: 70,
  },
  {
    tabId: 'logs',
    // t('console-app~Logs')
    nameKey: 'console-app~Logs',
    component: NodeLogs,
    priority: 30,
  },
];

export const NodeHealth: FC<NodeHealthProps> = ({ obj }) => (
  <NodeSubNavPage obj={obj} pageId={HEALTH_PAGE_ID} standardPages={standardPages} />
);
