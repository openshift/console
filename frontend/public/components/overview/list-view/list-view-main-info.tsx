import * as React from 'react';

export const ListViewMainInfo: React.FC<ListViewMainInfoProps> = ({ children }) => (
  <div className="list-view-pf-main-info">{children}</div>
);

type ListViewMainInfoProps = {
  children: React.ReactNode;
};
