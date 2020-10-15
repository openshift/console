import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { EventingTriggerModel } from '../../../models';
import TriggerList from './TriggerList';

const TriggerListPage: React.FC<React.ComponentProps<typeof ListPage>> = (props) => (
  <ListPage
    canCreate={false}
    {...props}
    kind={referenceForModel(EventingTriggerModel)}
    ListComponent={TriggerList}
  />
);

export default TriggerListPage;
