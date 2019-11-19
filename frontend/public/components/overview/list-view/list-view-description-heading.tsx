import * as React from 'react';

export const ListViewDescriptionHeading: React.FC<ListViewDescriptionHeadingProps> = ({
  children,
}) => <div className="list-group-item-heading">{children}</div>;

type ListViewDescriptionHeadingProps = {
  children: React.ReactNode;
};
