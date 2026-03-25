import type { FC } from 'react';
import { useState, useCallback, useMemo } from 'react';
import { NavExpandable, NavGroup, NavItemSeparator } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { NavExtension, K8sModel, ResourceNavItem } from '@console/dynamic-plugin-sdk';
import {
  isHrefNavItem,
  isResourceNavItem,
  isSeparator,
  isResourceNSNavItem,
} from '@console/dynamic-plugin-sdk';
import type { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { referenceForExtensionModel } from '@console/internal/module/k8s';
import { useK8sModels } from '@console/shared/src/hooks/useK8sModels';
import { useLocation } from '@console/shared/src/hooks/useLocation';
import { NavItemHref } from './NavItemHref';
import { NavItemResource } from './NavItemResource';
import { useNavExtensionsForSection } from './useNavExtensionsForSection';
import { navItemHrefIsActive, navItemResourceIsActive } from './utils';

export const NavSection: FC<NavSectionProps> = ({ id, name, dataAttributes }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [k8sModels] = useK8sModels();
  const navExtensions = useNavExtensionsForSection(id);
  const [isOpen, setIsOpen] = useState(false);

  const getK8sModelForExtension = useCallback(
    (e: LoadedExtension<ResourceNavItem>): K8sModel => {
      const { model } = e.properties;
      const gvk = referenceForExtensionModel(model);
      return k8sModels?.[gvk] ?? k8sModels[e?.properties?.model?.kind ?? ''];
    },
    [k8sModels],
  );

  const navExtensionIsActive = useCallback(
    (e: LoadedExtension<NavExtension>) => {
      if (isHrefNavItem(e)) {
        return navItemHrefIsActive(location, e.properties.href, e.properties.startsWith);
      }
      if (isResourceNavItem(e)) {
        const k8sModel = getK8sModelForExtension(e);
        return navItemResourceIsActive(location, k8sModel, e.properties.startsWith);
      }
      return false;
    },
    [getK8sModelForExtension, location],
  );
  const isActive = useMemo(() => navExtensions.some(navExtensionIsActive), [
    navExtensions,
    navExtensionIsActive,
  ]);
  const hasChildren = navExtensions?.length > 0;

  // Section is empty
  if (!hasChildren) {
    return null;
  }

  const children = navExtensions.map((extension) => {
    if (isSeparator(extension)) {
      // changed role due to accessibility violation
      // [role=separator] is not allowed under a role=list
      // https://github.com/patternfly/patternfly-react/issues/11717
      return (
        <NavItemSeparator
          role="presentation"
          key={extension.uid}
          className="oc-perspective-nav__divider"
          {...extension.properties.dataAttributes}
        />
      );
    }
    if (isHrefNavItem(extension)) {
      return (
        <NavItemHref
          key={extension.uid}
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
          key={extension.uid}
          namespaced={isResourceNSNavItem(extension)}
          model={extension.properties.model}
          startsWith={extension.properties.startsWith}
          dataAttributes={extension.properties.dataAttributes}
        >
          {extension.properties.name}
        </NavItemResource>
      );
    }
    return null;
  });

  if (!name) {
    return (
      <NavGroup
        title=""
        className="no-title"
        aria-label={t('console-app~Navigation')}
        {...dataAttributes}
      >
        {children}
      </NavGroup>
    );
  }

  return (
    <NavExpandable
      title={name}
      isActive={isActive}
      isExpanded={isOpen}
      onExpand={(e, expandedState) => setIsOpen(expandedState)}
      data-test="nav"
      buttonProps={dataAttributes}
    >
      {children}
    </NavExpandable>
  );
};

type NavSectionProps = {
  id: string;
  name: string;
  dataAttributes?: { [key: string]: string };
};
