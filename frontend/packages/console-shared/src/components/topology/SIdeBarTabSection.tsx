import * as React from 'react';
import './SideBarTabSection.scss';

const SideBarTabSection: React.FC = ({ children }) => {
  return <div className="ocs-sidebar-tabsection">{children}</div>;
};

export default SideBarTabSection;
