import * as React from 'react';
import { NavExpandable, NavGroup, NavItemSeparator } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  NavExtension,
  isHrefNavItem,
  isResourceNavItem,
  isSeparator,
  K8sModel,
  ResourceNavItem,
  isResourceNSNavItem,
} from '@console/dynamic-plugin-sdk';
import { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { referenceForExtensionModel } from '@console/internal/module/k8s';
import { useK8sModels } from '@console/shared/src/hooks/useK8sModels';
import { useLocation } from '@console/shared/src/hooks/useLocation';
import { NavItemHref } from './NavItemHref';
import { NavItemResource } from './NavItemResource';
import { useNavExtensionsForSection } from './useNavExtensionsForSection';
import { navItemHrefIsActive, navItemResourceIsActive } from './utils';

export const NavSection: React.FC<NavSectionProps> = ({ id, name, dataAttributes }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [k8sModels] = useK8sModels();
  const navExtensions = useNavExtensionsForSection(id);
  const [isOpen, setIsOpen] = React.useState(false);

  const getK8sModelForExtension = React.useCallback(
    (e: LoadedExtension<ResourceNavItem>): K8sModel => {
      const { model } = e.properties;
      const gvk = referenceForExtensionModel(model);
      return k8sModels?.[gvk] ?? k8sModels[e?.properties?.model?.kind ?? ''];
    },
    [k8sModels],
  );

  const navExtensionIsActive = React.useCallback(
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
  const isActive = React.useMemo(() => navExtensions.some(navExtensionIsActive), [
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
      return <NavItemSeparator key={extension.uid} {...extension.properties.dataAttributes} />;
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
