import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { ServiceModel } from '../../models';
import ServiceList from './ServiceList';

export interface ServicesPageProps {
  namespace: string;
}

const ServicesPage: React.FC<ServicesPageProps> = ({ namespace }) => (
  <ListPage
    namespace={namespace}
    canCreate
    kind={referenceForModel(ServiceModel)}
    ListComponent={ServiceList}
  />
);

export default ServicesPage;
