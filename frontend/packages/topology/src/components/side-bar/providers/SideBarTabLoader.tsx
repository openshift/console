import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { Tab } from '@console/internal/components/utils';
import SideBarTabHookResolver from './SideBarTabHookResolver';
import { useDetailsTab } from './useDetailsTab';
import { useDetailsTabSection } from './useDetailsTabSection';

type SideBarTabLoaderProps = {
  element: GraphElement;
  children: (tabs: Tab[], loaded: boolean) => React.ReactElement;
};

const SideBarTabLoader: React.FC<SideBarTabLoaderProps> = ({ element, children }) => {
  const tabExtensions = useDetailsTab();
  const [tabSectionExtensions, tabSectionExtensionsResolved] = useDetailsTabSection();

  if (!tabSectionExtensionsResolved) {
    return children([], false);
  }

  return (
    <SideBarTabHookResolver
      element={element}
      tabExtensions={tabExtensions}
      tabSectionExtensions={tabSectionExtensions}
    >
      {children}
    </SideBarTabHookResolver>
  );
};

export default SideBarTabLoader;
