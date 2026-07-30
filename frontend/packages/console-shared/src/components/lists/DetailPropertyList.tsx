import type { FC } from 'react';
import type { ListProps } from '@patternfly/react-core';
import { List } from '@patternfly/react-core';

import './DetailPropertyList.scss';

export const DetailPropertyList: FC<ListProps> = ({ children, ...props }) => (
  <List className="co-detail-property-list" {...props}>
    {children}
  </List>
);
