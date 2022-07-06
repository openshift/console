import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { NavExpandable, NavGroup } from '@patternfly/react-core';
import { useLocation } from '@console/shared/src/hooks/useLocation';
import { useNavExtensionsForSection } from './useNavExtensionsForSection';
import { isNavExtensionActive } from './utils';
import { PluginNavItem } from './PluginNavItem';

export const NavSection: React.FC<NavSectionProps> = ({ id, name, dataAttributes }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { t } = useTranslation();
  const location = useLocation();
  const navExtensions = useNavExtensionsForSection(id);
  const isActive = React.useMemo(
    () => navExtensions.some((e) => isNavExtensionActive(e, location)),
    [navExtensions, location],
  );
  const hasChildren = navExtensions?.length > 0;

  // Section is empty
  if (!hasChildren) {
    return null;
  }

  const children = navExtensions.map((extension) => (
    <PluginNavItem key={extension.uid} extension={extension} />
  ));

  if (!name) {
    return (
      <NavGroup
        title=""
        className="no-title"
        aria-label={t('public~Navigation')}
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
