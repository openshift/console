import * as React from 'react';
import { DefaultDetailsPage } from '@console/internal/components/default-resource';
import { DetailsPageProps } from '@console/internal/components/factory';
import { getBadgeFromType } from '@console/shared';
import { ServiceModel } from '../../models';

const ServiceDetailsPage: React.FC<DetailsPageProps> = (props) => (
  <DefaultDetailsPage {...props} badge={getBadgeFromType(ServiceModel.badge)} />
);

export default ServiceDetailsPage;
