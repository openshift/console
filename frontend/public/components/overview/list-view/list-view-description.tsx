import * as React from 'react';

export const ListViewDescription: React.FC<ListViewDescriptionProps> = ({ children }) => (
  <div className="list-view-pf-description">{children}</div>
);

type ListViewDescriptionProps = {
  children: React.ReactNode;
};
