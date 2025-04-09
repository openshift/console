import * as React from 'react';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { Page, navFactory, viewYamlComponent } from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import {
  ActionMenu,
  ActionMenuVariant,
  ActionServiceProvider,
} from '@console/shared/src/components/actions';
import HelpTextAlert from '@console/shared/src/components/layout/HelpTextAlert';
import { getComputedServiceBindingStatus } from '../../utils';
import { ServiceBindingDeprecationAlert } from '../service-binding-utils/ServiceBindingAlerts';
import ServiceBindingDetailsTab from './ServiceBindingDetailsTab';

const ServiceBindingDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const customActionMenu = (_, serviceBinding) => {
    const kindReference = referenceFor(serviceBinding);
    const context = { [kindReference]: serviceBinding };
    return (
      <ActionServiceProvider context={context}>
        {({ actions, options, loaded }) =>
          loaded && (
            <ActionMenu actions={actions} options={options} variant={ActionMenuVariant.DROPDOWN} />
          )
        }
      </ActionServiceProvider>
    );
  };

  const pages: Page[] = [
    navFactory.details(ServiceBindingDetailsTab),
    navFactory.editYaml(viewYamlComponent),
  ];

  return (
    <DetailsPage
      {...props}
      getResourceStatus={getComputedServiceBindingStatus}
      customActionMenu={customActionMenu}
      pages={pages}
      helpText={
        <HelpTextAlert>
          <ServiceBindingDeprecationAlert />
        </HelpTextAlert>
      }
    />
  );
};

export default ServiceBindingDetailsPage;
