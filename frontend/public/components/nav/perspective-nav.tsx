import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { NavItemSeparator, NavGroup, Button } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons';
import {
  useExtensions,
  NavSection as PluginNavSection,
  NavItem,
  SeparatorNavItem,
  isNavSection,
  isNavItem,
  isSeparatorNavItem,
  Perspective,
  isPerspective,
  LoadedExtension,
} from '@console/plugin-sdk';
import { RootState } from '../../redux';
import { setPinnedResources } from '../../actions/ui';
import { getActivePerspective, getPinnedResources } from '../../reducers/ui';
import { modelFor, referenceForModel } from '../../module/k8s';
import confirmNavUnpinModal from './confirmNavUnpinModal';
import { NavSection } from './section';
import AdminNav from './admin-nav';
import {
  createLink,
  NavLinkComponent,
  ResourceClusterLink,
  ResourceNSLink,
  RootNavLink,
} from './items';

import './_perspective-nav.scss';

type StateProps = {
  perspective: string;
  pinnedResources: string[];
};

interface DispatchProps {
  onPinnedResourcesChange: (resources: string[]) => void;
}

const getLabelForResource = (resource: string): string => {
  const model = modelFor(resource);
  return model ? model.labelPlural : '';
};

const itemDependsOnItem = (
  s1: LoadedExtension<PluginNavSection | NavItem | SeparatorNavItem>,
  s2: LoadedExtension<PluginNavSection | NavItem | SeparatorNavItem>,
) => {
  if (!s1.properties.insertBefore && !s1.properties.insertAfter) {
    return false;
  }
  const before = Array.isArray(s1.properties.insertBefore)
    ? s1.properties.insertBefore
    : [s1.properties.insertBefore];
  const after = Array.isArray(s1.properties.insertAfter)
    ? s1.properties.insertAfter
    : [s1.properties.insertAfter];
  return before.includes(s2.properties.id) || after.includes(s2.properties.id);
};

const isPositioned = (
  item: LoadedExtension<PluginNavSection | NavItem | SeparatorNavItem>,
  allItems: LoadedExtension<PluginNavSection | NavItem | SeparatorNavItem>[],
) => !!allItems.find((i) => itemDependsOnItem(item, i));

const findIndexForItem = (
  item: LoadedExtension<PluginNavSection | NavItem | SeparatorNavItem>,
  currentItems: LoadedExtension<PluginNavSection | NavItem | SeparatorNavItem>[],
) => {
  const { insertBefore, insertAfter } = item.properties;
  let index = -1;
  const before = Array.isArray(insertBefore) ? insertBefore : [insertBefore];
  const after = Array.isArray(insertAfter) ? insertAfter : [insertAfter];
  let count = 0;
  while (count < before.length && index < 0) {
    index = currentItems.findIndex((i) => i.properties.id === before[count]);
    count++;
  }
  count = 0;
  while (count < after.length && index < 0) {
    index = currentItems.findIndex((i) => i.properties.id === after[count]);
    if (index >= 0) {
      index += 1;
    }
    count++;
  }
  return index;
};

const insertItem = (
  item: LoadedExtension<PluginNavSection | NavItem | SeparatorNavItem>,
  currentItems: LoadedExtension<PluginNavSection | NavItem | SeparatorNavItem>[],
) => {
  const index = findIndexForItem(item, currentItems);
  if (index >= 0) {
    currentItems.splice(index, 0, item);
  } else {
    currentItems.push(item);
  }
};

const insertPositionedItems = (
  insertItems: LoadedExtension<PluginNavSection | NavItem | SeparatorNavItem>[],
  currentItems: LoadedExtension<PluginNavSection | NavItem | SeparatorNavItem>[],
) => {
  if (insertItems.length === 0) {
    return;
  }

  const sortedItems = insertItems.filter((item) => !isPositioned(item, insertItems));
  const positionedItems = insertItems.filter((item) => isPositioned(item, insertItems));

  if (sortedItems.length === 0) {
    // Circular dependencies
    positionedItems.forEach((i) => insertItem(i, currentItems));
    return;
  }

  sortedItems.forEach((i) => insertItem(i, currentItems));
  insertPositionedItems(positionedItems, currentItems);
};

