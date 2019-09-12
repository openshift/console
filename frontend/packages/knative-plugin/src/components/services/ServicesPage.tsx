import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { TechPreviewBadge } from '@console/shared';
import { ServiceModelAlpha, ServiceModelBeta } from '../../models';
import { ServiceListAlpha, ServiceListBeta } from './ServiceList';

export interface ServicesPageProps {
  namespace: string;
}

export const ServicesPageAlpha: React.FC<ServicesPageProps> = ({ namespace }) => (
  <ListPage
    namespace={namespace}
    canCreate
    kind={referenceForModel(ServiceModelAlpha)}
    ListComponent={ServiceListAlpha}
    badge={<TechPreviewBadge />}
  />
);

export const ServicesPageBeta: React.FC<ServicesPageProps> = ({ namespace }) => (
  <ListPage
    namespace={namespace}
    canCreate
    kind={referenceForModel(ServiceModelBeta)}
    ListComponent={ServiceListBeta}
    badge={<TechPreviewBadge />}
  />
);
