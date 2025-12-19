import type { ReactNode } from 'react';
import './TopologySideBarTabSection.scss';

interface TopologySideBarTabSectionProps {
  children?: ReactNode;
}

const TopologySideBarTabSection: Snail.FCC<TopologySideBarTabSectionProps> = ({ children }) => {
  return <div className="ocs-sidebar-tabsection">{children}</div>;
};

export default TopologySideBarTabSection;
