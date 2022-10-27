import * as React from 'react';
import { Nav, NavProps, PageSidebar } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import NavHeader from './NavHeader';
import PerspectiveNav from './PerspectiveNav';

type NavigationProps = {
  onNavSelect: NavProps['onSelect'];
  onPerspectiveSelected: () => void;
  isNavOpen: boolean;
};

export const Navigation: React.FC<NavigationProps> = React.memo(function Navigation({
  isNavOpen,
  onNavSelect,
  onPerspectiveSelected,
}) {
  const { t } = useTranslation();
  return (
    <PageSidebar
      nav={
        <Nav aria-label={t('console-app~Nav')} onSelect={onNavSelect} theme="dark">
          <NavHeader onPerspectiveSelected={onPerspectiveSelected} />
          <PerspectiveNav />
        </Nav>
      }
      isNavOpen={isNavOpen}
      theme="dark"
    />
  );
});
