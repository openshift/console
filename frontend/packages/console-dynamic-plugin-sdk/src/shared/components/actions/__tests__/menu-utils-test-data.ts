import { Action, ActionGroup } from '@console/dynamic-plugin-sdk';
import { LoadedExtension } from '@console/plugin-sdk';

export const mockActions: Action[] = [
  {
    id: 'mock-action-1',
    label: 'Mock Action 1',
    path: '$top',
    cta: {
      href: '/mock-href-1',
    },
  },
  {
    id: 'mock-action-2',
    label: 'Mock Action 2',
    path: 'common-1',
    cta: {
      href: '/mock-href-2',
    },
  },
  {
    id: 'mock-action-3',
    label: 'Mock Action 3',
    cta: {
      href: '/mock-href-3',
    },
  },
  {
    id: 'mock-action-4',
    label: 'Mock Action 4',
    path: 'common-2',
    cta: {
      href: '/mock-href-4',
    },
  },
  {
    id: 'mock-action-5',
    label: 'Mock Action 5',
    path: 'common-1/child-1',
    cta: {
      href: '/mock-href-5',
    },
  },
  {
    id: 'mock-action-6',
    label: 'Mock Action 6',
    path: '$bottom',
    cta: {
      href: '/mock-href-6',
    },
  },
];

export const mockActionGroups: LoadedExtension<ActionGroup>[] = [
  {
    type: 'console.action/group',
    properties: {
      id: 'common-1',
      label: 'Common Group 1',
      submenu: true,
    },
    flags: {
      required: [],
      disallowed: [],
    },
    pluginID: '@console/helm-plugin',
    pluginName: '@console/helm-plugin',
    uid: '@console/helm-plugin[15]',
  },
  {
    type: 'console.action/group',
    properties: {
      id: 'common-2',
      label: 'Common Group 2',
      insertAfter: 'common-1',
    },
    flags: {
      required: [],
      disallowed: [],
    },
    pluginID: '@console/helm-plugin',
    pluginName: '@console/helm-plugin',
    uid: '@console/helm-plugin[16]',
  },
  {
    type: 'console.action/group',
    properties: {
      id: 'child-1',
      label: 'Child Group 1',
      submenu: true,
    },
    flags: {
      required: [],
      disallowed: [],
    },
    pluginID: '@console/helm-plugin',
    pluginName: '@console/helm-plugin',
    uid: '@console/helm-plugin[17]',
  },
];

export const mockMenuOptions = [
  {
    id: '$top',
    children: [mockActions[0]],
  },
  {
    id: 'common-1',
    label: 'Common Group 1',
    submenu: true,
    children: [
      mockActions[1],
      {
        id: 'child-1',
        label: 'Child Group 1',
        submenu: true,
        children: [mockActions[4]],
      },
    ],
  },
  mockActions[2],
  {
    id: 'common-2',
    label: 'Common Group 2',
    insertAfter: 'common-1',
    children: [mockActions[3]],
  },
  {
    id: '$bottom',
    children: [mockActions[5]],
  },
];
