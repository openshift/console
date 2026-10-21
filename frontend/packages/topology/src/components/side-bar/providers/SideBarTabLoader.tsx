import type { FC, ReactElement } from 'react';
import type { GraphElement } from '@patternfly/react-topology';
import type { Tab } from '@console/internal/components/utils';
import SideBarTabHookResolver from './SideBarTabHookResolver';
import { useDetailsTab } from './useDetailsTab';
import { useDetailsTabSection } from './useDetailsTabSection';

type SideBarTabLoaderProps = {
  element: GraphElement;
  children: (tabs: Tab[], loaded: boolean) => ReactElement;
};

const SideBarTabLoader: FC<SideBarTabLoaderProps> = ({ element, children }) => {
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
