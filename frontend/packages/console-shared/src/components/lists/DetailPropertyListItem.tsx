import type { FC, ReactNode } from 'react';
import { ListItem } from '@patternfly/react-core';

import './DetailPropertyList.scss';

type DetailPropertyListItemProps = {
  title?: string;
  children?: ReactNode;
};

const DetailPropertyListItem: FC<DetailPropertyListItemProps> = ({ title, children }) => (
  <ListItem>
    {title && <span className="co-detail-property-list__item-title">{title}: </span>}
    {children}
  </ListItem>
);

export default DetailPropertyListItem;
