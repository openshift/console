import * as React from 'react';
import { useCommonResourceActions } from '@console/app/src/actions/hooks/useCommonResourceActions';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils';
import { TriggerBindingModel } from '../../models';
import { useTriggersTechPreviewBadge } from '../../utils/hooks';
import TriggerBindingDetails from './detail-page-tabs/TriggerBindingDetails';
import { useTriggersBreadcrumbsFor } from './hooks';

const TriggerBindingPage: React.FC<DetailsPageProps> = (props) => {
  const { kindObj } = props;
  const breadcrumbsFor = useTriggersBreadcrumbsFor(kindObj);
  const badge = useTriggersTechPreviewBadge(props.namespace);
  const commonActions = useCommonResourceActions(TriggerBindingModel, props.obj);
  return (
    <DetailsPage
      {...props}
      badge={badge}
      breadcrumbsFor={() => breadcrumbsFor}
      menuActions={commonActions}
      pages={[navFactory.details(TriggerBindingDetails), navFactory.editYaml()]}
    />
  );
};

export default TriggerBindingPage;