export const getSortedNavItems = (
  topLevelItems: LoadedExtension<PluginNavSection | NavItem | SeparatorNavItem>[],
) => {
  const sortedItems = topLevelItems.filter((item) => !isPositioned(item, topLevelItems));
  const positionedItems = topLevelItems.filter((item) => isPositioned(item, topLevelItems));
  insertPositionedItems(positionedItems, sortedItems);
  return sortedItems;
};

const PerspectiveNav: React.FC<StateProps & DispatchProps> = ({
  perspective,
  pinnedResources,
  onPinnedResourcesChange,
}) => {
  const perspectiveExtensions = useExtensions<Perspective>(isPerspective);
  const allItems = useExtensions<PluginNavSection | NavItem | SeparatorNavItem>(
    isNavSection,
    isNavItem,
  );
  const orderedNavItems = React.useMemo(() => {
    const topLevelItems = allItems.filter(
      (s) => s.properties.perspective === perspective && !(s as NavItem).properties.section,
    );
    return getSortedNavItems(topLevelItems);
  }, [allItems, perspective]);

  const unPin = (e: React.MouseEvent<HTMLButtonElement>, resource: string) => {
    e.preventDefault();
    e.stopPropagation();
    confirmNavUnpinModal(resource, pinnedResources, onPinnedResourcesChange);
  };

  // Until admin perspective is contributed through extensions, simply render static `AdminNav`
  if (perspective === 'admin') {
    return <AdminNav />;
  }

  const activePerspective = perspectiveExtensions.find((p) => p.properties.id === perspective);
  if (!pinnedResources && activePerspective.properties.defaultPins) {
    onPinnedResourcesChange(activePerspective.properties.defaultPins);
  }

  const getPinnedItems = (rootNavLink: boolean = false): React.ReactElement[] =>
    pinnedResources
      .map((resource) => {
        const model = modelFor(resource);
        if (!model) {
          return null;
        }
        const { labelPlural, apiVersion, apiGroup, namespaced, crd, plural } = model;
        const duplicates =
          pinnedResources.filter((res) => getLabelForResource(res) === labelPlural).length > 1;
        const props = {
          key: `pinned-${resource}`,
          name: labelPlural,
          resource: crd ? referenceForModel(model) : plural,
          tipText: duplicates ? `${labelPlural}: ${apiGroup || 'core'}/${apiVersion}` : null,
          id: resource,
        };
        const Component: NavLinkComponent = namespaced ? ResourceNSLink : ResourceClusterLink;
        const removeButton = (
          <Button
            className="oc-nav-pinned-item__unpin-button"
            variant="link"
            aria-label="Unpin"
            onClick={(e) => unPin(e, resource)}
          >
            <MinusCircleIcon className="oc-nav-pinned-item__icon" />
          </Button>
        );

        return rootNavLink ? (
          <RootNavLink
            key={resource}
            className="oc-nav-pinned-item"
            component={Component}
            {...props}
          >
            {removeButton}
          </RootNavLink>
        ) : (
          <Component key={resource} className="oc-nav-pinned-item" {...props}>
            {removeButton}
          </Component>
        );
      })
      .filter((p) => p !== null);

  return (
    <>
      {orderedNavItems.map((item, index) => {
        if (isNavSection(item)) {
          const { id, name } = item.properties;
          return <NavSection id={id} title={name} key={id} isGrouped={!name} />;
        }
        if (isNavItem(item)) {
          return createLink(item, true);
        }
        if (isSeparatorNavItem(item)) {
          return <NavItemSeparator key={`separator-${index}`} />;
        }
      })}
      {pinnedResources?.length ? (
        <NavGroup className="oc-nav-group" title="" key="group-pins">
          {getPinnedItems(true)}
        </NavGroup>
      ) : null}
    </>
  );
};

const mapStateToProps = (state: RootState): StateProps => {
  return {
    perspective: getActivePerspective(state),
    pinnedResources: getPinnedResources(state),
  };
};

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onPinnedResourcesChange: (resources: string[]) => {
    dispatch(setPinnedResources(resources));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(PerspectiveNav);
