import * as React from 'react';

export const ListViewAdditionalInfo: React.FC<ListViewAdditionalInfoProps> = ({ children }) => (
  <div className="list-view-pf-additional-info">{children}</div>
);

type ListViewAdditionalInfoProps = {
  children: React.ReactNode;
};
