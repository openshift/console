import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DetailsPageProps, DetailsPage } from '@console/internal/components/factory';
import { navFactory, Kebab } from '@console/internal/components/utils';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { useTasksBreadcrumbsFor } from '../pipelines/hooks';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';

const ClusterTaskDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { kindObj, match, kind } = props;
  const breadcrumbsFor = useTasksBreadcrumbsFor(kindObj, match);
  const { t } = useTranslation();
  const badge = usePipelineTechPreviewBadge(props.namespace);

  return (
    <DetailsPage
      {...props}
      badge={badge}
      menuActions={Kebab.factory.common}
      breadcrumbsFor={() => breadcrumbsFor}
      pages={[navFactory.details(DetailsForKind(kind, t)), navFactory.editYaml()]}
    />
  );
};

export default ClusterTaskDetailsPage;
