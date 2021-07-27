import * as React from 'react';
import './SideBarTabSection.scss';

export const SideBarTabSection: React.FC = ({ children }) => {
  return <div className="ocs-sidebar-tabsection">{children}</div>;
};
