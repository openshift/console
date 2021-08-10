import * as React from 'react';
import { NavList } from '@patternfly/react-core';
import {
  Separator,
  NavItem,
  isNavSection,
  NavSection as PluginNavSection,
  isNavItem,
  useActivePerspective,
} from '@console/dynamic-plugin-sdk';
import { useExtensions } from '@console/plugin-sdk';
import { PluginNavItems } from './items';
import { getSortedNavItems } from './navSortUtils';

import './PerspectiveNav.scss';

const PerspectiveNav: React.FC<{}> = () => {
  const [perspective] = useActivePerspective();
  const allItems = useExtensions<PluginNavSection | NavItem | Separator>(isNavSection, isNavItem);
  const orderedNavItems = React.useMemo(() => {
    const topLevelItems = allItems.filter(
      (s) => s.properties.perspective === perspective && !(s as NavItem).properties.section,
    );
    return getSortedNavItems(topLevelItems);
  }, [allItems, perspective]);

  return (
    <NavList className="oc-perspective-nav">
      <PluginNavItems items={orderedNavItems} />
    </NavList>
  );
};

export default PerspectiveNav;
