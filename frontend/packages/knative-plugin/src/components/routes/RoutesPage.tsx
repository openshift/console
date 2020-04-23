import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { RouteModel } from '../../models';
import RouteList from './RouteList';

const RoutesPage: React.FC<React.ComponentProps<typeof ListPage>> = (props) => (
  <ListPage
    {...props}
    canCreate={false}
    kind={referenceForModel(RouteModel)}
    ListComponent={RouteList}
  />
);

export default RoutesPage;
