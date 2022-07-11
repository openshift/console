import * as React from 'react';
import { GraphElement, isEdge } from '@patternfly/react-topology';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { DetailsTab, DetailsTabSection, ResolvedExtension } from '@console/dynamic-plugin-sdk';
import { Tab } from '@console/internal/components/utils';
import { orderExtensionBasedOnInsertBeforeAndAfter } from '@console/shared';
import { getResource } from '@console/topology/src/utils';
import { DefaultResourceSideBar } from '../DefaultResourceSideBar';
import TopologyEdgeResourcesPanel from '../TopologyEdgeResourcesPanel';

type ResolvedTabSection = Omit<DetailsTabSection['properties'], 'tab' | 'provider' | 'section'> & {
  contentElement: React.ReactNode;
};

type ResolvedTabSections = {
  [tabId: string]: ResolvedTabSection[];
};

type TabBarTabHookResolverProps = {
  element: GraphElement;
  children: (tabs: Tab[], loaded: boolean) => React.ReactElement;
  tabSectionExtensions: ResolvedExtension<DetailsTabSection>['properties'][];
  tabExtensions: DetailsTab['properties'][];
};

const blamedDeprecatedPlugins: Record<string, boolean> = {};
const renderNullNoop = () => null;

const TabBarTabHookResolver: React.FC<TabBarTabHookResolverProps> = ({
  element: graphElement,
  children,
  tabSectionExtensions,
  tabExtensions,
}) => {
  const { t } = useTranslation();

  // resolving hooks in loop since number of extensions will remain the same
  // TODO: Render each hook in its own child component...
  const resolvedTabSections = tabSectionExtensions.reduce<ResolvedTabSections>(
    (acc, { provider, section, tab: tabId, ...rest }) => {
      let contentElement: React.ReactNode;

      if (provider) {
        const hookResult = provider(graphElement);
        if (!hookResult) {
          return acc;
        }
        [contentElement] = hookResult;
      } else if (section) {
        if (!blamedDeprecatedPlugins[rest.id]) {
          blamedDeprecatedPlugins[rest.id] = true;
          // eslint-disable-next-line no-console
          console.warn(
            `TabSectionExtension "${rest.id}" should be updated from section to provider (hook)`,
          );
        }
        // Fallback to deprecated section
        contentElement = section(graphElement, renderNullNoop);
      }

      if (!contentElement) {
        return acc;
      }
      return {
        ...acc,
        ...(acc[tabId]
          ? { [tabId]: [...acc[tabId], { ...rest, contentElement }] }
          : { [tabId]: [{ ...rest, contentElement }] }),
      };
    },
    {},
  );

  const [tabs, tabsLoaded] = React.useMemo(() => {
    if (Object.keys(resolvedTabSections).length === 0) return [[], true];

    const resolvedTabs: Tab[] = tabExtensions.reduce((acc, { id: tabId, label }) => {
      if (!resolvedTabSections[tabId]) {
        return acc;
      }

      const orderedResolvedExtensions = orderExtensionBasedOnInsertBeforeAndAfter<{
        id: string;
        contentElement: React.ReactNode;
      }>(resolvedTabSections[tabId]);

      const tabContent = orderedResolvedExtensions.map(({ id: tabSectionId, contentElement }) => (
        <React.Fragment key={tabSectionId}>{contentElement}</React.Fragment>
      ));
      return [...acc, { name: label, component: tabContent }];
    }, []);

    return [resolvedTabs, true];
  }, [tabExtensions, resolvedTabSections]);

  // show default side bar
  if (tabsLoaded && tabs.length === 0) {
    const resource = getResource(graphElement);
    resource &&
      tabs.push({
        name: t('topology~Details'),
        component: () => <DefaultResourceSideBar resource={resource} />,
      });
    isEdge(graphElement) &&
      tabs.push({
        name: t('topology~Resources'),
        component: () => <TopologyEdgeResourcesPanel edge={graphElement} />,
      });
  }

  return children(tabs, tabsLoaded);
};

// TODO: Replace observer for full all childs to individual observer per section content element
export default observer(TabBarTabHookResolver);
