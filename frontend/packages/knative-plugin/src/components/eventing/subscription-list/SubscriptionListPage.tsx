import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { EventingSubscriptionModel } from '../../../models';
import SubscriptionList from './SubscriptionList';

const SubscriptionListPage: React.FC<React.ComponentProps<typeof ListPage>> = (props) => (
  <ListPage
    canCreate={false}
    {...props}
    kind={referenceForModel(EventingSubscriptionModel)}
    ListComponent={SubscriptionList}
  />
);

export default SubscriptionListPage;
