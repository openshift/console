import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import {
  DetailsTab,
  DetailsTabSection,
  isDetailsTab,
  isDetailsTabSection,
  ResolvedExtension,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk';
import { Tab } from '@console/internal/components/utils';
import { useExtensions } from '@console/plugin-sdk';
import { orderExtensionBasedOnInsertBeforeAndAfter } from '@console/shared';
import TabSection from './TabSection';

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

  const orderedTabSections = React.useMemo<ResolvedExtension<DetailsTabSection>['properties'][]>(
    () =>
      resolved
        ? orderExtensionBasedOnInsertBeforeAndAfter<
            ResolvedExtension<DetailsTabSection>['properties']
          >(tabSectionExtensions.map(({ properties }) => properties))
        : [],
    [tabSectionExtensions, resolved],
  );

  return resolved ? (
    <TabSection
      element={element}
      tabExtensions={orderedTabs}
      tabSectionExtensions={orderedTabSections}
    >
      {children}
    </TabSection>
  ) : (
    children([], false)
  );
};

export default SideBarTabLoader;
