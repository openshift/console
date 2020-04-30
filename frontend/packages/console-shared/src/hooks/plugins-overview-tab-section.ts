import * as React from 'react';
import { AsyncComponent, AsyncComponentProps } from '@console/internal/components/utils';
import { OverviewTabSection, isOverviewTabSection, useExtensions } from '@console/plugin-sdk';
import { OverviewItem } from '../types';

export const getResourceTabSectionComp = (t: OverviewTabSection): React.FC<AsyncComponentProps> => (
  props: AsyncComponentProps,
) => React.createElement(AsyncComponent, { ...props, loader: t.properties.loader });

export const usePluginsOverviewTabSection = (
  item: OverviewItem,
): { Component: React.FC<AsyncComponentProps>; key: string }[] => {
  const tabSections = useExtensions(isOverviewTabSection);
  return tabSections
    .filter((section) => item[section.properties.key])
    .map((section: OverviewTabSection) => ({
      Component: getResourceTabSectionComp(section),
      key: section.properties.key,
    }));
};
