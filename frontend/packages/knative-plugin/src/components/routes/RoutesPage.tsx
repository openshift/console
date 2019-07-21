import * as React from 'react';
import { match as RMatch } from 'react-router-dom';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { RouteModel } from '../../models';
import RouteList from './RouteList';

export interface RoutesPageProps {
  match: RMatch<{
    ns?: string;
  }>;
}

const RoutesPage: React.FC<RoutesPageProps> = ({ match }) => (
  <ListPage
    namespace={match.params.ns}
    canCreate
    kind={referenceForModel(RouteModel)}
    ListComponent={RouteList}
  />
);

export default RoutesPage;
