import * as React from 'react';
import type { ReactNode } from 'react';
import { ListItem } from '@patternfly/react-core';

import './DetailPropertyList.scss';

type DetailPropertyListItemProps = {
  title?: string;
  children?: ReactNode;
};

const DetailPropertyListItem: Snail.FCC<DetailPropertyListItemProps> = ({ title, children }) => (
  <ListItem>
    {title && <span className="co-detail-property-list__item-title">{title}: </span>}
    {children}
  </ListItem>
);

export default DetailPropertyListItem;
