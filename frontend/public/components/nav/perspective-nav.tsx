import * as React from 'react';
import { NavGroup } from '@patternfly/react-core';
import { useExtensions } from '@console/plugin-sdk';
import {
  Separator,
  NavItem,
  isNavSection,
  NavSection as PluginNavSection,
  isNavItem,
  useActivePerspective,
} from '@console/dynamic-plugin-sdk';
import { modelFor } from '@console/internal/module/k8s';
import { DragAndDrop } from '@console/shared/src/components/dnd';
import PinnedResource from './PinnedResource';
import { usePinnedResources } from '@console/shared';
import { getSortedNavItems } from './navSortUtils';
import AdminNav from './admin-nav';
import { PluginNavItems } from './items';

import './_perspective-nav.scss';

const PerspectiveNav: React.FC<{}> = () => {
  const [perspective] = useActivePerspective();
  const allItems = useExtensions<PluginNavSection | NavItem | Separator>(isNavSection, isNavItem);
  const [pinnedResources, setPinnedResources, pinnedResourcesLoaded] = usePinnedResources();
  const [validPinnedResources, setValidPinnedResources] = React.useState<string[]>(pinnedResources);
  const orderedNavItems = React.useMemo(() => {
    const topLevelItems = allItems.filter(
      (s) => s.properties.perspective === perspective && !(s as NavItem).properties.section,
    );
    return getSortedNavItems(topLevelItems);
  }, [allItems, perspective]);

  React.useEffect(() => {
    const validResources = pinnedResources.filter((res) => !!modelFor(res));
    setValidPinnedResources(validResources);
  }, [setValidPinnedResources, pinnedResources]);

  // Until admin perspective is contributed through extensions, render static
  // `AdminNav` and any additional plugin nav items.
  if (perspective === 'admin') {
    return <AdminNav pluginNavItems={orderedNavItems} />;
  }

  const getPinnedItems = (): React.ReactElement[] =>
    validPinnedResources.map((resource, idx) => (
      <PinnedResource
        key={idx.toString()}
        idx={idx}
        resourceRef={resource}
        onChange={setPinnedResources}
        onDrag={setValidPinnedResources}
        navResources={validPinnedResources}
        draggable={validPinnedResources.length > 1}
      />
    ));

  return (
    <div className="oc-perspective-nav" data-test-id="dev-perspective-nav">
      <PluginNavItems items={orderedNavItems} />
      {pinnedResourcesLoaded && validPinnedResources?.length > 0 ? (
        <DragAndDrop>
          <NavGroup title="" className="no-title">
            {getPinnedItems()}
          </NavGroup>
        </DragAndDrop>
      ) : null}
    </div>
  );
};

export default PerspectiveNav;
