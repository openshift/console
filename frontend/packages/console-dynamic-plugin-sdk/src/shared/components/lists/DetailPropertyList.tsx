import * as React from 'react';
import { List, ListProps } from '@patternfly/react-core';

import './DetailPropertyList.scss';

const DetailPropertyList: React.FC<ListProps> = ({ children, ...props }) => (
  <List className="co-detail-property-list" {...props}>
    {children}
  </List>
);

export default DetailPropertyList;
