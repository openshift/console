import * as React from 'react';

export const SidebarInputWrapper: React.FC = ({ children }) => {
  return <div style={{ width: 'calc(100% - 28px)' }}>{children}</div>;
};
