import * as React from 'react';
import { NavItemSeparator } from '@patternfly/react-core';
import {
  isNavSection,
  isSeparator,
  NavExtension,
  isHrefNavItem,
  isResourceNSNavItem,
  isResourceNavItem,
} from '@console/dynamic-plugin-sdk';
import { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { NavItemHref } from './NavItemHref';
import { NavItemResource } from './NavItemResource';
import { NavSection } from './NavSection';

export const PluginNavItem: React.FC<PluginNavItemProps> = ({ extension }) => {
  if (isNavSection(extension)) {
    return (
      <NavSection
        id={extension.properties.id}
        name={extension.properties.name}
        dataAttributes={extension.properties.dataAttributes}
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
        dataAttributes={extension.properties.dataAttributes}
      >
        {extension.properties.name}
      </NavItemHref>
    );
  }
  if (isResourceNavItem(extension)) {
    return (
      <NavItemResource
        namespaced={isResourceNSNavItem(extension)}
        model={extension.properties.model}
        startsWith={extension.properties.startsWith}
        dataAttributes={extension.properties.dataAttributes}
      >
        {extension.properties.name}
      </NavItemResource>
    );
  }
  // eslint-disable-next-line no-console
  console.warn('Invalid or unrecognized navigation extension:', extension);
  return null;
};

export type PluginNavItemProps = {
  extension: LoadedExtension<NavExtension>;
};
