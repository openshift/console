import * as React from 'react';
import { DetailsPageProps, DetailsPage } from '@console/internal/components/factory';
import { navFactory, Kebab } from '@console/internal/components/utils';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { useTasksBreadcrumbsFor } from '../pipelines/hooks';

const TaskDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { kindObj, match, kind } = props;
  const breadcrumbsFor = useTasksBreadcrumbsFor(kindObj, match);

  return (
    <DetailsPage
      {...props}
      menuActions={Kebab.factory.common}
      breadcrumbsFor={() => breadcrumbsFor}
      pages={[navFactory.details(DetailsForKind(kind)), navFactory.editYaml()]}
    />
  );
};

export default TaskDetailsPage;
