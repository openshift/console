import * as React from 'react';
import { AddressBookIcon } from '@patternfly/react-icons';

import { StatusGroupMapper } from '@console/internal/components/dashboard/inventory-card/inventory-item';

export const getRouteStatusGroups: StatusGroupMapper = (resources) => ({
  'demo-inventory-group': {
    statusIDs: ['Accepted'],
    count: resources.length,
    filterType: 'route-status',
  },
});

export const DemoGroupIcon: React.FC<{}> = () => (
  <AddressBookIcon className="co-inventory-card__status-icon co-inventory-card__status-icon--warn" />
);
