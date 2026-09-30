import type { ReactElement } from 'react';
import type { ShortcutProps } from '@patternfly/react-component-groups/dist/dynamic/Shortcut';
import ShortcutGrid from '@patternfly/react-component-groups/dist/dynamic/ShortcutGrid';
import type { TFunction } from 'i18next';
import { TopologyViewType } from '../../topology-types';

export type Options = {
  supportedFileTypes: string[];
  isEmptyModel: boolean;
  viewType: TopologyViewType;
  allImportAccess: boolean;
};
export const getTopologyShortcuts = (t: TFunction, options: Options): ReactElement => {
  const { supportedFileTypes, isEmptyModel, viewType, allImportAccess } = options;
  const isGraphView = !isEmptyModel && viewType === TopologyViewType.graph;

  const shortcuts: ShortcutProps[] = [
    ...(isGraphView
      ? [
          { keys: [], drag: true, description: t('topology~Move') },
          ...(allImportAccess
            ? [
                {
                  keys: ['shift'],
                  drag: true,
                  description: t('topology~Edit application grouping'),
                },
                { keys: [], rightClick: true, description: t('topology~Access context menu') },
                {
                  keys: [],
                  hover: true,
                  description: t('topology~Access create connector handle'),
                },
              ]
            : []),
        ]
      : []),
    ...(!isEmptyModel
      ? [{ keys: [], click: true, description: t('topology~View details in side panel') }]
      : []),
    { keys: ['ctrl', 'Spacebar'], description: t('topology~Open quick search modal') },
    ...(supportedFileTypes?.length > 0 && allImportAccess
      ? [
          {
            keys: [],
            dragAndDrop: true,
            description: t('topology~Upload file ({{fileTypes}}) to project', {
              fileTypes: supportedFileTypes.map((ex) => `.${ex}`).toString(),
            }),
          },
        ]
      : []),
  ];

  return <ShortcutGrid shortcuts={shortcuts} />;
};
