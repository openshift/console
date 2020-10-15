import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { EventingBrokerModel } from '../../../models';
import BrokerList from './BrokerList';

export interface ServicesPageProps {
  namespace: string;
}

const BrokerListPage: React.FC<React.ComponentProps<typeof ListPage>> = (props) => (
  <ListPage
    {...props}
    canCreate={false}
    kind={referenceForModel(EventingBrokerModel)}
    ListComponent={BrokerList}
  />
);

export default BrokerListPage;
