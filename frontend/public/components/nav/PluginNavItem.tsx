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
import { NavItemHref } from './NavItemHref';
import { NavSection } from './NavSection';
import { NavItemResource } from './NavItemResource';

export const PluginNavItem: React.FC<PluginNavItemsProps> = ({ extension }) => {
  if (isNavSection(extension)) {
    return (
      <NavSection
        id={extension.properties.id}
        name={extension.properties.name}
        dataAttributes-={extension.properties.dataAttributes}
      />
    );
  }
  if (isSeparator(extension)) {
    return <NavItemSeparator key={extension.uid} {...extension.properties.dataAttributes} />;
  }
  if (isHrefNavItem(extension)) {
    return (
      <NavItemHref
        href={extension.properties.href}
        namespaced={extension.properties.namespaced}
        prefixNamespaced={extension.properties.prefixNamespaced}
        startsWith={extension.properties.startsWith}
      >
        {extension.properties.name}
      </NavItemHref>
    );
  }
  if (isResourceNSNavItem(extension) || isResourceClusterNavItem(extension)) {
    return (
      <NavItemResource
        namespaced={isResourceNSNavItem(extension)}
        model={extension.properties.model}
        startsWith={extension.properties.startsWith}
      >
        {extension.properties.name}
      </NavItemResource>
    );
  }
  return null;
};

export type PluginNavItemsProps = {
  extension: LoadedExtension<NavExtension>;
};
