import * as React from 'react';
import './TopologySideBarTabSection.scss';

interface TopologySideBarTabSectionProps {
  children?: React.ReactNode;
}

const TopologySideBarTabSection: React.FCC<TopologySideBarTabSectionProps> = ({ children }) => {
  return <div className="ocs-sidebar-tabsection">{children}</div>;
};

export default TopologySideBarTabSection;
