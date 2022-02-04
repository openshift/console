import * as React from 'react';
import { GraphElement, isEdge } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import {
  DetailsTab,
  DetailsTabSection,
  isDetailsTab,
  isDetailsTabSection,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk';
import { Tab } from '@console/internal/components/utils';
import { useExtensions } from '@console/plugin-sdk';
import { orderExtensionBasedOnInsertBeforeAndAfter } from '@console/shared';
import { getResource } from '@console/topology/src/utils';
import { DefaultResourceSideBar } from '../DefaultResourceSideBar';
import TopologyEdgeResourcesPanel from '../TopologyEdgeResourcesPanel';

const TabSection: React.FC = ({ children }) => <>{children}</>;

type SideBarTabLoaderProps = {
  element: GraphElement;
  children: (tabs: Tab[], loaded: boolean) => React.ReactElement;
};

const SideBarTabLoader: React.FC<SideBarTabLoaderProps> = ({ element, children }) => {
  const { t } = useTranslation();
  const [isSectionRendered, setIsSectionRendered] = React.useState<{ [tab: string]: boolean[] }>(
    {},
  );
  const renderSection = React.useRef<{ [tab: string]: boolean[] }>({});
  const tabExtensions = useExtensions<DetailsTab>(isDetailsTab);
  const [tabSectionExtensions, resolved] = useResolvedExtensions<DetailsTabSection>(
    isDetailsTabSection,
  );
  const orderedTabs = React.useMemo<DetailsTab['properties'][]>(
    () =>
      orderExtensionBasedOnInsertBeforeAndAfter<DetailsTab['properties']>(
        tabExtensions.map(({ properties }) => properties),
      ),
    [tabExtensions],
  );

  const renderNull = React.useCallback((tab: string): [number, () => null] => {
    renderSection.current[tab]
      ? renderSection.current[tab].push(true)
      : (renderSection.current[tab] = [true]);
    const index = renderSection.current[tab].length - 1;
    return [
      index,
      (): null => {
        renderSection.current[tab][index] = false;
        setIsSectionRendered(renderSection.current);
        return null;
      },
    ];
  }, []);
  const tabSections = React.useMemo(() => {
    return resolved
      ? tabSectionExtensions.reduce((tabs, { properties: { tab, section, ...rest } }) => {
          const [index, callback] = renderNull(tab);
          const resolvedSection = section(element, callback);
          if (!resolvedSection) {
            renderSection.current[tab][index] = false;
            return tabs;
          }
          return {
            ...tabs,
            ...(tabs.hasOwnProperty(tab)
              ? { [tab]: [...tabs[tab], { ...rest, resolvedSection }] }
              : { [tab]: [{ ...rest, resolvedSection }] }),
          };
        }, {})
      : {};
  }, [resolved, tabSectionExtensions, element, renderNull]);

  const [tabs, loaded] = React.useMemo(() => {
    if (Object.keys(tabSections).length === 0) return [[], false];

    const resolvedTabs = orderedTabs.reduce((acc, { id, label }) => {
      if (
        !tabSections.hasOwnProperty(id) ||
        (isSectionRendered[id] && !isSectionRendered[id].some((s) => s))
      )
        return acc;
      const tabContent = orderExtensionBasedOnInsertBeforeAndAfter<{
        resolvedSection: React.ReactNode;
        id: string;
      }>(tabSections[id]).map(({ id: tsId, resolvedSection }) => (
        <TabSection key={tsId}>{resolvedSection}</TabSection>
      ));
      return [...acc, { name: label, component: () => <>{tabContent}</> }];
    }, []);

    return [resolvedTabs, true];
  }, [tabSections, isSectionRendered, orderedTabs]);

  // show default side bar
  if (tabs.length === 0) {
    const resource = getResource(element);
    resource &&
      tabs.push({
        name: t('topology~Details'),
        component: () => <DefaultResourceSideBar resource={resource} />,
      });
    isEdge(element) &&
      tabs.push({
        name: t('topology~Resources'),
        component: () => <TopologyEdgeResourcesPanel edge={element} />,
      });
  }

  return children(tabs, loaded);
};

export default SideBarTabLoader;
