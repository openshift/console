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

  // The resolver calls each tab-section provider hook in a loop, so its hook
  // count depends on the extension set. Remount it when the set changes so
  // the hook list is never reconciled across different provider sets.
  const extensionsKey = tabSectionExtensions.map(({ id }) => id).join(',');

  return (
    <SideBarTabHookResolver
      key={extensionsKey}
      element={element}
      tabExtensions={tabExtensions}
      tabSectionExtensions={tabSectionExtensions}
    >
      {children}
    </SideBarTabHookResolver>
  );
};

export default SideBarTabLoader;
