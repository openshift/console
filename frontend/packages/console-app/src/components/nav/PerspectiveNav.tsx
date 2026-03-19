import type { FC } from 'react';
import { useCallback, useState, useEffect, useMemo } from 'react';
import { NavList } from '@patternfly/react-core';
import type { DragDropSortProps, DraggableObject } from '@patternfly/react-drag-drop';
import { DragDropSort } from '@patternfly/react-drag-drop';
import { useTranslation } from 'react-i18next';
import {
  useActivePerspective,
  isNavSection,
  isNavItem,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { modelFor } from '@console/internal/module/k8s';
import { usePinnedResources } from '@console/shared/src/hooks/usePinnedResources';
import PinnedResource from './PinnedResource';
import { PluginNavItem } from './PluginNavItem';
import { useNavExtensionsForPerspective } from './useNavExtensionForPerspective';
import { getSortedNavExtensions, isTopLevelNavItem } from './utils';

import './PerspectiveNav.scss';

const PerspectiveNav: FC<{}> = () => {
  const [activePerspective] = useActivePerspective();
  const allNavExtensions = useNavExtensionsForPerspective(activePerspective);
  const [pinnedResources, setPinnedResources, pinnedResourcesLoaded] = usePinnedResources();
  const [validPinnedResources, setValidPinnedResources] = useState<string[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    const validResources = pinnedResources.filter((res) => !!modelFor(res));
    setValidPinnedResources(validResources);
  }, [setValidPinnedResources, pinnedResources]);

  const orderedNavExtensions = useMemo(() => {
    const topLevelNavExtensions = allNavExtensions.filter(isTopLevelNavItem);
    return getSortedNavExtensions(topLevelNavExtensions);
  }, [allNavExtensions]);

  const draggableItems = useMemo<DraggableObject[]>(() => {
    return validPinnedResources.map((res, idx) => ({
      id: res,
      props: { className: 'co-pinned-resource-item' },
      content: (
        <PinnedResource
          key={`${res}_${idx.toString()}`}
          idx={idx}
          resourceRef={res}
          onChange={setPinnedResources}
          navResources={validPinnedResources}
        />
      ),
    }));
  }, [validPinnedResources, setPinnedResources]);

  const onDrop = useCallback<DragDropSortProps['onDrop']>(
    (_, newItems) => {
      const newOrder = newItems.map((item) => item.id as string);
      setPinnedResources(newOrder);
    },
    [setPinnedResources],
  );

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
      {pinnedResourcesLoaded && validPinnedResources?.length > 0 ? (
        <section
          className="pf-v6-c-nav__section no-title"
          aria-label={t('console-app~Pinned resources')}
        >
          {draggableItems.length === 1 ? (
            draggableItems[0].content
          ) : (
            <DragDropSort items={draggableItems} onDrop={onDrop} />
          )}
        </section>
      ) : null}
    </>
  );

  return hasListItem ? (
    <NavList
      className="oc-perspective-nav"
      title=""
      aria-label={t('console-app~Main navigation')}
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
