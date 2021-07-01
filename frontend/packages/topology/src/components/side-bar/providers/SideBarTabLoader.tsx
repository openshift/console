import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
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

const TabSection: React.FC = ({ children }) => <>{children}</>;

type SideBarTabLoaderProps = {
  element: GraphElement;
  children: (tabs: Tab[], loaded: boolean) => React.ReactElement;
};

const SideBarTabLoader: React.FC<SideBarTabLoaderProps> = ({ element, children }) => {
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

  const tabSections = React.useMemo(() => {
    return resolved
      ? tabSectionExtensions.reduce((tabs, { properties: { tab, section, ...rest } }) => {
          const resolvedSection = section(element);
          if (!resolvedSection) return tabs;
          return {
            ...tabs,
            ...(tabs.hasOwnProperty(tab)
              ? { [tab]: [...tabs[tab], { ...rest, resolvedSection }] }
              : { [tab]: [{ ...rest, resolvedSection }] }),
          };
        }, {})
      : {};
  }, [tabSectionExtensions, element, resolved]);

  const [tabs, loaded] = React.useMemo(() => {
    if (Object.keys(tabSections).length === 0) return [[], false];

    const resolvedTabs = orderedTabs.reduce((acc, { id, label }) => {
      if (!tabSections.hasOwnProperty(id)) return acc;
      const tabContent = orderExtensionBasedOnInsertBeforeAndAfter<{
        resolvedSection: React.ReactNode;
        id: string;
      }>(tabSections[id]).map(({ id: tsId, resolvedSection }) => (
        <TabSection key={tsId}>{resolvedSection}</TabSection>
      ));
      return [...acc, { name: label, component: () => <>{tabContent}</> }];
    }, []);

    return [resolvedTabs, true];
  }, [tabSections, orderedTabs]);

  return children(tabs, loaded);
};

export default SideBarTabLoader;
