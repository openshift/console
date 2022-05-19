import * as React from 'react';
import { NavExpandable, NavGroup } from '@patternfly/react-core';

import { useActiveNamespace } from '@console/shared/src/hooks/redux-selectors';
import { useLocation } from '@console/shared/src/hooks/useLocation';
import { useNavExtensionsForSection } from './useNavExtensionsForSection';
import { isNavExtensionActive, stripNS } from './utils';
import { PluginNavItems } from './PluginNavItems';

export const NavSection: React.FC<NavSectionProps> = ({ id, name, dataAttributes }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeNamespace] = useActiveNamespace();
  const location = useLocation();
  const navExtensions = useNavExtensionsForSection(id);
  const isActive = React.useMemo(() => {
    const path = stripNS(location);
    return navExtensions.some((e) => isNavExtensionActive(e, path, activeNamespace));
  }, [navExtensions, location, activeNamespace]);
  const hasChildren = navExtensions?.length > 0;

  // Section is empty
  if (!hasChildren) {
    return null;
  }

  if (!name) {
    return (
      <NavGroup title="" className="no-title" {...dataAttributes}>
        <PluginNavItems items={navExtensions} />
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
      <PluginNavItems items={navExtensions} />
    </NavExpandable>
  );
};

type NavSectionProps = {
  id: string;
  name: string;
  dataAttributes?: { [key: string]: string };
};
