import * as React from 'react';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils';
import { useTriggersTechPreviewBadge } from '../../utils/hooks';
import TriggerTemplateDetails from './detail-page-tabs/TriggerTemplateDetails';
import { useTriggersBreadcrumbsFor } from './hooks';

const TriggerTemplatePage: React.FC<DetailsPageProps> = (props) => {
  const { kindObj } = props;
  const breadcrumbsFor = useTriggersBreadcrumbsFor(kindObj);
  const badge = useTriggersTechPreviewBadge(props.namespace);

  return (
    <DetailsPage
      {...props}
      badge={badge}
      breadcrumbsFor={() => breadcrumbsFor}
      pages={[navFactory.details(TriggerTemplateDetails), navFactory.editYaml()]}
    />
  );
};

export default TriggerTemplatePage;
