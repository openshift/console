import * as React from 'react';
import { DefaultDetailsPage } from '@console/internal/components/default-resource';
import { DetailsPageProps } from '@console/internal/components/factory';
import { getBadgeFromType } from '@console/shared';
import { RouteModel } from '../../models';

const RouteDetailsPage: React.FC<DetailsPageProps> = (props) => (
  <DefaultDetailsPage {...props} badge={getBadgeFromType(RouteModel.badge)} />
);

export default RouteDetailsPage;
