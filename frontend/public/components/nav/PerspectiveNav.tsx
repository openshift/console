import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as classNames from 'classnames';
import { NavGroup, NavList } from '@patternfly/react-core';
import { modelFor } from '@console/internal/module/k8s';
import PinnedResource from './PinnedResource';
import withDragDropContext from '../utils/drag-drop-context';
import {
  useActivePerspective,
  isNavSection,
  isNavItem,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { usePinnedResources } from '@console/shared';
import { PluginNavItem } from './PluginNavItem';
import { useNavExtensionsForPerspective } from './useNavExtensionForPerspective';
import { getSortedNavExtensions, isTopLevelNavItem } from './utils';

import './PerspectiveNav.scss';

const PerspectiveNav: React.FC<{}> = () => {
  const [activePerspective] = useActivePerspective();
  const allNavExtensions = useNavExtensionsForPerspective(activePerspective);
  const [pinnedResources, setPinnedResources, pinnedResourcesLoaded] = usePinnedResources();
  const [validPinnedResources, setValidPinnedResources] = React.useState<string[]>([]);
  const [isDragged, setIsDragged] = React.useState(false);
  const { t } = useTranslation();

  React.useEffect(() => {
    const validResources = pinnedResources.filter((res) => !!modelFor(res));
    setValidPinnedResources(validResources);
  }, [setValidPinnedResources, pinnedResources]);

  const orderedNavExtensions = React.useMemo(() => {
    const topLevelNavExtensions = allNavExtensions.filter(isTopLevelNavItem);
    return getSortedNavExtensions(topLevelNavExtensions);
  }, [allNavExtensions]);

  const getPinnedItems = (): React.ReactElement[] =>
    validPinnedResources.map((resource, idx) => (
      <PinnedResource
        key={`${resource}_${idx.toString()}`}
        idx={idx}
        resourceRef={resource}
        onChange={setPinnedResources}
        onReorder={setValidPinnedResources}
        onDrag={setIsDragged}
        navResources={validPinnedResources}
        draggable={validPinnedResources.length > 1}
      />
    ));

  const NavGroupWithDnd = withDragDropContext(() => (
    <NavGroup
      title=""
      aria-label={t('public~Pinned resources')}
      className={classNames('no-title', { 'oc-perspective-nav--dragging': isDragged })}
    >
      {getPinnedItems()}
    </NavGroup>
  ));

  // We have to use NavList if there is at least one extension that will render an <li>, but we
  // can't use NavList if there are no extensions that render an <li>
  const hasListItem = orderedNavExtensions.some(
    (item) => (isNavSection(item) && item.properties.name) || isNavItem(item),
  );

  const content = (
    <>
      {orderedNavExtensions.map((extension) => (
        <PluginNavItem key={extension.uid} extension={extension} />
      ))}
      {pinnedResourcesLoaded && validPinnedResources?.length > 0 ? <NavGroupWithDnd /> : null}
    </>
  );

  return hasListItem ? (
    <NavList
      className="oc-perspective-nav"
      title=""
      aria-label={t('public~Main navigation')}
      data-test-id={`${activePerspective}-perspective-nav`}
    >
      {content}
    </NavList>
  ) : (
    <div className="oc-perspective-nav" data-test-id={`${activePerspective}-perspective-nav`}>
      {content}
    </div>
  );
};

export default PerspectiveNav;
