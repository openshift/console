import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { RouteModel } from '../../models';
import RouteList from './RouteList';

export interface RoutesPageProps {
  namespace: string;
}

const RoutesPage: React.FC<RoutesPageProps> = ({ namespace }) => (
  <ListPage
    namespace={namespace}
    canCreate={false}
    kind={referenceForModel(RouteModel)}
    ListComponent={RouteList}
  />
);

export default RoutesPage;
