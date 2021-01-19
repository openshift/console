import * as React from 'react';
import { useActivePerspective } from '@console/shared';
import { Kebab, navFactory } from '@console/internal/components/utils';
import { DetailsPage } from '@console/internal/components/factory';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { useServerlessBreadcrumbsFor } from '../../../hooks/useBreadcrumbsFor';

const EventSourceDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const { match, kind, kindObj } = props;
  const isAdminPerspective = useActivePerspective()[0] === 'admin';
  const pages = [navFactory.details(DetailsForKind(kind)), navFactory.editYaml()];
  const commonActions = Kebab.factory.common.map((action) => action);
  const menuActionsCreator = [...Kebab.getExtensionsActionsForKind(kindObj), ...commonActions];
  const breadcrumbsFor = useServerlessBreadcrumbsFor(
    { ...kindObj, ...(isAdminPerspective ? { labelPlural: 'Event Sources' } : {}) },
    match,
    'eventing',
    'EventSource',
  );
  return (
    <DetailsPage
      {...props}
      breadcrumbsFor={() => breadcrumbsFor}
      pages={pages}
      menuActions={menuActionsCreator}
    />
  );
};

export default EventSourceDetailsPage;
