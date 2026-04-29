import type { FC } from 'react';
import type { NodeKind } from '@console/dynamic-plugin-sdk/src';
import { CONFIG_PAGE_ID, NodeSubNavPage } from '../NodeSubNavPage';
import Machine from './machine/Machine';
import NodeStorage from './node-storage/NodeStorage';
import OperatingSystem from './OperatingSystem';

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
    tabId: 'operating-system',
    // t('console-app~Operating system')
    nameKey: 'console-app~Operating system',
    component: OperatingSystem,
    priority: 50,
  },
  {
    tabId: 'machine',
    // t('console-app~Machine')
    nameKey: 'console-app~Machine',
    component: Machine,
    priority: 40,
  },
];

export const NodeConfiguration: FC<NodeConfigurationProps> = ({ obj }) => (
  <NodeSubNavPage obj={obj} pageId={CONFIG_PAGE_ID} standardPages={standardPages} />
);
