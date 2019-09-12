import * as React from 'react';
import { DefaultDetailsPage } from '@console/internal/components/default-resource';
import { DetailsPageProps } from '@console/internal/components/factory';
import { TechPreviewBadge } from '@console/shared';

const ServiceDetailsPage: React.FC<DetailsPageProps> = (props) => (
  <DefaultDetailsPage {...props} badge={<TechPreviewBadge />} />
);

export default ServiceDetailsPage;
