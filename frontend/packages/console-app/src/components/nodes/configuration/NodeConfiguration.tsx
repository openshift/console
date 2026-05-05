import type { FC } from 'react';
import type { NodeKind } from '@console/dynamic-plugin-sdk/src';
import { NodeSubNavPage } from '../NodeSubNavPage';
import NodeMachine from './machine/NodeMachine';
import NodeStorage from './node-storage/NodeStorage';

export const CONFIG_PAGE_ID = 'configuration';
export const CONFIG_STORAGE_PAGE_ID = 'storage';
export const CONFIG_MACHINE_PAGE_ID = 'machine';

type NodeConfigurationProps = {
  obj: NodeKind;
};

const standardPages = [
  {
    tabId: CONFIG_STORAGE_PAGE_ID,
    // t('console-app~Storage')
    nameKey: 'console-app~Storage',
    component: NodeStorage,
    priority: 70,
  },
  {
    tabId: CONFIG_MACHINE_PAGE_ID,
    // t('console-app~Machine')
    nameKey: 'console-app~Machine',
    component: NodeMachine,
    priority: 50,
  },
];

export const NodeConfiguration: FC<NodeConfigurationProps> = ({ obj }) => (
  <NodeSubNavPage obj={obj} pageId={CONFIG_PAGE_ID} standardPages={standardPages} />
);
