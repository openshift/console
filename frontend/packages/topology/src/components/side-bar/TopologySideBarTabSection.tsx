import type { FC, ReactNode } from 'react';
import './TopologySideBarTabSection.scss';

interface TopologySideBarTabSectionProps {
  children?: ReactNode;
}

const TopologySideBarTabSection: FC<TopologySideBarTabSectionProps> = ({ children }) => {
  return <div className="ocs-sidebar-tabsection">{children}</div>;
};

export default TopologySideBarTabSection;
