import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { getBadgeFromType } from '@console/shared';
import { RouteModel } from '../../models';
import RouteList from './RouteList';

const RoutesPage: React.FC<React.ComponentProps<typeof ListPage>> = (props) => (
  <ListPage
    {...props}
    canCreate={false}
    kind={referenceForModel(RouteModel)}
    ListComponent={RouteList}
    badge={getBadgeFromType(RouteModel.badge)}
  />
);

export default RoutesPage;
