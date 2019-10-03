import * as React from 'react';
import { AddressBookIcon } from '@patternfly/react-icons';
import {
  StatusGroupMapper,
  ExpandedComponentProps,
} from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';

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

export const ExpandedRoutes: React.FC<ExpandedComponentProps> = ({ resource }) => (
  <div>Additional content for {resource.length} routes</div>
);
