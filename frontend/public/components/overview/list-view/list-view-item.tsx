import * as React from 'react';

import { ListViewGroupItem } from './list-view-group-item';
import { ListViewRow } from './list-view-row';

export const ListViewItem: React.FC<ListViewItemProps> = ({
  additionalInfo,
  heading,
  ...props
}) => (
  <ListViewGroupItem {...props}>
    <ListViewRow heading={heading} additionalInfo={additionalInfo} />
  </ListViewGroupItem>
);

type ListViewItemProps = {
  additionalInfo?: React.ReactNode[];
  className?: string;
  heading?: React.ReactNode;
  id: string;
  onClick: React.MouseEventHandler;
};
