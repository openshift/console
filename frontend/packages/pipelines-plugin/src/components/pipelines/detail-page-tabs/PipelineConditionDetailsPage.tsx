import * as React from 'react';
import { DetailsPageProps } from '@console/dynamic-plugin-sdk';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { DetailsPage } from '@console/internal/components/factory';
import { navFactory, Kebab } from '@console/internal/components/utils';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { usePipelineTechPreviewBadge } from '../../../utils/hooks';
import { usePipelinesBreadcrumbsFor } from '../hooks';

const PipelineConditionDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { match, kind } = props;
  const [model] = useK8sModel(kind);
  const breadcrumbsFor = usePipelinesBreadcrumbsFor(model, match);
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
