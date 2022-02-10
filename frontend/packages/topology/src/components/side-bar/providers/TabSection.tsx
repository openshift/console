import * as React from 'react';
import { GraphElement, isEdge, observer } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { DetailsTab, DetailsTabSection, ResolvedExtension } from '@console/dynamic-plugin-sdk';
import { Tab } from '@console/internal/components/utils';
import { orderExtensionBasedOnInsertBeforeAndAfter } from '@console/shared';
import { getResource } from '@console/topology/src/utils';
import { DefaultResourceSideBar } from '../DefaultResourceSideBar';
import TopologyEdgeResourcesPanel from '../TopologyEdgeResourcesPanel';

type TabSection = Omit<
  DetailsTabSection['properties'] & { resolvedSection: React.ReactNode },
  'section' | 'tab'
>;

type TabSectionProps = {
  element: GraphElement;
  children: (tabs: Tab[], loaded: boolean) => React.ReactElement;
  tabSectionExtensions: ResolvedExtension<DetailsTabSection>['properties'][];
  tabExtensions: DetailsTab['properties'][];
};

const TabSection: React.FC<TabSectionProps> = ({
  element,
  children,
  tabSectionExtensions,
  tabExtensions,
}) => {
  const { t } = useTranslation();

  // resolving hooks in loop since number of extensions will remain the same
  const tabSections: { [key: string]: TabSection[] } = tabSectionExtensions.reduce(
    (acc, { section, tab, ...rest }) => {
      const [resolvedSection] = section(element);
      if (!resolvedSection) {
        return acc;
      }
      return {
        ...acc,
        ...(acc.hasOwnProperty(tab)
          ? { [tab]: [...acc[tab], { ...rest, resolvedSection }] }
          : { [tab]: [{ ...rest, resolvedSection }] }),
      };
    },
    {},
  );

  const [tabs, tabsLoaded] = React.useMemo(() => {
    if (Object.keys(tabSections).length === 0) return [[], false];

    const resolvedTabs: Tab[] = tabExtensions.reduce((acc, { id, label }) => {
      if (!tabSections.hasOwnProperty(id)) {
        return acc;
      }
      const tabContent = orderExtensionBasedOnInsertBeforeAndAfter<{
        resolvedSection: React.ReactNode;
        id: string;
      }>(tabSections[id]).map(({ id: tsId, resolvedSection }) => (
        <React.Fragment key={tsId}>{resolvedSection}</React.Fragment>
      ));
      return [...acc, { name: label, component: () => <>{tabContent}</> }];
    }, []);

    return [resolvedTabs, true];
  }, [tabSections, tabExtensions]);

  // show default side bar
  if (tabsLoaded && tabs.length === 0) {
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

  return children(tabs, tabsLoaded);
};

export default observer(TabSection);
