import * as React from 'react';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { DetailsPageProps, DetailsPage } from '@console/internal/components/factory';
import { navFactory, Kebab } from '@console/internal/components/utils';
import { usePipelineTechPreviewBadge } from '../../../utils/hooks';
import { usePipelinesBreadcrumbsFor } from '../hooks';

const PipelineConditionDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { kindObj, match, kind } = props;
  const breadcrumbsFor = usePipelinesBreadcrumbsFor(kindObj, match);
  const badge = usePipelineTechPreviewBadge(props.namespace);

  return (
    <DetailsPage
      {...props}
      badge={badge}
      menuActions={Kebab.factory.common}
      breadcrumbsFor={() => breadcrumbsFor}
      pages={[navFactory.details(DetailsForKind(kind)), navFactory.editYaml()]}
    />
  );
};

export default PipelineConditionDetailsPage;
