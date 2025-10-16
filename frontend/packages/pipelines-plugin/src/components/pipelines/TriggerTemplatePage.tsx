import * as React from 'react';
import { useCommonResourceActions } from '@console/app/src/actions/hooks/useCommonResourceActions';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils';
import { TriggerTemplateModel } from '../../models';
import { useTriggersTechPreviewBadge } from '../../utils/hooks';
import TriggerTemplateDetails from './detail-page-tabs/TriggerTemplateDetails';
import { useTriggersBreadcrumbsFor } from './hooks';

const TriggerTemplatePage: React.FC<DetailsPageProps> = (props) => {
  const { kindObj } = props;
  const breadcrumbsFor = useTriggersBreadcrumbsFor(kindObj);
  const badge = useTriggersTechPreviewBadge(props.namespace);
  const commonActions = useCommonResourceActions(TriggerTemplateModel, props.obj);

  return (
    <DetailsPage
      {...props}
      badge={badge}
      breadcrumbsFor={() => breadcrumbsFor}
      menuActions={commonActions}
      pages={[navFactory.details(TriggerTemplateDetails), navFactory.editYaml()]}
    />
  );
};

export default TriggerTemplatePage;
