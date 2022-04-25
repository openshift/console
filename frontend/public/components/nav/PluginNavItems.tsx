import * as React from 'react';
import { NavItemSeparator } from '@patternfly/react-core';
import {
  isNavSection,
  isSeparator,
  NavExtension,
  isHrefNavItem,
  isResourceNSNavItem,
  isResourceClusterNavItem,
} from '@console/dynamic-plugin-sdk';
import { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { NavSection } from './NavSection';
import { NavLinkRoot } from './NavLinkRoot';
import { NavLinkHref } from './NavLinkHref';
import { NavLinkResourceNS } from './NavLinkResourceNS';
import { NavLinkResourceCluster } from './NavLinkResourceCluster';

export const PluginNavItems: React.FC<PluginNavItemsProps> = ({ items }) => {
  return (
    <>
      {items.map((item) => {
        if (isNavSection(item)) {
          return (
            <NavSection
              key={item.uid}
              id={item.properties.id}
              name={item.properties.name}
              dataAttributes={item.properties.dataAttributes}
            />
          );
        }
        if (isSeparator(item)) {
          return <NavItemSeparator key={item.uid} {...item.properties.dataAttributes} />;
        }
        if (isHrefNavItem(item)) {
          return <NavLinkRoot key={item.uid} component={NavLinkHref} {...item.properties} />;
        }
        if (isResourceNSNavItem(item)) {
          return <NavLinkRoot key={item.uid} component={NavLinkResourceNS} {...item.properties} />;
        }
        if (isResourceClusterNavItem(item)) {
          return (
            <NavLinkRoot key={item.uid} component={NavLinkResourceCluster} {...item.properties} />
          );
        }
        return null;
      })}
    </>
  );
};

export type PluginNavItemsProps = {
  items: LoadedExtension<NavExtension>[];
};
