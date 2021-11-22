import * as React from 'react';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { Kebab, navFactory } from '@console/internal/components/utils';
import { useTriggersTechPreviewBadge } from '../../utils/hooks';
import TriggerTemplateDetails from './detail-page-tabs/TriggerTemplateDetails';
import { useTriggersBreadcrumbsFor } from './hooks';

const TriggerTemplatePage: React.FC<DetailsPageProps> = (props) => {
  const { kindObj, match } = props;
  const breadcrumbsFor = useTriggersBreadcrumbsFor(kindObj, match);
  const badge = useTriggersTechPreviewBadge(props.namespace);

  return (
    <DetailsPage
      {...props}
      badge={badge}
      breadcrumbsFor={() => breadcrumbsFor}
      menuActions={Kebab.factory.common}
      pages={[navFactory.details(TriggerTemplateDetails), navFactory.editYaml()]}
    />
  );
};

export default TriggerTemplatePage;
