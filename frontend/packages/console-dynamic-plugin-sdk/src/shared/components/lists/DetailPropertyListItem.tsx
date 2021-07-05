import * as React from 'react';
import { ListItem } from '@patternfly/react-core';

import './DetailPropertyList.scss';

type DetailPropertyListItemProps = {
  title?: string;
};

const DetailPropertyListItem: React.FC<DetailPropertyListItemProps> = ({ title, children }) => (
  <ListItem>
    {title && <span className="co-detail-property-list__item-title">{title}: </span>}
    {children}
  </ListItem>
);

export default DetailPropertyListItem;
