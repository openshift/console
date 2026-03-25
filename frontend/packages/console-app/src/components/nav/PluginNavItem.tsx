import type { FC } from 'react';
import { NavItemSeparator } from '@patternfly/react-core';
import type { NavExtension } from '@console/dynamic-plugin-sdk';
import {
  isNavSection,
  isSeparator,
  isHrefNavItem,
  isResourceNSNavItem,
  isResourceNavItem,
  useActivePerspective,
} from '@console/dynamic-plugin-sdk';
import type { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { FavoriteNavItems } from '../favorite/FavoriteNavItems';
import { NavItemHref } from './NavItemHref';
import { NavItemResource } from './NavItemResource';
import { NavSection } from './NavSection';

export const PluginNavItem: FC<PluginNavItemProps> = ({ extension }) => {
  const [activePerspective] = useActivePerspective();
  if (isNavSection(extension)) {
    return (
      <>
        <NavSection
          id={extension.properties.id}
          name={extension.properties.name}
          dataAttributes={extension.properties.dataAttributes}
        />
        {extension.properties.id === 'home' && activePerspective === 'admin' && (
          <FavoriteNavItems />
        )}
      </>
    );
  }
  if (isSeparator(extension)) {
    // changed role due to accessibility violation
    // [role=separator] is not allowed under a role=list
    // https://github.com/patternfly/patternfly-react/issues/11717
    return (
      <NavItemSeparator
        role="presentation"
        key={extension.uid}
        {...extension.properties.dataAttributes}
      />
    );
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
