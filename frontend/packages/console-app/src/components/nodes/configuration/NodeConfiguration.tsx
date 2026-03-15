import type { FC } from 'react';
import type { NodeKind } from '@console/dynamic-plugin-sdk/src';
import { NodeSubNavPage } from '../NodeSubNavPage';
import NodeStorage from './node-storage/NodeStorage';
import NodeMachine from './NodeMachine';

type NodeConfigurationProps = {
  obj: NodeKind;
};

const standardPages = [
  {
    tabId: 'storage',
    // t('console-app~Storage')
    nameKey: 'console-app~Storage',
    component: NodeStorage,
    priority: 70,
  },
  {
    tabId: 'machine',
    // t('console-app~Machine')
    nameKey: 'console-app~Machine',
    component: NodeMachine,
    priority: 50,
  },
];

export const NodeConfiguration: FC<NodeConfigurationProps> = ({ obj }) => (
  <NodeSubNavPage obj={obj} pageId="configuration" standardPages={standardPages} />
);
