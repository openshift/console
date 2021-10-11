import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { NavGroup, Button } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons';
import { useExtensions } from '@console/plugin-sdk';
import {
  Separator,
  NavItem,
  isNavSection,
  NavSection as PluginNavSection,
  isNavItem,
  useActivePerspective,
} from '@console/dynamic-plugin-sdk';
import { usePinnedResources } from '@console/shared';
import { K8sKind, modelFor, referenceForModel } from '../../module/k8s';
import { getSortedNavItems } from './navSortUtils';
import confirmNavUnpinModal from './confirmNavUnpinModal';
import AdminNav from './admin-nav';
import {
  NavLinkComponent,
  PluginNavItems,
  ResourceClusterLink,
  ResourceNSLink,
  RootNavLink,
} from './items';

import './_perspective-nav.scss';

const PerspectiveNav: React.FC<{}> = () => {
  const { t } = useTranslation();
  const [perspective] = useActivePerspective();
  const allItems = useExtensions<PluginNavSection | NavItem | Separator>(isNavSection, isNavItem);
  const [pinnedResources, setPinnedResources, pinnedResourcesLoaded] = usePinnedResources();
  const orderedNavItems = React.useMemo(() => {
    const topLevelItems = allItems.filter(
      (s) => s.properties.perspective === perspective && !(s as NavItem).properties.section,
    );
    return getSortedNavItems(topLevelItems);
  }, [allItems, perspective]);

  const unPin = (e: React.MouseEvent<HTMLButtonElement>, resource: string) => {
    e.preventDefault();
    e.stopPropagation();
    confirmNavUnpinModal(resource, pinnedResources, setPinnedResources);
  };

  // Until admin perspective is contributed through extensions, render static
  // `AdminNav` and any additional plugin nav items.
  if (perspective === 'admin') {
    return <AdminNav pluginNavItems={orderedNavItems} />;
  }

  const getLabelForResource = (resource: string): string => {
    const model: K8sKind | undefined = modelFor(resource);
    if (model) {
      if (model.labelPluralKey) {
        return t(model.labelPluralKey);
      }
      return model.labelPlural || model.plural;
    }
    return '';
  };

  const getPinnedItems = (): React.ReactElement[] =>
    pinnedResourcesLoaded
      ? pinnedResources
          .map((resource) => {
            const model = modelFor(resource);
            if (!model) {
              return null;
            }
            const { apiVersion, apiGroup, namespaced, crd, plural } = model;
            const label = getLabelForResource(resource);
            const duplicates =
              pinnedResources.filter((res) => getLabelForResource(res) === label).length > 1;
            const props = {
              key: `pinned-${resource}`,
              name: label,
              resource: crd ? referenceForModel(model) : plural,
              tipText: duplicates ? `${label}: ${apiGroup || 'core'}/${apiVersion}` : null,
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

            return (
              <RootNavLink
                key={resource}
                className="oc-nav-pinned-item"
                component={Component}
                {...props}
              >
                {removeButton}
              </RootNavLink>
            );
          })
          .filter((p) => p !== null)
      : [];

  return (
    <div className="oc-perspective-nav">
      <PluginNavItems items={orderedNavItems} />
      {pinnedResourcesLoaded && pinnedResources?.length ? (
        <NavGroup title="">{getPinnedItems()}</NavGroup>
      ) : null}
    </div>
  );
};

export default PerspectiveNav;
