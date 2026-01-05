import type { FC } from 'react';
import { memo } from 'react';
import { Nav, NavProps, PageSidebar, PageSidebarBody } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import NavHeader from './NavHeader';
import PerspectiveNav from './PerspectiveNav';

type NavigationProps = {
  onNavSelect: NavProps['onSelect'];
  onPerspectiveSelected: () => void;
  isNavOpen: boolean;
};

export const Navigation: FC<NavigationProps> = memo(function Navigation({
  isNavOpen,
  onNavSelect,
  onPerspectiveSelected,
}) {
  const { t } = useTranslation();
  return (
    <PageSidebar isSidebarOpen={isNavOpen}>
      <PageSidebarBody>
        <Nav aria-label={t('console-app~Nav')} onSelect={onNavSelect}>
          <NavHeader onPerspectiveSelected={onPerspectiveSelected} />
          <PerspectiveNav />
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );
});
