import * as React from 'react';

export const ListViewBody: React.FC<ListViewBodyProps> = ({ children }) => (
  <div className="list-view-pf-body">{children}</div>
);

type ListViewBodyProps = {
  children: React.ReactNode;
};
